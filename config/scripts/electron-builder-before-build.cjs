const { execFileSync } = require('node:child_process')
const { resolve } = require('node:path')
const electronBuilderNativeRebuild = require('./electron-builder-native-rebuild.cjs')

const projectDir = resolve(__dirname, '../..')

function electronBuilderBeforeBuild(context, runner = execFileSync) {
  const shouldContinue = electronBuilderNativeRebuild(context)
  const preparationArgs = buildWslRuntimePreparationArgs(context)
  if (preparationArgs) {
    runner(process.execPath, preparationArgs, {
      cwd: projectDir,
      stdio: 'inherit'
    })
  }
  return shouldContinue
}

function buildWslRuntimePreparationArgs(context) {
  const platform =
    typeof context?.platform === 'string' ? context.platform : context?.platform?.nodeName
  if (platform === 'win32') {
    // Why: Windows cannot execute Linux native addons directly, so package a
    // verified Linux runtime that can be installed inside each WSL distro.
    return ['config/scripts/prepare-wsl-watcher-runtime.mjs']
  }
  return null
}

module.exports = electronBuilderBeforeBuild
module.exports.default = electronBuilderBeforeBuild
module.exports.buildWslRuntimePreparationArgs = buildWslRuntimePreparationArgs
