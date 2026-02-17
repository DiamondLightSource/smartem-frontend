import { Box } from '@mui/material'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ContextStrip } from '~/components/session/ContextStrip'

export const Route = createFileRoute('/sessions/$sessionId')({
  component: SessionLayout,
})

function SessionLayout() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 56px)',
        overflow: 'hidden',
      }}
    >
      <ContextStrip />
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </Box>
    </Box>
  )
}
