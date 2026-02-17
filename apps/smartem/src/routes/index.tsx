import { Box, ButtonBase, Chip, LinearProgress, Tooltip, Typography } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { MicroscopeIcon } from '~/components/widgets/MicroscopeIcon'
import {
  activeSessions,
  formatDuration,
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
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: selected ? `${instrumentColors[instrument.id]}80` : 'divider',
        backgroundColor: selected ? `${instrumentColors[instrument.id]}06` : 'background.paper',
        p: 1,
        pt: 0.5,
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
      {/* Microscope illustration */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 0,
        }}
      >
        <MicroscopeIcon status={instrument.status} scale={0.42} />
      </Box>

      {/* Info strip below microscope */}
      <Box sx={{ width: '100%', mt: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
          <StatusDot color={color} pulse={isRunning} />
          <Typography variant="caption" fontWeight={600} noWrap sx={{ fontSize: '0.6875rem' }}>
            {instrument.name}
          </Typography>
        </Box>
        {session ? (
          <Box sx={{ mt: 0.25 }}>
            <Typography
              variant="caption"
              noWrap
              sx={{
                display: 'block',
                textAlign: 'center',
                fontSize: '0.5625rem',
                color: 'text.secondary',
              }}
            >
              {session.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25, px: 0.5 }}>
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
                  fontSize: '0.5625rem',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'text.secondary',
                }}
              >
                {session.gridsCompleted}/{session.gridsTotal}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              fontSize: '0.5625rem',
              color: 'text.disabled',
              mt: 0.25,
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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
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
          gap: 1,
          p: 1,
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

function SessionRow({ session, highlighted }: { session: Session; highlighted: boolean }) {
  const isActive = session.status === 'running' || session.status === 'paused'
  const color = sessionStatusColor[session.status]
  const instColor = instrumentColors[session.instrumentId] ?? '#6e7781'

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 1.5,
        py: 0.75,
        borderRadius: 1,
        cursor: 'pointer',
        backgroundColor: highlighted ? `${instColor}08` : 'transparent',
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

function SessionsPanel({ selectedInstrument }: { selectedInstrument: string | null }) {
  const filteredActive = selectedInstrument
    ? activeSessions.filter((s) => s.instrumentId === selectedInstrument)
    : activeSessions

  const filteredRecent = selectedInstrument
    ? recentSessions.filter((s) => s.instrumentId === selectedInstrument)
    : recentSessions

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
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
          {/* Spacer for tick row */}
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
          {/* Day tick labels */}
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

          {/* Rows */}
          <Box sx={{ position: 'absolute', top: 20, bottom: 0, left: 0, right: 0 }}>
            {/* Grid lines */}
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

            {/* Now line */}
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

            {/* Session rows */}
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
    <Tooltip title={`${block.sessionName}`} placement="top">
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
        py: 1,
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
// Dashboard (three-quadrant HUD)
// ============================================================================

function Dashboard() {
  const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null)

  return (
    <Box
      sx={{
        height: 'calc(100vh - 56px)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr auto',
        gridTemplateAreas: `
          "instruments sessions"
          "timeline timeline"
        `,
        overflow: 'hidden',
      }}
    >
      {/* Top-left: Instruments */}
      <Box
        sx={{
          gridArea: 'instruments',
          borderRight: '1px solid',
          borderBottom: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <InstrumentsPanel
          selectedInstrument={selectedInstrument}
          onSelectInstrument={setSelectedInstrument}
        />
      </Box>

      {/* Top-right: Sessions */}
      <Box
        sx={{
          gridArea: 'sessions',
          borderBottom: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <SessionsPanel selectedInstrument={selectedInstrument} />
      </Box>

      {/* Bottom: Timeline */}
      <Box
        sx={{
          gridArea: 'timeline',
          height: 220,
          overflow: 'hidden',
        }}
      >
        <GanttTimeline selectedInstrument={selectedInstrument} />
      </Box>
    </Box>
  )
}
