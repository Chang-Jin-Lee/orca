# Feature Education State

Orca uses local persisted UI state to decide which education surfaces should appear for a user. Keep these concepts separate; they answer different questions and should not be collapsed into one flag.

## State Types

`featureTipsSeenIds` answers: "Has Orca already surfaced this tip?"

Set this when a restart tip is opened, dismissed, or acted on. It prevents the same tip from reappearing after restart, crash, or dismissal. It does not mean the user used the feature.

`contextualToursSeenIds` answers: "Has Orca already surfaced this contextual tour?"

Set this after a tour has rendered a measured target, or when the user skips/completes the tour. It prevents the same tour from showing again. It does not mean the user used the feature.

`featureInteractions` answers: "Has the user actually interacted with this feature?"

This is the product-state signal for already-discovered features. It lives in `PersistedUIState.featureInteractions`, keyed by `FeatureInteractionId`, and stores the first local interaction timestamp:

```ts
{
  tasks: {
    firstInteractedAt: 1716500000000
  }
}
```

Use this to suppress tips or tours that would teach a feature the user has already found on their own.

## Rules

- Define every trackable feature in `src/shared/feature-interactions.ts`.
- The `interaction` text must clearly state what counts as "used." Avoid vague labels like "seen" or "visited" unless passive visibility is truly the intended signal.
- Record only the first interaction. Repeated opens should not churn the user-data file.
- Record interactions only after persisted UI state is hydrated, so startup defaults cannot overwrite real user data.
- Do not rename or reuse ids. If semantics change materially, add a new id and leave the old one readable.
- Unknown or malformed persisted ids are ignored during hydration for forward/backward compatibility.
- This state is local product state, not telemetry. Do not use it for analytics conclusions unless a separate telemetry event exists.

## Adding A Tip

When a tip should not show after the user has already used the feature, add the relevant interaction id to the tip definition:

```ts
{
  id: 'voice-dictation',
  completedByFeatureInteractions: ['voice-dictation']
}
```

Then make sure the feature records its interaction at the meaningful product moment. For example, voice dictation records only after a session reaches `listening`, not when the settings pane opens.

## Adding A Tour

Tours still use `contextualToursSeenIds` to avoid repeating the same tour. If opening or using the toured surface should also suppress future education for that feature, call `recordFeatureInteraction(featureId)` from the surface's meaningful interaction point.

For contextual tours in this branch, `useContextualTour(...)` records the matching interaction once the surface is enabled and persisted UI is ready. Surface-specific gates decide what "enabled" means; for example, the browser tour waits for a non-blank local browser page.

## Test Profiles

Completed-onboarding E2E profiles should preseed both education exposure and feature interaction state. That keeps first-run education from covering unrelated UI under test while preserving production behavior for real profiles.
