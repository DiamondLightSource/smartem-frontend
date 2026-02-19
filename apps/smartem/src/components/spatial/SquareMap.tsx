import { Box, ButtonBase, Checkbox, FormControlLabel, Typography } from '@mui/material'
import { useCallback, useMemo, useState } from 'react'
import type { MockFoilHole } from '~/data/mock-session-detail'
import { gray, statusColors } from '~/theme'
import {
  computeHeatmapBins,
  type HeatmapBin,
  type HeatmapOptions,
  qualityColor,
  valueToHeatmapColor,
} from '~/utils/heatmap'

type MetricKey = 'quality' | 'resolution' | 'astigmatism' | 'particleCount'

const METRIC_OPTIONS: Record<MetricKey, HeatmapOptions> = {
  quality: { label: 'Quality', type: 'linear', binCount: 5 },
  resolution: { label: 'Resolution (A)', max: 5, type: 'log', binCount: 5 },
  astigmatism: { label: 'Astigmatism (nm)', max: 50, type: 'log', binCount: 5 },
  particleCount: {
    label: 'Particle Count',
    min: 0,
    max: 300,
    type: 'linear',
    binCount: 5,
  },
}

interface SquareMapProps {
  foilholes: MockFoilHole[]
  squareLabel: string
  onFoilholeClick?: (uuid: string) => void
}

export function SquareMap({ foilholes, squareLabel, onFoilholeClick }: SquareMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectionFrozen, setSelectionFrozen] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [metric, setMetric] = useState<MetricKey>('quality')
  const [hideNull, setHideNull] = useState(false)

  const useHeatmap = metric !== 'quality'

  const metricValues = useMemo(() => {
    if (!useHeatmap) return null
    return foilholes.map((fh) => {
      if (metric === 'resolution') return fh.resolution
      if (metric === 'astigmatism') return fh.astigmatism
      if (metric === 'particleCount') return fh.particleCount
      return null
    })
  }, [foilholes, metric, useHeatmap])

  const heatmapBins = useMemo(() => {
    if (!metricValues) return [] as HeatmapBin[]
    return computeHeatmapBins(metricValues, METRIC_OPTIONS[metric])
  }, [metricValues, metric])

  const getMetricValue = useCallback(
    (fh: MockFoilHole): number | null => {
      if (metric === 'quality') return fh.quality
      if (metric === 'resolution') return fh.resolution
      if (metric === 'astigmatism') return fh.astigmatism
      if (metric === 'particleCount') return fh.particleCount
      return null
    },
    [metric]
  )

  const getFill = useCallback(
    (fh: MockFoilHole): string => {
      if (!useHeatmap) return qualityColor(fh.quality)
      const val = getMetricValue(fh)
      return valueToHeatmapColor(val, heatmapBins) ?? gray[600]
    },
    [useHeatmap, getMetricValue, heatmapBins]
  )

  const isNullMetric = useCallback(
    (fh: MockFoilHole): boolean => {
      if (!useHeatmap) return false
      return getMetricValue(fh) === null
    },
    [useHeatmap, getMetricValue]
  )

  const handleClick = useCallback(
    (uuid: string) => {
      if (onFoilholeClick) {
        onFoilholeClick(uuid)
        return
      }
      if (uuid === selectedId) {
        setSelectionFrozen((f) => !f)
      } else {
        setSelectionFrozen(true)
        setSelectedId(uuid)
      }
    },
    [onFoilholeClick, selectedId]
  )

  const handleHover = useCallback(
    (uuid: string | null) => {
      if (!selectionFrozen) {
        setHoveredId(uuid)
      }
    },
    [selectionFrozen]
  )

  const hoveredHole = hoveredId ? foilholes.find((h) => h.uuid === hoveredId) : null
  const selectedHole = selectedId ? foilholes.find((h) => h.uuid === selectedId) : null

  const avgQuality =
    foilholes.length > 0 ? foilholes.reduce((sum, h) => sum + h.quality, 0) / foilholes.length : 0

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Checkered placeholder for microscope image */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `repeating-conic-gradient(${gray[200]} 0% 25%, ${gray[50]} 0% 50%) 50% / 20px 20px`,
            borderRadius: 1,
          }}
        />
        <svg
          viewBox="0 0 2880 2046"
          role="img"
          aria-label="Grid square map showing foilholes"
          style={{
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            position: 'relative',
            zIndex: 1,
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            setTooltipPos({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            })
          }}
        >
          {foilholes.map((fh) => {
            const isHovered = hoveredId === fh.uuid
            const isSelected = selectedId === fh.uuid
            const isNull = isNullMetric(fh)

            if (isNull && hideNull) return null

            const fill = isNull ? 'black' : getFill(fh)
            const opacity = isNull ? 0.2 : isHovered || isSelected ? 1.0 : 0.6

            return (
              <circle
                key={fh.uuid}
                role="button"
                tabIndex={0}
                cx={fh.xLocation}
                cy={fh.yLocation}
                r={fh.diameter / 2}
                fill={fill}
                opacity={opacity}
                stroke={
                  isNull
                    ? '#cf222e'
                    : fh.isNearGridBar
                      ? gray[600]
                      : isSelected
                        ? '#e59344'
                        : isHovered
                          ? gray[900]
                          : 'none'
                }
                strokeWidth={isNull ? 2 : fh.isNearGridBar ? 4 : isHovered || isSelected ? 4 : 0}
                strokeDasharray={fh.isNearGridBar ? '8 4' : 'none'}
                strokeOpacity={isNull ? 0.4 : 1}
                style={{ cursor: 'pointer', transition: 'opacity 0.1s' }}
                onMouseEnter={() => handleHover(fh.uuid)}
                onMouseLeave={() => handleHover(null)}
                onClick={() => handleClick(fh.uuid)}
              />
            )
          })}
        </svg>

        {/* Tooltip */}
        {hoveredHole && (
          <Box
            sx={{
              position: 'absolute',
              left: tooltipPos.x + 12,
              top: tooltipPos.y - 30,
              backgroundColor: gray[900],
              color: '#ffffff',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}
          >
            {hoveredHole.foilholeId} —{' '}
            {useHeatmap
              ? `${getMetricValue(hoveredHole) ?? 'N/A'} ${METRIC_OPTIONS[metric].label}`
              : `${Math.round(hoveredHole.quality * 100)}%`}
            {hoveredHole.isNearGridBar && ' (near grid bar)'}
          </Box>
        )}
      </Box>

      {/* Bottom controls */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 0.75,
          borderTop: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {squareLabel}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {foilholes.length} foilholes
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          avg {Math.round(avgQuality * 100)}%
        </Typography>

        {selectionFrozen && (
          <Typography
            variant="caption"
            sx={{
              color: statusColors.paused,
              fontWeight: 500,
              fontSize: '0.625rem',
            }}
          >
            locked
          </Typography>
        )}

        {selectedHole && (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              ml: 0.5,
              pl: 1,
              borderLeft: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              {selectedHole.foilholeId}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {Math.round(selectedHole.quality * 100)}%
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {selectedHole.status}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {selectedHole.micrographCount} mic
            </Typography>
            {selectedHole.isNearGridBar && (
              <Typography variant="caption" sx={{ color: statusColors.paused, fontWeight: 500 }}>
                near grid bar
              </Typography>
            )}
          </Box>
        )}

        <Box sx={{ flex: 1 }} />

        {/* Metric selector */}
        <Box sx={{ display: 'flex', gap: 0.25 }}>
          {(Object.keys(METRIC_OPTIONS) as MetricKey[]).map((key) => (
            <ButtonBase
              key={key}
              onClick={() => setMetric(key)}
              sx={{
                px: 0.75,
                py: 0.25,
                borderRadius: 0.5,
                fontSize: '0.5625rem',
                fontWeight: key === metric ? 600 : 400,
                color: key === metric ? 'text.primary' : 'text.disabled',
                backgroundColor: key === metric ? gray[50] : 'transparent',
                '&:hover': { backgroundColor: gray[100] },
              }}
            >
              {METRIC_OPTIONS[key].label.split(' ')[0]}
            </ButtonBase>
          ))}
        </Box>

        {useHeatmap && (
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={hideNull}
                onChange={(e) => setHideNull(e.target.checked)}
                sx={{ p: 0.25 }}
              />
            }
            label={
              <Typography variant="caption" sx={{ fontSize: '0.5625rem' }}>
                Hide uncollected
              </Typography>
            }
            sx={{ mr: 0, ml: 0.5 }}
          />
        )}

        <HeatmapLegend useHeatmap={useHeatmap} bins={heatmapBins} />
      </Box>
    </Box>
  )
}

function HeatmapLegend({ useHeatmap, bins }: { useHeatmap: boolean; bins: HeatmapBin[] }) {
  if (useHeatmap && bins.length > 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ display: 'flex', gap: '1px' }}>
          {bins.map((bin) => (
            <Box key={bin.edge} sx={{ width: 16, height: 6, backgroundColor: bin.color }} />
          ))}
        </Box>
        <Typography variant="caption" sx={{ fontSize: '0.5rem', color: 'text.disabled' }}>
          {bins[0].edge.toFixed(1)}-{bins[bins.length - 1].edge.toFixed(1)}
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <Typography variant="caption" sx={{ fontSize: '0.625rem', color: 'text.disabled' }}>
        Quality
      </Typography>
      <Box
        sx={{
          width: 80,
          height: 6,
          borderRadius: 3,
          background: `linear-gradient(90deg, ${statusColors.error}, ${statusColors.paused} 50%, ${statusColors.running})`,
        }}
      />
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Typography variant="caption" sx={{ fontSize: '0.5625rem', color: 'text.disabled' }}>
          0
        </Typography>
        <Typography variant="caption" sx={{ fontSize: '0.5625rem', color: 'text.disabled' }}>
          1
        </Typography>
      </Box>
    </Box>
  )
}
