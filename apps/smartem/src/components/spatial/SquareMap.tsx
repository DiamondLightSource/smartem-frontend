import { Box, Typography } from '@mui/material'
import { useState } from 'react'
import type { MockFoilHole } from '~/data/mock-session-detail'
import { statusColors } from '~/theme'

function qualityColor(q: number): string {
  if (q >= 0.7) return statusColors.running
  if (q >= 0.4) return statusColors.paused
  return statusColors.error
}

interface SquareMapProps {
  foilholes: MockFoilHole[]
  squareLabel: string
}

export function SquareMap({ foilholes, squareLabel }: SquareMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const hoveredHole = hoveredId ? foilholes.find((h) => h.uuid === hoveredId) : null
  const selectedHole = selectedId ? foilholes.find((h) => h.uuid === selectedId) : null

  const avgQuality =
    foilholes.length > 0 ? foilholes.reduce((sum, h) => sum + h.quality, 0) / foilholes.length : 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
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
        <svg
          viewBox="0 0 2880 2046"
          role="img"
          aria-label="Grid square map showing foilholes"
          style={{
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            background: '#e8eaed',
            borderRadius: 4,
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
          }}
        >
          {foilholes.map((fh) => {
            const isHovered = hoveredId === fh.uuid
            const isSelected = selectedId === fh.uuid
            const fill = qualityColor(fh.quality)
            const opacity = isHovered || isSelected ? 1.0 : 0.6
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
                stroke={fh.isNearGridBar ? '#656d76' : isHovered || isSelected ? '#1f2328' : 'none'}
                strokeWidth={fh.isNearGridBar ? 4 : isHovered || isSelected ? 4 : 0}
                strokeDasharray={fh.isNearGridBar ? '8 4' : 'none'}
                style={{ cursor: 'pointer', transition: 'opacity 0.1s' }}
                onMouseEnter={() => setHoveredId(fh.uuid)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setSelectedId((prev) => (prev === fh.uuid ? null : fh.uuid))}
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
            {hoveredHole.foilholeId} — {Math.round(hoveredHole.quality * 100)}%
            {hoveredHole.isNearGridBar && ' (near grid bar)'}
          </Box>
        )}
      </Box>

      {/* Bottom controls */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 2,
          py: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
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

        {selectedHole && (
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              ml: 1,
              pl: 1.5,
              borderLeft: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              {selectedHole.foilholeId}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {Math.round(selectedHole.quality * 100)}% quality
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
        <QualityLegend />
      </Box>
    </Box>
  )
}

function QualityLegend() {
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
