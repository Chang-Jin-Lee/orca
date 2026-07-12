const { readFileSync, renameSync, rmSync, writeFileSync } = require('node:fs')
const { join } = require('node:path')

const PATCH_MARKER = 'Orca: Windows pre-ready shutdown is synchronous.'
const VANILLA_DESTROY = `    WindowsTerminal.prototype.destroy = function () {
        var _this = this;
        this._deferNoArgs(function () {
            _this.kill();
        });
    };`
const PATCHED_DESTROY = `    WindowsTerminal.prototype.destroy = function () {
        this.kill();
    };`
const VANILLA_KILL = `    WindowsTerminal.prototype.kill = function (signal) {
        var _this = this;
        this._deferNoArgs(function () {
            if (signal) {
                throw new Error('Signals not supported on windows.');
            }
            _this._close();
            _this._agent.kill();
        });
    };`
const PATCHED_KILL = `    WindowsTerminal.prototype.kill = function (signal) {
        if (signal) {
            throw new Error('Signals not supported on windows.');
        }
        // ${PATCH_MARKER}
        this._deferreds = [];
        this._close();
        this._agent.kill();
    };`

function replaceExactlyOnce(source, before, after, label) {
  const first = source.indexOf(before)
  if (first < 0 || source.includes(before, first + before.length)) {
    throw new Error(`node-pty@1.1.0 ${label} implementation did not match exactly once`)
  }
  return source.slice(0, first) + after + source.slice(first + before.length)
}

function patchWindowsTerminal(source) {
  if (source.includes(PATCH_MARKER)) {
    if (!source.includes(PATCHED_DESTROY) || !source.includes(PATCHED_KILL)) {
      throw new Error('node-pty Windows shutdown patch marker exists on an incomplete patch')
    }
    return source
  }

  const withDestroy = replaceExactlyOnce(source, VANILLA_DESTROY, PATCHED_DESTROY, 'destroy()')
  return replaceExactlyOnce(withDestroy, VANILLA_KILL, PATCHED_KILL, 'kill()')
}

function applyPatch(rootDir = process.cwd()) {
  const target = join(rootDir, 'node_modules', 'node-pty', 'lib', 'windowsTerminal.js')
  const source = readFileSync(target, 'utf8')
  const patched = patchWindowsTerminal(source)
  if (patched !== source) {
    const pendingTarget = `${target}.orca-patch-pending`
    try {
      writeFileSync(pendingTarget, patched, 'utf8')
      renameSync(pendingTarget, target)
    } finally {
      rmSync(pendingTarget, { force: true })
    }
  }
  return target
}

function checkNativeDeps(rootDir = process.cwd()) {
  const target = join(rootDir, 'node_modules', 'node-pty', 'lib', 'windowsTerminal.js')
  const source = readFileSync(target, 'utf8')
  if (!source.includes(PATCHED_DESTROY) || !source.includes(PATCHED_KILL)) {
    throw new Error('node-pty Windows pre-ready shutdown patch is missing')
  }
  require.resolve('@parcel/watcher', { paths: [rootDir] })
  return target
}

if (require.main === module) {
  const mode = process.argv[2] ?? '--apply'
  const rootDir = process.argv[3] ?? process.cwd()
  if (mode === '--check') {
    checkNativeDeps(rootDir)
    process.stdout.write('ORCA-NATIVE-DEPS-OK\n')
  } else if (mode === '--apply') {
    const target = applyPatch(rootDir)
    process.stdout.write(`ORCA-NPTY-WINDOWS-PATCH-OK ${target}\n`)
  } else {
    throw new Error(`Unsupported node-pty patch mode: ${mode}`)
  }
}

module.exports = { PATCH_MARKER, applyPatch, checkNativeDeps, patchWindowsTerminal }
