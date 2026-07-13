import { spawn } from 'node:child_process'

import { flattenCatalog } from './localization-catalog-model.mjs'

function startGit(root, args, onGitProcess) {
  onGitProcess?.(args)
  return spawn('git', args, { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] })
}

function processFailure(child, stderr, label) {
  return new Promise((resolve, reject) => {
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${label} failed (${code}): ${stderr.join('')}`))
      }
    })
  })
}

async function writeLines(stream, lines) {
  for (const line of lines) {
    if (!stream.write(`${line}\n`)) {
      await new Promise((resolve) => stream.once('drain', resolve))
    }
  }
  stream.end()
}

async function readHistory(root, localePaths, onGitProcess) {
  const child = startGit(
    root,
    ['log', '--first-parent', '--reverse', '-z', '--format=%H%x00%s', 'HEAD', '--', ...localePaths],
    onGitProcess
  )
  child.stdin.end()
  const stderr = []
  child.stderr.setEncoding('utf8')
  child.stderr.on('data', (chunk) => stderr.push(chunk))
  const completion = processFailure(child, stderr, 'git log')
  const fields = []
  let pending = Buffer.alloc(0)

  // Why: NUL-delimited streaming avoids shell quoting and subject/newline ambiguity across platforms.
  for await (const chunk of child.stdout) {
    pending = Buffer.concat([pending, chunk])
    let delimiter = pending.indexOf(0)
    while (delimiter >= 0) {
      fields.push(pending.subarray(0, delimiter).toString('utf8'))
      pending = pending.subarray(delimiter + 1)
      delimiter = pending.indexOf(0)
    }
  }
  await completion
  if (pending.length > 0 || fields.length % 2 !== 0) {
    throw new Error('git log returned incomplete localization history metadata')
  }
  const commits = []
  for (let index = 0; index < fields.length; index += 2) {
    commits.push({ commit: fields[index], subject: fields[index + 1] })
  }
  return commits
}

async function resolveBlobOids(root, specs, onGitProcess) {
  if (specs.length === 0) {
    return new Map()
  }
  const child = startGit(root, ['cat-file', '--batch-check'], onGitProcess)
  const stderr = []
  child.stderr.setEncoding('utf8')
  child.stderr.on('data', (chunk) => stderr.push(chunk))
  const completion = processFailure(child, stderr, 'git cat-file --batch-check')
  const output = []
  child.stdout.setEncoding('utf8')
  child.stdout.on('data', (chunk) => output.push(chunk))
  await Promise.all([writeLines(child.stdin, specs), completion])
  const lines = output.join('').trimEnd().split('\n')
  if (lines.length !== specs.length) {
    throw new Error(`git cat-file resolved ${lines.length} blobs for ${specs.length} requests`)
  }
  return new Map(
    specs.map((spec, index) => {
      const fields = lines[index].split(' ')
      return [spec, fields.at(-1) === 'missing' ? undefined : fields[0]]
    })
  )
}

class BatchBlobReader {
  constructor(root, onGitProcess) {
    this.child = startGit(root, ['cat-file', '--batch'], onGitProcess)
    this.iterator = this.child.stdout[Symbol.asyncIterator]()
    this.buffer = Buffer.alloc(0)
    this.stderr = []
    this.child.stderr.setEncoding('utf8')
    this.child.stderr.on('data', (chunk) => this.stderr.push(chunk))
    this.completion = processFailure(this.child, this.stderr, 'git cat-file --batch')
  }

  async fill() {
    const { value, done } = await this.iterator.next()
    if (done) {
      throw new Error('git cat-file ended before returning the requested blob')
    }
    this.buffer = Buffer.concat([this.buffer, value])
  }

  async readLine() {
    let newline = this.buffer.indexOf(10)
    while (newline < 0) {
      await this.fill()
      newline = this.buffer.indexOf(10)
    }
    const line = this.buffer.subarray(0, newline).toString('utf8')
    this.buffer = this.buffer.subarray(newline + 1)
    return line
  }

  async readBytes(size) {
    while (this.buffer.length < size + 1) {
      await this.fill()
    }
    const value = this.buffer.subarray(0, size)
    if (this.buffer[size] !== 10) {
      throw new Error('git cat-file returned a malformed blob terminator')
    }
    this.buffer = this.buffer.subarray(size + 1)
    return value
  }

  async read(oid) {
    if (!this.child.stdin.write(`${oid}\n`)) {
      await new Promise((resolve) => this.child.stdin.once('drain', resolve))
    }
    const header = await this.readLine()
    const [returnedOid, type, sizeText] = header.split(' ')
    if (returnedOid !== oid || type !== 'blob') {
      throw new Error(`git cat-file returned unexpected object metadata: ${header}`)
    }
    return this.readBytes(Number(sizeText))
  }

  async close() {
    this.child.stdin.end()
    await this.completion
  }
}

function revisionSpec(revision, relativePath) {
  return `${revision}:${relativePath}`
}

export async function collectReviewedCorrectionHistory(
  root,
  locales,
  localePaths,
  commitClassifications,
  onGitProcess
) {
  // Why: the reviewed algorithm is scoped to commits that touched target catalogs, not English-only edits.
  const commits = await readHistory(root, localePaths.slice(1), onGitProcess)
  const paths = new Map(
    ['en', ...locales].map((locale) => [
      locale,
      localePaths[locale === 'en' ? 0 : locales.indexOf(locale) + 1]
    ])
  )
  const finalSpecs = locales.map((locale) => revisionSpec('HEAD', paths.get(locale)))
  const commitSpecs = commits.map(({ commit }) =>
    [commit, `${commit}^`].flatMap((revision) =>
      ['en', ...locales].map((locale) => revisionSpec(revision, paths.get(locale)))
    )
  )
  const specs = [...new Set([...finalSpecs, ...commitSpecs.flat()])]
  const oidBySpec = await resolveBlobOids(root, specs, onGitProcess)
  const remainingUses = new Map()
  for (const spec of [...finalSpecs, ...commitSpecs.flat()]) {
    const oid = oidBySpec.get(spec)
    if (oid) {
      remainingUses.set(oid, (remainingUses.get(oid) ?? 0) + 1)
    }
  }
  const reader = new BatchBlobReader(root, onGitProcess)
  const cachedCatalogs = new Map()

  async function catalog(spec) {
    const oid = oidBySpec.get(spec)
    if (!oid) {
      return new Map()
    }
    if (!cachedCatalogs.has(oid)) {
      cachedCatalogs.set(oid, flattenCatalog(JSON.parse(await reader.read(oid))))
    }
    const value = cachedCatalogs.get(oid)
    const uses = remainingUses.get(oid) - 1
    remainingUses.set(oid, uses)
    // Why: each blob is parsed once, then released after its last chronological use.
    if (uses === 0) {
      cachedCatalogs.delete(oid)
    }
    return value
  }

  try {
    const finalByLocale = {}
    for (let index = 0; index < locales.length; index += 1) {
      finalByLocale[locales[index]] = await catalog(finalSpecs[index])
    }
    const messages = Object.fromEntries(locales.map((locale) => [locale, new Map()]))
    const provenance = new Map()
    for (let index = 0; index < commits.length; index += 1) {
      const { commit, subject } = commits[index]
      const classification = commitClassifications.commits?.[commit]
      const revisions = commitSpecs[index]
      const beforeEn = await catalog(revisions[1 + locales.length])
      const afterEn = await catalog(revisions[0])
      for (let localeIndex = 0; localeIndex < locales.length; localeIndex += 1) {
        const locale = locales[localeIndex]
        const before = await catalog(revisions[2 + locales.length + localeIndex])
        const after = await catalog(revisions[1 + localeIndex])
        for (const [key, value] of after) {
          const targetOnlyCorrection =
            before.has(key) && before.get(key) !== value && beforeEn.get(key) === afterEn.get(key)
          if (!targetOnlyCorrection || finalByLocale[locale].get(key) !== value) {
            continue
          }
          if (!classification) {
            throw new Error(`Unclassified localization provenance commit: ${commit} ${subject}`)
          }
          provenance.set(commit, { commit, subject, ...classification })
          if (classification.classification !== 'reviewed-correction') {
            continue
          }
          const existing = messages[locale].get(key)
          messages[locale].set(key, {
            value,
            commits: [...(existing?.commits ?? []), commit],
            reason: 'historical-target-only-correction'
          })
        }
      }
    }
    return { commits, messages, provenance }
  } finally {
    await reader.close()
  }
}
