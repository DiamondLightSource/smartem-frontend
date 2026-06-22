import { Box, ButtonBase, Slider, Typography } from '@mui/material'
import {
  useGetFoilholeQualityPredictionTimeSeriesForGridsquareGridsquaresGridsquareUuidFoilholeQualityPredictionsGet as useFoilholeSeries,
  useGetGridsquareQualityPredictionTimeSeriesGridsquaresGridsquareUuidQualityPredictionsGet as useSquareSeries,
} from '@smartem/api'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { gray, statusColors } from '~/theme'
import { qualityColor } from '~/utils/heatmap'

// Histogram resolution for the foilhole quality distribution. Matches the legacy view's ~20-bin
// granularity (it used d3 bin().thresholds(19)).
const BIN_COUNT = 20

type SeriesPoint = { timestamp?: string | null; value: number }

// The quality-prediction time-series endpoints are typed as metric-keyed records, but a
// duplicate backend route can shadow them with a flat list payload (smartem-decisions#298),
// so the runtime value may be an array. Treat any non-record value as empty so callers
// never spread a non-iterable.
function asRecord<V>(value: Record<string, V> | null | undefined): Record<string, V> {
  return value != null && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

// The foilhole's predicted value as of time `t`: the most recent observation at or before `t`,
// or null if the foilhole had no prediction yet (so it drops out of the distribution until it
// first appears). Expects `series` sorted ascending by timestamp.
function valueAsOf(series: SeriesPoint[], t: number): number | null {
  let result: number | null = null
  for (const p of series) {
    const ts = p.timestamp ? Date.parse(p.timestamp) : Number.NaN
    if (Number.isNaN(ts)) continue
    if (ts <= t) result = p.value
    else break
  }
  return result
}

export const Route = createFileRoute(
  '/acquisitions/$acquisitionId/grids/$gridId/squares_/$squareId/predictions'
)({
  component: SquarePredictionsView,
})

function SquarePredictionsView() {
  const { squareId } = Route.useParams()
  const { data: squareSeries } = useSquareSeries(squareId)
  const { data: foilholeSeries } = useFoilholeSeries(squareId)

  // Defend against the shadowed-route shape mismatch (see asRecord / #298).
  const squareSeriesByMetric = useMemo(() => asRecord(squareSeries), [squareSeries])
  const foilholeSeriesByMetric = useMemo(() => asRecord(foilholeSeries), [foilholeSeries])

  // Metric names are the keys of the per-metric time-series responses.
  const metrics = useMemo(() => {
    const set = new Set<string>()
    for (const k of Object.keys(squareSeriesByMetric)) set.add(k)
    for (const k of Object.keys(foilholeSeriesByMetric)) set.add(k)
    return Array.from(set).sort()
  }, [squareSeriesByMetric, foilholeSeriesByMetric])

  const [picked, setPicked] = useState('')
  const metric = picked && metrics.includes(picked) ? picked : (metrics[0] ?? '')

  const timePoints = useMemo(() => {
    const series = squareSeriesByMetric[metric]
    const arr = Array.isArray(series) ? [...series] : []
    arr.sort((a, b) => (a.timestamp ?? '').localeCompare(b.timestamp ?? ''))
    return arr.map((p) => p.value)
  }, [squareSeriesByMetric, metric])

  const squareMean =
    timePoints.length > 0 ? timePoints.reduce((s, v) => s + v, 0) / timePoints.length : null

  if (metrics.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          No quality predictions recorded for this grid square yet.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto', p: 2 }}>
      {/* Metric selector */}
      <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
        {metrics.map((m) => (
          <ButtonBase
            key={m}
            onClick={() => setPicked(m)}
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.8125rem',
              fontWeight: m === metric ? 600 : 400,
              color: m === metric ? 'text.primary' : 'text.secondary',
              backgroundColor: m === metric ? gray[50] : 'transparent',
              '&:hover': { backgroundColor: gray[100] },
            }}
          >
            {m}
          </ButtonBase>
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Box
          sx={{
            flex: '1 1 480px',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
            <Typography variant="h6">Square quality over time</Typography>
            {squareMean != null && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                mean {Math.round(squareMean * 100)}%
              </Typography>
            )}
          </Box>
          <LineChart values={timePoints} />
        </Box>

        <Box
          sx={{
            flex: '0 1 360px',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 2,
          }}
        >
          {/* Remount per metric so the as-of slider resets to "latest" when the metric changes. */}
          <FoilholeDistribution
            key={metric}
            seriesByHole={asRecord(foilholeSeriesByMetric[metric])}
          />
        </Box>
      </Box>
    </Box>
  )
}

// Foilhole quality distribution with an "as of time" slider: scrubbing recomputes the histogram
// from each foilhole's most-recent value at or before the selected time, so you can watch the
// distribution build up over the acquisition rather than only seeing the final state.
function FoilholeDistribution({ seriesByHole }: { seriesByHole: Record<string, unknown> }) {
  // One sorted series per foilhole that actually has points.
  const sortedSeries = useMemo(() => {
    const out: SeriesPoint[][] = []
    for (const series of Object.values(seriesByHole)) {
      if (!Array.isArray(series) || series.length === 0) continue
      out.push(
        [...series].sort((a, b) =>
          (a.timestamp ?? '').localeCompare(b.timestamp ?? '')
        ) as SeriesPoint[]
      )
    }
    return out
  }, [seriesByHole])

  const { minTime, maxTime } = useMemo(() => {
    let mn = Number.POSITIVE_INFINITY
    let mx = Number.NEGATIVE_INFINITY
    for (const series of sortedSeries) {
      for (const p of series) {
        const ts = p.timestamp ? Date.parse(p.timestamp) : Number.NaN
        if (Number.isNaN(ts)) continue
        if (ts < mn) mn = ts
        if (ts > mx) mx = ts
      }
    }
    return {
      minTime: mn === Number.POSITIVE_INFINITY ? 0 : mn,
      maxTime: mx === Number.NEGATIVE_INFINITY ? 0 : mx,
    }
  }, [sortedSeries])

  // Slider position is a 0..1 fraction (default 1 = latest) so it stays meaningful even if the
  // series data arrives after mount and the absolute time domain shifts.
  const [pos, setPos] = useState(1)
  const hasRange = maxTime > minTime
  const selectedTime = minTime + pos * (maxTime - minTime)

  const asOfValues = useMemo(() => {
    const vals: number[] = []
    for (const series of sortedSeries) {
      const v = valueAsOf(series, selectedTime)
      if (v != null) vals.push(v)
    }
    return vals
  }, [sortedSeries, selectedTime])

  const histogram = useMemo(() => {
    const bins = Array(BIN_COUNT).fill(0) as number[]
    for (const v of asOfValues)
      bins[Math.min(BIN_COUNT - 1, Math.max(0, Math.floor(v * BIN_COUNT)))]++
    return bins
  }, [asOfValues])

  const mean =
    asOfValues.length > 0 ? asOfValues.reduce((s, v) => s + v, 0) / asOfValues.length : null

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1, flexWrap: 'wrap' }}>
        <Typography variant="h6">Foilhole distribution</Typography>
        {mean != null && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            mean {Math.round(mean * 100)}%
          </Typography>
        )}
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {asOfValues.length}/{sortedSeries.length} foilholes
        </Typography>
      </Box>

      <Histogram bins={histogram} />

      {hasRange && (
        <Box sx={{ px: 1, mt: 0.5 }}>
          <Slider
            size="small"
            min={0}
            max={1}
            step={0.01}
            value={pos}
            onChange={(_, v) => setPos(typeof v === 'number' ? v : v[0])}
            aria-label="As of time"
          />
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', display: 'block', textAlign: 'center' }}
          >
            as of {new Date(selectedTime).toLocaleString()}
            {pos >= 1 ? ' (latest)' : ''}
          </Typography>
        </Box>
      )}
    </>
  )
}

function LineChart({ values }: { values: number[] }) {
  if (values.length === 0) {
    return <EmptyChart label="No time-series for this metric" />
  }
  const W = 600
  const H = 200
  const pad = { top: 10, right: 10, bottom: 24, left: 36 }
  const plotW = W - pad.left - pad.right
  const plotH = H - pad.top - pad.bottom
  const points = values.map((v, i) => ({
    x: pad.left + (i / Math.max(1, values.length - 1)) * plotW,
    y: pad.top + (1 - v) * plotH,
    v,
  }))
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto' }}
      role="img"
      aria-label="Quality over time"
    >
      <line
        x1={pad.left}
        y1={pad.top}
        x2={pad.left}
        y2={pad.top + plotH}
        stroke={gray[300]}
        strokeWidth="1"
      />
      {[0, 0.5, 1].map((f) => {
        const y = pad.top + (1 - f) * plotH
        return (
          <text key={f} x={pad.left - 6} y={y + 3} textAnchor="end" fontSize="9" fill={gray[500]}>
            {Math.round(f * 100)}
          </text>
        )
      })}
      <line
        x1={pad.left}
        y1={pad.top + plotH}
        x2={pad.left + plotW}
        y2={pad.top + plotH}
        stroke={gray[300]}
        strokeWidth="1"
      />
      <polyline
        points={points.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke={statusColors.idle}
        strokeWidth="1.5"
        opacity="0.6"
      />
      {points.map((p) => (
        <circle
          key={`${p.x}-${p.y}`}
          cx={p.x}
          cy={p.y}
          r={3}
          fill={qualityColor(p.v)}
          opacity="0.85"
        />
      ))}
    </svg>
  )
}

function Histogram({ bins }: { bins: number[] }) {
  const maxBin = Math.max(1, ...bins)
  if (bins.every((b) => b === 0)) {
    return <EmptyChart label="No foilhole predictions for this metric" />
  }
  const W = 400
  const H = 200
  const pad = { top: 10, right: 10, bottom: 24, left: 32 }
  const plotW = W - pad.left - pad.right
  const plotH = H - pad.top - pad.bottom
  const barW = plotW / bins.length - 2
  const bars = bins.map((count, i) => ({
    edge: i / bins.length,
    count,
    x: pad.left + (i / bins.length) * plotW + 1,
  }))
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto' }}
      role="img"
      aria-label="Foilhole quality distribution"
    >
      <line
        x1={pad.left}
        y1={pad.top}
        x2={pad.left}
        y2={pad.top + plotH}
        stroke={gray[300]}
        strokeWidth="1"
      />
      <line
        x1={pad.left}
        y1={pad.top + plotH}
        x2={pad.left + plotW}
        y2={pad.top + plotH}
        stroke={gray[300]}
        strokeWidth="1"
      />
      {bars.map((bar) => {
        const barH = (bar.count / maxBin) * plotH
        return (
          <rect
            key={bar.edge}
            x={bar.x}
            y={pad.top + plotH - barH}
            width={barW}
            height={barH}
            fill={qualityColor(bar.edge + 0.5 / bins.length)}
            opacity="0.7"
            rx="1"
          />
        )
      })}
    </svg>
  )
}

function EmptyChart({ label }: { label: string }) {
  return (
    <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        {label}
      </Typography>
    </Box>
  )
}
