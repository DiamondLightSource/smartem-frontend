import {
  AppBar,
  Box,
  Button,
  Divider,
  IconButton,
  InputBase,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import { Link, useRouterState } from '@tanstack/react-router'
import { useCallback, useRef, useState } from 'react'

const navLinks = [
  { label: 'Dashboard', to: '/' },
  { label: 'Sessions', to: '/sessions' },
  { label: 'Models', to: '/models' },
  { label: 'Depositions', to: '/depositions' },
] as const

function NavLink({ label, to }: { label: string; to: string }) {
  const router = useRouterState()
  const isActive =
    to === '/' ? router.location.pathname === '/' : router.location.pathname.startsWith(to)

  return (
    <Typography
      component={Link}
      to={to}
      variant="body2"
      sx={{
        px: 1.5,
        py: 0.75,
        borderRadius: 1,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? 'text.primary' : 'text.secondary',
        textDecoration: 'none',
        '&:hover': {
          backgroundColor: '#f6f8fa',
          color: 'text.primary',
        },
      }}
    >
      {label}
    </Typography>
  )
}

type UserRole = 'visitor' | 'staff' | 'admin'

const ROLE_KEY = 'smartem-user-role'

const ROLES: { key: UserRole; label: string; short: string }[] = [
  { key: 'visitor', label: 'Visitor user', short: 'Visitor' },
  { key: 'staff', label: 'Facility staff', short: 'Staff' },
  { key: 'admin', label: 'System admin', short: 'Admin' },
]

function readRole(): UserRole {
  const v = localStorage.getItem(ROLE_KEY)
  if (v === 'visitor' || v === 'staff' || v === 'admin') return v
  return 'staff'
}

export function Header() {
  return (
    <AppBar position="sticky" component="header">
      <Toolbar
        sx={{
          minHeight: '56px !important',
          height: 56,
          px: { xs: 2, sm: 3 },
          gap: 1,
        }}
      >
        {/* Logos */}
        <Tooltip title="Diamond Light Source — eBIC">
          <IconButton
            component="a"
            href="https://www.diamond.ac.uk/Instruments/Biological-Cryo-Imaging/eBIC.html"
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{ p: 0.5 }}
          >
            <Box
              component="img"
              src="/diamond-logo.ico"
              alt="Diamond Light Source"
              sx={{ width: 24, height: 24 }}
            />
          </IconButton>
        </Tooltip>
        <Tooltip title="FragmentScreen">
          <IconButton
            component="a"
            href="https://fragmentscreen.org"
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{ p: 0.5, mr: 0.5 }}
          >
            <Box
              component="img"
              src="/fragment-screen-logo.png"
              alt="FragmentScreen"
              sx={{ width: 24, height: 24 }}
            />
          </IconButton>
        </Tooltip>

        <Typography
          component={Link}
          to="/"
          variant="body1"
          sx={{
            fontWeight: 700,
            fontSize: '1rem',
            color: 'text.primary',
            textDecoration: 'none',
            mr: 2,
            flexShrink: 0,
          }}
        >
          SmartEM
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.25, mr: 2, flexShrink: 0 }}>
          {navLinks.map((link) => (
            <NavLink key={link.to} {...link} />
          ))}
        </Box>

        <Box
          sx={{
            flex: 1,
            maxWidth: 480,
            mx: 'auto',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1.5,
              px: 1.5,
              height: 32,
              backgroundColor: '#f6f8fa',
              '&:hover': { borderColor: '#afb8c1' },
            }}
          >
            <InputBase
              placeholder="Search or jump to..."
              readOnly
              sx={{
                flex: 1,
                fontSize: '0.8125rem',
                color: 'text.secondary',
                '& input': { cursor: 'default', padding: 0 },
              }}
            />
            <Typography
              component="kbd"
              sx={{
                fontSize: '0.6875rem',
                color: 'text.disabled',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 0.5,
                px: 0.75,
                py: 0.125,
                lineHeight: 1.4,
                fontFamily: 'inherit',
                backgroundColor: '#ffffff',
              }}
            >
              /
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 2, flexShrink: 0 }}>
          <SettingsMenu />
          <RoleSwitcher />
        </Box>
      </Toolbar>
    </AppBar>
  )
}

function SettingsMenu() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  return (
    <>
      <Tooltip title="Settings">
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ color: 'text.secondary' }}
        >
          <HamburgerIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 220 } } }}
      >
        <MenuItem disabled sx={{ opacity: '0.7 !important', fontSize: '0.8125rem' }}>
          <ListItemIcon sx={{ minWidth: '28px !important' }}>
            <ThemeIcon />
          </ListItemIcon>
          <ListItemText>Light / Dark mode</ListItemText>
          <Typography variant="caption" sx={{ color: 'text.disabled', ml: 1 }}>
            soon
          </Typography>
        </MenuItem>

        <MenuItem disabled sx={{ opacity: '0.7 !important', fontSize: '0.8125rem' }}>
          <ListItemIcon sx={{ minWidth: '28px !important' }}>
            <LanguageIcon />
          </ListItemIcon>
          <ListItemText>Language</ListItemText>
          <Typography variant="caption" sx={{ color: 'text.disabled', ml: 1 }}>
            English
          </Typography>
        </MenuItem>

        <MenuItem disabled sx={{ opacity: '0.7 !important', fontSize: '0.8125rem' }}>
          <ListItemIcon sx={{ minWidth: '28px !important' }}>
            <DensityIcon />
          </ListItemIcon>
          <ListItemText>Display density</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem
          component="a"
          href="https://diamondlightsource.github.io/smartem-devtools/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setAnchorEl(null)}
          sx={{ fontSize: '0.8125rem' }}
        >
          <ListItemIcon sx={{ minWidth: '28px !important' }}>
            <DocsIcon />
          </ListItemIcon>
          <ListItemText>Documentation</ListItemText>
          <Typography variant="caption" sx={{ color: 'text.disabled', ml: 1 }}>
            ↗
          </Typography>
        </MenuItem>

        <MenuItem disabled sx={{ opacity: '0.7 !important', fontSize: '0.8125rem' }}>
          <ListItemIcon sx={{ minWidth: '28px !important' }}>
            <KeyboardIcon />
          </ListItemIcon>
          <ListItemText>Keyboard shortcuts</ListItemText>
          <Typography variant="caption" sx={{ color: 'text.disabled', ml: 1 }}>
            ?
          </Typography>
        </MenuItem>

        <MenuItem
          component="a"
          href="https://github.com/DiamondLightSource/smartem-frontend/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setAnchorEl(null)}
          sx={{ fontSize: '0.8125rem' }}
        >
          <ListItemIcon sx={{ minWidth: '28px !important' }}>
            <BugIcon />
          </ListItemIcon>
          <ListItemText>Report a bug</ListItemText>
          <Typography variant="caption" sx={{ color: 'text.disabled', ml: 1 }}>
            ↗
          </Typography>
        </MenuItem>
      </Menu>
    </>
  )
}

function RoleSwitcher() {
  const [role, setRole] = useState<UserRole>(readRole)
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)

  const pick = useCallback((r: UserRole) => {
    setRole(r)
    localStorage.setItem(ROLE_KEY, r)
    setOpen(false)
  }, [])

  const current = ROLES.find((r) => r.key === role) ?? ROLES[1]

  return (
    <>
      <Button
        ref={anchorRef}
        size="small"
        variant="outlined"
        onClick={() => setOpen((v) => !v)}
        sx={{ textTransform: 'none', fontWeight: 500, fontSize: '0.8125rem' }}
      >
        {current.short}
      </Button>
      <Menu
        anchorEl={anchorRef.current}
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 160 } } }}
      >
        {ROLES.map((r) => (
          <MenuItem
            key={r.key}
            selected={r.key === role}
            onClick={() => pick(r.key)}
            sx={{ fontSize: '0.8125rem' }}
          >
            {r.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

// ---------------------------------------------------------------------------
// Inline SVG icons (16×16)
// ---------------------------------------------------------------------------

function HamburgerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      role="img"
      aria-label="Menu"
    >
      <path d="M1 2.75A.75.75 0 0 1 1.75 2h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 2.75Zm0 5A.75.75 0 0 1 1.75 7h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 7.75ZM1.75 12h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5Z" />
    </svg>
  )
}

function ThemeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      role="img"
      aria-label="Theme"
    >
      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM3 8a5 5 0 0 1 5-5v10a5 5 0 0 1-5-5Z" />
    </svg>
  )
}

function LanguageIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      role="img"
      aria-label="Language"
    >
      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM3.07 7.5h2.453c.04-1.1.19-2.12.43-2.97a8 8 0 0 1-.82-.43A5.98 5.98 0 0 0 3.07 7.5Zm2.453 1H3.07a5.98 5.98 0 0 0 2.063 3.4c.27-.13.55-.27.82-.43-.24-.85-.39-1.87-.43-2.97ZM7.5 3.09c-.5.26-1.02.9-1.39 2.03-.12.4-.21.84-.28 1.38h1.67V3.09Zm0 4.41H5.83c.04 1.02.18 1.95.39 2.72.37 1.13.9 1.77 1.28 2.03V8.5v-1Zm1 6.41c.5-.26 1.02-.9 1.39-2.03.21-.67.35-1.45.39-2.38H8.5v4.41Zm0-5.41h1.78c-.04-.92-.18-1.7-.39-2.38C9.52 3.99 9 3.35 8.5 3.09V7.5Zm2.78 1c-.04 1.1-.19 2.12-.43 2.97.27.16.55.3.82.43A5.98 5.98 0 0 0 12.93 8.5h-2.453Zm.82-1H12.93a5.98 5.98 0 0 0-2.063-3.4c-.27.13-.55.27-.82.43.24.85.39 1.87.43 2.97Z" />
    </svg>
  )
}

function DensityIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      role="img"
      aria-label="Display density"
    >
      <path d="M2 3h12v1H2zm0 4h12v1H2zm0 4h12v1H2z" />
    </svg>
  )
}

function DocsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      role="img"
      aria-label="Documentation"
    >
      <path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.74 3.74 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324 .004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.75 3.75 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z" />
    </svg>
  )
}

function KeyboardIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      role="img"
      aria-label="Keyboard shortcuts"
    >
      <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h11A1.5 1.5 0 0 1 15 3.5v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 11.5ZM2.5 3a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5ZM4 5h1v1H4Zm3 0H6v1h1Zm2 0h1v1H9Zm3 0h-1v1h1ZM4 8h1v1H4Zm3 0H6v1h1Zm2 0h1v1H9Zm3 0h-1v1h1ZM5 10H4v1h7v-1H5Z" />
    </svg>
  )
}

function BugIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      role="img"
      aria-label="Report a bug"
    >
      <path d="M4.72 3.22a.75.75 0 0 1 1.06 0l1.19 1.19c.28-.1.57-.18.88-.22V1.75a.75.75 0 0 1 1.5 0v2.44c.3.04.59.12.86.22l1.19-1.19a.75.75 0 1 1 1.06 1.06L11.28 5.47c.17.23.31.48.41.75H13a.75.75 0 0 1 0 1.5h-1.1a4 4 0 0 1 0 .56H13a.75.75 0 0 1 0 1.5h-1.31c-.07.21-.15.41-.26.59l1.35 1.35a.75.75 0 1 1-1.06 1.06l-1.15-1.15A3.98 3.98 0 0 1 8 12.5a3.98 3.98 0 0 1-2.57-.92L4.28 12.73a.75.75 0 0 1-1.06-1.06l1.35-1.35a4 4 0 0 1-.26-.59H3a.75.75 0 0 1 0-1.5h1.1a4 4 0 0 1 0-.56H3a.75.75 0 0 1 0-1.5h1.31c.1-.27.24-.52.41-.75L3.53 4.28a.75.75 0 0 1 0-1.06ZM8 5a2.5 2.5 0 0 0-2.5 2.5v1A2.5 2.5 0 1 0 8 5Z" />
    </svg>
  )
}
