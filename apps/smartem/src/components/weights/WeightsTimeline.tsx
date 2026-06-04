import { Box, Typography } from '@mui/material'
import type { QualityPredictionModelWeight } from '@smartem/api'
import { useMemo } from 'react'
import { gray, statusColors } from '~/theme'
import { CLUSTER_PALETTE } from '~/utils/heatmap'

interface Props {
  weights: QualityPredictionModelWeight[]
}

interface MetricSeries {
  metric: string
  color: string
  points: { t: number; weight: number }[]
  mean: number
  current: number
  sdev: number
  trendUp: boolean
}

function confidence(sdev: number): { label: string; color: string } {
  if (sdev > 0.2) return { label: 'Highly uncertain', color: statusColors.error }
  if (sdev > 0.1) return { label: 'Uncertain', color: statusColors.paused }
  return { label: 'Confident', color: statusColors.running }
}

// Bespoke SVG weight-over-time chart (one line per metric) plus per-metric stats, ported in
// spirit from the legacy MUI-x-charts component but kept dependency-free to match the app's
// hand-rolled charts and not pre-empt the open charting-library decision.
export function WeightsTimeline({ weights }: Props) {
  const series = useMemo<MetricSeries[]>(() => {
    const byMetric = new Map<string, { t: number; weight: number }[]>()
    for (const w of weights) {
      if (!w.metric_name) continue
      const t = w.timestamp ? new Date(w.timestamp).getTime() : 0
      const bucket = byMetric.get(w.metric_name)
      const point = { t, weight: w.weight }
      if (bucket) bucket.push(point)
      else byMetric.set(w.metric_name, [point])
    }
    return Array.from(byMetric.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([metric, raw], i) => {
        const points = [...raw].sort((a, b) => a.t - b.t)
        const values = points.map((p) => p.weight)
        const mean = values.reduce((s, v) => s + v, 0) / values.length
        const tail = values.slice(-Math.max(1, Math.floor(values.length / 10)))
        const tailAvg = tail.reduce((s, v) => s + v, 0) / tail.length
        const sdev = Math.sqrt(
          values.map((v) => (v - mean) ** 2).reduce((s, v) => s + v, 0) / values.length
        )
        return {
          metric,
          color: CLUSTER_PALETTE[i % CLUSTER_PALETTE.length],
          points,
          mean,
          current: values[values.length - 1],
          sdev,
          trendUp: values[values.length - 1] >= tailAvg,
        }
      })
  }, [weights])

  if (series.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        No model weights recorded for this grid.
      </Typography>
    )
  }

  const W = 720
  const H = 280
  const pad = { top: 12, right: 12, bottom: 28, left: 36 }
  const plotW = W - pad.left - pad.right
  const plotH = H - pad.top - pad.bottom

  const allT = series.flatMap((s) => s.points.map((p) => p.t))
  const minT = Math.min(...allT)
  const maxT = Math.max(...allT)
  const maxW = Math.max(1, ...series.flatMap((s) => s.points.map((p) => p.weight)))
  const tx = (t: number) => pad.left + (maxT === minT ? 0.5 : (t - minT) / (maxT - minT)) * plotW
  const wy = (w: number) => pad.top + (1 - w / maxW) * plotH

  return (
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
        <Typography variant="h6" sx={{ mb: 1 }}>
          Weight over time
        </Typography>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', height: 'auto' }}
          role="img"
          aria-label="Model weight history"
        >
          <line
            x1={pad.left}
            y1={pad.top}
            x2={pad.left}
            y2={pad.top + plotH}
            stroke={gray[300]}
            strokeWidth="1"
          />
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const y = pad.top + (1 - f) * plotH
            return (
              <g key={f}>
                <line
                  x1={pad.left - 4}
                  y1={y}
                  x2={pad.left}
                  y2={y}
                  stroke={gray[300]}
                  strokeWidth="1"
                />
                <text x={pad.left - 8} y={y + 3} textAnchor="end" fontSize="9" fill={gray[500]}>
                  {(f * maxW).toFixed(1)}
                </text>
              </g>
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
          {series.map((s) => (
            <g key={s.metric}>
              <polyline
                points={s.points.map((p) => `${tx(p.t)},${wy(p.weight)}`).join(' ')}
                fill="none"
                stroke={s.color}
                strokeWidth="1.5"
                opacity="0.9"
              />
              {s.points.map((p) => (
                <circle
                  key={`${s.metric}-${p.t}`}
                  cx={tx(p.t)}
                  cy={wy(p.weight)}
                  r={2.5}
                  fill={s.color}
                />
              ))}
            </g>
          ))}
          <text
            x={pad.left + plotW / 2}
            y={H - 2}
            textAnchor="middle"
            fontSize="9"
            fill={gray[500]}
          >
            time
          </text>
        </svg>
      </Box>

      <Box sx={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {series.map((s) => {
          const conf = confidence(s.sdev)
          return (
            <Box
              key={s.metric}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: s.color,
                  flexShrink: 0,
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 96 }}>
                {s.metric}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}
              >
                {s.current.toFixed(2)} {s.trendUp ? '↑' : '↓'}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}
              >
                μ {s.mean.toFixed(2)}
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Typography variant="caption" sx={{ color: conf.color, fontWeight: 500 }}>
                {conf.label}
              </Typography>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
