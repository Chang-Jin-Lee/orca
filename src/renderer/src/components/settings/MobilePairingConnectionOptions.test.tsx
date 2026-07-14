// @vitest-environment happy-dom

import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MobileRelayStatus } from '../../../../shared/mobile-relay-status'
import type { OrcaProfileAuthStatus } from '../../../../shared/orca-profiles'
import { MobilePairingConnectionOptions } from './MobilePairingConnectionOptions'

type MobileRelayStoreState = {
  orcaProfileAuthStatus: OrcaProfileAuthStatus | null
  orcaProfileConnecting: boolean
  connectCurrentOrcaProfile: () => Promise<null>
}

const mocks = vi.hoisted(() => ({
  state: {} as MobileRelayStoreState
}))

vi.mock('../../store', () => ({
  useAppStore: (selector: (state: MobileRelayStoreState) => unknown) => selector(mocks.state)
}))

vi.mock('../../i18n/i18n', () => ({
  translate: (_key: string, fallback: string) => fallback
}))

describe('MobilePairingConnectionOptions', () => {
  let statusListener: ((status: MobileRelayStatus) => void) | null
  const connect = vi.fn().mockResolvedValue(null)

  beforeEach(() => {
    statusListener = null
    connect.mockClear()
    Object.defineProperty(window, 'api', {
      configurable: true,
      value: {
        mobile: {
          getRelayStatus: vi.fn().mockResolvedValue({ status: 'registered' }),
          onRelayStatusChanged: vi.fn((listener: (status: MobileRelayStatus) => void) => {
            statusListener = listener
            return vi.fn()
          })
        },
        shell: { openUrl: vi.fn().mockResolvedValue(undefined) }
      }
    })
    mocks.state = {
      orcaProfileAuthStatus: {
        activeProfileId: 'profile-1',
        configured: true,
        state: 'local',
        persistence: 'none'
      },
      orcaProfileConnecting: false,
      connectCurrentOrcaProfile: connect
    }
  })

  afterEach(() => cleanup())

  it('offers local-only pairing while Relay requires sign-in', async () => {
    const user = userEvent.setup()
    render(<MobilePairingConnectionOptions value="local-only" onChange={vi.fn()} />)

    expect(screen.getByRole('radio', { name: /connect from anywhere/i })).toBeDisabled()
    expect(screen.getByRole('radio', { name: /local network only/i })).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(connect).toHaveBeenCalledOnce()
  })

  it('selects either automatic fallback or local-only pairing when signed in', async () => {
    mocks.state = {
      orcaProfileAuthStatus: {
        activeProfileId: 'profile-1',
        configured: true,
        state: 'connected',
        persistence: 'encrypted'
      },
      orcaProfileConnecting: false,
      connectCurrentOrcaProfile: connect
    }
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<MobilePairingConnectionOptions value="automatic" onChange={onChange} />)

    await waitFor(() => expect(screen.getByText('Ready')).toBeVisible())
    await user.click(screen.getByRole('radio', { name: /local network only/i }))
    expect(onChange).toHaveBeenCalledWith('local-only')
    statusListener?.('standby')
    await waitFor(() => expect(screen.getByText('Available')).toBeVisible())
  })

  it('explains the Relay beta and opens both compatible mobile builds', async () => {
    const user = userEvent.setup()
    render(<MobilePairingConnectionOptions value="local-only" onChange={vi.fn()} />)

    await user.hover(screen.getByRole('button', { name: 'About the Orca Relay beta' }))
    await waitFor(() =>
      expect(screen.getByText(/currently available on the iOS TestFlight preview/i)).toBeVisible()
    )

    await user.click(screen.getByRole('button', { name: 'Open TestFlight' }))
    expect(window.api.shell.openUrl).toHaveBeenCalledWith(
      'https://testflight.apple.com/join/YjeGMQBA'
    )

    await user.click(screen.getByRole('button', { name: 'Download Android APK' }))
    expect(window.api.shell.openUrl).toHaveBeenCalledWith(
      'https://github.com/stablyai/orca/releases/download/mobile-android-v0.0.27/app-release.apk'
    )
  })

  it('keeps the compact onboarding choices structurally stable across modes', async () => {
    mocks.state = {
      orcaProfileAuthStatus: {
        activeProfileId: 'profile-1',
        configured: true,
        state: 'connected',
        persistence: 'encrypted'
      },
      orcaProfileConnecting: false,
      connectCurrentOrcaProfile: connect
    }
    const props = { compact: true, onChange: vi.fn() }
    const { rerender } = render(<MobilePairingConnectionOptions {...props} value="automatic" />)

    expect(screen.getByRole('radiogroup').children).toHaveLength(2)
    expect(screen.getByText('LAN or Tailscale')).toBeVisible()
    expect(screen.getByText(/direct connection when available/i)).toBeVisible()
    await waitFor(() => expect(screen.getByText('Ready')).toBeInTheDocument())

    rerender(<MobilePairingConnectionOptions {...props} value="local-only" />)
    expect(screen.getByRole('radiogroup').children).toHaveLength(2)
    expect(screen.getByText(/without connecting this phone through Orca Relay/i)).toBeVisible()
  })
})
