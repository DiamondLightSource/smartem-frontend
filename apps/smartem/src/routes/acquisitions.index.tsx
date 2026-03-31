import {
  Box,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import type { AcquisitionStatus } from '@smartem/api'
import { useGetAcquisitionsAcquisitionsGet } from '@smartem/api'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { gray, statusColors } from '~/theme'

export const Route = createFileRoute('/acquisitions/')({
  component: SessionsListPage,
})

const statusLabel: Record<AcquisitionStatus, string> = {
  planned: 'Planned',
  started: 'Started',
  completed: 'Completed',
  paused: 'Paused',
  abandoned: 'Abandoned',
}

const statusColor: Record<AcquisitionStatus, string> = {
  planned: statusColors.offline,
  started: statusColors.running,
  completed: statusColors.idle,
  paused: statusColors.paused,
  abandoned: statusColors.error,
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(startTime: string, endTime: string | null): string {
  const start = new Date(startTime).getTime()
  const end = endTime ? new Date(endTime).getTime() : Date.now()
  const hours = Math.floor((end - start) / 3_600_000)
  const mins = Math.floor(((end - start) % 3_600_000) / 60_000)
  if (hours === 0) return `${mins}m`
  return `${hours}h ${mins}m`
}

function SessionsListPage() {
  const navigate = useNavigate()
  const { data: acquisitions, isLoading, error } = useGetAcquisitionsAcquisitionsGet()

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="error">
          Failed to load acquisitions
        </Typography>
      </Box>
    )
  }

  const sorted = [...(acquisitions ?? [])].sort((a, b) => {
    if (!a.start_time) return 1
    if (!b.start_time) return -1
    return new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  })

  return (
    <Box
      sx={{
        height: 'calc(100vh - 56px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        p: 0.5,
        gap: 0.5,
        backgroundColor: gray[50],
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 1,
          px: 3,
          py: 1.5,
          flexShrink: 0,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Typography variant="h4">Acquisitions</Typography>
        <Typography variant="caption" sx={{ fontWeight: 500 }}>
          {sorted.length}
        </Typography>
      </Box>

      <TableContainer
        sx={{
          flex: 1,
          overflow: 'auto',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Instrument</TableCell>
              <TableCell>Started</TableCell>
              <TableCell>Duration</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((acq) => {
              const status = acq.status ?? 'planned'
              const color = statusColor[status]
              return (
                <TableRow
                  key={acq.uuid}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() =>
                    navigate({
                      to: '/acquisitions/$acquisitionId',
                      params: { acquisitionId: acq.uuid },
                    })
                  }
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {acq.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={statusLabel[status]}
                      sx={{
                        height: 20,
                        fontSize: '0.6875rem',
                        fontWeight: 500,
                        backgroundColor: `${color}14`,
                        color,
                        border: `1px solid ${color}40`,
                        '& .MuiChip-label': { px: 0.75 },
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {acq.instrument_model ?? acq.instrument_id ?? '--'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {acq.start_time
                        ? `${formatDate(acq.start_time)} ${formatTime(acq.start_time)}`
                        : '--'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {acq.start_time ? formatDuration(acq.start_time, acq.end_time) : '--'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
