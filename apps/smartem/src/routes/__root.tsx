import { Box, CssBaseline, Typography } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ErrorBoundary } from '~/components/ErrorBoundary'
import { Header } from '~/components/shell/Header'
import { theme } from '~/theme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

// The TanStack Router + Query devtools float over the bottom corners of the UI. Show them in dev by
// default, but let a local `.env.local` opt out with VITE_DEVTOOLS=false when they obscure the layout;
// never render them in a production build.
const showDevtools = import.meta.env.DEV && import.meta.env.VITE_DEVTOOLS !== 'false'

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: RootErrorComponent,
})

function RootComponent() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <ErrorBoundary label="Header">
            <Header />
          </ErrorBoundary>
          <Box component="main" sx={{ flex: 1 }}>
            <ErrorBoundary label="Route">
              <Outlet />
            </ErrorBoundary>
          </Box>
        </Box>
        {showDevtools && <TanStackRouterDevtools />}
        {showDevtools && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ThemeProvider>
  )
}

function RootErrorComponent({ error }: { error: Error }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 3, maxWidth: 720, mx: 'auto' }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Something went wrong
        </Typography>
        <Typography
          variant="body2"
          component="pre"
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.8125rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            p: 2,
            backgroundColor: 'grey.50',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          {error.message}
        </Typography>
      </Box>
    </ThemeProvider>
  )
}
