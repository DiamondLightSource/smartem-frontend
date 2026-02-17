import { Box, ButtonBase, FormControlLabel, Switch, Typography } from '@mui/material'
import { useCallback, useMemo, useState } from 'react'
import type {
  MockGridSquare,
  MockModelPredictions,
  MockPredictionModel,
} from '~/data/mock-session-detail'
import { statusColors } from '~/theme'
import {
  CLUSTER_PALETTE,
  computeHeatmapBins,
  HEATMAP_PALETTE,
  type HeatmapBin,
  qualityColor,
  valueToHeatmapColor,
} from '~/utils/heatmap'

type ColorMode = 'quality' | 'prediction' | 'cluster'

interface AtlasMapProps {
  squares: MockGridSquare[]
  gridName: string
  onSquareClick: (squareUuid: string) => void
  predictions?: MockModelPredictions[]
  models?: MockPredictionModel[]
  selectedSquareId?: string | null
  onSquareHover?: (squareUuid: string | null) => void
  frozenSelection?: boolean
  onFreezeToggle?: () => void
}

export function AtlasMap({
  squares,
  gridName,
  onSquareClick,
  predictions,
  models,
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
  const [selectedModelId, setSelectedModelId] = useState(models?.[0]?.id ?? '')
  const [colorMode, setColorMode] = useState<ColorMode>('quality')

  const frozen = externalFrozen ?? internalFrozen
  const selectedId = externalSelectedId ?? internalFrozenId
  const hoveredId = internalHoveredId

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
        if (val != null) return valueToHeatmapColor(val, predBins) ?? '#656d76'
        return '#656d76'
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
        {/* Image placeholder background */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-conic-gradient(#e8eaed 0% 25%, #f0f2f4 0% 50%) 50% / 20px 20px',
            borderRadius: 1,
          }}
        />
        <svg
          viewBox="0 0 4005 4005"
          role="img"
          aria-label="Atlas map showing grid squares"
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
          {squares.map((sq) => {
            const isHovered = hoveredId === sq.uuid
            const isSelected = selectedId === sq.uuid
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
                stroke={isSelected ? '#e59344' : isHovered ? '#1f2328' : 'none'}
                strokeWidth={isSelected ? 12 : isHovered ? 8 : 0}
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
        </svg>

        {/* Tooltip */}
        {hoveredSquare && (
          <Box
            sx={{
              position: 'absolute',
              left: tooltipPos.x + 12,
              top: tooltipPos.y - 30,
              backgroundColor: '#1f2328',
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

      {/* Controls bar */}
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
          {gridName}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {squares.length} squares
        </Typography>

        {frozen && (
          <Typography
            variant="caption"
            sx={{
              color: statusColors.paused,
              fontWeight: 500,
              fontSize: '0.625rem',
            }}
          >
            selection locked
          </Typography>
        )}

        <Box sx={{ flex: 1 }} />

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
                      backgroundColor: m.id === selectedModelId ? '#f0f2f4' : 'transparent',
                      '&:hover': { backgroundColor: '#f6f8fa' },
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
              backgroundColor: colorMode === 'cluster' ? '#f0f2f4' : 'transparent',
              '&:hover': { backgroundColor: '#f6f8fa' },
            }}
          >
            Clusters
          </ButtonBase>
        )}

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
