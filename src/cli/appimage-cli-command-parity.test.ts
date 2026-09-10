import { describe, expect, it } from 'vitest'
import { APPIMAGE_CLI_COMMAND_NAMES } from '../main/startup/appimage-cli-command-names'
import { COMMAND_SPECS } from './specs'

// Why this test lives under src/cli: the Electron redirect's allow-list duplicates the CLI's
// top-level command names because the main tsconfig cannot import the CLI project, so the parity
// check has to run from the CLI side. Both directions matter. A command the redirect doesn't know
// about silently boots the GUI instead of running it on an extracted AppImage or .deb install
// (#13004); an entry left behind after a command is removed or renamed sends that name down the
// CLI path, where it resolves to nothing. The two sets are equal today, so parity is exact rather
// than one-sided.

const topLevelCommandNames = [...new Set(COMMAND_SPECS.map((spec) => spec.path[0]))]

describe('AppImage CLI command allow-list parity with the CLI spec', () => {
  it('has top-level commands to compare against', () => {
    expect(topLevelCommandNames.length).toBeGreaterThan(0)
  })

  it.each(topLevelCommandNames)('allow-lists the top-level command %s', (name) => {
    expect(APPIMAGE_CLI_COMMAND_NAMES).toContain(name)
  })

  it.each(APPIMAGE_CLI_COMMAND_NAMES)('keeps no allow-list entry for a gone command %s', (name) => {
    expect(topLevelCommandNames).toContain(name)
  })
})
