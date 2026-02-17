import { Box, ButtonBase, Typography } from '@mui/material'
import { Link, useParams, useRouterState } from '@tanstack/react-router'
import { getGrid } from '~/data/mock-session-detail'

const tabs = [
  { key: 'atlas', label: 'Atlas', suffix: '/atlas' },
  { key: 'squares', label: 'Squares', suffix: '/squares' },
] as const

export function ViewSwitcher() {
  const { sessionId, gridId } = useParams({ strict: false }) as {
    sessionId: string
    gridId: string
  }
  const router = useRouterState()
  const pathname = router.location.pathname

  const grid = getGrid(gridId)

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 2,
        height: 36,
        borderBottom: '1px solid',
        borderColor: 'divider',
        flexShrink: 0,
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, mr: 1.5 }}>
        {grid?.name ?? gridId}
      </Typography>

      {tabs.map((tab) => {
        const to = `/sessions/${sessionId}/grids/${gridId}${tab.suffix}`
        const isActive = pathname.endsWith(tab.suffix)
        return (
          <ButtonBase
            key={tab.key}
            component={Link}
            to={to}
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.8125rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'text.primary' : 'text.secondary',
              backgroundColor: isActive ? '#f0f2f4' : 'transparent',
              textDecoration: 'none',
              '&:hover': { backgroundColor: '#f6f8fa' },
            }}
          >
            {tab.label}
          </ButtonBase>
        )
      })}
    </Box>
  )
}
