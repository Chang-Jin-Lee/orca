import { readFile } from 'node:fs/promises'

import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'

const workflowUrl = new URL(
  '../../.github/workflows/ssh-relay-runtime-artifacts.yml',
  import.meta.url
)

describe('SSH relay runtime artifact workflow', () => {
  it('uses exact native runner labels and SHA-pinned actions without publication authority', async () => {
    const workflow = parse(await readFile(workflowUrl, 'utf8'))
    const posixJob = workflow.jobs['build-posix-runtime']
    const windowsJob = workflow.jobs['build-windows-runtime']

    expect(posixJob.strategy.matrix.include.map((entry) => [entry.runner, entry.tuple])).toEqual([
      ['ubuntu-24.04', 'linux-x64-glibc'],
      ['ubuntu-24.04-arm', 'linux-arm64-glibc'],
      ['macos-15-intel', 'darwin-x64'],
      ['macos-15', 'darwin-arm64']
    ])
    expect(windowsJob.strategy.matrix.include.map((entry) => [entry.runner, entry.tuple])).toEqual([
      ['windows-2022', 'win32-x64'],
      ['windows-11-arm', 'win32-arm64']
    ])
    expect(workflow.permissions).toEqual({ contents: 'read' })
    expect(posixJob['timeout-minutes']).toBe(20)
    expect(windowsJob['timeout-minutes']).toBe(30)
    for (const job of [posixJob, windowsJob]) {
      expect(job.steps[0].with.ref).toBe('${{ github.event.pull_request.head.sha || github.sha }}')
      for (const step of job.steps.filter((candidate) => candidate.uses)) {
        expect(step.uses).toMatch(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+@[0-9a-f]{40}$/)
      }
    }
  })

  it('uploads only the first output after two clean builds verify and compare', async () => {
    const source = await readFile(workflowUrl, 'utf8')
    const workflow = parse(source)
    const steps = workflow.jobs['build-posix-runtime'].steps
    const windowsSteps = workflow.jobs['build-windows-runtime'].steps
    const buildIndex = steps.findIndex(
      (step) => step.name === 'Build twice, inspect, smoke, and compare exact runtime'
    )
    const uploadIndex = steps.findIndex(
      (step) => step.name === 'Upload unpublished artifact evidence'
    )

    expect(buildIndex).toBeGreaterThan(-1)
    expect(uploadIndex).toBeGreaterThan(buildIndex)
    expect(source).toContain('verify-ssh-relay-runtime.mjs')
    expect(source).toContain('ssh-relay-runtime-workflow.test.mjs')
    expect(source).toContain('pnpm install --frozen-lockfile --ignore-scripts')
    expect(source).toContain('--connect-timeout 20 --max-time 300 --retry 2')
    expect(source).toContain('mkdir -p "$output_root"')
    expect(source).toContain('source_commit=$(git rev-parse HEAD)')
    expect(source).toContain('--git-commit "$source_commit"')
    expect(source).not.toContain('--git-commit "$GITHUB_SHA"')
    expect(source).toContain('for output in "$first_output" "$second_output"')
    expect(source).toContain('foreach ($output in @($firstOutput, $secondOutput))')
    expect(source).toContain('ssh-relay-runtime-reproducibility.mjs')
    expect(source).toContain('ssh-relay-runtime-reproducibility.test.mjs')
    expect(source).toContain(
      'node --check config/scripts/ssh-relay-runtime-reproducibility.test.mjs'
    )
    expect(
      source.match(/node --check config\/scripts\/build-ssh-relay-runtime\.mjs/g)
    ).toHaveLength(2)
    expect(
      source.match(/node --check config\/scripts\/ssh-relay-runtime-build\.test\.mjs/g)
    ).toHaveLength(2)
    expect(source.match(/ssh-relay-node-pty-build\.test\.mjs/g)).toHaveLength(2)
    expect(source.match(/ssh-relay-node-pty-windows-build-determinism\.test\.mjs/g)).toHaveLength(2)
    expect(source.match(/ssh-relay-runtime-build\.test\.mjs/g)).toHaveLength(4)
    expect(source.match(/--work-directory/g)).toHaveLength(2)
    expect(source).toContain('work_directory="$RUNNER_TEMP/orca-ssh-relay-runtime-build-work"')
    expect(source).toContain(
      "$workDirectory = Join-Path $env:RUNNER_TEMP 'orca-ssh-relay-runtime-build-work'"
    )
    expect(source).not.toContain('work_directory="$output_root/build-work"')
    expect(source).not.toContain("Join-Path $outputRoot 'build-work'")
    expect(source).toContain('cp "$first_output"/*.tar.xz')
    expect(source).toContain("Get-ChildItem -LiteralPath $firstOutput -Filter '*.zip'")
    expect(source).toContain('ssh-relay-node-zip-inspection.test.mjs')
    expect(source).toContain('ssh-relay-runtime-pty-smoke.test.mjs')
    expect(source).toContain('ssh-relay-runtime-resource-diagnostics.test.mjs')
    expect(source).toContain('ssh-relay-runtime-zip.test.mjs')
    expect(source).toContain('node-v24.18.0-headers.tar.gz')
    expect(source).toContain('node_library: win-x64/node.lib')
    expect(source).toContain("@('gpg.exe', 'gpgv.exe')")
    for (const jobSteps of [steps, windowsSteps]) {
      const run = jobSteps.find(
        (step) => step.name === 'Build twice, inspect, smoke, and compare exact runtime'
      ).run
      expect(run.indexOf('ssh-relay-runtime-reproducibility.mjs')).toBeGreaterThan(
        run.indexOf('verify-ssh-relay-runtime.mjs')
      )
      expect(run.indexOf('runtime-evidence/${{ matrix.tuple }}')).toBeGreaterThan(
        run.indexOf('ssh-relay-runtime-reproducibility.mjs')
      )
    }
    expect(steps[uploadIndex].with.path).toBe('runtime-evidence/${{ matrix.tuple }}/')
    expect(source).not.toMatch(/releases\/|gh release|contents:\s*write/i)
  })
})
