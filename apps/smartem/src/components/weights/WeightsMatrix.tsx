import { Box, Tooltip, Typography } from '@mui/material'
import type { QualityPredictionModelWeight } from '@smartem/api'
import { useMemo } from 'react'
import { gray } from '~/theme'
import { cellFillColor, cellTextColor } from './cellColor'

interface Props {
  weightsByModel: Record<string, QualityPredictionModelWeight[]>
}

interface LatestCell {
  weight: number
  timestamp: string | undefined
}

const CELL_HEIGHT = 64
const CELL_MIN_WIDTH = 100
const ROW_HEADER_WIDTH = 160
const COL_HEADER_HEIGHT = 40

function formatTimestamp(ts: string | undefined): string {
  if (!ts) return '—'
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ts
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function pickLatest(entries: QualityPredictionModelWeight[]): LatestCell | undefined {
  if (entries.length === 0) return undefined
  let best = entries[0]
  for (const entry of entries) {
    if ((entry.timestamp ?? '') > (best.timestamp ?? '')) best = entry
  }
  return { weight: best.weight, timestamp: best.timestamp }
}

export function WeightsMatrix({ weightsByModel }: Props) {
  const { models, metrics, cells } = useMemo(() => {
    const modelSet = Object.keys(weightsByModel)
    const metricSet = new Set<string>()
    const grouped = new Map<string, QualityPredictionModelWeight[]>()

    for (const [modelName, entries] of Object.entries(weightsByModel)) {
      for (const entry of entries) {
        if (!entry.metric_name) continue
        metricSet.add(entry.metric_name)
        const key = `${modelName}::${entry.metric_name}`
        const bucket = grouped.get(key)
        if (bucket) bucket.push(entry)
        else grouped.set(key, [entry])
      }
    }

    const cellMap = new Map<string, LatestCell>()
    for (const [key, entries] of grouped.entries()) {
      const latest = pickLatest(entries)
      if (latest) cellMap.set(key, latest)
    }

    return {
      models: modelSet,
      metrics: Array.from(metricSet).sort(),
      cells: cellMap,
    }
  }, [weightsByModel])

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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
