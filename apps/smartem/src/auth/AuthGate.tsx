import { setAuthToken } from '@smartem/api'
import type { PropsWithChildren } from 'react'
import { AuthProvider } from './AuthProvider'
import { isAuthEnabled } from './config'

export const AuthGate = ({ children }: PropsWithChildren) => {
  if (!isAuthEnabled()) {
    return <>{children}</>
  }

  return <AuthProvider onTokenChange={setAuthToken}>{children}</AuthProvider>
}
