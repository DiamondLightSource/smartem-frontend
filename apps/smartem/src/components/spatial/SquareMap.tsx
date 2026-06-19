import {
  Box,
  ButtonBase,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material'
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

type BaseMetric = 'quality' | 'resolution' | 'astigmatism' | 'particleCount'

const METRIC_OPTIONS: Record<BaseMetric, HeatmapOptions> = {
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

const BASE_METRICS = Object.keys(METRIC_OPTIONS) as BaseMetric[]

const metricButtonSx = (active: boolean) => ({
  px: 0.75,
  py: 0.25,
  borderRadius: 0.5,
  fontSize: '0.5625rem',
  fontWeight: active ? 600 : 400,
  color: active ? 'text.primary' : 'text.disabled',
  backgroundColor: active ? gray[50] : 'transparent',
  '&:hover': { backgroundColor: gray[100] },
})

// A prediction overlay layer: a model (or the cross-model "overall") whose predicted
// per-foilhole quality colours the map. Selected via the same control as base metrics and
// addressed internally as `pred:<id>`.
export interface PredictionLayer {
  id: string
  label: string
}

interface SquareMapProps {
  foilholes: MockFoilHole[]
  squareLabel: string
  imageUrl?: string
  imageLoading?: boolean
  // Natural pixel size of the micrograph. Foilhole coords are in this space, so the viewBox must
  // match it; falls back to the standard gridsquare image size until the image has decoded.
  imageWidth?: number
  imageHeight?: number
  onFoilholeClick?: (uuid: string) => void
  predictionLayers?: PredictionLayer[]
  // layer id -> (foilhole uuid -> predicted value, 0..1)
  predictionValues?: Record<string, Map<string, number>>
  // foilholes the system suggests collecting next; highlighted when the toggle is on
  suggestedHoleIds?: Set<string>
  // "full" (default) fills the viewport with the micrograph and a horizontal control bar - the
  // standalone square page. "panel" is the atlas-embedded preview (issue #68): a compact header, the
  // micrograph fitted to its aspect ratio at the top, and the controls stacked in the space below so
  // nothing floats and the two panes line up at the top.
  variant?: 'full' | 'panel'
  // Panel-only header actions; rendered as icon buttons beside the title.
  onClose?: () => void
  onExpand?: () => void
}

export function SquareMap({
  foilholes,
  squareLabel,
  imageUrl,
  imageLoading,
  imageWidth,
  imageHeight,
  onFoilholeClick,
  predictionLayers = [],
  predictionValues = {},
  suggestedHoleIds,
  variant = 'full',
  onClose,
  onExpand,
}: SquareMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectionFrozen, setSelectionFrozen] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [metric, setMetric] = useState<string>('quality')
  const [hideNull, setHideNull] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // The micrograph (decoded server-side) lands seconds after the lightweight foilhole geometry.
  // Hold the overlay back until the image has painted so circles and image reveal together; if
  // no image is available, reveal once we know. Re-arm on image change by resetting during
  // render against the previously seen URL - the standard React pattern.
  const [imageLoaded, setImageLoaded] = useState(false)
  const [prevImageUrl, setPrevImageUrl] = useState(imageUrl)
  if (imageUrl !== prevImageUrl) {
    setPrevImageUrl(imageUrl)
    setImageLoaded(false)
  }
  const imageReady = imageLoaded || (!imageLoading && !imageUrl)

  const predLayerId = metric.startsWith('pred:') ? metric.slice(5) : null
  const isPred = predLayerId !== null
  const baseMetric = isPred ? null : (metric as BaseMetric)
  // Prediction layers are 0..1 scores coloured like quality; only the non-quality base
  // metrics use the binned heatmap scale.
  const useHeatmap = !isPred && metric !== 'quality'

  const metricValues = useMemo(() => {
    if (!useHeatmap || !baseMetric) return null
    return foilholes.map((fh) => {
      if (baseMetric === 'resolution') return fh.resolution
      if (baseMetric === 'astigmatism') return fh.astigmatism
      if (baseMetric === 'particleCount') return fh.particleCount
      return null
    })
  }, [foilholes, baseMetric, useHeatmap])

  const heatmapBins = useMemo(() => {
    if (!metricValues || !baseMetric) return [] as HeatmapBin[]
    return computeHeatmapBins(metricValues, METRIC_OPTIONS[baseMetric])
  }, [metricValues, baseMetric])

  const getMetricValue = useCallback(
    (fh: MockFoilHole): number | null => {
      if (isPred && predLayerId) return predictionValues[predLayerId]?.get(fh.uuid) ?? null
      if (metric === 'quality') return fh.quality
      if (metric === 'resolution') return fh.resolution
      if (metric === 'astigmatism') return fh.astigmatism
      if (metric === 'particleCount') return fh.particleCount
      return null
    },
    [isPred, predLayerId, predictionValues, metric]
  )

  const getFill = useCallback(
    (fh: MockFoilHole): string => {
      if (isPred) {
        const val = getMetricValue(fh)
        return val != null ? qualityColor(val) : gray[600]
      }
      if (!useHeatmap) return qualityColor(fh.quality)
      const val = getMetricValue(fh)
      return valueToHeatmapColor(val, heatmapBins) ?? gray[600]
    },
    [isPred, useHeatmap, getMetricValue, heatmapBins]
  )

  const isNullMetric = useCallback(
    (fh: MockFoilHole): boolean => {
      if (!useHeatmap && !isPred) return false
      return getMetricValue(fh) === null
    },
    [useHeatmap, isPred, getMetricValue]
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
  const hoveredValue = hoveredHole ? getMetricValue(hoveredHole) : null

  const avgQuality =
    foilholes.length > 0 ? foilholes.reduce((sum, h) => sum + h.quality, 0) / foilholes.length : 0

  // Foilhole coords live in the micrograph's native pixel space; match the viewBox to it (falling
  // back to the standard gridsquare size until the image decodes) so the overlay stays on the image.
  const vbW = imageWidth ?? 2880
  const vbH = imageHeight ?? 2046

  const isPanel = variant === 'panel'

  // Shared control leaves, composed differently per variant: a single horizontal bar for the full
  // page, a stacked block under the micrograph for the embedded panel.
  const statsItems = (
    <>
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
          sx={{ color: statusColors.paused, fontWeight: 500, fontSize: '0.625rem' }}
        >
          locked
        </Typography>
      )}
    </>
  )

  const selectedHoleDetail = selectedHole ? (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        ml: isPanel ? 0 : 0.5,
        pl: isPanel ? 0 : 1,
        borderLeft: isPanel ? 'none' : '1px solid',
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
  ) : null

  const metricSelector = (
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.25 }}>
      {BASE_METRICS.map((key) => (
        <ButtonBase key={key} onClick={() => setMetric(key)} sx={metricButtonSx(key === metric)}>
          {METRIC_OPTIONS[key].label.split(' ')[0]}
        </ButtonBase>
      ))}
      {predictionLayers.length > 0 && (
        <Box sx={{ width: '1px', alignSelf: 'stretch', backgroundColor: 'divider', mx: 0.25 }} />
      )}
      {predictionLayers.map((layer) => {
        const key = `pred:${layer.id}`
        return (
          <ButtonBase key={key} onClick={() => setMetric(key)} sx={metricButtonSx(key === metric)}>
            {layer.label}
          </ButtonBase>
        )
      })}
    </Box>
  )

  const suggestionsToggle =
    suggestedHoleIds && suggestedHoleIds.size > 0 ? (
      <ButtonBase
        onClick={() => setShowSuggestions((s) => !s)}
        sx={{
          px: 0.75,
          py: 0.25,
          borderRadius: 0.5,
          fontSize: '0.625rem',
          fontWeight: showSuggestions ? 600 : 400,
          color: showSuggestions ? '#2f6feb' : 'text.disabled',
          backgroundColor: showSuggestions ? gray[50] : 'transparent',
          '&:hover': { backgroundColor: gray[100] },
        }}
      >
        Suggestions ({suggestedHoleIds.size})
      </ButtonBase>
    ) : null

  const hideNullToggle =
    useHeatmap || isPred ? (
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
        sx={{ mr: 0, ml: isPanel ? 0 : 0.5 }}
      />
    ) : null

  const legend = <HeatmapLegend useHeatmap={useHeatmap} bins={heatmapBins} />

  const imageArea = (
    <Box
      sx={
        isPanel
          ? {
              // Fill the height between header and controls as an image-viewer canvas. The landscape
              // micrograph centres within and any leftover reads as dark matting, so the panel never
              // ends in a white void below the controls.
              flex: 1,
              minHeight: 0,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: gray[900],
              borderBottom: '1px solid',
              borderColor: 'divider',
            }
          : {
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }
      }
    >
      {/* Checkered placeholder for microscope image. In the panel the area is a dark viewer canvas,
          so drop the checker once the image is ready and let the dark matting show through. */}
      {!(isPanel && imageReady) && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `repeating-conic-gradient(${gray[200]} 0% 25%, ${gray[50]} 0% 50%) 50% / 20px 20px`,
            borderRadius: 1,
          }}
        />
      )}
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
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
        {imageUrl && (
          <image
            href={imageUrl}
            x="0"
            y="0"
            width={vbW}
            height={vbH}
            preserveAspectRatio="none"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
            style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
          />
        )}
        <g
          style={{
            opacity: imageReady ? 1 : 0,
            transition: 'opacity 0.4s ease',
            pointerEvents: imageReady ? 'auto' : 'none',
          }}
        >
          {foilholes.map((fh) => {
            const isHovered = hoveredId === fh.uuid
            const isSelected = selectedId === fh.uuid
            const isNull = isNullMetric(fh)
            const isSuggested = showSuggestions && (suggestedHoleIds?.has(fh.uuid) ?? false)

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
                          : isSuggested
                            ? '#2f6feb'
                            : 'none'
                }
                strokeWidth={
                  isNull ? 2 : fh.isNearGridBar ? 4 : isHovered || isSelected || isSuggested ? 4 : 0
                }
                strokeDasharray={fh.isNearGridBar ? '8 4' : 'none'}
                strokeOpacity={isNull ? 0.4 : 1}
                style={{ cursor: 'pointer', transition: 'opacity 0.1s' }}
                onMouseEnter={() => handleHover(fh.uuid)}
                onMouseLeave={() => handleHover(null)}
                onClick={() => handleClick(fh.uuid)}
              />
            )
          })}
        </g>
      </svg>

      {/* Loading indicator while the micrograph is still being fetched/decoded */}
      {!imageReady && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          <CircularProgress size={28} thickness={4} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Loading image…
          </Typography>
        </Box>
      )}

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
          {isPred
            ? hoveredValue != null
              ? `${Math.round(hoveredValue * 100)}% predicted`
              : 'no prediction'
            : useHeatmap && baseMetric
              ? `${hoveredValue ?? 'N/A'} ${METRIC_OPTIONS[baseMetric].label}`
              : `${Math.round(hoveredHole.quality * 100)}%`}
          {hoveredHole.isNearGridBar && ' (near grid bar)'}
        </Box>
      )}
    </Box>
  )

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {isPanel && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1.5,
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: gray[50],
            flexShrink: 0,
          }}
        >
          {/* Orange accent echoes the locked-square ring on the atlas, tying the two panes together. */}
          <Box
            sx={{
              width: '3px',
              alignSelf: 'stretch',
              minHeight: 20,
              borderRadius: 1,
              backgroundColor: '#e59344',
            }}
          />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="caption"
              noWrap
              sx={{ fontWeight: 700, display: 'block', lineHeight: 1.25 }}
            >
              {squareLabel}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.625rem' }}>
              {foilholes.length} foilholes · avg {Math.round(avgQuality * 100)}%
              {selectionFrozen ? ' · locked' : ''}
            </Typography>
          </Box>
          {onExpand && (
            <Tooltip title="Open full square view" placement="bottom">
              <IconButton
                onClick={onExpand}
                size="small"
                sx={{ p: 0.5 }}
                aria-label="Open full square view"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M6 3h7v7M13 3l-7 7M11 9v4H3V5h4"
                    stroke={gray[700]}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </IconButton>
            </Tooltip>
          )}
          {onClose && (
            <Tooltip title="Close grid square" placement="bottom">
              <IconButton
                onClick={onClose}
                size="small"
                sx={{ p: 0.5 }}
                aria-label="Close grid square panel"
              >
                <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path
                    d="M3 3l6 6M9 3l-6 6"
                    stroke={gray[700]}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}

      {imageArea}

      {isPanel ? (
        // Controls pinned directly below the viewer canvas at their natural height (the image area
        // above takes the slack), so there is no empty band at the foot of the panel.
        <Box
          sx={{
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            px: 1.5,
            py: 1.25,
          }}
        >
          {selectedHoleDetail}
          {metricSelector}
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            {suggestionsToggle}
            {hideNullToggle}
            <Box sx={{ flex: 1 }} />
            {legend}
          </Box>
        </Box>
      ) : (
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
          {statsItems}
          {selectedHoleDetail}
          <Box sx={{ flex: 1 }} />
          {metricSelector}
          {suggestionsToggle}
          {hideNullToggle}
          {legend}
        </Box>
      )}
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
