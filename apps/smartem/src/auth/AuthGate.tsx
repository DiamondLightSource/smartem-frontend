import { Login } from '@mui/icons-material'
import { Box, Button, Typography } from '@mui/material'
import { setAuthToken } from '@smartem/api'
import type { PropsWithChildren } from 'react'
import { AuthProvider, useAuth } from './AuthProvider'
import { isAuthEnabled } from './config'

export const AuthGate = ({ children }: PropsWithChildren) => {
  if (!isAuthEnabled()) {
    return <>{children}</>
  }

  return (
    <AuthProvider onTokenChange={setAuthToken}>
      <AuthBoundary>{children}</AuthBoundary>
    </AuthProvider>
  )
}

function AuthBoundary({ children }: PropsWithChildren) {
  const auth = useAuth()

  // Keycloak init is in flight - render nothing rather than flash either the
  // sign-in screen or the app contents.
  if (!auth.initialised) return null

  if (!auth.authenticated) return <SignInScreen onSignIn={auth.login} error={auth.error} />

  return <>{children}</>
}

function SignInScreen({ onSignIn, error }: { onSignIn: () => void; error?: string }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        px: 3,
        textAlign: 'center',
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        SmartEM
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 320 }}>
        Sign in with your Diamond account to continue.
      </Typography>
      <Button variant="contained" startIcon={<Login fontSize="small" />} onClick={onSignIn}>
        Sign in
      </Button>
      {error && (
        <Typography variant="caption" sx={{ color: 'error.main' }}>
          {error}
        </Typography>
      )}
    </Box>
  )
}
