import {
  Box,
  ButtonBase,
  CircularProgress,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material'
import { useCallback, useMemo, useState } from 'react'
import type {
  MockGridSquare,
  MockModelPredictions,
  MockPredictionModel,
} from '~/data/mock-session-detail'
import { gray, statusColors } from '~/theme'
import {
  CLUSTER_PALETTE,
  computeHeatmapBins,
  HEATMAP_PALETTE,
  type HeatmapBin,
  qualityColor,
  valueToHeatmapColor,
} from '~/utils/heatmap'
import { SPATIAL_FOOTER_MIN_HEIGHT } from './layout'

type ColorMode = 'quality' | 'prediction' | 'cluster'

interface AtlasMapProps {
  squares: MockGridSquare[]
  gridName: string
  imageUrl?: string
  imageLoading?: boolean
  // Natural pixel size of the atlas image. Square coords are in this space, so the viewBox must
  // match it; falls back to a square guess until the image has decoded.
  imageWidth?: number
  imageHeight?: number
  onSquareClick: (squareUuid: string) => void
  predictions?: MockModelPredictions[]
  models?: MockPredictionModel[]
  suggestedSquareIds?: Set<string>
  selectedSquareId?: string | null
  onSquareHover?: (squareUuid: string | null) => void
  frozenSelection?: boolean
  onFreezeToggle?: () => void
}

export function AtlasMap({
  squares,
  gridName,
  imageUrl,
  imageLoading,
  imageWidth,
  imageHeight,
  onSquareClick,
  predictions,
  models,
  suggestedSquareIds,
  selectedSquareId: externalSelectedId,
  onSquareHover,
  frozenSelection: externalFrozen,
  onFreezeToggle: externalFreezeToggle,
}: AtlasMapProps) {
  const [internalHoveredId, setInternalHoveredId] = useState<string | null>(null)
  const [internalFrozenId, setInternalFrozenId] = useState<string | null>(null)
  const [internalFrozen, setInternalFrozen] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [showPredictions, setShowPredictions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedModelId, setSelectedModelId] = useState(models?.[0]?.id ?? '')
  const [colorMode, setColorMode] = useState<ColorMode>('quality')

  const frozen = externalFrozen ?? internalFrozen
  const selectedId = externalSelectedId ?? internalFrozenId
  const hoveredId = internalHoveredId

  // The atlas image (a multi-MB micrograph decoded server-side) arrives seconds after the
  // lightweight square geometry. Hold the overlay back until the image has painted so the
  // circles and image reveal together rather than circles-first. If no image is available,
  // reveal once we know. Re-arm the reveal when the image changes (e.g. switching grids) by
  // resetting during render against the previously seen URL - the standard React pattern.
  const [imageLoaded, setImageLoaded] = useState(false)
  const [prevImageUrl, setPrevImageUrl] = useState(imageUrl)
  if (imageUrl !== prevImageUrl) {
    setPrevImageUrl(imageUrl)
    setImageLoaded(false)
  }
  const imageReady = imageLoaded || (!imageLoading && !imageUrl)

  const selectedPrediction = useMemo(
    () => predictions?.find((p) => p.modelId === selectedModelId),
    [predictions, selectedModelId]
  )

  const predValues = useMemo(() => {
    if (!selectedPrediction || !showPredictions) return null
    return selectedPrediction.squareQualities
  }, [selectedPrediction, showPredictions])

  const predBins = useMemo(() => {
    if (!predValues) return [] as HeatmapBin[]
    return computeHeatmapBins(Array.from(predValues.values()), {
      label: 'Prediction',
      type: 'linear',
      binCount: 5,
    })
  }, [predValues])

  const predMin = useMemo(() => {
    if (!predValues) return 0
    const vals = Array.from(predValues.values())
    return vals.length > 0 ? Math.min(...vals) : 0
  }, [predValues])
  const predMax = useMemo(() => {
    if (!predValues) return 1
    const vals = Array.from(predValues.values())
    return vals.length > 0 ? Math.max(...vals) : 1
  }, [predValues])

  const handleClick = useCallback(
    (uuid: string) => {
      if (externalFreezeToggle) {
        if (uuid === selectedId) {
          externalFreezeToggle()
        } else {
          onSquareClick(uuid)
        }
        return
      }
      if (uuid === internalFrozenId) {
        setInternalFrozen((f) => !f)
      } else {
        setInternalFrozen(true)
        setInternalFrozenId(uuid)
      }
    },
    [externalFreezeToggle, selectedId, internalFrozenId, onSquareClick]
  )

  const handleHover = useCallback(
    (uuid: string | null) => {
      if (!frozen) {
        setInternalHoveredId(uuid)
        onSquareHover?.(uuid)
      }
    },
    [frozen, onSquareHover]
  )

  const hoveredSquare = hoveredId ? squares.find((s) => s.uuid === hoveredId) : null

  const getFill = useCallback(
    (sq: MockGridSquare) => {
      if (colorMode === 'cluster' && sq.latent) {
        return CLUSTER_PALETTE[sq.latent.clusterIndex % CLUSTER_PALETTE.length]
      }
      if (showPredictions && predValues) {
        const val = predValues.get(sq.uuid)
        if (val != null) return valueToHeatmapColor(val, predBins) ?? gray[600]
        return gray[600]
      }
      return qualityColor(sq.quality)
    },
    [colorMode, showPredictions, predValues, predBins]
  )

  const getRadius = useCallback(
    (sq: MockGridSquare) => {
      if (showPredictions && predValues) {
        const val = predValues.get(sq.uuid)
        if (val != null) {
          const range = predMax - predMin || 1
          const normalized = (val - predMin) / range
          return (sq.sizeWidth / 2) * (0.5 + normalized)
        }
      }
      return sq.sizeWidth / 2
    },
    [showPredictions, predValues, predMin, predMax]
  )

  const activeMode = showPredictions ? 'prediction' : colorMode

  // Square coords live in the atlas image's native pixel space; match the viewBox to it (falling
  // back to a square guess until the image decodes) so the overlay sits on the image instead of
  // being stretched by forcing a non-square image into a square box.
  const vbW = imageWidth ?? 4005
  const vbH = imageHeight ?? 4005

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header bar - mirrors the grid-square panel header so the two panes line up at the top. */}
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
        <Box
          sx={{
            width: '3px',
            alignSelf: 'stretch',
            minHeight: 20,
            borderRadius: 1,
            backgroundColor: gray[400],
          }}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="caption"
            noWrap
            sx={{ fontWeight: 700, display: 'block', lineHeight: 1.25 }}
          >
            {gridName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.625rem' }}>
            {squares.length} squares{frozen ? ' · selection locked' : ''}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          // Dark viewer canvas matching the grid-square panel so the (dark) micrograph blends into the
          // matting. The image itself is left-aligned inside the SVG (preserveAspectRatio) so it lines up
          // with the page header; the slack falls to the right, into the seam before the panel.
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: gray[900],
        }}
      >
        {/* Checkered placeholder while the atlas image loads; dropped once it is ready. */}
        {!imageReady && (
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
          aria-label="Atlas map showing grid squares"
          // Left-align the scaled image inside the (full-width) SVG so its left edge lines up with the
          // page header / left margin, consistent with the rest of the page. The SVG fills the pane, so
          // flex justify-content can't move it - the alignment has to happen inside via
          // preserveAspectRatio (xMin = left, YMid = vertically centred); the leftover slack falls into
          // the seam between the atlas and the grid-square panel as dark matting.
          preserveAspectRatio="xMinYMid meet"
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
            setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
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
            {squares.map((sq) => {
              const isHovered = hoveredId === sq.uuid
              const isSelected = selectedId === sq.uuid
              const isSuggested = showSuggestions && (suggestedSquareIds?.has(sq.uuid) ?? false)
              const fill = getFill(sq)
              const r = getRadius(sq)
              const opacity = isHovered || isSelected ? 1.0 : sq.selected ? 0.8 : 0.5
              return (
                <circle
                  key={sq.uuid}
                  role="button"
                  tabIndex={0}
                  cx={sq.centerX}
                  cy={sq.centerY}
                  r={r}
                  fill={fill}
                  opacity={opacity}
                  stroke={
                    isSelected
                      ? '#e59344'
                      : isHovered
                        ? gray[900]
                        : isSuggested
                          ? '#2f6feb'
                          : 'none'
                  }
                  strokeWidth={isSelected ? 12 : isHovered ? 8 : isSuggested ? 10 : 0}
                  style={{ cursor: 'pointer', transition: 'opacity 0.1s' }}
                  onMouseEnter={() => handleHover(sq.uuid)}
                  onMouseLeave={() => handleHover(null)}
                  onClick={() => handleClick(sq.uuid)}
                  onDoubleClick={() => onSquareClick(sq.uuid)}
                >
                  {sq.hasImageData && sq.status === 'collected' && (
                    <animate
                      attributeName="fill-opacity"
                      dur="1.5s"
                      values="0.4;0.9;0.4"
                      repeatCount="indefinite"
                    />
                  )}
                </circle>
              )
            })}
          </g>
        </svg>

        {/* Loading indicator while the atlas image is still being fetched/decoded */}
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
              Loading atlas image…
            </Typography>
          </Box>
        )}

        {/* Tooltip */}
        {hoveredSquare && (
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
            {hoveredSquare.gridsquareId} — {Math.round(hoveredSquare.quality * 100)}%
            {showPredictions &&
              predValues?.get(hoveredSquare.uuid) != null &&
              ` (pred: ${predValues.get(hoveredSquare.uuid)?.toFixed(3)})`}
          </Box>
        )}
      </Box>

      {/* Controls bar - shares the grid-square panel's footer height so the two footers line up. */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 0.75,
          minHeight: SPATIAL_FOOTER_MIN_HEIGHT,
          borderTop: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        {/* Prediction overlay toggle */}
        {models && models.length > 0 && (
          <>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={showPredictions}
                  onChange={() => {
                    setShowPredictions((p) => !p)
                    setColorMode(showPredictions ? 'quality' : 'prediction')
                  }}
                />
              }
              label={
                <Typography variant="caption" sx={{ fontSize: '0.625rem' }}>
                  Predictions
                </Typography>
              }
              sx={{ mr: 0.5, ml: 0 }}
            />
            {showPredictions && (
              <Box sx={{ display: 'flex', gap: 0.25 }}>
                {models.map((m) => (
                  <ButtonBase
                    key={m.id}
                    onClick={() => setSelectedModelId(m.id)}
                    sx={{
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 0.5,
                      fontSize: '0.5625rem',
                      fontWeight: m.id === selectedModelId ? 600 : 400,
                      color: m.id === selectedModelId ? 'text.primary' : 'text.disabled',
                      backgroundColor: m.id === selectedModelId ? gray[50] : 'transparent',
                      '&:hover': { backgroundColor: gray[100] },
                    }}
                  >
                    {m.name.split('-')[0]}
                  </ButtonBase>
                ))}
              </Box>
            )}
          </>
        )}

        {/* Color mode: cluster toggle */}
        {!showPredictions && (
          <ButtonBase
            onClick={() => setColorMode((m) => (m === 'cluster' ? 'quality' : 'cluster'))}
            sx={{
              px: 0.75,
              py: 0.25,
              borderRadius: 0.5,
              fontSize: '0.625rem',
              fontWeight: colorMode === 'cluster' ? 600 : 400,
              color: colorMode === 'cluster' ? 'text.primary' : 'text.disabled',
              backgroundColor: colorMode === 'cluster' ? gray[50] : 'transparent',
              '&:hover': { backgroundColor: gray[100] },
            }}
          >
            Clusters
          </ButtonBase>
        )}

        {suggestedSquareIds && suggestedSquareIds.size > 0 && (
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
            Suggestions ({suggestedSquareIds.size})
          </ButtonBase>
        )}

        <Box sx={{ flex: 1 }} />

        <ColorLegend mode={activeMode} bins={predBins} />
      </Box>
    </Box>
  )
}

function ColorLegend({ mode, bins }: { mode: ColorMode; bins: HeatmapBin[] }) {
  if (mode === 'cluster') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
        {CLUSTER_PALETTE.map((c) => (
          <Box
            key={c}
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: c,
            }}
          />
        ))}
      </Box>
    )
  }

  if (mode === 'prediction' && bins.length > 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ display: 'flex', gap: '1px' }}>
          {bins.map((bin) => (
            <Box
              key={bin.edge}
              sx={{
                width: 16,
                height: 6,
                backgroundColor: bin.color,
              }}
            />
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

export { HEATMAP_PALETTE }
