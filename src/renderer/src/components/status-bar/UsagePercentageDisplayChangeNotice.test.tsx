// @vitest-environment happy-dom

import { act, createContext, useContext, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UsagePercentageDisplayChangeNotice } from './UsagePercentageDisplayChangeNotice'

const storeState = {
  persistedUIReady: true,
  usagePercentageDisplayChangeNoticeDismissed: false,
  dismissUsagePercentageDisplayChangeNotice: vi.fn(),
  statusBarVisible: true,
  activeModal: 'none' as string,
  setSettingsSearchQuery: vi.fn(),
  openSettingsTarget: vi.fn(),
  openSettingsPage: vi.fn()
}

vi.mock('@/store', () => ({
  useAppStore: Object.assign(
    (selector: (state: typeof storeState) => unknown) => selector(storeState),
    {
      getState: () => storeState
    }
  )
}))

vi.mock('@/components/ui/popover', () => {
  const OpenContext = createContext(false)
  return {
    Popover: ({ open, children }: { open?: boolean; children: ReactNode }) => (
      <OpenContext.Provider value={open === true}>
        <div data-testid="popover" data-open={open ? 'true' : 'false'}>
          {children}
        </div>
      </OpenContext.Provider>
    ),
    PopoverAnchor: ({ children }: { children: ReactNode }) => (
      <div data-testid="popover-anchor">{children}</div>
    ),
    PopoverContent: ({ children }: { children: ReactNode }) => {
      const open = useContext(OpenContext)
      if (!open) {
        return null
      }
      return <div data-testid="popover-content">{children}</div>
    }
  }
})

describe('UsagePercentageDisplayChangeNotice', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    vi.useFakeTimers()
    storeState.persistedUIReady = true
    storeState.usagePercentageDisplayChangeNoticeDismissed = false
    storeState.statusBarVisible = true
    storeState.activeModal = 'none'
    storeState.dismissUsagePercentageDisplayChangeNotice = vi.fn()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    vi.useRealTimers()
  })

  it('opens the callout next to usage meters after a short delay when eligible', () => {
    act(() => {
      root.render(
        <UsagePercentageDisplayChangeNotice hasVisibleUsageMeters>
          <span>usage-meters</span>
        </UsagePercentageDisplayChangeNotice>
      )
    })

    expect(container.querySelector('[data-open="true"]')).toBeNull()
    act(() => {
      vi.advanceTimersByTime(1_800)
    })
    expect(container.querySelector('[data-open="true"]')).not.toBeNull()
    expect(container.textContent).toContain('usage-meters')
    expect(container.textContent).toContain('Usage now shows % used')
    expect(container.textContent).toContain('Prefer remaining? Change it in Settings.')
  })

  it('does not open when no usage meters are visible', () => {
    act(() => {
      root.render(
        <UsagePercentageDisplayChangeNotice hasVisibleUsageMeters={false}>
          <span>usage-meters</span>
        </UsagePercentageDisplayChangeNotice>
      )
    })
    act(() => {
      vi.advanceTimersByTime(2_000)
    })
    expect(container.querySelector('[data-open="true"]')).toBeNull()
    expect(container.textContent).not.toContain('Usage now shows % used')
  })

  it('does not open when the notice was already dismissed', () => {
    storeState.usagePercentageDisplayChangeNoticeDismissed = true
    act(() => {
      root.render(
        <UsagePercentageDisplayChangeNotice hasVisibleUsageMeters>
          <span>usage-meters</span>
        </UsagePercentageDisplayChangeNotice>
      )
    })
    act(() => {
      vi.advanceTimersByTime(2_000)
    })
    expect(container.querySelector('[data-open="true"]')).toBeNull()
    expect(container.textContent).not.toContain('Usage now shows % used')
  })

  it('does not open while another modal is open', () => {
    storeState.activeModal = 'feature-tips'
    act(() => {
      root.render(
        <UsagePercentageDisplayChangeNotice hasVisibleUsageMeters>
          <span>usage-meters</span>
        </UsagePercentageDisplayChangeNotice>
      )
    })
    act(() => {
      vi.advanceTimersByTime(2_000)
    })
    expect(container.querySelector('[data-open="true"]')).toBeNull()
  })

  it('opens Appearance with a Usage percentages filter after wiping prior search', () => {
    const callOrder: string[] = []
    storeState.openSettingsPage = vi.fn(() => {
      callOrder.push('openSettingsPage')
    })
    storeState.openSettingsTarget = vi.fn(() => {
      callOrder.push('openSettingsTarget')
    })
    storeState.setSettingsSearchQuery = vi.fn(() => {
      callOrder.push('setSettingsSearchQuery')
    })
    storeState.dismissUsagePercentageDisplayChangeNotice = vi.fn()

    act(() => {
      root.render(
        <UsagePercentageDisplayChangeNotice hasVisibleUsageMeters>
          <span>usage-meters</span>
        </UsagePercentageDisplayChangeNotice>
      )
    })
    act(() => {
      vi.advanceTimersByTime(1_800)
    })

    const openSettingsButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Open Settings'
    )
    expect(openSettingsButton).toBeTruthy()
    act(() => {
      openSettingsButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    // Why: openSettingsPage clears search first; the filter must be applied after.
    expect(callOrder).toEqual(['openSettingsPage', 'openSettingsTarget', 'setSettingsSearchQuery'])
    expect(storeState.openSettingsTarget).toHaveBeenCalledWith({
      pane: 'appearance',
      repoId: null
    })
    expect(storeState.setSettingsSearchQuery).toHaveBeenCalledWith('Usage percentages')
    expect(storeState.dismissUsagePercentageDisplayChangeNotice).toHaveBeenCalled()
  })
})
