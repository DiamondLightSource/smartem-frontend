import { Box, ButtonBase, Chip, LinearProgress, Tooltip, Typography } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useRef, useState } from 'react'
import { MicroscopeIcon } from '~/components/widgets/MicroscopeIcon'
import {
  activeSessions,
  formatDate,
  formatDuration,
  formatTime,
  type GanttBlock,
  ganttRows,
  type Instrument,
  type InstrumentStatus,
  instrumentColors,
  instruments,
  NOW_MS,
  recentSessions,
  type Session,
  type SessionStatus,
} from '~/data/mock-dashboard'
import { statusColors } from '~/theme'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

// ============================================================================
// Status helpers
// ============================================================================

const statusLabel: Record<InstrumentStatus, string> = {
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

function StatusDot({ color, pulse }: { color: string; pulse?: boolean }) {
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
        ...(pulse && {
          boxShadow: `0 0 0 0 ${color}60`,
          animation: 'pulse 2s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { boxShadow: `0 0 0 0 ${color}60` },
            '50%': { boxShadow: `0 0 0 4px ${color}00` },
          },
        }),
      }}
    />
  )
}

// ============================================================================
// Resizable divider
// ============================================================================

function useDrag(onDrag: (delta: number) => void) {
  const dragging = useRef(false)
  const lastPos = useRef(0)

  const onMouseDown = useCallback(
    (axis: 'x' | 'y') => (e: React.MouseEvent) => {
      e.preventDefault()
      dragging.current = true
      lastPos.current = axis === 'x' ? e.clientX : e.clientY

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current) return
        const pos = axis === 'x' ? ev.clientX : ev.clientY
        const delta = pos - lastPos.current
        lastPos.current = pos
        onDrag(delta)
      }

      const onUp = () => {
        dragging.current = false
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.body.style.cursor = axis === 'x' ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [onDrag]
  )

  return onMouseDown
}

function DividerH({ onDrag }: { onDrag: (delta: number) => void }) {
  const onMouseDown = useDrag(onDrag)
  return (
    <Box
      onMouseDown={onMouseDown('y')}
      sx={{
        height: 5,
        cursor: 'row-resize',
        backgroundColor: 'transparent',
        position: 'relative',
        flexShrink: 0,
        zIndex: 10,
        '&:hover, &:active': { '& > div': { backgroundColor: 'primary.main', opacity: 1 } },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: '30%',
          right: '30%',
          top: '50%',
          transform: 'translateY(-50%)',
          height: 3,
          borderRadius: 1,
          backgroundColor: 'divider',
          opacity: 0.5,
          transition: 'all 0.15s',
        }}
      />
    </Box>
  )
}

function DividerV({ onDrag }: { onDrag: (delta: number) => void }) {
  const onMouseDown = useDrag(onDrag)
  return (
    <Box
      onMouseDown={onMouseDown('x')}
      sx={{
        width: 5,
        cursor: 'col-resize',
        backgroundColor: 'transparent',
        position: 'relative',
        flexShrink: 0,
        zIndex: 10,
        '&:hover, &:active': { '& > div': { backgroundColor: 'primary.main', opacity: 1 } },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '30%',
          bottom: '30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 3,
          borderRadius: 1,
          backgroundColor: 'divider',
          opacity: 0.5,
          transition: 'all 0.15s',
        }}
      />
    </Box>
  )
}

// ============================================================================
// QUADRANT: Instruments (top-left)
// ============================================================================

function InstrumentTile({
  instrument,
  selected,
  onSelect,
}: {
  instrument: Instrument
  selected: boolean
  onSelect: (id: string | null) => void
}) {
  const isOffline = instrument.status === 'offline'
  const isRunning = instrument.status === 'running'
  const color = statusColors[instrument.status]
  const session = instrument.currentSessionId
    ? activeSessions.find((s) => s.id === instrument.currentSessionId)
    : null

  return (
    <ButtonBase
      onClick={() => onSelect(selected ? null : instrument.id)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        borderRadius: 1,
        border: '1px solid',
        borderColor: selected ? `${instrumentColors[instrument.id]}80` : 'divider',
        backgroundColor: selected ? `${instrumentColors[instrument.id]}06` : 'background.paper',
        p: 0.75,
        pt: 0.25,
        transition: 'all 0.15s ease',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': isOffline
          ? {}
          : {
              borderColor: `${instrumentColors[instrument.id]}60`,
              backgroundColor: '#f6f8fa',
            },
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 0,
        }}
      >
        <MicroscopeIcon status={instrument.status} scale={0.28} />
      </Box>
      <Box sx={{ width: '100%', mt: 0.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
          <StatusDot color={color} pulse={isRunning} />
          <Typography variant="caption" fontWeight={600} noWrap sx={{ fontSize: '0.625rem' }}>
            {instrument.name}
          </Typography>
        </Box>
        {session ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25, px: 0.25 }}>
            <LinearProgress
              variant="determinate"
              value={(session.gridsCompleted / session.gridsTotal) * 100}
              sx={{
                flex: 1,
                height: 2,
                borderRadius: 1,
                backgroundColor: '#e8eaed',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: instrumentColors[instrument.id],
                  borderRadius: 1,
                },
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.5rem',
                fontVariantNumeric: 'tabular-nums',
                color: 'text.secondary',
              }}
            >
              {session.gridsCompleted}/{session.gridsTotal}
            </Typography>
          </Box>
        ) : (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              fontSize: '0.5rem',
              color: 'text.disabled',
              mt: 0.125,
            }}
          >
            {isOffline ? 'Offline' : statusLabel[instrument.status]}
          </Typography>
        )}
      </Box>
    </ButtonBase>
  )
}

function InstrumentsPanel({
  selectedInstrument,
  onSelectInstrument,
}: {
  selectedInstrument: string | null
  onSelectInstrument: (id: string | null) => void
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <PanelHeader
        title="Instruments"
        count={instruments.filter((i) => i.status !== 'offline').length}
        suffix="online"
      />
      <Box
        sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: 0.75,
          p: 0.75,
          overflow: 'hidden',
        }}
      >
        {instruments.map((inst) => (
          <InstrumentTile
            key={inst.id}
            instrument={inst}
            selected={selectedInstrument === inst.id}
            onSelect={onSelectInstrument}
          />
        ))}
      </Box>
    </Box>
  )
}

// ============================================================================
// QUADRANT: Sessions (top-right)
// ============================================================================

// Mock detail data for expanded sessions
const mockSessionDetails = {
  grids: [
    { name: 'Grid A1', squares: 42, foilholes: 318, status: 'collected' },
    { name: 'Grid A2', squares: 38, foilholes: 290, status: 'collected' },
    { name: 'Grid B1', squares: 45, foilholes: 340, status: 'collecting' },
    { name: 'Grid B2', squares: 0, foilholes: 0, status: 'queued' },
  ],
  metrics: {
    totalMicrographs: 2847,
    avgDefocus: -1.8,
    avgResolution: 3.2,
    avgMotion: 1.4,
    particlesPicked: 142350,
    iceFraction: 0.12,
  },
}

function SessionRow({
  session,
  highlighted,
  expanded,
  onToggle,
}: {
  session: Session
  highlighted: boolean
  expanded: boolean
  onToggle: (id: string) => void
}) {
  const isActive = session.status === 'running' || session.status === 'paused'
  const color = sessionStatusColor[session.status]
  const instColor = instrumentColors[session.instrumentId] ?? '#6e7781'

  return (
    <Box>
      <Box
        onClick={() => onToggle(session.id)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 1.5,
          py: 0.75,
          borderRadius: 1,
          cursor: 'pointer',
          backgroundColor: expanded ? '#f6f8fa' : highlighted ? `${instColor}08` : 'transparent',
          borderLeft: highlighted ? `2px solid ${instColor}` : '2px solid transparent',
          transition: 'all 0.1s ease',
          '&:hover': { backgroundColor: '#f6f8fa' },
        }}
      >
        <StatusDot color={color} pulse={session.status === 'running'} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={500} noWrap>
            {session.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontSize: '0.6875rem' }}>
              {session.instrumentName}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.6875rem', color: 'text.disabled' }}>
              {formatDuration(session.startTime, session.endTime)}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {session.avgQuality != null && <QualityBar value={session.avgQuality} />}
          <Typography
            variant="caption"
            sx={{
              fontVariantNumeric: 'tabular-nums',
              fontSize: '0.6875rem',
              minWidth: 36,
              textAlign: 'right',
            }}
          >
            {session.gridsCompleted}/{session.gridsTotal}
          </Typography>
          {isActive && (
            <Chip
              size="small"
              label={sessionStatusLabel[session.status]}
              sx={{
                backgroundColor: `${color}14`,
                color,
                fontWeight: 500,
                border: `1px solid ${color}40`,
                height: 18,
                fontSize: '0.625rem',
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          )}
        </Box>
      </Box>

      {/* Expanded detail card */}
      {expanded && <SessionDetailCard session={session} />}
    </Box>
  )
}

function SessionDetailCard({ session }: { session: Session }) {
  const m = mockSessionDetails.metrics
  const instColor = instrumentColors[session.instrumentId] ?? '#6e7781'

  return (
    <Box
      sx={{
        mx: 1.5,
        mb: 1,
        p: 1.25,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        backgroundColor: '#fafbfc',
      }}
    >
      {/* Session meta row */}
      <Box sx={{ display: 'flex', gap: 3, mb: 1, flexWrap: 'wrap' }}>
        <MetricItem
          label="Started"
          value={`${formatDate(session.startTime)} ${formatTime(session.startTime)}`}
        />
        {session.endTime && (
          <MetricItem
            label="Ended"
            value={`${formatDate(session.endTime)} ${formatTime(session.endTime)}`}
          />
        )}
        <MetricItem label="Micrographs" value={m.totalMicrographs.toLocaleString()} />
        <MetricItem label="Particles" value={m.particlesPicked.toLocaleString()} />
        <MetricItem label="Avg resolution" value={`${m.avgResolution} A`} />
        <MetricItem label="Avg defocus" value={`${m.avgDefocus} um`} />
      </Box>

      {/* Grid table */}
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Grids
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        {mockSessionDetails.grids
          .slice(0, session.gridsTotal > 4 ? 4 : session.gridsTotal)
          .map((grid) => (
            <Box
              key={grid.name}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                py: 0.25,
                px: 0.5,
                borderRadius: 0.5,
                '&:hover': { backgroundColor: '#f0f2f4' },
              }}
            >
              <Typography variant="caption" fontWeight={500} sx={{ minWidth: 50 }}>
                {grid.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 60 }}>
                {grid.squares} sq
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 60 }}>
                {grid.foilholes} fh
              </Typography>
              <Chip
                size="small"
                label={grid.status}
                sx={{
                  height: 16,
                  fontSize: '0.5625rem',
                  backgroundColor:
                    grid.status === 'collected'
                      ? `${statusColors.running}14`
                      : grid.status === 'collecting'
                        ? `${instColor}14`
                        : '#f0f2f4',
                  color:
                    grid.status === 'collected'
                      ? statusColors.running
                      : grid.status === 'collecting'
                        ? instColor
                        : 'text.secondary',
                  '& .MuiChip-label': { px: 0.5 },
                }}
              />
            </Box>
          ))}
      </Box>
    </Box>
  )
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{ fontSize: '0.5625rem', color: 'text.disabled', display: 'block' }}
      >
        {label}
      </Typography>
      <Typography variant="caption" sx={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
    </Box>
  )
}

function QualityBar({ value }: { value: number }) {
  const color =
    value >= 0.8 ? statusColors.running : value >= 0.6 ? statusColors.paused : statusColors.error
  return (
    <Tooltip title={`${Math.round(value * 100)}% avg quality`} placement="left">
      <Box
        sx={{
          width: 32,
          height: 4,
          backgroundColor: '#e8eaed',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{ width: `${value * 100}%`, height: '100%', backgroundColor: color, borderRadius: 2 }}
        />
      </Box>
    </Tooltip>
  )
}

function SessionsPanel({
  selectedInstrument,
  expandedSession,
  onToggleSession,
}: {
  selectedInstrument: string | null
  expandedSession: string | null
  onToggleSession: (id: string) => void
}) {
  const filteredActive = selectedInstrument
    ? activeSessions.filter((s) => s.instrumentId === selectedInstrument)
    : activeSessions

  const filteredRecent = selectedInstrument
    ? recentSessions.filter((s) => s.instrumentId === selectedInstrument)
    : recentSessions

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <PanelHeader
        title="Sessions"
        count={filteredActive.length + filteredRecent.length}
        suffix={
          selectedInstrument
            ? `on ${instruments.find((i) => i.id === selectedInstrument)?.name}`
            : undefined
        }
      />
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 0.5,
          pb: 1,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { backgroundColor: '#d1d9e0', borderRadius: 2 },
        }}
      >
        {filteredActive.length > 0 && (
          <>
            <Typography variant="h6" sx={{ px: 1.5, pt: 1, pb: 0.5 }}>
              Active
            </Typography>
            {filteredActive.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                highlighted={selectedInstrument === s.instrumentId}
                expanded={expandedSession === s.id}
                onToggle={onToggleSession}
              />
            ))}
          </>
        )}
        {filteredRecent.length > 0 && (
          <>
            <Typography variant="h6" sx={{ px: 1.5, pt: 1.5, pb: 0.5 }}>
              Recent
            </Typography>
            {filteredRecent.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                highlighted={selectedInstrument === s.instrumentId}
                expanded={expandedSession === s.id}
                onToggle={onToggleSession}
              />
            ))}
          </>
        )}
        {filteredActive.length === 0 && filteredRecent.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="caption">No sessions</Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}

// ============================================================================
// QUADRANT: Timeline / Gantt (bottom)
// ============================================================================

const WEEK_MS = 7 * 24 * 3600_000
const GANTT_START = NOW_MS - WEEK_MS
const GANTT_END = NOW_MS
const GANTT_RANGE = GANTT_END - GANTT_START

const DAY_TICKS = Array.from({ length: 8 }, (_, i) => {
  const ms = GANTT_START + i * 24 * 3600_000
  const date = new Date(ms)
  return {
    key: date.toISOString().slice(0, 10),
    ms,
    pct: ((ms - GANTT_START) / GANTT_RANGE) * 100,
    label: date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
  }
})

const NOW_PCT = ((NOW_MS - GANTT_START) / GANTT_RANGE) * 100

function GanttTimeline({ selectedInstrument }: { selectedInstrument: string | null }) {
  const visibleRows = ganttRows.filter((r) => {
    const inst = instruments.find((i) => i.id === r.instrumentId)
    return inst && inst.status !== 'offline'
  })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <PanelHeader title="Timeline" suffix="7 days" />
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Instrument labels */}
        <Box
          sx={{
            width: 72,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ height: 20, flexShrink: 0 }} />
          {visibleRows.map((row) => {
            const isSelected = selectedInstrument === row.instrumentId
            return (
              <Box
                key={row.instrumentId}
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  pr: 1,
                  backgroundColor: isSelected
                    ? `${instrumentColors[row.instrumentId]}08`
                    : 'transparent',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.6875rem',
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? instrumentColors[row.instrumentId] : 'text.secondary',
                  }}
                >
                  {row.instrumentName}
                </Typography>
              </Box>
            )
          })}
        </Box>

        {/* Gantt area */}
        <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ height: 20, position: 'relative', flexShrink: 0 }}>
            {DAY_TICKS.map((tick) => (
              <Typography
                key={tick.key}
                variant="caption"
                sx={{
                  position: 'absolute',
                  left: `${tick.pct}%`,
                  top: 2,
                  transform: 'translateX(-50%)',
                  fontSize: '0.5625rem',
                  color: 'text.disabled',
                  whiteSpace: 'nowrap',
                }}
              >
                {tick.label}
              </Typography>
            ))}
          </Box>

          <Box sx={{ position: 'absolute', top: 20, bottom: 0, left: 0, right: 0 }}>
            {DAY_TICKS.map((tick) => (
              <Box
                key={`line-${tick.key}`}
                sx={{
                  position: 'absolute',
                  left: `${tick.pct}%`,
                  top: 0,
                  bottom: 0,
                  width: '1px',
                  backgroundColor: '#e8eaed',
                }}
              />
            ))}

            <Box
              sx={{
                position: 'absolute',
                left: `${NOW_PCT}%`,
                top: 0,
                bottom: 0,
                width: 1.5,
                backgroundColor: statusColors.error,
                zIndex: 2,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -2,
                  left: -3,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: statusColors.error,
                },
              }}
            />

            {visibleRows.map((row, rowIdx) => {
              const isSelected = selectedInstrument === row.instrumentId
              const rowTop = `${(rowIdx / visibleRows.length) * 100}%`
              const rowHeight = `${100 / visibleRows.length}%`

              return (
                <Box
                  key={row.instrumentId}
                  sx={{
                    position: 'absolute',
                    top: rowTop,
                    height: rowHeight,
                    left: 0,
                    right: 0,
                    borderBottom: '1px solid #f0f2f4',
                    backgroundColor: isSelected
                      ? `${instrumentColors[row.instrumentId]}04`
                      : 'transparent',
                  }}
                >
                  {row.blocks.map((block) => (
                    <GanttBlockEl
                      key={block.sessionId}
                      block={block}
                      dimmed={selectedInstrument != null && selectedInstrument !== row.instrumentId}
                    />
                  ))}
                </Box>
              )
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

function GanttBlockEl({ block, dimmed }: { block: GanttBlock; dimmed: boolean }) {
  const leftPct = Math.max(0, ((block.startMs - GANTT_START) / GANTT_RANGE) * 100)
  const rightPct = Math.min(100, ((block.endMs - GANTT_START) / GANTT_RANGE) * 100)
  const widthPct = rightPct - leftPct
  const isActive = block.status === 'running' || block.status === 'paused'

  if (widthPct <= 0) return null

  return (
    <Tooltip title={block.sessionName} placement="top">
      <Box
        sx={{
          position: 'absolute',
          left: `${leftPct}%`,
          width: `${widthPct}%`,
          top: '15%',
          height: '70%',
          backgroundColor: block.color,
          opacity: dimmed ? 0.15 : block.status === 'abandoned' ? 0.35 : 0.7,
          borderRadius: 0.5,
          cursor: 'pointer',
          transition: 'opacity 0.15s ease',
          '&:hover': { opacity: 1 },
          ...(isActive && {
            borderRight: `2px solid ${block.color}`,
            backgroundImage: `linear-gradient(90deg, ${block.color} 0%, ${block.color}cc 100%)`,
          }),
        }}
      />
    </Tooltip>
  )
}

// ============================================================================
// Shared
// ============================================================================

function PanelHeader({ title, count, suffix }: { title: string; count?: number; suffix?: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 0.75,
        px: 1.5,
        py: 0.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
        flexShrink: 0,
      }}
    >
      <Typography variant="h5">{title}</Typography>
      {count != null && (
        <Typography variant="caption" sx={{ fontWeight: 500 }}>
          {count}
        </Typography>
      )}
      {suffix && (
        <Typography variant="caption" sx={{ fontSize: '0.6875rem' }}>
          {suffix}
        </Typography>
      )}
    </Box>
  )
}

// ============================================================================
// Dashboard (three-quadrant HUD with resizable panels)
// ============================================================================

const HEADER_H = 56
const MIN_COL = 0.25
const MAX_COL = 0.75
const MIN_TIMELINE = 120
const MAX_TIMELINE_FRAC = 0.6

function Dashboard() {
  const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null)
  const [expandedSession, setExpandedSession] = useState<string | null>(null)

  // Panel sizing state (fraction / pixels)
  const [leftFrac, setLeftFrac] = useState(0.5)
  const [timelineH, setTimelineH] = useState(260)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleVDrag = useCallback((delta: number) => {
    if (!containerRef.current) return
    const totalW = containerRef.current.offsetWidth
    setLeftFrac((prev) => Math.min(MAX_COL, Math.max(MIN_COL, prev + delta / totalW)))
  }, [])

  const handleHDrag = useCallback((delta: number) => {
    if (!containerRef.current) return
    const totalH = containerRef.current.offsetHeight
    const maxPx = totalH * MAX_TIMELINE_FRAC
    setTimelineH((prev) => Math.min(maxPx, Math.max(MIN_TIMELINE, prev - delta)))
  }, [])

  const toggleSession = useCallback((id: string) => {
    setExpandedSession((prev) => (prev === id ? null : id))
  }, [])

  return (
    <Box
      ref={containerRef}
      sx={{
        height: `calc(100vh - ${HEADER_H}px)`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Top row: instruments | divider | sessions */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <Box
          sx={{
            width: `${leftFrac * 100}%`,
            borderRight: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <InstrumentsPanel
            selectedInstrument={selectedInstrument}
            onSelectInstrument={setSelectedInstrument}
          />
        </Box>
        <DividerV onDrag={handleVDrag} />
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <SessionsPanel
            selectedInstrument={selectedInstrument}
            expandedSession={expandedSession}
            onToggleSession={toggleSession}
          />
        </Box>
      </Box>

      {/* Horizontal divider */}
      <DividerH onDrag={handleHDrag} />

      {/* Bottom: Timeline */}
      <Box
        sx={{
          height: timelineH,
          flexShrink: 0,
          borderTop: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <GanttTimeline selectedInstrument={selectedInstrument} />
      </Box>
    </Box>
  )
}
