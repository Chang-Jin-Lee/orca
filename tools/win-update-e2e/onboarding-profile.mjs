// A completed-onboarding persistence seed for a fresh packaged Orca profile.
//
// A first-run profile renders a fullscreen onboarding overlay (`fixed inset-0
// z-[100]`) that intercepts every pointer event, and the telemetry notice
// overlay for the existing-user cohort. Both block the harness from reaching a
// terminal. The renderer shows onboarding only while `onboarding.closedAt ===
// null` (src/renderer/src/components/onboarding/should-show-onboarding.ts), so
// writing this object to `<userDataDir>/orca-data.json` BEFORE launch dismisses
// it — the same mechanism the app's own E2E suite uses (tests/e2e/helpers/
// e2e-completed-onboarding-profile.ts + orca-app.ts).
//
// The onboarding flow-version and final-step values mirror src/shared/constants
// (ONBOARDING_FLOW_VERSION=4, ONBOARDING_FINAL_STEP=5 at time of writing); if the
// app bumps the flow version, refresh these so a stale version does not re-arm
// onboarding.

import { writeFileSync } from 'node:fs'
import path from 'node:path'

const ONBOARDING_FLOW_VERSION = 4
const ONBOARDING_FINAL_STEP = 5

/** The persisted profile object written to orca-data.json. */
export function getCompletedOnboardingProfile() {
  return {
    settings: {
      telemetry: {
        optedIn: true,
        installId: '00000000-0000-4000-8000-000000000000',
        existedBeforeTelemetryRelease: false
      }
    },
    onboarding: {
      flowVersion: ONBOARDING_FLOW_VERSION,
      closedAt: 1,
      outcome: 'completed',
      lastCompletedStep: ONBOARDING_FINAL_STEP
    }
  }
}

/** Write the completed-onboarding profile into a userData dir before launch. */
export function seedCompletedOnboarding(userDataDir) {
  writeFileSync(
    path.join(userDataDir, 'orca-data.json'),
    `${JSON.stringify(getCompletedOnboardingProfile(), null, 2)}\n`
  )
}
