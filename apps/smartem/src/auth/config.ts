import type { KeycloakServerConfig } from 'keycloak-js'

export const isAuthEnabled = (): boolean => {
  if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    return import.meta.env.VITE_AUTH_ENABLED === 'true'
  }
  return import.meta.env.VITE_AUTH_ENABLED !== 'false'
}

export const keycloakConfig: KeycloakServerConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'https://identity.diamond.ac.uk',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'dls',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'SmartEM',
}
