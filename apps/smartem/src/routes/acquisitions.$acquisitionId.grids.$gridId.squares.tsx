import { Box } from '@mui/material'
import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { gray } from '~/theme'

export const Route = createFileRoute('/acquisitions/$acquisitionId/grids/$gridId/squares')({
  component: SquaresLayout,
})

// Two lenses on the same grid-square collection: the sortable, expandable Table (index) and the
// thumbnail Gallery. The square detail view (squares_/$squareId) is intentionally un-nested, so this
// sub-switch only frames the two collection views.
function SquaresLayout() {
  const { acquisitionId, gridId } = Route.useParams()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const onGallery = pathname.endsWith('/gallery')

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
          to="/acquisitions/$acquisitionId/grids/$gridId/squares"
          params={{ acquisitionId, gridId }}
          style={{ textDecoration: 'none' }}
        >
          <Box sx={tabSx(!onGallery)}>Table</Box>
        </Link>
        <Link
          to="/acquisitions/$acquisitionId/grids/$gridId/squares/gallery"
          params={{ acquisitionId, gridId }}
          style={{ textDecoration: 'none' }}
        >
          <Box sx={tabSx(onGallery)}>Gallery</Box>
        </Link>
      </Box>
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Outlet />
      </Box>
    </Box>
  )
}
