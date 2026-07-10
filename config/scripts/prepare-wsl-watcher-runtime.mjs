import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

export const WSL_WATCHER_NODE_VERSION = '24.15.0'
const WSL_WATCHER_INSTALL_LAYOUT_VERSION = 1

const rootDir = path.resolve(import.meta.dirname, '../..')
const outputDir = path.join(rootDir, 'out', 'wsl-watcher')
const cacheDir = path.join(rootDir, 'node_modules', '.cache', 'orca-wsl-watcher')
const runtimeArchives = {
  x64: {
    sha256: '472655581fb851559730c48763e0c9d3bc25975c59d518003fc0849d3e4ba0f6',
    watcherPackage: '@parcel/watcher-linux-x64-glibc'
  },
  arm64: {
    sha256: 'f3d5a797b5d210ce8e2cb265544c8e482eaedcb8aa409a8b46da7e8595d0dda0',
    watcherPackage: '@parcel/watcher-linux-arm64-glibc'
  }
}

function sha256(contents) {
  return createHash('sha256').update(contents).digest('hex')
}

async function matchesHash(filename, expected) {
  try {
    return sha256(await readFile(filename)) === expected
  } catch {
    return false
  }
}

async function downloadRuntime(arch, expectedHash) {
  await mkdir(cacheDir, { recursive: true })
  const filename = `node-v${WSL_WATCHER_NODE_VERSION}-linux-${arch}.tar.xz`
  const cached = path.join(cacheDir, filename)
  if (await matchesHash(cached, expectedHash)) {
    return cached
  }

  const response = await fetch(`https://nodejs.org/dist/v${WSL_WATCHER_NODE_VERSION}/${filename}`, {
    signal: AbortSignal.timeout(60_000)
  })
  if (!response.ok) {
    throw new Error(`Could not download ${filename}: HTTP ${response.status}`)
  }
  const contents = Buffer.from(await response.arrayBuffer())
  const actualHash = sha256(contents)
  if (actualHash !== expectedHash) {
    throw new Error(
      `Checksum mismatch for ${filename}: expected ${expectedHash}, got ${actualHash}`
    )
  }
  const temporary = `${cached}.${process.pid}.tmp`
  await writeFile(temporary, contents)
  await rm(cached, { force: true })
  await rename(temporary, cached)
  return cached
}

async function assertBuildInput(filename, description) {
  try {
    const info = await stat(filename)
    if (info.isFile()) {
      return
    }
  } catch {}
  throw new Error(`Missing ${description} at ${filename}. Run pnpm build:electron-vite first.`)
}

export async function prepareWslWatcherRuntime() {
  const hostSource = path.join(rootDir, 'out', 'main', 'wsl-watcher-host.js')
  await assertBuildInput(hostSource, 'compiled WSL watcher host')

  const stageDir = `${outputDir}.${process.pid}.tmp`
  await rm(stageDir, { recursive: true, force: true })
  await mkdir(stageDir, { recursive: true })
  const hostContents = await readFile(hostSource)
  await writeFile(path.join(stageDir, 'host.js'), hostContents)
  await copyFile(
    path.join(rootDir, 'node_modules', '@parcel', 'watcher', 'LICENSE'),
    path.join(stageDir, 'parcel-watcher-LICENSE')
  )

  const versionParts = [
    String(WSL_WATCHER_INSTALL_LAYOUT_VERSION),
    WSL_WATCHER_NODE_VERSION,
    sha256(hostContents)
  ]
  for (const [arch, runtime] of Object.entries(runtimeArchives)) {
    const archDir = path.join(stageDir, arch)
    await mkdir(archDir, { recursive: true })
    const archive = await downloadRuntime(arch, runtime.sha256)
    const watcherSource = path.join(
      rootDir,
      'node_modules',
      '@parcel',
      runtime.watcherPackage.replace('@parcel/', ''),
      'watcher.node'
    )
    const watcherContents = await readFile(watcherSource)
    versionParts.push(arch, runtime.sha256, sha256(watcherContents))
    await copyFile(archive, path.join(archDir, 'node.tar.xz'))
    await writeFile(path.join(archDir, 'watcher.node'), watcherContents)
  }

  const manifest = {
    protocol: 1,
    installLayout: WSL_WATCHER_INSTALL_LAYOUT_VERSION,
    nodeVersion: WSL_WATCHER_NODE_VERSION,
    bundleVersion: sha256(versionParts.join('\n')).slice(0, 20)
  }
  await writeFile(path.join(stageDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  await rm(outputDir, { recursive: true, force: true })
  await rename(stageDir, outputDir)
  process.stdout.write(
    `[prepare-wsl-watcher-runtime] prepared ${manifest.bundleVersion} in ${outputDir}\n`
  )
  return manifest
}

if (process.argv[1] === import.meta.filename) {
  await prepareWslWatcherRuntime()
}
