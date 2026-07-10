import { describe, expect, it } from 'vitest'
import { INSTALL_SCRIPT, parseRunningWslDistros } from './filesystem-watcher-wsl-runtime'

describe('managed WSL watcher runtime', () => {
  it('parses running distro output across WSL encodings', () => {
    expect(parseRunningWslDistros('U\0b\0u\0n\0t\0u\0\r\0\n\0* Debian\r\n')).toEqual([
      'Ubuntu',
      'Debian'
    ])
  })

  it('installs a verified architecture-specific host without a user runtime', () => {
    expect(INSTALL_SCRIPT).toContain('case "$(uname -m)"')
    expect(INSTALL_SCRIPT).toContain('getconf GNU_LIBC_VERSION')
    expect(INSTALL_SCRIPT).toContain('node-v$node_version-linux-$arch/bin/node')
    expect(INSTALL_SCRIPT).toContain('node-v$node_version-linux-$arch/LICENSE')
    expect(INSTALL_SCRIPT).toContain('parcel-watcher-LICENSE')
    expect(INSTALL_SCRIPT).toContain('"$stage/node" "$stage/host.js" --check')
    expect(INSTALL_SCRIPT).not.toContain('python')
  })
})
