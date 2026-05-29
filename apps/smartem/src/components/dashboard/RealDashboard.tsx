import { Box, ButtonBase, Chip, CircularProgress, Tooltip, Typography } from '@mui/material'
import { type AcquisitionResponse, useGetAcquisitionsAcquisitionsGet } from '@smartem/api'
import { Link } from '@tanstack/react-router'
import { useCallback, useMemo, useRef, useState } from 'react'
import { gray, statusColors } from '~/theme'

// ============================================================================
// Acquisition status helpers
// ============================================================================

type AcqStatus = NonNullable<AcquisitionResponse['status']>

const statusLabel: Record<AcqStatus, string> = {
  planned: 'Planned',
  started: 'Running',
  paused: 'Paused',
  completed: 'Completed',
  abandoned: 'Abandoned',
}

const statusColor: Record<AcqStatus, string> = {
  planned: statusColors.offline,
  started: statusColors.running,
  paused: statusColors.paused,
  completed: statusColors.idle,
  abandoned: statusColors.error,
}

function isActiveStatus(s: AcqStatus | null | undefined): boolean {
  return s === 'started' || s === 'paused'
}

// ============================================================================
// Formatting helpers
// ============================================================================

function parseTimeMs(iso: string | null | undefined): number | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  return Number.isFinite(t) ? t : null
}

function formatDuration(startIso: string | null, endIso: string | null): string | null {
  const start = parseTimeMs(startIso)
  if (start == null) return null
  const end = parseTimeMs(endIso) ?? Date.now()
  const ms = Math.max(0, end - start)
  const hours = Math.floor(ms / 3_600_000)
  const mins = Math.floor((ms % 3_600_000) / 60_000)
  if (hours === 0) return `${mins}m`
  return `${hours}h ${mins}m`
}

function formatTimeShort(iso: string | null): string | null {
  const t = parseTimeMs(iso)
  if (t == null) return null
  return new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

// ============================================================================
// Per-instrument-model colouring (stable hash to a small palette)
// ============================================================================

const INSTRUMENT_PALETTE = [
  '#5878a3',
  '#e59344',
  '#6ba059',
  '#d1605e',
  '#a77c9f',
  '#cbb766',
  '#7a807c',
  '#9caec1',
] as const

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function instrumentColor(model: string): string {
  return INSTRUMENT_PALETTE[hashString(model) % INSTRUMENT_PALETTE.length]
}

// ============================================================================
// Shared widgets
// ============================================================================

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
// Resizable dividers
// ============================================================================

function useDrag(onDrag: (delta: number) => void) {
  const dragging = useRef(false)
  const lastPos = useRef(0)

  return useCallback(
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
}

function DividerH({ onDrag }: { onDrag: (delta: number) => void }) {
  const onMouseDown = useDrag(onDrag)
  return (
    <Box
      onMouseDown={onMouseDown('y')}
      sx={{
        height: 8,
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
        width: 8,
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
// Timeline range toggle
// ============================================================================

type TimelineRange = 'today' | 'week' | 'month'

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
            backgroundColor: range === r.key ? gray[50] : 'transparent',
            color: range === r.key ? 'text.primary' : 'text.disabled',
            '&:hover': { backgroundColor: gray[100] },
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
// Instruments panel (under construction)
//
// The microscope list will be wired once the backend exposes an /instruments
// endpoint (see smartem-devtools#81). The selection/hover state machinery
// below is intentionally kept intact so the same callbacks can later drive
// real instrument items; only the display is stubbed.
// ============================================================================

function InstrumentsPanel({
  selectedInstruments,
  highlightedInstrument,
}: {
  selectedInstruments: Set<string>
  highlightedInstrument: string | null
  onToggleInstrument: (id: string) => void
}) {
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
        <Typography variant="h5">Instruments</Typography>
        <Typography variant="caption" sx={{ fontSize: '0.6875rem', color: 'text.disabled' }}>
          under construction
        </Typography>
        {selectedInstruments.size > 0 && (
          <Typography
            variant="caption"
            sx={{ fontSize: '0.625rem', color: 'primary.main', fontWeight: 500 }}
          >
            ({selectedInstruments.size} selected)
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          p: 3,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          Microscope list is awaiting a backend endpoint.
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled', maxWidth: 320 }}>
          Selection here will filter the Sessions and Timeline panels once instruments are exposed
          via the API (smartem-devtools#81). The reactive plumbing is in place — only the display is
          stubbed.
        </Typography>
        {highlightedInstrument && (
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.625rem' }}>
            (highlight: {highlightedInstrument})
          </Typography>
        )}
      </Box>
    </Box>
  )
}

// ============================================================================
// Sessions / Acquisitions panel
// ============================================================================

function SessionRow({
  acq,
  expanded,
  onToggle,
  onHoverInstrument,
}: {
  acq: AcquisitionResponse
  expanded: boolean
  onToggle: (uuid: string) => void
  onHoverInstrument: (id: string | null) => void
}) {
  const status: AcqStatus = acq.status ?? 'planned'
  const color = statusColor[status]
  const isRunning = status === 'started'
  const instColor = acq.instrument_model ? instrumentColor(acq.instrument_model) : gray[600]

  const duration = formatDuration(acq.start_time, acq.end_time)
  const instrumentLabel = acq.instrument_model ?? acq.instrument_id ?? '—'

  return (
    <Box>
      <Box
        onClick={() => onToggle(acq.uuid)}
        onMouseEnter={() => acq.instrument_model && onHoverInstrument(acq.instrument_model)}
        onMouseLeave={() => onHoverInstrument(null)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 1.5,
          py: 0.75,
          borderRadius: 1,
          cursor: 'pointer',
          backgroundColor: expanded ? gray[100] : 'transparent',
          borderLeft: `2px solid ${expanded ? instColor : 'transparent'}`,
          transition: 'all 0.1s ease',
          '&:hover': { backgroundColor: gray[100] },
        }}
      >
        <StatusDot color={color} pulse={isRunning} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Link
            to="/acquisitions/$acquisitionId"
            params={{ acquisitionId: acq.uuid }}
            onClick={(e) => e.stopPropagation()}
            style={{ textDecoration: 'none' }}
          >
            <Typography
              variant="body2"
              fontWeight={500}
              noWrap
              sx={{
                color: 'text.primary',
                '&:hover': { textDecoration: 'underline', color: 'primary.main' },
              }}
            >
              {acq.name}
            </Typography>
          </Link>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontSize: '0.6875rem' }}>
              {instrumentLabel}
            </Typography>
            {duration && (
              <Typography variant="caption" sx={{ fontSize: '0.6875rem', color: 'text.disabled' }}>
                {duration}
              </Typography>
            )}
          </Box>
        </Box>
        <Chip
          size="small"
          label={statusLabel[status]}
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
      </Box>
      {expanded && <SessionDetailCard acq={acq} />}
    </Box>
  )
}

function SessionDetailCard({ acq }: { acq: AcquisitionResponse }) {
  const started = formatTimeShort(acq.start_time)
  const ended = formatTimeShort(acq.end_time)

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
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {started && <MetricItem label="Started" value={started} />}
        {ended && <MetricItem label="Ended" value={ended} />}
        {acq.instrument_model && <MetricItem label="Instrument" value={acq.instrument_model} />}
        {acq.instrument_id && <MetricItem label="Instrument ID" value={acq.instrument_id} />}
        {acq.storage_path && <MetricItem label="Storage" value={acq.storage_path} />}
      </Box>
    </Box>
  )
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        sx={{ fontSize: '0.5625rem', color: 'text.disabled', display: 'block' }}
      >
        {label}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 500,
          fontVariantNumeric: 'tabular-nums',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'inline-block',
          maxWidth: 240,
        }}
        noWrap
      >
        {value}
      </Typography>
    </Box>
  )
}

function SessionsPanel({
  acquisitions,
  selectedInstruments,
  expandedSession,
  onToggleSession,
  onHoverInstrument,
}: {
  acquisitions: AcquisitionResponse[]
  selectedInstruments: Set<string>
  expandedSession: string | null
  onToggleSession: (uuid: string) => void
  onHoverInstrument: (id: string | null) => void
}) {
  const hasFilter = selectedInstruments.size > 0

  const matchesFilter = useCallback(
    (acq: AcquisitionResponse) => {
      if (!hasFilter) return true
      if (acq.instrument_model && selectedInstruments.has(acq.instrument_model)) return true
      if (acq.instrument_id && selectedInstruments.has(acq.instrument_id)) return true
      return false
    },
    [hasFilter, selectedInstruments]
  )

  const sorted = useMemo(() => {
    const list = acquisitions.filter(matchesFilter)
    return [...list].sort((a, b) => {
      const ta = parseTimeMs(a.start_time) ?? 0
      const tb = parseTimeMs(b.start_time) ?? 0
      return tb - ta
    })
  }, [acquisitions, matchesFilter])

  const active = sorted.filter((a) => isActiveStatus(a.status))
  const recent = sorted.filter((a) => !isActiveStatus(a.status))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <PanelHeader
        title="Acquisitions"
        count={sorted.length}
        suffix={hasFilter ? `filtered by ${selectedInstruments.size} instrument(s)` : undefined}
      />
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 0.5,
          pb: 1,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { backgroundColor: gray[300], borderRadius: 2 },
        }}
      >
        {active.length > 0 && (
          <>
            <Typography variant="h6" sx={{ px: 1.5, pt: 1, pb: 0.5 }}>
              Active
            </Typography>
            {active.map((acq) => (
              <SessionRow
                key={acq.uuid}
                acq={acq}
                expanded={expandedSession === acq.uuid}
                onToggle={onToggleSession}
                onHoverInstrument={onHoverInstrument}
              />
            ))}
          </>
        )}
        {recent.length > 0 && (
          <>
            <Typography variant="h6" sx={{ px: 1.5, pt: 1.5, pb: 0.5 }}>
              Recent
            </Typography>
            {recent.map((acq) => (
              <SessionRow
                key={acq.uuid}
                acq={acq}
                expanded={expandedSession === acq.uuid}
                onToggle={onToggleSession}
                onHoverInstrument={onHoverInstrument}
              />
            ))}
          </>
        )}
        {sorted.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="caption">No acquisitions</Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}

// ============================================================================
// Timeline (Gantt) panel
//
// Rows are unique `instrument_model` values present in the acquisitions list,
// blocks are individual acquisitions positioned by their start/end timestamps.
// Acquisitions with neither an instrument_model nor a start_time are omitted
// (nothing to draw).
// ============================================================================

interface GanttConfig {
  start: number
  range: number
  nowPct: number
  ticks: { key: string; pct: number; label: string }[]
  suffix: string
}

function buildGanttConfig(range: TimelineRange, nowMs: number): GanttConfig {
  const HOUR = 3600_000
  const DAY = 24 * HOUR

  if (range === 'today') {
    const start = nowMs - DAY
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
    const start = nowMs - 30 * DAY
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
  const start = nowMs - 7 * DAY
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

interface GanttRow {
  model: string
  color: string
  blocks: { acq: AcquisitionResponse; startMs: number; endMs: number }[]
}

function buildGanttRows(acquisitions: AcquisitionResponse[], nowMs: number): GanttRow[] {
  const byModel = new Map<string, GanttRow>()
  for (const acq of acquisitions) {
    const model = acq.instrument_model
    if (!model) continue
    const startMs = parseTimeMs(acq.start_time)
    if (startMs == null) continue
    const endMs = parseTimeMs(acq.end_time) ?? nowMs

    let row = byModel.get(model)
    if (!row) {
      row = { model, color: instrumentColor(model), blocks: [] }
      byModel.set(model, row)
    }
    row.blocks.push({ acq, startMs, endMs })
  }
  return [...byModel.values()].sort((a, b) => a.model.localeCompare(b.model))
}

function GanttBlockEl({
  block,
  ganttStart,
  ganttRange,
  rowColor,
  dimmed,
}: {
  block: GanttRow['blocks'][number]
  ganttStart: number
  ganttRange: number
  rowColor: string
  dimmed: boolean
}) {
  const leftPct = Math.max(0, ((block.startMs - ganttStart) / ganttRange) * 100)
  const rightPct = Math.min(100, ((block.endMs - ganttStart) / ganttRange) * 100)
  const widthPct = rightPct - leftPct
  if (widthPct <= 0) return null

  const status: AcqStatus = block.acq.status ?? 'planned'
  const isActive = isActiveStatus(status)
  const isAbandoned = status === 'abandoned'

  return (
    <Tooltip title={`${block.acq.name} (${statusLabel[status]})`} placement="top">
      <Box
        sx={{
          position: 'absolute',
          left: `${leftPct}%`,
          width: `${widthPct}%`,
          top: '15%',
          height: '70%',
          backgroundColor: rowColor,
          opacity: dimmed ? 0.15 : isAbandoned ? 0.35 : 0.7,
          borderRadius: 0.5,
          cursor: 'pointer',
          transition: 'opacity 0.15s ease',
          '&:hover': { opacity: 1 },
          ...(isActive && {
            borderRight: `2px solid ${rowColor}`,
            backgroundImage: `linear-gradient(90deg, ${rowColor} 0%, ${rowColor}cc 100%)`,
          }),
        }}
      />
    </Tooltip>
  )
}

function GanttTimeline({
  acquisitions,
  activeInstruments,
  range,
  onRangeChange,
}: {
  acquisitions: AcquisitionResponse[]
  activeInstruments: Set<string>
  range: TimelineRange
  onRangeChange: (r: TimelineRange) => void
}) {
  // nowMs is computed per render; for an idle dashboard this is fine since
  // we don't memoise across multi-second updates. If/when we add live polling
  // we may want to pin this on a state setter so blocks don't jitter.
  const nowMs = Date.now()
  const cfg = useMemo(() => buildGanttConfig(range, nowMs), [range, nowMs])
  const rows = useMemo(() => buildGanttRows(acquisitions, nowMs), [acquisitions, nowMs])

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
            width: 120,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ height: 20, flexShrink: 0 }} />
          {rows.map((row) => {
            const isActive = activeInstruments.has(row.model)
            return (
              <Box
                key={row.model}
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  pr: 1,
                  backgroundColor: isActive ? `${row.color}08` : 'transparent',
                }}
              >
                <Typography
                  variant="caption"
                  noWrap
                  sx={{
                    fontSize: '0.6875rem',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? row.color : 'text.secondary',
                  }}
                >
                  {row.model}
                </Typography>
              </Box>
            )
          })}
          {rows.length === 0 && (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="caption" sx={{ fontSize: '0.625rem', color: 'text.disabled' }}>
                no data
              </Typography>
            </Box>
          )}
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
                  backgroundColor: gray[200],
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

            {rows.map((row, rowIdx) => {
              const isActive = activeInstruments.has(row.model)
              const rowTop = `${(rowIdx / Math.max(rows.length, 1)) * 100}%`
              const rowHeight = `${100 / Math.max(rows.length, 1)}%`

              return (
                <Box
                  key={row.model}
                  sx={{
                    position: 'absolute',
                    top: rowTop,
                    height: rowHeight,
                    left: 0,
                    right: 0,
                    borderBottom: `1px solid ${gray[50]}`,
                    backgroundColor: isActive ? `${row.color}04` : 'transparent',
                  }}
                >
                  {row.blocks.map((block) => (
                    <GanttBlockEl
                      key={block.acq.uuid}
                      block={block}
                      ganttStart={cfg.start}
                      ganttRange={cfg.range}
                      rowColor={row.color}
                      dimmed={hasFilter && !isActive}
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

// ============================================================================
// Dashboard top-level
// ============================================================================

const HEADER_H = 56
const MIN_COL = 0.25
const MAX_COL = 0.75
const MIN_TIMELINE = 120
const MAX_TIMELINE_FRAC = 0.6

export default function RealDashboard() {
  const { data: acquisitions, isLoading, error } = useGetAcquisitionsAcquisitionsGet()

  // Instrument selection state - kept intact for when /instruments is wired
  // (see smartem-devtools#81). For now only Sessions/Timeline read from it,
  // and only the Acquisitions side derives instrument identities (from
  // instrument_model on each acquisition).
  const [selectedInstruments, setSelectedInstruments] = useState<Set<string>>(new Set())
  const [hoveredInstrument, setHoveredInstrument] = useState<string | null>(null)
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
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

  const toggleSession = useCallback((uuid: string) => {
    setExpandedSession((prev) => (prev === uuid ? null : uuid))
  }, [])

  // Expanding a session also "highlights" its instrument model
  const expandedInstrumentModel = useMemo(() => {
    if (!expandedSession || !acquisitions) return null
    return acquisitions.find((a) => a.uuid === expandedSession)?.instrument_model ?? null
  }, [expandedSession, acquisitions])

  // Combined set used by the timeline to dim non-relevant rows
  const activeInstruments = useMemo(() => {
    const set = new Set(selectedInstruments)
    if (hoveredInstrument) set.add(hoveredInstrument)
    if (expandedInstrumentModel) set.add(expandedInstrumentModel)
    return set
  }, [selectedInstruments, hoveredInstrument, expandedInstrumentModel])

  // The instruments panel's own highlight: hover relay from sessions, or
  // the expanded session's instrument model. Same shape as MockDashboard's
  // contract so the panel can be swapped to a real one without rewiring.
  const instrumentsPanelHighlight = hoveredInstrument ?? expandedInstrumentModel

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: `calc(100vh - ${HEADER_H}px)`,
        }}
      >
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

  const acquisitionList = acquisitions ?? []

  return (
    <Box
      ref={containerRef}
      sx={{
        height: `calc(100vh - ${HEADER_H}px)`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        p: 0.5,
        backgroundColor: gray[50],
      }}
    >
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <Box
          sx={{
            width: `${leftFrac * 100}%`,
            overflow: 'hidden',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          <InstrumentsPanel
            selectedInstruments={selectedInstruments}
            highlightedInstrument={instrumentsPanelHighlight}
            onToggleInstrument={toggleInstrument}
          />
        </Box>
        <DividerV onDrag={handleVDrag} />
        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          <SessionsPanel
            acquisitions={acquisitionList}
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
          overflow: 'hidden',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <GanttTimeline
          acquisitions={acquisitionList}
          activeInstruments={activeInstruments}
          range={timelineRange}
          onRangeChange={setTimelineRange}
        />
      </Box>
    </Box>
  )
}
