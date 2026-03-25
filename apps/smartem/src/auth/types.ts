export type AuthUser = {
  name: string
  givenName: string
  familyName: string
  fedId: string
  email: string
}

export interface Auth {
  initialised: boolean
  authenticated: boolean
  user?: AuthUser
  login: () => void
  logout: () => void
  getToken: () => string
  error?: string
}
