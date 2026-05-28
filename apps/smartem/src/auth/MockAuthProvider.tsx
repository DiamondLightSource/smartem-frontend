import { type PropsWithChildren, useEffect } from 'react'
import { AuthContext } from './AuthContext'
import type { Auth } from './types'

const MOCK_TOKEN = 'mock-token'

const mockAuth: Auth = {
  initialised: true,
  authenticated: true,
  user: {
    name: 'Mock User',
    givenName: 'Mock',
    familyName: 'User',
    fedId: 'mock001',
    email: 'mock@example.diamond.ac.uk',
  },
  login: () => {},
  logout: () => {},
  getToken: () => MOCK_TOKEN,
}

interface MockAuthProviderProps extends PropsWithChildren {
  onTokenChange?: (token: string) => void
}

export const MockAuthProvider = ({ children, onTokenChange }: MockAuthProviderProps) => {
  useEffect(() => {
    onTokenChange?.(MOCK_TOKEN)
  }, [onTokenChange])

  return <AuthContext.Provider value={mockAuth}>{children}</AuthContext.Provider>
}
