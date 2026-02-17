import {
  AppBar,
  Box,
  Button,
  InputBase,
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
] as const

function NavLink({ label, to }: { label: string; to: string }) {
  const router = useRouterState()
  const isActive = router.location.pathname === to

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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2, flexShrink: 0 }}>
          <Tooltip title="Display density">
            <Button
              size="small"
              variant="outlined"
              sx={{
                minWidth: 0,
                px: 1,
                color: 'text.secondary',
                fontSize: '1rem',
                lineHeight: 1,
              }}
            >
              <DensityIcon />
            </Button>
          </Tooltip>

          <RoleSwitcher />
        </Box>
      </Toolbar>
    </AppBar>
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
