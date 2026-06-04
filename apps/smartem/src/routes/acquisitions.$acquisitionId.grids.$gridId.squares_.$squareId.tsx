import { Box } from '@mui/material'
import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { gray } from '~/theme'

export const Route = createFileRoute(
  '/acquisitions/$acquisitionId/grids/$gridId/squares_/$squareId'
)({
  component: SquareLayout,
})

function SquareLayout() {
  const { acquisitionId, gridId, squareId } = Route.useParams()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const onPredictions = pathname.endsWith('/predictions')

  const tabSx = (active: boolean) => ({
    px: 1.25,
    py: 0.5,
    fontSize: '0.8125rem',
    fontWeight: active ? 600 : 400,
    color: active ? 'text.primary' : 'text.secondary',
    textDecoration: 'none',
    borderBottom: '2px solid',
    borderColor: active ? 'primary.main' : 'transparent',
    '&:hover': { color: 'text.primary' },
  })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          px: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: gray[50],
          flexShrink: 0,
        }}
      >
        <Link
          to="/acquisitions/$acquisitionId/grids/$gridId/squares/$squareId"
          params={{ acquisitionId, gridId, squareId }}
          style={{ textDecoration: 'none' }}
        >
          <Box sx={tabSx(!onPredictions)}>Map</Box>
        </Link>
        <Link
          to="/acquisitions/$acquisitionId/grids/$gridId/squares/$squareId/predictions"
          params={{ acquisitionId, gridId, squareId }}
          style={{ textDecoration: 'none' }}
        >
          <Box sx={tabSx(onPredictions)}>Predictions</Box>
        </Link>
      </Box>
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Outlet />
      </Box>
    </Box>
  )
}
