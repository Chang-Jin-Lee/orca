import type * as fs from 'fs'
import { sep } from 'path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveNodePtySpawnHelperPath, selectNodePtySpawnHelperRepair } from './local-pty-utils'

const { existsSyncMock } = vi.hoisted(() => ({
  existsSyncMock: vi.fn<(path: string) => boolean>()
}))

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof fs>('fs')
  return {
    ...actual,
    existsSync: existsSyncMock
  }
})

function normalizePathForAssertion(path: string): string {
  return sep === '\\' ? path.replaceAll('\\', '/') : path
}

describe('selectNodePtySpawnHelperRepair', () => {
  afterEach(() => {
    existsSyncMock.mockReset()
  })

  it('does not repair when the resolved helper already exists', () => {
    existsSyncMock.mockImplementation((path) => path === '/resolved/spawn-helper')

    expect(
      selectNodePtySpawnHelperRepair({
        resolvedHelperPath: '/resolved/spawn-helper',
        candidates: ['/resolved/spawn-helper', '/prebuilds/spawn-helper']
      })
    ).toEqual({ needsRepair: false, repairSourcePath: null })
  })

  it('repairs from an alternate existing helper when the resolved path is missing', () => {
    existsSyncMock.mockImplementation((path) => path === '/prebuilds/spawn-helper')

    expect(
      selectNodePtySpawnHelperRepair({
        resolvedHelperPath: '/build/Release/spawn-helper',
        candidates: ['/build/Release/spawn-helper', '/prebuilds/spawn-helper']
      })
    ).toEqual({
      needsRepair: true,
      repairSourcePath: '/prebuilds/spawn-helper'
    })
  })

  it('does not claim a repair when no helper exists anywhere', () => {
    existsSyncMock.mockReturnValue(false)

    expect(
      selectNodePtySpawnHelperRepair({
        resolvedHelperPath: '/build/Release/spawn-helper',
        candidates: ['/build/Release/spawn-helper', '/prebuilds/spawn-helper']
      })
    ).toEqual({ needsRepair: false, repairSourcePath: null })
  })
})

describe('resolveNodePtySpawnHelperPath', () => {
  it('matches node-pty path resolution for relative native dirs', () => {
    expect(
      normalizePathForAssertion(
        resolveNodePtySpawnHelperPath({
          unixTerminalPath: '/app/node_modules/node-pty/lib/unixTerminal.js',
          nativeDir: '../build/Release/'
        })
      )
    ).toBe('/app/node_modules/node-pty/build/Release/spawn-helper')
  })

  it('targets the unpacked asar path used by node-pty at runtime', () => {
    expect(
      normalizePathForAssertion(
        resolveNodePtySpawnHelperPath({
          unixTerminalPath:
            '/App.app/Contents/Resources/app.asar/node_modules/node-pty/lib/unixTerminal.js',
          nativeDir: '../build/Release/'
        })
      )
    ).toBe(
      '/App.app/Contents/Resources/app.asar.unpacked/node_modules/node-pty/build/Release/spawn-helper'
    )
  })

  it('does not double-apply the unpacked asar transform', () => {
    expect(
      normalizePathForAssertion(
        resolveNodePtySpawnHelperPath({
          unixTerminalPath:
            '/App.app/Contents/Resources/app.asar.unpacked/node_modules/node-pty/lib/unixTerminal.js',
          nativeDir: '../build/Release/'
        })
      )
    ).toBe(
      '/App.app/Contents/Resources/app.asar.unpacked/node_modules/node-pty/build/Release/spawn-helper'
    )
  })
})
