import { Box } from '@mui/material'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ContextStrip } from '~/components/session/ContextStrip'
import { gray } from '~/theme'

export const Route = createFileRoute('/acquisitions/$acquisitionId')({
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
        p: 0.5,
        gap: 0.5,
        backgroundColor: gray[50],
      }}
    >
      <ContextStrip />
      <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <Outlet />
      </Box>
    </Box>
  )
}
