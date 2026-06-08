import { Box, ButtonBase, Typography } from '@mui/material'
import {
  useGetFoilholeQualityPredictionTimeSeriesForGridsquareGridsquaresGridsquareUuidFoilholeQualityPredictionsGet as useFoilholeSeries,
  useGetGridsquareQualityPredictionTimeSeriesGridsquaresGridsquareUuidQualityPredictionsGet as useSquareSeries,
} from '@smartem/api'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { gray, statusColors } from '~/theme'
import { qualityColor } from '~/utils/heatmap'

// The quality-prediction time-series endpoints are typed as metric-keyed records, but a
// duplicate backend route can shadow them with a flat list payload (smartem-decisions#298),
// so the runtime value may be an array. Treat any non-record value as empty so callers
// never spread a non-iterable.
function asRecord<V>(value: Record<string, V> | null | undefined): Record<string, V> {
  return value != null && typeof value === 'object' && !Array.isArray(value) ? value : {}
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

  // Latest value per foilhole for the selected metric -> distribution.
  const foilholeValues = useMemo(() => {
    const byHole = asRecord(foilholeSeriesByMetric[metric])
    const vals: number[] = []
    for (const series of Object.values(byHole)) {
      if (!Array.isArray(series) || series.length === 0) continue
      const latest = [...series].sort((a, b) =>
        (a.timestamp ?? '').localeCompare(b.timestamp ?? '')
      )
      vals.push(latest[latest.length - 1].value)
    }
    return vals
  }, [foilholeSeriesByMetric, metric])

  const histogram = useMemo(() => {
    const bins = Array(10).fill(0) as number[]
    for (const v of foilholeValues) bins[Math.min(9, Math.max(0, Math.floor(v * 10)))]++
    return bins
  }, [foilholeValues])

  const squareMean =
    timePoints.length > 0 ? timePoints.reduce((s, v) => s + v, 0) / timePoints.length : null
  const foilholeMean =
    foilholeValues.length > 0
      ? foilholeValues.reduce((s, v) => s + v, 0) / foilholeValues.length
      : null

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
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
            <Typography variant="h6">Foilhole distribution</Typography>
            {foilholeMean != null && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                mean {Math.round(foilholeMean * 100)}%
              </Typography>
            )}
          </Box>
          <Histogram bins={histogram} />
        </Box>
      </Box>
    </Box>
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
    edge: i / 10,
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
            fill={qualityColor(bar.edge + 0.05)}
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
