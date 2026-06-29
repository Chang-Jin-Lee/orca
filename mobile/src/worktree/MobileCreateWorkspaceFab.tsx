import { Platform, Pressable, StyleSheet } from 'react-native'
import { Plus } from 'lucide-react-native'
import { colors, spacing } from '../theme/mobile-theme'

const MOBILE_CREATE_WORKSPACE_FAB_SIZE = 56
const MOBILE_CREATE_WORKSPACE_FAB_ICON_SIZE = 26
export const MOBILE_CREATE_WORKSPACE_FAB_LIST_CLEARANCE =
  MOBILE_CREATE_WORKSPACE_FAB_SIZE + spacing.xl

type MobileCreateWorkspaceFabProps = {
  bottomOffset: number
  connected: boolean
  onPress: () => void
}

export function MobileCreateWorkspaceFab({
  bottomOffset,
  connected,
  onPress
}: MobileCreateWorkspaceFabProps) {
  return (
    <Pressable
      style={[styles.button, { bottom: bottomOffset }, !connected && styles.disabled]}
      onPress={onPress}
      disabled={!connected}
      accessibilityRole="button"
      accessibilityLabel="New workspace"
      accessibilityState={{ disabled: !connected }}
    >
      <Plus
        size={MOBILE_CREATE_WORKSPACE_FAB_ICON_SIZE}
        color={connected ? colors.bgBase : colors.textMuted}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: spacing.lg,
    width: MOBILE_CREATE_WORKSPACE_FAB_SIZE,
    height: MOBILE_CREATE_WORKSPACE_FAB_SIZE,
    borderRadius: MOBILE_CREATE_WORKSPACE_FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12
      },
      android: { elevation: 8 }
    })
  },
  disabled: {
    backgroundColor: colors.bgRaised,
    opacity: 0.6
  }
})
