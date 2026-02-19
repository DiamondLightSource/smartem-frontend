import { Box, Chip, LinearProgress, Typography } from '@mui/material'
import { createFileRoute, Link } from '@tanstack/react-router'
import { sessions } from '~/data/mock-dashboard'
import { getSessionGrids, type MockGrid } from '~/data/mock-session-detail'
import { statusColors } from '~/theme'

export const Route = createFileRoute('/acquisitions/$acquisitionId/')({
  component: SessionOverview,
})

const gridStatusColor: Record<MockGrid['status'], string> = {
  completed: statusColors.running,
  collecting: statusColors.paused,
  screening: statusColors.idle,
  queued: statusColors.offline,
}

const gridStatusLabel: Record<MockGrid['status'], string> = {
  completed: 'Completed',
  collecting: 'Collecting',
  screening: 'Screening',
  queued: 'Queued',
}

function SessionOverview() {
  const { acquisitionId } = Route.useParams()
  const session = sessions.find((s) => s.id === acquisitionId)
  const grids = getSessionGrids(acquisitionId)

  if (!session) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Session not found
        </Typography>
      </Box>
    )
  }

  const completedGrids = grids.filter((g) => g.status === 'completed').length
  const totalFoilholes = grids.reduce((sum, g) => sum + g.foilholeCount, 0)
  const totalMicrographs = grids.reduce((sum, g) => sum + g.micrographCount, 0)
  const gridsWithQuality = grids.filter((g) => g.avgQuality != null)
  const avgQuality =
    gridsWithQuality.length > 0
      ? gridsWithQuality.reduce((sum, g) => sum + (g.avgQuality ?? 0), 0) / gridsWithQuality.length
      : null

  const instrument = session.instrumentName
  const duration = formatDuration(session.startTime, session.endTime)

  return (
    <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Stats bar */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          px: 1.5,
          py: 1,
          backgroundColor: '#f6f8fa',
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <StatItem label="Grids" value={`${completedGrids}/${grids.length}`} />
        <StatItem label="Foilholes" value={totalFoilholes.toLocaleString()} />
        <StatItem label="Micrographs" value={totalMicrographs.toLocaleString()} />
        {avgQuality != null && (
          <StatItem label="Avg quality" value={`${Math.round(avgQuality * 100)}%`} />
        )}
        <StatItem label="Instrument" value={instrument} />
        <StatItem label="Duration" value={duration} />
      </Box>

      {/* Grid cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 1.5,
        }}
      >
        {grids.map((grid) => (
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

function GridCard({ grid, acquisitionId }: { grid: MockGrid; acquisitionId: string }) {
  const color = gridStatusColor[grid.status]
  const progress =
    grid.status === 'completed'
      ? 100
      : grid.status === 'queued'
        ? 0
        : Math.round((grid.micrographCount / Math.max(1, grid.foilholeCount)) * 100)

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
          borderRadius: 1.5,
          backgroundColor: 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.1s',
          '&:hover': { borderColor: '#afb8c1', backgroundColor: '#f6f8fa' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            {grid.name}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Chip
            size="small"
            label={gridStatusLabel[grid.status]}
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

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 3,
            borderRadius: 1,
            backgroundColor: '#e8eaed',
            '& .MuiLinearProgress-bar': { backgroundColor: color, borderRadius: 1 },
          }}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Typography variant="caption" sx={{ fontSize: '0.6875rem' }}>
            {grid.squareCount} squares
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.6875rem' }}>
            {grid.foilholeCount} foilholes
          </Typography>
          {grid.avgQuality != null && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <QualityDot value={grid.avgQuality} />
              <Typography
                variant="caption"
                sx={{ fontSize: '0.6875rem', fontVariantNumeric: 'tabular-nums' }}
              >
                {Math.round(grid.avgQuality * 100)}%
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Link>
  )
}

function QualityDot({ value }: { value: number }) {
  const color =
    value >= 0.7 ? statusColors.running : value >= 0.4 ? statusColors.paused : statusColors.error
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: color,
      }}
    />
  )
}

function formatDuration(startTime: string, endTime: string | null): string {
  const start = new Date(startTime).getTime()
  const end = endTime ? new Date(endTime).getTime() : Date.now()
  const hours = Math.floor((end - start) / 3_600_000)
  const mins = Math.floor(((end - start) % 3_600_000) / 60_000)
  if (hours === 0) return `${mins}m`
  return `${hours}h ${mins}m`
}
