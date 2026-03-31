import { Box, Chip, CircularProgress, Typography } from '@mui/material'
import type { AcquisitionResponse, GridResponse, GridStatus } from '@smartem/api'
import {
  useGetAcquisitionGridsAcquisitionsAcquisitionUuidGridsGet,
  useGetAcquisitionsAcquisitionsGet,
} from '@smartem/api'
import { createFileRoute, Link } from '@tanstack/react-router'
import { gray, statusColors } from '~/theme'

export const Route = createFileRoute('/acquisitions/$acquisitionId/')({
  component: SessionOverview,
})

const gridStatusColor: Record<GridStatus, string> = {
  none: statusColors.offline,
  'scan started': statusColors.paused,
  'scan completed': statusColors.idle,
  'grid squares decision started': statusColors.paused,
  'grid squares decision completed': statusColors.running,
}

const gridStatusLabel: Record<GridStatus, string> = {
  none: 'None',
  'scan started': 'Scanning',
  'scan completed': 'Scanned',
  'grid squares decision started': 'Deciding',
  'grid squares decision completed': 'Completed',
}

function formatDuration(startTime: string, endTime: string | null): string {
  const start = new Date(startTime).getTime()
  const end = endTime ? new Date(endTime).getTime() : Date.now()
  const hours = Math.floor((end - start) / 3_600_000)
  const mins = Math.floor(((end - start) % 3_600_000) / 60_000)
  if (hours === 0) return `${mins}m`
  return `${hours}h ${mins}m`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function SessionOverview() {
  const { acquisitionId } = Route.useParams()
  const {
    data: grids,
    isLoading,
    error,
  } = useGetAcquisitionGridsAcquisitionsAcquisitionUuidGridsGet(acquisitionId)
  const { data: acquisitions } = useGetAcquisitionsAcquisitionsGet()
  const acquisition = acquisitions?.find((a) => a.uuid === acquisitionId)

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
          Failed to load grids
        </Typography>
      </Box>
    )
  }

  const gridList = grids ?? []
  const completedGrids = gridList.filter(
    (g) => g.status === 'grid squares decision completed' || g.status === 'scan completed'
  ).length

  return (
    <Box
      sx={{
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        height: '100%',
        overflow: 'auto',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          px: 1.5,
          py: 1,
          backgroundColor: gray[100],
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <StatItem label="Grids" value={`${completedGrids}/${gridList.length}`} />
        {acquisition?.instrument_model && (
          <StatItem label="Instrument" value={acquisition.instrument_model} />
        )}
        {acquisition?.start_time && (
          <StatItem
            label="Duration"
            value={formatDuration(acquisition.start_time, acquisition.end_time)}
          />
        )}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 1.5,
        }}
      >
        {gridList.map((grid) => (
          <GridCard key={grid.uuid} grid={grid} acquisitionId={acquisitionId} />
        ))}
      </Box>
    </Box>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{ fontSize: '0.625rem', color: 'text.disabled', display: 'block' }}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
    </Box>
  )
}

function GridCard({ grid, acquisitionId }: { grid: GridResponse; acquisitionId: string }) {
  const status = grid.status ?? 'none'
  const color = gridStatusColor[status]

  return (
    <Link
      to="/acquisitions/$acquisitionId/grids/$gridId"
      params={{ acquisitionId, gridId: grid.uuid }}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.75,
          p: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          backgroundColor: 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.1s',
          '&:hover': { borderColor: gray[400], backgroundColor: gray[100] },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            {grid.name}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Chip
            size="small"
            label={gridStatusLabel[status]}
            sx={{
              height: 18,
              fontSize: '0.625rem',
              fontWeight: 500,
              backgroundColor: `${color}14`,
              color,
              border: `1px solid ${color}40`,
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {grid.scan_start_time && (
            <Typography variant="caption" sx={{ fontSize: '0.6875rem' }}>
              Started {formatTime(grid.scan_start_time)}
            </Typography>
          )}
          {grid.scan_end_time && (
            <Typography variant="caption" sx={{ fontSize: '0.6875rem' }}>
              {formatDuration(grid.scan_start_time!, grid.scan_end_time)}
            </Typography>
          )}
        </Box>
      </Box>
    </Link>
  )
}
