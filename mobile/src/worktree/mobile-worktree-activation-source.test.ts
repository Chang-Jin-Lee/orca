import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('../../app/h/[hostId]/index.tsx', import.meta.url), 'utf8')
const fabSource = readFileSync(new URL('./MobileCreateWorkspaceFab.tsx', import.meta.url), 'utf8')

function sliceBetween(startPattern: string, endPattern: string): string {
  const start = source.indexOf(startPattern)
  expect(start).toBeGreaterThanOrEqual(0)
  const end = source.indexOf(endPattern, start)
  expect(end).toBeGreaterThan(start)
  return source.slice(start, end)
}

describe('mobile worktree activation', () => {
  it('opens mobile sessions without foregrounding other paired clients', () => {
    const openSession = sliceBetween(
      'const openWorktreeSession = useCallback(',
      'const handleSortChange = useCallback'
    )

    expect(openSession).toContain("sendRequest('worktree.activate'")
    expect(openSession).toContain('notifyClients: false')
  })

  it('keeps the phone new workspace action as a bottom-right floating button', () => {
    const phoneToolbar = sliceBetween(
      '<View style={styles.toolbar}>',
      '<Pressable style={styles.searchToggle} onPress={() => setShowSearch((s) => !s)}>'
    )
    const mobileCreateFabUsage = sliceBetween('{!embedded ? (', '<PickerModal')
    const listPadding = sliceBetween('contentContainerStyle={[', 'renderSectionHeader=')

    expect(phoneToolbar).not.toContain('openNewWorktreeModal')
    expect(phoneToolbar).not.toContain('styles.newButton')

    expect(mobileCreateFabUsage).toContain('<MobileCreateWorkspaceFab')
    expect(mobileCreateFabUsage).toContain('bottomOffset={insets.bottom + spacing.lg}')
    expect(mobileCreateFabUsage).toContain("connected={connState === 'connected'}")
    expect(mobileCreateFabUsage).toContain('onPress={openNewWorktreeModal}')

    expect(listPadding).toContain('!embedded ? MOBILE_CREATE_WORKSPACE_FAB_LIST_CLEARANCE : 0')
  })

  it('renders the mobile create workspace control as an accessible bottom-right FAB', () => {
    expect(fabSource).toContain("position: 'absolute'")
    expect(fabSource).toContain('right: spacing.lg')
    expect(fabSource).toContain('disabled={!connected}')
    expect(fabSource).toContain('accessibilityRole="button"')
    expect(fabSource).toContain('accessibilityLabel="New workspace"')
    expect(fabSource).toContain('accessibilityState={{ disabled: !connected }}')
    expect(fabSource).toContain('Platform.select')
    expect(fabSource).toContain('android: { elevation: 8 }')
  })

  it('preserves the embedded toolbar new workspace action', () => {
    const embeddedToolbar = sliceBetween('{embedded ? (', ') : (')

    expect(embeddedToolbar).toContain('onPress={openNewWorktreeModal}')
    expect(embeddedToolbar).toContain('accessibilityLabel="New workspace"')
  })
})
