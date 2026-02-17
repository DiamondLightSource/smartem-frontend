import { Box } from '@mui/material'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/sessions/$sessionId/grids/$gridId/squares_/$squareId')({
  component: SquareLayout,
})

function SquareLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Outlet />
    </Box>
  )
}
