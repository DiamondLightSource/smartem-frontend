import { AccountCircle, Login } from '@mui/icons-material'
import { Box, IconButton, Menu, MenuItem, Typography } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { useState } from 'react'
import { useAuth } from '../auth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

export const Route = createRootRoute({
  component: RootComponent,
})

function AuthControls() {
  const auth = useAuth()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  if (!auth.initialised) return null

  if (!auth.authenticated) {
    return (
      <IconButton color="inherit" onClick={() => auth.login()}>
        <Login />
      </IconButton>
    )
  }

  return (
    <>
      <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
        <AccountCircle />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem disabled>{auth.user?.name || auth.user?.email}</MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null)
            auth.logout()
          }}
        >
          Logout
        </MenuItem>
      </Menu>
    </>
  )
}

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Box
          component="header"
          sx={{
            px: 3,
            py: 2,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="h6" component="span" fontWeight={700}>
            SmartEM
          </Typography>
          <AuthControls />
        </Box>

        <Box component="main" sx={{ flex: 1, p: 3 }}>
          <Outlet />
        </Box>
      </Box>
      <TanStackRouterDevtools />
    </QueryClientProvider>
  )
}
