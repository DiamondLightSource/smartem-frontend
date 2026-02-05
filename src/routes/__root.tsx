import { Box } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { ApiVersionCheck } from '../components/ApiVersionCheck'
import { RouterLink } from '../components/RouterLink'
import {
  ColourSchemeButton,
  DiamondDSTheme,
  Footer,
  FooterLink,
  FooterLinks,
  Navbar,
  NavLink,
  NavLinks,
  ThemeProvider,
} from '../components/ui'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <ThemeProvider theme={DiamondDSTheme} defaultMode="system">
      <QueryClientProvider client={queryClient}>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar
            logo="theme"
            linkComponent={RouterLink}
            rightSlot={
              <>
                <ColourSchemeButton />
                <Box
                  component="img"
                  src="/fragment-screen-logo.png"
                  width={30}
                  onClick={() => window.open('https://fragmentscreen.org', '_blank')}
                  sx={{ cursor: 'pointer' }}
                />
              </>
            }
          >
            <NavLinks>
              <NavLink to="/" linkComponent={RouterLink}>
                Home
              </NavLink>
              <NavLink to="/models" linkComponent={RouterLink}>
                Models
              </NavLink>
            </NavLinks>
          </Navbar>

          <Box component="main" sx={{ flex: 1 }}>
            <Outlet />
          </Box>

          <Footer logo="theme" copyright="Diamond Light Source">
            <FooterLinks>
              <FooterLink href="https://www.diamond.ac.uk/Instruments/Biological-Cryo-Imaging/eBIC.html">
                eBIC
              </FooterLink>
              <FooterLink href="https://fragmentscreen.org">FragmentScreen</FooterLink>
            </FooterLinks>
          </Footer>
        </Box>
        <ApiVersionCheck />
        <TanStackRouterDevtools />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
