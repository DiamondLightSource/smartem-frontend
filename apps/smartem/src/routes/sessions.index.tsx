import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  formatDate,
  formatDuration,
  formatTime,
  type SessionStatus,
  sessions,
} from '~/data/mock-dashboard'
import { statusColors } from '~/theme'

export const Route = createFileRoute('/sessions/')({
  component: SessionsListPage,
})

const statusLabel: Record<SessionStatus, string> = {
  running: 'Running',
  paused: 'Paused',
  completed: 'Completed',
  abandoned: 'Abandoned',
}

const statusColor: Record<SessionStatus, string> = {
  running: statusColors.running,
  paused: statusColors.paused,
  completed: statusColors.idle,
  abandoned: statusColors.error,
}

function SessionsListPage() {
  const navigate = useNavigate()
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  )

  return (
    <Box
      sx={{
        height: 'calc(100vh - 56px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 1,
          px: 3,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Typography variant="h4">Sessions</Typography>
        <Typography variant="caption" sx={{ fontWeight: 500 }}>
          {sessions.length}
        </Typography>
      </Box>

      <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Instrument</TableCell>
              <TableCell>Started</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Grids</TableCell>
              <TableCell>Quality</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((s) => {
              const color = statusColor[s.status]
              return (
                <TableRow
                  key={s.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() =>
                    navigate({ to: '/sessions/$sessionId', params: { sessionId: s.id } })
                  }
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {s.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={statusLabel[s.status]}
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
                    <Typography variant="body2">{s.instrumentName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatDate(s.startTime)} {formatTime(s.startTime)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatDuration(s.startTime, s.endTime)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {s.gridsCompleted}/{s.gridsTotal}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {s.avgQuality != null ? (
                      <QualityCell value={s.avgQuality} />
                    ) : (
                      <Typography variant="body2" color="text.disabled">
                        —
                      </Typography>
                    )}
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

function QualityCell({ value }: { value: number }) {
  const color =
    value >= 0.7 ? statusColors.running : value >= 0.4 ? statusColors.paused : statusColors.error
  const pct = Math.round(value * 100)
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        sx={{
          width: 40,
          height: 4,
          backgroundColor: '#e8eaed',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 2 }} />
      </Box>
      <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.75rem' }}>
        {pct}%
      </Typography>
    </Box>
  )
}
