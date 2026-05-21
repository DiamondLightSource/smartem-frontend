import type { KeycloakServerConfig } from 'keycloak-js'

export interface RuntimeConfig {
  keycloak: KeycloakServerConfig
  authEnabled: boolean
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

export const isAuthEnabled = (): boolean => getRuntimeConfig().authEnabled

export const getKeycloakConfig = (): KeycloakServerConfig => getRuntimeConfig().keycloak
