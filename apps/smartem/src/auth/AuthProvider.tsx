import Keycloak, { type KeycloakError } from 'keycloak-js'
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { keycloakConfig } from './config'
import type { Auth, AuthUser } from './types'

const MIN_SECONDS_BEFORE_EXPIRY = 10
const MIN_REFRESH_INTERVAL_SECONDS = 5

const defaultAuth: Auth = {
  initialised: false,
  authenticated: false,
  login: () => {},
  logout: () => {},
  getToken: () => '',
}

const AuthContext = createContext<Auth>(defaultAuth)

export const useAuth = () => useContext(AuthContext)

interface AuthProviderProps extends PropsWithChildren {
  onTokenChange?: (token: string) => void
}

function buildAuth(keycloak: Keycloak): Auth {
  const auth: Auth = {
    initialised: keycloak.didInitialize,
    authenticated: keycloak.authenticated ?? false,
    login: () => void keycloak.login({}),
    logout: () => void keycloak.logout({}),
    getToken: () => keycloak.token ?? '',
  }

  if (keycloak.authenticated && keycloak.idTokenParsed) {
    auth.user = {
      name: keycloak.idTokenParsed.name ?? '',
      givenName: keycloak.idTokenParsed.given_name ?? '',
      familyName: keycloak.idTokenParsed.family_name ?? '',
      fedId: keycloak.idTokenParsed.fedId ?? '',
      email: keycloak.idTokenParsed.email ?? '',
    } satisfies AuthUser
  }

  return auth
}

export const AuthProvider = ({ children, onTokenChange }: AuthProviderProps) => {
  const [auth, setAuth] = useState<Auth>(defaultAuth)
  const refreshTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const onTokenChangeRef = useRef(onTokenChange)
  onTokenChangeRef.current = onTokenChange

  useEffect(() => {
    const keycloak = new Keycloak(keycloakConfig)

    const emitToken = () => {
      const token = keycloak.authenticated && keycloak.token ? keycloak.token : ''
      onTokenChangeRef.current?.(token)
    }

    const scheduleRefresh = () => {
      clearTimeout(refreshTimer.current)

      if (!keycloak.idTokenParsed?.exp || !keycloak.idTokenParsed?.iat) return

      const tokenLifetime = keycloak.idTokenParsed.exp - keycloak.idTokenParsed.iat
      let refreshIn = tokenLifetime - MIN_SECONDS_BEFORE_EXPIRY
      if (refreshIn < MIN_REFRESH_INTERVAL_SECONDS) {
        refreshIn = MIN_REFRESH_INTERVAL_SECONDS
      }

      refreshTimer.current = setTimeout(() => {
        keycloak.updateToken(-1).catch((err: KeycloakError) => {
          console.error('Token refresh failed:', err)
          setAuth((prev) => ({ ...prev, error: 'Token refresh failed' }))
        })
      }, refreshIn * 1000)
    }

    keycloak.onAuthSuccess = () => {
      setAuth(buildAuth(keycloak))
      emitToken()
      scheduleRefresh()
    }

    keycloak.onAuthRefreshSuccess = () => {
      emitToken()
      scheduleRefresh()
    }

    keycloak.onAuthLogout = () => {
      clearTimeout(refreshTimer.current)
      setAuth(buildAuth(keycloak))
      emitToken()
    }

    keycloak.onAuthError = (error: KeycloakError) => {
      console.error('Keycloak auth error:', error)
      setAuth((prev) => ({ ...prev, error: `Auth error: ${error.error}` }))
    }

    keycloak
      .init({ onLoad: 'check-sso' })
      .then(() => setAuth(buildAuth(keycloak)))
      .catch((err) => {
        console.error('Keycloak init failed:', err)
        setAuth({ ...defaultAuth, initialised: true, error: 'Failed to connect to Keycloak' })
      })

    return () => {
      clearTimeout(refreshTimer.current)
    }
  }, [])

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}
