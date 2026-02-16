import {
  Box,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'
import {
  activeSessions,
  formatDate,
  formatDateTime,
  formatDuration,
  type Instrument,
  type InstrumentStatus,
  instruments,
  recentSessions,
  type Session,
  type SessionStatus,
  type TimelineBlock,
  timelineDays,
} from '~/data/mock-dashboard'
import { statusColors } from '~/theme'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

// -- Status helpers --

const instrumentStatusLabel: Record<InstrumentStatus, string> = {
  running: 'Running',
  idle: 'Idle',
  paused: 'Paused',
  error: 'Error',
  offline: 'Offline',
}

const sessionStatusLabel: Record<SessionStatus, string> = {
  running: 'Running',
  paused: 'Paused',
  completed: 'Completed',
  abandoned: 'Abandoned',
}

const sessionStatusColor: Record<SessionStatus, string> = {
  running: statusColors.running,
  paused: statusColors.paused,
  completed: statusColors.idle,
  abandoned: statusColors.error,
}

function StatusDot({ color }: { color: string }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
  )
}

function StatusChip({ label, color }: { label: string; color: string }) {
  return (
    <Chip
      size="small"
      label={label}
      sx={{
        backgroundColor: `${color}14`,
        color,
        fontWeight: 500,
        borderColor: `${color}40`,
        border: '1px solid',
      }}
    />
  )
}

// -- Section header --

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1.5 }}>
      <Typography variant="h4">{title}</Typography>
      {count != null && (
        <Typography variant="caption" sx={{ fontWeight: 500 }}>
          {count}
        </Typography>
      )}
    </Box>
  )
}

// -- Instrument strip --

function InstrumentCard({ instrument }: { instrument: Instrument }) {
  const isOffline = instrument.status === 'offline'
  const session = instrument.currentSessionId
    ? activeSessions.find((s) => s.id === instrument.currentSessionId)
    : null

  return (
    <Card
      sx={{
        minWidth: 150,
        maxWidth: 180,
        flex: '0 0 auto',
        opacity: isOffline ? 0.5 : 1,
        transition: 'box-shadow 0.15s',
        '&:hover': isOffline ? {} : { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
          <StatusDot color={statusColors[instrument.status]} />
          <Typography variant="body2" fontWeight={600} noWrap>
            {instrument.name}
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ display: 'block', mb: 0.25 }}>
          {instrumentStatusLabel[instrument.status]}
        </Typography>
        {session && (
          <>
            <Typography
              variant="caption"
              fontWeight={500}
              noWrap
              sx={{ display: 'block', color: 'text.primary' }}
            >
              {session.name}
            </Typography>
            <Typography variant="caption">
              {session.gridsCompleted}/{session.gridsTotal} grids
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function InstrumentStrip() {
  const online = instruments.filter((i) => i.status !== 'offline')
  const offline = instruments.filter((i) => i.status === 'offline')

  return (
    <Box>
      <SectionHeader title="Instruments" count={instruments.length} />
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          overflowX: 'auto',
          pb: 1,
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-thumb': { backgroundColor: '#d1d9e0', borderRadius: 3 },
        }}
      >
        {online.map((i) => (
          <InstrumentCard key={i.id} instrument={i} />
        ))}
        {offline.map((i) => (
          <InstrumentCard key={i.id} instrument={i} />
        ))}
      </Box>
    </Box>
  )
}

// -- Active sessions table --

function ActiveSessionsTable() {
  return (
    <Box>
      <SectionHeader title="Active sessions" count={activeSessions.length} />
      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Session</TableCell>
              <TableCell>Instrument</TableCell>
              <TableCell>Started</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Grids</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activeSessions.map((session) => (
              <ActiveSessionRow key={session.id} session={session} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

function ActiveSessionRow({ session }: { session: Session }) {
  return (
    <TableRow sx={{ cursor: 'pointer' }}>
      <TableCell>
        <Typography variant="body2" fontWeight={500}>
          {session.name}
        </Typography>
      </TableCell>
      <TableCell>{session.instrumentName}</TableCell>
      <TableCell>{formatDateTime(session.startTime)}</TableCell>
      <TableCell>{formatDuration(session.startTime, session.endTime)}</TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {session.gridsCompleted}/{session.gridsTotal}
        </Typography>
      </TableCell>
      <TableCell>
        <StatusChip
          label={sessionStatusLabel[session.status]}
          color={sessionStatusColor[session.status]}
        />
      </TableCell>
    </TableRow>
  )
}

// -- Recent sessions table --

function RecentSessionsTable() {
  return (
    <Box>
      <SectionHeader title="Recent sessions" count={recentSessions.length} />
      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Session</TableCell>
              <TableCell>Instrument</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Grids</TableCell>
              <TableCell>Quality</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentSessions.map((session) => (
              <RecentSessionRow key={session.id} session={session} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

function QualityIndicator({ value }: { value: number | null }) {
  if (value == null) return <Typography variant="caption">--</Typography>
  const pct = Math.round(value * 100)
  const color =
    value >= 0.8 ? statusColors.running : value >= 0.6 ? statusColors.paused : statusColors.error
  return (
    <Typography variant="body2" sx={{ color, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
      {pct}%
    </Typography>
  )
}

function RecentSessionRow({ session }: { session: Session }) {
  return (
    <TableRow sx={{ cursor: 'pointer' }}>
      <TableCell>
        <Typography variant="body2" fontWeight={500}>
          {session.name}
        </Typography>
      </TableCell>
      <TableCell>{session.instrumentName}</TableCell>
      <TableCell>{formatDate(session.startTime)}</TableCell>
      <TableCell>{formatDuration(session.startTime, session.endTime)}</TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {session.gridsCompleted}/{session.gridsTotal}
        </Typography>
      </TableCell>
      <TableCell>
        <QualityIndicator value={session.avgQuality} />
      </TableCell>
      <TableCell>
        <StatusChip
          label={sessionStatusLabel[session.status]}
          color={sessionStatusColor[session.status]}
        />
      </TableCell>
    </TableRow>
  )
}

// -- Session timeline --

const HOURS = 24
const CELL_HEIGHT = 20
const HOUR_WIDTH = 32
const HOUR_LABELS = Array.from({ length: HOURS }, (_, i) => i.toString().padStart(2, '0'))
const HOUR_GRID = Array.from({ length: HOURS }, (_, i) => ({
  key: `g${i}`,
  leftPct: (i / HOURS) * 100,
  isMajor: i % 6 === 0,
}))

function SessionTimeline() {
  return (
    <Box>
      <SectionHeader title="This week" />
      <Card sx={{ p: 2, overflowX: 'auto' }}>
        <Box sx={{ position: 'relative', minWidth: HOURS * HOUR_WIDTH + 60 }}>
          {/* Hour labels */}
          <Box sx={{ display: 'flex', ml: '60px', mb: 0.5 }}>
            {HOUR_LABELS.map((label) => (
              <Typography
                key={label}
                variant="caption"
                sx={{
                  width: HOUR_WIDTH,
                  textAlign: 'center',
                  fontSize: '0.625rem',
                  color: 'text.disabled',
                }}
              >
                {label}
              </Typography>
            ))}
          </Box>

          {/* Day rows */}
          {timelineDays.map((day) => (
            <Box key={day.date} sx={{ display: 'flex', alignItems: 'center', mb: 0.25 }}>
              <Box sx={{ width: 60, flexShrink: 0, pr: 1, textAlign: 'right' }}>
                <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.6875rem' }}>
                  {day.dayLabel}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ display: 'block', fontSize: '0.5625rem', color: 'text.disabled' }}
                >
                  {day.date.slice(5)}
                </Typography>
              </Box>
              <Box
                sx={{
                  position: 'relative',
                  height: CELL_HEIGHT,
                  flex: 1,
                  backgroundColor: '#f6f8fa',
                  borderRadius: 0.5,
                  minWidth: HOURS * HOUR_WIDTH,
                }}
              >
                {/* Hour grid lines */}
                {HOUR_GRID.map((line) => (
                  <Box
                    key={line.key}
                    sx={{
                      position: 'absolute',
                      left: `${line.leftPct}%`,
                      top: 0,
                      bottom: 0,
                      width: '1px',
                      backgroundColor: line.isMajor ? '#d1d9e080' : '#e8eaed40',
                    }}
                  />
                ))}
                {/* Session blocks */}
                {day.blocks.map((block) => (
                  <TimelineBlockEl key={`${block.sessionId}-${block.startHour}`} block={block} />
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Card>
    </Box>
  )
}

function TimelineBlockEl({ block }: { block: TimelineBlock }) {
  const leftPct = (block.startHour / HOURS) * 100
  const widthPct = ((block.endHour - block.startHour) / HOURS) * 100

  return (
    <Tooltip title={`${block.instrumentName}: ${block.sessionName}`} placement="top">
      <Box
        sx={{
          position: 'absolute',
          left: `${leftPct}%`,
          width: `${Math.max(widthPct, 0.5)}%`,
          top: 2,
          bottom: 2,
          backgroundColor: block.color,
          opacity: block.status === 'abandoned' ? 0.4 : 0.75,
          borderRadius: 0.5,
          cursor: 'default',
          '&:hover': { opacity: 1 },
        }}
      />
    </Tooltip>
  )
}

// -- Dashboard --

function Dashboard() {
  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: 'auto',
        px: 3,
        py: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <InstrumentStrip />
      <ActiveSessionsTable />
      <RecentSessionsTable />
      <SessionTimeline />
    </Box>
  )
}
