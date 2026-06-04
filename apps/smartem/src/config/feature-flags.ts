import { getRuntimeFeatureOverrides } from '~/auth/config'

// Compile-time defaults for every known feature flag. A deployment's config.json may
// override any of these via its `features` map. Incomplete/experimental features default
// to false so they stay hidden until explicitly enabled.
export const FEATURE_DEFAULTS = {
  // ARIA deposition workflow (route + nav link not built yet)
  depositions: false,
  // Agent log viewer (future, SSE-backed)
  agentLogs: false,
  // Dark colour scheme (designed separately)
  darkMode: false,
  // Display-density control (compact/comfortable/spacious)
  density: false,
} as const

export type FeatureName = keyof typeof FEATURE_DEFAULTS

// Resolves a flag: runtime override (config.json) wins, else the compile-time default.
// Plain function (no React state) - runtime config is applied once before render and is
// static thereafter, so this is safe to call directly in render or anywhere else.
export function getFeatureFlag(name: FeatureName): boolean {
  return getRuntimeFeatureOverrides()?.[name] ?? FEATURE_DEFAULTS[name]
}

// Hook form for ergonomic use in components. Non-reactive by design (flags don't change
// during a session); it simply returns the resolved value.
export function useFeatureFlag(name: FeatureName): boolean {
  return getFeatureFlag(name)
}
