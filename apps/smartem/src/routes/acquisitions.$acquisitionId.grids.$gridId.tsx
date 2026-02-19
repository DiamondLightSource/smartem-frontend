import { Box } from '@mui/material'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ViewSwitcher } from '~/components/session/ViewSwitcher'

export const Route = createFileRoute('/acquisitions/$acquisitionId/grids/$gridId')({
  component: GridLayout,
})

function GridLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <ViewSwitcher />
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </Box>
    </Box>
  )
}
