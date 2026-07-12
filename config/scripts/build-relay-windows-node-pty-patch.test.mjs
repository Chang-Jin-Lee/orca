import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = resolve(import.meta.dirname, '../..')
const require = createRequire(import.meta.url)
const patchName = 'node-pty-windows-pre-ready-shutdown-patch.cjs'
const vanillaWindowsTerminal = `'use strict';
function WindowsTerminal() {}
    WindowsTerminal.prototype.destroy = function () {
        var _this = this;
        this._deferNoArgs(function () {
            _this.kill();
        });
    };
    WindowsTerminal.prototype.kill = function (signal) {
        var _this = this;
        this._deferNoArgs(function () {
            if (signal) {
                throw new Error('Signals not supported on windows.');
            }
            _this._close();
            _this._agent.kill();
        });
    };
WindowsTerminal.prototype._deferNoArgs = function (deferredFn) {
    var _this = this;
    if (this._isReady) {
        deferredFn.call(this);
        return;
    }
    this._deferreds.push({ run: function () { return deferredFn.call(_this); } });
};
exports.WindowsTerminal = WindowsTerminal;
`

function loadHarness(modulePath) {
  delete require.cache[require.resolve(modulePath)]
  const { WindowsTerminal } = require(modulePath)
  const terminal = Object.create(WindowsTerminal.prototype)
  let closeCount = 0
  let nativeKillCount = 0
  terminal._isReady = false
  terminal._deferreds = []
  terminal._close = () => closeCount++
  terminal._agent = { kill: () => nativeKillCount++ }
  terminal.kill()
  return {
    closeCount,
    nativeKillCount,
    deferredCount: terminal._deferreds.length
  }
}

describe('packaged Windows SSH relay node-pty patch', () => {
  it('hashes, ships, and executes the pre-ready shutdown fix', () => {
    const build = spawnSync(process.execPath, ['config/scripts/build-relay.mjs'], {
      cwd: projectRoot,
      encoding: 'utf8'
    })
    expect(build.status, `${build.stdout}\n${build.stderr}`).toBe(0)

    for (const platform of ['win32-x64', 'win32-arm64']) {
      const relayDir = join(projectRoot, 'out', 'relay', platform)
      const relayContent = readFileSync(join(relayDir, 'relay.js'))
      const patchContent = readFileSync(join(relayDir, patchName))
      const expectedHash = createHash('sha256')
        .update(relayContent)
        .update(patchContent)
        .digest('hex')
        .slice(0, 12)
      expect(readFileSync(join(relayDir, '.version'), 'utf8')).toBe(`0.1.0+${expectedHash}`)
    }

    for (const platform of ['linux-x64', 'darwin-arm64']) {
      expect(existsSync(join(projectRoot, 'out', 'relay', platform, patchName))).toBe(false)
    }

    const packageConfig = require('../electron-builder.config.cjs')
    for (const platform of ['win', 'mac', 'linux']) {
      expect(packageConfig[platform].extraResources).toContainEqual({
        from: 'out/relay',
        to: 'relay'
      })
    }

    const tempRoot = mkdtempSync(join(tmpdir(), 'orca-relay-node-pty-'))
    try {
      const modulePath = join(tempRoot, 'node_modules', 'node-pty', 'lib', 'windowsTerminal.js')
      const watcherPath = join(tempRoot, 'node_modules', '@parcel', 'watcher', 'index.js')
      mkdirSync(dirname(modulePath), { recursive: true })
      mkdirSync(dirname(watcherPath), { recursive: true })
      writeFileSync(modulePath, vanillaWindowsTerminal, 'utf8')
      writeFileSync(watcherPath, 'module.exports = {}\n', 'utf8')

      expect(loadHarness(modulePath)).toEqual({
        closeCount: 0,
        nativeKillCount: 0,
        deferredCount: 1
      })

      const patch = spawnSync(
        process.execPath,
        [join(projectRoot, 'out', 'relay', 'win32-x64', patchName), '--apply', tempRoot],
        { cwd: tempRoot, encoding: 'utf8' }
      )
      expect(patch.status, patch.stderr).toBe(0)
      expect(patch.stdout).toContain('ORCA-NPTY-WINDOWS-PATCH-OK')
      expect(loadHarness(modulePath)).toEqual({
        closeCount: 1,
        nativeKillCount: 1,
        deferredCount: 0
      })

      const secondPatch = spawnSync(
        process.execPath,
        [join(projectRoot, 'out', 'relay', 'win32-x64', patchName), '--apply', tempRoot],
        { cwd: tempRoot, encoding: 'utf8' }
      )
      expect(secondPatch.status, secondPatch.stderr).toBe(0)

      const check = spawnSync(
        process.execPath,
        [join(projectRoot, 'out', 'relay', 'win32-x64', patchName), '--check', tempRoot],
        { cwd: tempRoot, encoding: 'utf8' }
      )
      expect(check.status, check.stderr).toBe(0)
      expect(check.stdout).toContain('ORCA-NATIVE-DEPS-OK')
    } finally {
      rmSync(tempRoot, { recursive: true, force: true })
    }
  })
})
