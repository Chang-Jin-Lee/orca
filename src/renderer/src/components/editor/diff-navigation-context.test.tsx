// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { editor } from 'monaco-editor'
import {
  DiffNavigationProvider,
  useDiffNavigation,
  type DiffNavigationContextValue
} from './diff-navigation-context'

type FakeDiffEditor = editor.IStandaloneDiffEditor & {
  setLineChanges: (count: number) => void
  fireUpdate: () => void
  goToDiff: ReturnType<typeof vi.fn>
}

function createFakeEditor(initialCount: number): FakeDiffEditor {
  let count = initialCount
  let updateCallback: (() => void) | null = null
  const editor = {
    getLineChanges: () => (count > 0 ? Array.from({ length: count }, () => ({})) : []),
    goToDiff: vi.fn(),
    onDidUpdateDiff: (cb: () => void) => {
      updateCallback = cb
      return { dispose: () => {} }
    },
    setLineChanges: (next: number) => {
      count = next
    },
    fireUpdate: () => updateCallback?.()
  } as unknown as FakeDiffEditor
  return editor
}

let captured: DiffNavigationContextValue | null = null

function Probe(): null {
  captured = useDiffNavigation()
  return null
}

describe('DiffNavigationProvider', () => {
  let container: HTMLDivElement | null = null
  let root: Root | null = null

  function mount(): void {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() => {
      root?.render(
        <DiffNavigationProvider>
          <Probe />
        </DiffNavigationProvider>
      )
    })
  }

  afterEach(() => {
    if (root) {
      act(() => root?.unmount())
    }
    container?.remove()
    container = null
    root = null
    captured = null
  })

  it('exposes the change count and routes nav actions to the registered editor', () => {
    mount()
    const editor = createFakeEditor(3)
    act(() => captured?.registerDiffEditor(editor))

    expect(captured?.changeCount).toBe(3)

    act(() => captured?.goToNextDiff())
    expect(editor.goToDiff).toHaveBeenCalledWith('next')

    act(() => captured?.goToPreviousDiff())
    expect(editor.goToDiff).toHaveBeenCalledWith('previous')
  })

  it('re-renders when onDidUpdateDiff flips the count 0 -> N (count is state)', () => {
    mount()
    const editor = createFakeEditor(0)
    act(() => captured?.registerDiffEditor(editor))
    expect(captured?.changeCount).toBe(0)

    act(() => {
      editor.setLineChanges(2)
      editor.fireUpdate()
    })
    expect(captured?.changeCount).toBe(2)
  })

  it('ignores a stale unregister for an editor that is no longer current (identity guard)', () => {
    mount()
    const oldEditor = createFakeEditor(1)
    const newEditor = createFakeEditor(4)

    // Fast-swap: new editor registers before the old one's dispose fires.
    act(() => captured?.registerDiffEditor(oldEditor))
    act(() => captured?.registerDiffEditor(newEditor))
    expect(captured?.changeCount).toBe(4)

    act(() => captured?.unregisterDiffEditor(oldEditor))

    // New editor's count is intact and nav still routes to it.
    expect(captured?.changeCount).toBe(4)
    act(() => captured?.goToNextDiff())
    expect(newEditor.goToDiff).toHaveBeenCalledWith('next')
    expect(oldEditor.goToDiff).not.toHaveBeenCalled()
  })
})
