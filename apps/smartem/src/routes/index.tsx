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
  sessions,
} from '~/data/mock-dashboard'
import { statusColors } from '~/theme'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

// ============================================================================
// Types
// ============================================================================

type InstrumentView = 'list' | 'cards' | 'icons'
type TimelineRange = 'today' | 'week' | 'month'

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
// View toggle icons
// ============================================================================

function ViewToggle({
  view,
  onChange,
}: {
  view: InstrumentView
  onChange: (v: InstrumentView) => void
}) {
  const views: { key: InstrumentView; icon: React.ReactNode; tip: string }[] = [
    { key: 'list', icon: <ListViewIcon />, tip: 'List' },
    { key: 'cards', icon: <CardsViewIcon />, tip: 'Cards' },
    { key: 'icons', icon: <IconsViewIcon />, tip: 'Grid' },
  ]

  return (
    <Box
      sx={{
        display: 'flex',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      {views.map((v) => (
        <Tooltip key={v.key} title={v.tip} placement="bottom">
          <ButtonBase
            onClick={() => onChange(v.key)}
            sx={{
              p: 0.5,
              width: 26,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: view === v.key ? '#f0f2f4' : 'transparent',
              color: view === v.key ? 'text.primary' : 'text.disabled',
              '&:hover': { backgroundColor: '#f6f8fa' },
              borderRight: v.key !== 'icons' ? '1px solid' : 'none',
              borderColor: 'divider',
            }}
          >
            {v.icon}
          </ButtonBase>
        </Tooltip>
      ))}
    </Box>
  )
}

function ListViewIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="currentColor"
      role="img"
      aria-label="List view"
    >
      <rect x="0" y="1" width="14" height="2.5" rx="0.5" />
      <rect x="0" y="5.75" width="14" height="2.5" rx="0.5" />
      <rect x="0" y="10.5" width="14" height="2.5" rx="0.5" />
    </svg>
  )
}

function CardsViewIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="currentColor"
      role="img"
      aria-label="Cards view"
    >
      <rect x="0" y="0" width="6" height="6" rx="1" />
      <rect x="8" y="0" width="6" height="6" rx="1" />
      <rect x="0" y="8" width="6" height="6" rx="1" />
      <rect x="8" y="8" width="6" height="6" rx="1" />
    </svg>
  )
}

function IconsViewIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="currentColor"
      role="img"
      aria-label="Grid view"
    >
      <rect x="0" y="0" width="3" height="3" rx="0.5" />
      <rect x="5.5" y="0" width="3" height="3" rx="0.5" />
      <rect x="11" y="0" width="3" height="3" rx="0.5" />
      <rect x="0" y="5.5" width="3" height="3" rx="0.5" />
      <rect x="5.5" y="5.5" width="3" height="3" rx="0.5" />
      <rect x="11" y="5.5" width="3" height="3" rx="0.5" />
      <rect x="0" y="11" width="3" height="3" rx="0.5" />
      <rect x="5.5" y="11" width="3" height="3" rx="0.5" />
      <rect x="11" y="11" width="3" height="3" rx="0.5" />
    </svg>
  )
}

const TIMELINE_RANGES: { key: TimelineRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
]

function RangeToggle({
  range,
  onChange,
}: {
  range: TimelineRange
  onChange: (r: TimelineRange) => void
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      {TIMELINE_RANGES.map((r, idx) => (
        <ButtonBase
          key={r.key}
          onClick={() => onChange(r.key)}
          sx={{
            px: 1,
            height: 24,
            fontSize: '0.6875rem',
            fontWeight: range === r.key ? 600 : 400,
            backgroundColor: range === r.key ? '#f0f2f4' : 'transparent',
            color: range === r.key ? 'text.primary' : 'text.disabled',
            '&:hover': { backgroundColor: '#f6f8fa' },
            borderRight: idx < TIMELINE_RANGES.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          {r.label}
        </ButtonBase>
      ))}
    </Box>
  )
}

// ============================================================================
// QUADRANT: Instruments (top-left)
// ============================================================================

function InstrumentItem({
  instrument,
  selected,
  highlighted,
  onToggle,
  view,
}: {
  instrument: Instrument
  selected: boolean
  highlighted: boolean
  onToggle: (id: string) => void
  view: InstrumentView
}) {
  const isOffline = instrument.status === 'offline'
  const isRunning = instrument.status === 'running'
  const color = statusColors[instrument.status]
  const iColor = instrumentColors[instrument.id]
  const session = instrument.currentSessionId
    ? activeSessions.find((s) => s.id === instrument.currentSessionId)
    : null

  const borderActive = selected || highlighted

  if (view === 'list') {
    return (
      <ButtonBase
        onClick={() => onToggle(instrument.id)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          width: '100%',
          textAlign: 'left',
          px: 1.25,
          py: 0.5,
          borderRadius: 1,
          border: '1px solid',
          borderColor: borderActive ? `${iColor}80` : 'transparent',
          backgroundColor: borderActive ? `${iColor}06` : 'transparent',
          opacity: isOffline ? 0.45 : 1,
          transition: 'all 0.1s',
          '&:hover': { backgroundColor: '#f6f8fa' },
        }}
      >
        <MicroscopeIcon status={instrument.status} scale={0.16} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <StatusDot color={color} pulse={isRunning} />
            <Typography variant="body2" fontWeight={600} noWrap>
              {instrument.name}
            </Typography>
            <Typography variant="caption" sx={{ color, fontSize: '0.625rem', fontWeight: 500 }}>
              {statusLabel[instrument.status]}
            </Typography>
          </Box>
          {session && (
            <Typography
              variant="caption"
              noWrap
              sx={{ color: 'text.secondary', fontSize: '0.6875rem' }}
            >
              {session.name} — {session.gridsCompleted}/{session.gridsTotal} grids
            </Typography>
          )}
        </Box>
        {session && (
          <Box sx={{ width: 60, flexShrink: 0 }}>
            <LinearProgress
              variant="determinate"
              value={(session.gridsCompleted / session.gridsTotal) * 100}
              sx={{
                height: 3,
                borderRadius: 1,
                backgroundColor: '#e8eaed',
                '& .MuiLinearProgress-bar': { backgroundColor: iColor, borderRadius: 1 },
              }}
            />
          </Box>
        )}
      </ButtonBase>
    )
  }

  if (view === 'cards') {
    return (
      <ButtonBase
        onClick={() => onToggle(instrument.id)}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          textAlign: 'center',
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: borderActive ? `${iColor}80` : 'divider',
          backgroundColor: borderActive ? `${iColor}06` : 'background.paper',
          p: 1,
          opacity: isOffline ? 0.4 : 1,
          transition: 'all 0.15s',
          overflow: 'hidden',
          '&:hover': isOffline ? {} : { borderColor: `${iColor}60`, backgroundColor: '#f6f8fa' },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.75 }}>
          <MicroscopeIcon status={instrument.status} scale={0.3} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
          <StatusDot color={color} pulse={isRunning} />
          <Typography variant="caption" fontWeight={600} noWrap sx={{ fontSize: '0.6875rem' }}>
            {instrument.name}
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color, fontSize: '0.5625rem', fontWeight: 500 }}>
          {statusLabel[instrument.status]}
        </Typography>
        {session && (
          <Box sx={{ width: '100%', mt: 0.5 }}>
            <Typography
              variant="caption"
              noWrap
              sx={{ display: 'block', color: 'text.secondary', fontSize: '0.5625rem' }}
            >
              {session.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
              <LinearProgress
                variant="determinate"
                value={(session.gridsCompleted / session.gridsTotal) * 100}
                sx={{
                  flex: 1,
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: '#e8eaed',
                  '& .MuiLinearProgress-bar': { backgroundColor: iColor, borderRadius: 1 },
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
          </Box>
        )}
      </ButtonBase>
    )
  }

  // icons view — smartphone-style shortcuts
  return (
    <ButtonBase
      onClick={() => onToggle(instrument.id)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
        p: 0.5,
        opacity: isOffline ? 0.35 : 1,
        transition: 'all 0.15s ease',
        backgroundColor: borderActive ? `${iColor}0a` : 'transparent',
        '&:hover': isOffline ? {} : { backgroundColor: '#f6f8fa' },
      }}
    >
      <Box sx={{ mb: 0.5 }}>
        <MicroscopeIcon status={instrument.status} scale={0.28} />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
        <StatusDot color={color} pulse={isRunning} />
        <Typography
          variant="caption"
          fontWeight={borderActive ? 700 : 500}
          noWrap
          sx={{ fontSize: '0.625rem', color: borderActive ? iColor : 'text.primary' }}
        >
          {instrument.name}
        </Typography>
      </Box>
    </ButtonBase>
  )
}

function InstrumentsPanel({
  selectedInstruments,
  highlightedInstrument,
  onToggleInstrument,
  view,
  onViewChange,
}: {
  selectedInstruments: Set<string>
  highlightedInstrument: string | null
  onToggleInstrument: (id: string) => void
  view: InstrumentView
  onViewChange: (v: InstrumentView) => void
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header with view toggle */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.5,
          py: 0.75,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Typography variant="h5">Instruments</Typography>
        <Typography variant="caption" sx={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
          {instruments.filter((i) => i.status !== 'offline').length}/{instruments.length}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: '0.6875rem' }}>
          online
        </Typography>
        {selectedInstruments.size > 0 && (
          <Typography
            variant="caption"
            sx={{ fontSize: '0.625rem', color: 'primary.main', fontWeight: 500 }}
          >
            ({selectedInstruments.size} selected)
          </Typography>
        )}
        <Box sx={{ flex: 1 }} />
        <ViewToggle view={view} onChange={onViewChange} />
      </Box>

      <Box
        sx={{
          display: view === 'list' ? 'flex' : 'grid',
          flexDirection: view === 'list' ? 'column' : undefined,
          gridTemplateColumns:
            view === 'cards' ? 'repeat(2, 1fr)' : view === 'icons' ? 'repeat(4, 1fr)' : undefined,
          gridTemplateRows: view === 'icons' ? 'repeat(3, 1fr)' : undefined,
          gap: view === 'list' ? 0.25 : view === 'icons' ? 0 : 0.75,
          placeItems: view === 'icons' ? 'center' : undefined,
          flex: 1,
          p: 0.75,
          overflow: view === 'icons' ? 'hidden' : 'auto',
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { backgroundColor: '#d1d9e0', borderRadius: 2 },
        }}
      >
        {instruments.map((inst) => (
          <InstrumentItem
            key={inst.id}
            instrument={inst}
            selected={selectedInstruments.has(inst.id)}
            highlighted={highlightedInstrument === inst.id}
            onToggle={onToggleInstrument}
            view={view}
          />
        ))}
      </Box>
    </Box>
  )
}

// ============================================================================
// QUADRANT: Sessions (top-right)
// ============================================================================

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
  onHoverInstrument,
}: {
  session: Session
  highlighted: boolean
  expanded: boolean
  onToggle: (id: string) => void
  onHoverInstrument: (id: string | null) => void
}) {
  const isActive = session.status === 'running' || session.status === 'paused'
  const color = sessionStatusColor[session.status]
  const instColor = instrumentColors[session.instrumentId] ?? '#6e7781'

  return (
    <Box>
      <Box
        onClick={() => onToggle(session.id)}
        onMouseEnter={() => onHoverInstrument(session.instrumentId)}
        onMouseLeave={() => onHoverInstrument(null)}
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
  selectedInstruments,
  expandedSession,
  onToggleSession,
  onHoverInstrument,
}: {
  selectedInstruments: Set<string>
  expandedSession: string | null
  onToggleSession: (id: string) => void
  onHoverInstrument: (id: string | null) => void
}) {
  const hasFilter = selectedInstruments.size > 0
  const filteredActive = hasFilter
    ? activeSessions.filter((s) => selectedInstruments.has(s.instrumentId))
    : activeSessions

  const filteredRecent = hasFilter
    ? recentSessions.filter((s) => selectedInstruments.has(s.instrumentId))
    : recentSessions

  const filterLabel = hasFilter
    ? `on ${[...selectedInstruments]
        .map((id) => instruments.find((i) => i.id === id)?.name)
        .filter(Boolean)
        .join(', ')}`
    : undefined

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <PanelHeader
        title="Sessions"
        count={filteredActive.length + filteredRecent.length}
        suffix={filterLabel}
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
                highlighted={hasFilter && selectedInstruments.has(s.instrumentId)}
                expanded={expandedSession === s.id}
                onToggle={onToggleSession}
                onHoverInstrument={onHoverInstrument}
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
                highlighted={hasFilter && selectedInstruments.has(s.instrumentId)}
                expanded={expandedSession === s.id}
                onToggle={onToggleSession}
                onHoverInstrument={onHoverInstrument}
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

interface GanttConfig {
  start: number
  range: number
  nowPct: number
  ticks: { key: string; pct: number; label: string }[]
  suffix: string
}

function buildGanttConfig(range: TimelineRange): GanttConfig {
  const HOUR = 3600_000
  const DAY = 24 * HOUR

  if (range === 'today') {
    const start = NOW_MS - DAY
    const span = DAY
    const ticks = Array.from({ length: 9 }, (_, i) => {
      const ms = start + i * 3 * HOUR
      const d = new Date(ms)
      return {
        key: `h-${i}`,
        pct: ((i * 3 * HOUR) / span) * 100,
        label: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      }
    })
    return { start, range: span, nowPct: 100, ticks, suffix: '24 h' }
  }

  if (range === 'month') {
    const start = NOW_MS - 30 * DAY
    const span = 30 * DAY
    const ticks: GanttConfig['ticks'] = []
    for (let i = 0; i <= 30; i += 5) {
      const ms = start + i * DAY
      const d = new Date(ms)
      ticks.push({
        key: d.toISOString().slice(0, 10),
        pct: ((i * DAY) / span) * 100,
        label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      })
    }
    return { start, range: span, nowPct: 100, ticks, suffix: '30 days' }
  }

  // week (default)
  const start = NOW_MS - 7 * DAY
  const span = 7 * DAY
  const ticks = Array.from({ length: 8 }, (_, i) => {
    const ms = start + i * DAY
    const d = new Date(ms)
    return {
      key: d.toISOString().slice(0, 10),
      pct: ((i * DAY) / span) * 100,
      label: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
    }
  })
  return { start, range: span, nowPct: 100, ticks, suffix: '7 days' }
}

function GanttTimeline({
  activeInstruments,
  range,
  onRangeChange,
}: {
  activeInstruments: Set<string>
  range: TimelineRange
  onRangeChange: (r: TimelineRange) => void
}) {
  const cfg = buildGanttConfig(range)

  const visibleRows = ganttRows.filter((r) => {
    const inst = instruments.find((i) => i.id === r.instrumentId)
    return inst && inst.status !== 'offline'
  })

  const hasFilter = activeInstruments.size > 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.5,
          py: 0.75,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Typography variant="h5">Timeline</Typography>
        <Typography variant="caption" sx={{ fontSize: '0.6875rem' }}>
          {cfg.suffix}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <RangeToggle range={range} onChange={onRangeChange} />
      </Box>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
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
            const isActive = activeInstruments.has(row.instrumentId)
            return (
              <Box
                key={row.instrumentId}
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  pr: 1,
                  backgroundColor: isActive
                    ? `${instrumentColors[row.instrumentId]}08`
                    : 'transparent',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.6875rem',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? instrumentColors[row.instrumentId] : 'text.secondary',
                  }}
                >
                  {row.instrumentName}
                </Typography>
              </Box>
            )
          })}
        </Box>

        <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ height: 20, position: 'relative', flexShrink: 0 }}>
            {cfg.ticks.map((tick) => (
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
            {cfg.ticks.map((tick) => (
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
                left: `${cfg.nowPct}%`,
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
              const isActive = activeInstruments.has(row.instrumentId)
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
                    backgroundColor: isActive
                      ? `${instrumentColors[row.instrumentId]}04`
                      : 'transparent',
                  }}
                >
                  {row.blocks.map((block) => (
                    <GanttBlockEl
                      key={block.sessionId}
                      block={block}
                      ganttStart={cfg.start}
                      ganttRange={cfg.range}
                      dimmed={hasFilter && !activeInstruments.has(row.instrumentId)}
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

function GanttBlockEl({
  block,
  ganttStart,
  ganttRange,
  dimmed,
}: {
  block: GanttBlock
  ganttStart: number
  ganttRange: number
  dimmed: boolean
}) {
  const leftPct = Math.max(0, ((block.startMs - ganttStart) / ganttRange) * 100)
  const rightPct = Math.min(100, ((block.endMs - ganttStart) / ganttRange) * 100)
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
  const [selectedInstruments, setSelectedInstruments] = useState<Set<string>>(new Set())
  const [hoveredInstrument, setHoveredInstrument] = useState<string | null>(null)
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [instrumentView, setInstrumentView] = useState<InstrumentView>('icons')
  const [timelineRange, setTimelineRange] = useState<TimelineRange>('week')

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

  const toggleInstrument = useCallback((id: string) => {
    setSelectedInstruments((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSession = useCallback((id: string) => {
    setExpandedSession((prev) => (prev === id ? null : id))
  }, [])

  // Expanding a session also highlights its instrument
  const expandedInstrument = expandedSession
    ? (sessions.find((s) => s.id === expandedSession)?.instrumentId ?? null)
    : null

  // Combined set for timeline/gantt highlighting: selected + hovered + expanded
  const activeInstruments = new Set(selectedInstruments)
  if (hoveredInstrument) activeInstruments.add(hoveredInstrument)
  if (expandedInstrument) activeInstruments.add(expandedInstrument)

  // For instrument panel highlighting: hovered from sessions or expanded session
  const sessionHighlightedInstrument = hoveredInstrument ?? expandedInstrument

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
            selectedInstruments={selectedInstruments}
            highlightedInstrument={sessionHighlightedInstrument}
            onToggleInstrument={toggleInstrument}
            view={instrumentView}
            onViewChange={setInstrumentView}
          />
        </Box>
        <DividerV onDrag={handleVDrag} />
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <SessionsPanel
            selectedInstruments={selectedInstruments}
            expandedSession={expandedSession}
            onToggleSession={toggleSession}
            onHoverInstrument={setHoveredInstrument}
          />
        </Box>
      </Box>

      <DividerH onDrag={handleHDrag} />

      <Box
        sx={{
          height: timelineH,
          flexShrink: 0,
          borderTop: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <GanttTimeline
          activeInstruments={activeInstruments}
          range={timelineRange}
          onRangeChange={setTimelineRange}
        />
      </Box>
    </Box>
  )
}
