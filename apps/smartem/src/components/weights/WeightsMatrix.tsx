import { Box, Slider, Tooltip, Typography } from '@mui/material'
import type { QualityPredictionModelWeight } from '@smartem/api'
import { useMemo, useState } from 'react'
import { gray } from '~/theme'
import { cellFillColor, cellTextColor } from './cellColor'

interface Props {
  weightsByModel: Record<string, QualityPredictionModelWeight[]>
  // When true, render a client-side "as of {timestamp}" slider that re-colours the matrix from the
  // already-fetched history. Off by default so the per-model detail page (which pairs the matrix
  // with a full timeline) is unchanged.
  showTimeSlider?: boolean
}

interface Cell {
  weight: number
  timestamp: string | undefined
}

const CELL_HEIGHT = 64
const CELL_MIN_WIDTH = 100
const ROW_HEADER_WIDTH = 160
const COL_HEADER_HEIGHT = 40

function tsMillis(ts: string | undefined): number {
  if (!ts) return Number.NaN
  return new Date(ts).getTime()
}

function formatMillis(ms: number): string {
  if (Number.isNaN(ms)) return '—'
  return new Date(ms).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTimestamp(ts: string | undefined): string {
  if (!ts) return '—'
  const ms = new Date(ts).getTime()
  if (Number.isNaN(ms)) return ts
  return formatMillis(ms)
}

// Latest weight recorded at or before `asOf` (ms). asOf = +Infinity yields the latest overall, so
// the default view matches the previous "current weights" behaviour.
function pickAtOrBefore(entries: QualityPredictionModelWeight[], asOf: number): Cell | undefined {
  let bestT = Number.NEGATIVE_INFINITY
  let best: Cell | undefined
  for (const entry of entries) {
    const t = tsMillis(entry.timestamp)
    if (Number.isNaN(t) || t > asOf) continue
    if (t > bestT) {
      bestT = t
      best = { weight: entry.weight, timestamp: entry.timestamp }
    }
  }
  return best
}

export function WeightsMatrix({ weightsByModel, showTimeSlider = false }: Props) {
  const { models, metrics, grouped, minT, maxT } = useMemo(() => {
    const modelSet = Object.keys(weightsByModel)
    const metricSet = new Set<string>()
    const grouped = new Map<string, QualityPredictionModelWeight[]>()
    let minT = Number.POSITIVE_INFINITY
    let maxT = Number.NEGATIVE_INFINITY

    for (const [modelName, entries] of Object.entries(weightsByModel)) {
      for (const entry of entries) {
        if (!entry.metric_name) continue
        metricSet.add(entry.metric_name)
        const key = `${modelName}::${entry.metric_name}`
        const bucket = grouped.get(key)
        if (bucket) bucket.push(entry)
        else grouped.set(key, [entry])
        const t = tsMillis(entry.timestamp)
        if (!Number.isNaN(t)) {
          if (t < minT) minT = t
          if (t > maxT) maxT = t
        }
      }
    }

    return {
      models: modelSet,
      metrics: Array.from(metricSet).sort(),
      grouped,
      minT,
      maxT,
    }
  }, [weightsByModel])

  const hasTimeline =
    showTimeSlider && Number.isFinite(minT) && Number.isFinite(maxT) && maxT > minT
  // null = "latest" (the rightmost / default position). A concrete ms value pins the matrix to a
  // point in history.
  const [asOf, setAsOf] = useState<number | null>(null)
  const effectiveAsOf = hasTimeline && asOf !== null ? asOf : Number.POSITIVE_INFINITY

  const cells = useMemo(() => {
    const cellMap = new Map<string, Cell>()
    for (const [key, entries] of grouped.entries()) {
      const cell = pickAtOrBefore(entries, effectiveAsOf)
      if (cell) cellMap.set(key, cell)
    }
    return cellMap
  }, [grouped, effectiveAsOf])

  if (models.length === 0 || metrics.length === 0) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No model weights available for this grid.
        </Typography>
      </Box>
    )
  }

  const gridTemplateColumns = `${ROW_HEADER_WIDTH}px repeat(${metrics.length}, minmax(${CELL_MIN_WIDTH}px, 1fr))`
  const gridTemplateRows = `${COL_HEADER_HEIGHT}px repeat(${models.length}, ${CELL_HEIGHT}px)`

  const sliderValue = asOf ?? maxT
  const isLatest = asOf === null || asOf >= maxT
  const sliderStep = Math.max(1, Math.round((maxT - minT) / 500))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {hasTimeline && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 56 }}>
            As of
          </Typography>
          <Slider
            size="small"
            min={minT}
            max={maxT}
            step={sliderStep}
            value={sliderValue}
            onChange={(_, value) => setAsOf(typeof value === 'number' ? value : value[0])}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => formatMillis(value)}
            aria-label="Show weights as of"
            sx={{ flex: 1, minWidth: 200, maxWidth: 480 }}
          />
          <Typography
            variant="caption"
            sx={{
              color: 'text.primary',
              fontVariantNumeric: 'tabular-nums',
              minWidth: 150,
              textAlign: 'right',
            }}
          >
            {formatMillis(sliderValue)}
          </Typography>
          <Box
            component="button"
            type="button"
            disabled={isLatest}
            onClick={() => setAsOf(null)}
            sx={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              px: 1,
              py: 0.25,
              borderRadius: 1,
              border: '1px solid',
              borderColor: isLatest ? gray[200] : 'divider',
              backgroundColor: 'background.paper',
              color: isLatest ? 'text.disabled' : 'text.secondary',
              cursor: isLatest ? 'default' : 'pointer',
              '&:hover': isLatest ? {} : { borderColor: gray[400], color: 'text.primary' },
            }}
          >
            {isLatest ? 'Latest' : 'Reset to latest'}
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns, gridTemplateRows, gap: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            pr: 1.5,
            pb: 0.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: 'text.disabled', fontStyle: 'italic', fontSize: '0.6875rem' }}
          >
            model × metric
          </Typography>
        </Box>

        {metrics.map((metric) => (
          <Box
            key={`col-${metric}`}
            sx={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              pb: 0.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                color: 'text.primary',
                textAlign: 'center',
              }}
            >
              {metric}
            </Typography>
          </Box>
        ))}

        {models.flatMap((model) => {
          const rowKey = `row-${model}`
          const headerCell = (
            <Box
              key={rowKey}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                pr: 1.5,
                borderRight: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, fontSize: '0.8125rem', color: 'text.primary' }}
              >
                {model}
              </Typography>
            </Box>
          )

          const dataCells = metrics.map((metric) => {
            const cellKey = `cell-${model}-${metric}`
            const cell = cells.get(`${model}::${metric}`)
            if (!cell) {
              return (
                <Box
                  key={cellKey}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: gray[100],
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1,
                    color: 'text.disabled',
                    fontSize: '0.75rem',
                  }}
                >
                  —
                </Box>
              )
            }
            return (
              <Tooltip
                key={cellKey}
                title={
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {model} · {metric}
                    </Typography>
                    <Typography variant="caption">Weight: {cell.weight.toFixed(3)}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      {formatTimestamp(cell.timestamp)}
                    </Typography>
                  </Box>
                }
                placement="top"
                arrow
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: cellFillColor(cell.weight),
                    color: cellTextColor(cell.weight),
                    borderRadius: 1,
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    cursor: 'default',
                    transition: 'transform 80ms ease-out, box-shadow 80ms ease-out',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: 1,
                    },
                  }}
                >
                  {cell.weight.toFixed(2)}
                </Box>
              </Tooltip>
            )
          })

          return [headerCell, ...dataCells]
        })}
      </Box>

      <WeightsMatrixLegend />
    </Box>
  )
}

function WeightsMatrixLegend() {
  const stops = [0, 0.25, 0.5, 0.75, 1]
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 56 }}>
        Weight
      </Typography>
      <Box
        sx={{
          flex: 1,
          maxWidth: 320,
          height: 12,
          borderRadius: 0.5,
          background: `linear-gradient(to right, ${cellFillColor(0)}, ${cellFillColor(0.5)}, ${cellFillColor(1)})`,
          border: '1px solid',
          borderColor: 'divider',
        }}
      />
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', flex: 1, maxWidth: 320, ml: -1 }}
      >
        {stops.map((s) => (
          <Typography
            key={s}
            variant="caption"
            sx={{ color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}
          >
            {s.toFixed(2)}
          </Typography>
        ))}
      </Box>
    </Box>
  )
}
