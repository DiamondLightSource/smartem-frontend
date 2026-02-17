import { Box, ButtonBase, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import type { MockModelPredictions, MockPredictionModel } from '~/data/mock-session-detail'
import { statusColors } from '~/theme'
import { qualityColor } from '~/utils/heatmap'

interface PredictionsViewProps {
  models: MockPredictionModel[]
  predictions: MockModelPredictions[]
}

export function PredictionsView({ models, predictions }: PredictionsViewProps) {
  const [selectedModelId, setSelectedModelId] = useState(models[0]?.id ?? '')
  const [sliderValue, setSliderValue] = useState(100)

  const selectedModel = models.find((m) => m.id === selectedModelId)
  const selectedPrediction = predictions.find((p) => p.modelId === selectedModelId)
  const dataPoints = selectedPrediction?.dataPoints ?? []

  const visibleCount = Math.max(1, Math.round((sliderValue / 100) * dataPoints.length))
  const visiblePoints = dataPoints.slice(0, visibleCount)

  const foilholeQualities = useMemo(() => {
    if (!selectedPrediction) return []
    return Array.from(selectedPrediction.foilholeQualities.values())
  }, [selectedPrediction])

  const histogram = useMemo(() => {
    const bins = Array(10).fill(0) as number[]
    for (const q of foilholeQualities) {
      const idx = Math.min(9, Math.floor(q * 10))
      bins[idx]++
    }
    return bins
  }, [foilholeQualities])

  const maxBin = Math.max(1, ...histogram)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto', p: 2 }}>
      {/* Model selector */}
      <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
        {models.map((model) => {
          const isActive = model.id === selectedModelId
          return (
            <ButtonBase
              key={model.id}
              onClick={() => setSelectedModelId(model.id)}
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.8125rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'text.primary' : 'text.secondary',
                backgroundColor: isActive ? '#f0f2f4' : 'transparent',
                '&:hover': { backgroundColor: '#f6f8fa' },
              }}
            >
              {model.name}
            </ButtonBase>
          )
        })}
      </Box>

      {/* Charts row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        {/* Time-series chart */}
        <Box
          sx={{
            flex: '1 1 500px',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1.5,
            p: 2,
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            Quality over time
          </Typography>
          <TimeSeriesChart dataPoints={visiblePoints} />
        </Box>

        {/* Histogram */}
        <Box
          sx={{
            flex: '0 1 360px',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1.5,
            p: 2,
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            Quality distribution
          </Typography>
          <HistogramChart bins={histogram} maxBin={maxBin} />
        </Box>
      </Box>

      {/* Temporal slider */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 1,
          mb: 2,
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>
          Time range
        </Typography>
        <Box
          component="input"
          type="range"
          min={1}
          max={100}
          value={sliderValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSliderValue(Number(e.target.value))
          }
          sx={{
            flex: 1,
            height: 4,
            appearance: 'none',
            background: '#d1d9e0',
            borderRadius: 2,
            outline: 'none',
            '&::-webkit-slider-thumb': {
              appearance: 'none',
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: statusColors.idle,
              cursor: 'pointer',
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums', minWidth: 60 }}
        >
          {visibleCount} / {dataPoints.length} pts
        </Typography>
      </Box>

      {/* Bottom bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 1,
          py: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {selectedModel?.name}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          v{selectedModel?.version}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {selectedModel?.type}
        </Typography>
      </Box>
    </Box>
  )
}

function TimeSeriesChart({
  dataPoints,
}: {
  dataPoints: { quality: number; squareUuid: string }[]
}) {
  if (dataPoints.length === 0) {
    return (
      <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          No data points
        </Typography>
      </Box>
    )
  }

  const W = 600
  const H = 200
  const pad = { top: 10, right: 10, bottom: 30, left: 40 }
  const plotW = W - pad.left - pad.right
  const plotH = H - pad.top - pad.bottom

  const points = dataPoints.map((dp, i) => ({
    x: pad.left + (i / Math.max(1, dataPoints.length - 1)) * plotW,
    y: pad.top + (1 - dp.quality) * plotH,
    quality: dp.quality,
    squareUuid: dp.squareUuid,
  }))

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto' }}
      role="img"
      aria-label="Chart"
    >
      {/* Y axis */}
      <line
        x1={pad.left}
        y1={pad.top}
        x2={pad.left}
        y2={pad.top + plotH}
        stroke="#d1d9e0"
        strokeWidth="1"
      />
      {[0, 0.25, 0.5, 0.75, 1].map((v) => {
        const y = pad.top + (1 - v) * plotH
        return (
          <g key={v}>
            <line x1={pad.left - 4} y1={y} x2={pad.left} y2={y} stroke="#d1d9e0" strokeWidth="1" />
            <text x={pad.left - 8} y={y + 3} textAnchor="end" fontSize="9" fill="#8b949e">
              {Math.round(v * 100)}
            </text>
          </g>
        )
      })}
      {/* X axis */}
      <line
        x1={pad.left}
        y1={pad.top + plotH}
        x2={pad.left + plotW}
        y2={pad.top + plotH}
        stroke="#d1d9e0"
        strokeWidth="1"
      />
      <text x={pad.left + plotW / 2} y={H - 4} textAnchor="middle" fontSize="9" fill="#8b949e">
        Squares (time-ordered)
      </text>

      {/* Polyline */}
      <polyline
        points={polyline}
        fill="none"
        stroke={statusColors.idle}
        strokeWidth="1.5"
        opacity="0.6"
      />

      {/* Data circles */}
      {points.map((p) => (
        <circle
          key={p.squareUuid}
          cx={p.x}
          cy={p.y}
          r={3.5}
          fill={qualityColor(p.quality)}
          opacity="0.85"
        />
      ))}
    </svg>
  )
}

function HistogramChart({ bins, maxBin }: { bins: number[]; maxBin: number }) {
  const W = 400
  const H = 200
  const pad = { top: 10, right: 10, bottom: 30, left: 40 }
  const plotW = W - pad.left - pad.right
  const plotH = H - pad.top - pad.bottom
  const barWidth = plotW / bins.length - 2

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto' }}
      role="img"
      aria-label="Chart"
    >
      {/* Y axis */}
      <line
        x1={pad.left}
        y1={pad.top}
        x2={pad.left}
        y2={pad.top + plotH}
        stroke="#d1d9e0"
        strokeWidth="1"
      />

      {/* X axis */}
      <line
        x1={pad.left}
        y1={pad.top + plotH}
        x2={pad.left + plotW}
        y2={pad.top + plotH}
        stroke="#d1d9e0"
        strokeWidth="1"
      />

      {/* Bars */}
      {bins.map((count, i) => {
        const barH = (count / maxBin) * plotH
        const x = pad.left + (i / bins.length) * plotW + 1
        const y = pad.top + plotH - barH
        const midQ = (i + 0.5) / 10
        const binLabel = (i / 10).toFixed(1)
        return (
          <g key={binLabel}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              fill={qualityColor(midQ)}
              opacity="0.7"
              rx="1"
            />
            <text
              x={x + barWidth / 2}
              y={pad.top + plotH + 14}
              textAnchor="middle"
              fontSize="8"
              fill="#8b949e"
            >
              {(i / 10).toFixed(1)}
            </text>
          </g>
        )
      })}

      <text x={pad.left + plotW / 2} y={H - 4} textAnchor="middle" fontSize="9" fill="#8b949e">
        Quality
      </text>
      <text
        x={8}
        y={pad.top + plotH / 2}
        textAnchor="middle"
        fontSize="9"
        fill="#8b949e"
        transform={`rotate(-90, 8, ${pad.top + plotH / 2})`}
      >
        Count
      </text>
    </svg>
  )
}
