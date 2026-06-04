import type { KeycloakServerConfig } from 'keycloak-js'

export interface RuntimeConfig {
  keycloak: KeycloakServerConfig
  // Optional per-deployment feature toggles, overlaid on the compile-time defaults in
  // config/feature-flags.ts. Absent in mock mode (no config.json is loaded).
  features?: Record<string, boolean>
}

let runtimeConfig: RuntimeConfig | null = null

export const setRuntimeConfig = (config: RuntimeConfig): void => {
  runtimeConfig = config
}

const getRuntimeConfig = (): RuntimeConfig => {
  if (!runtimeConfig) {
    throw new Error(
      'Runtime config not loaded. /config.json must be fetched and applied before reading auth config.'
    )
  }
  return runtimeConfig
}

export const getKeycloakConfig = (): KeycloakServerConfig => getRuntimeConfig().keycloak

// Non-throwing: feature flags are optional and config is absent in mock mode, so callers
// fall back to compile-time defaults rather than erroring.
export const getRuntimeFeatureOverrides = (): Record<string, boolean> | undefined =>
  runtimeConfig?.features
