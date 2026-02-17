import { Box, Typography } from '@mui/material'
import { useState } from 'react'
import type { MockGridSquare } from '~/data/mock-session-detail'
import { statusColors } from '~/theme'

function qualityColor(q: number): string {
  if (q >= 0.7) return statusColors.running
  if (q >= 0.4) return statusColors.paused
  return statusColors.error
}

interface AtlasMapProps {
  squares: MockGridSquare[]
  gridName: string
  onSquareClick: (squareUuid: string) => void
}

export function AtlasMap({ squares, gridName, onSquareClick }: AtlasMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const hoveredSquare = hoveredId ? squares.find((s) => s.uuid === hoveredId) : null

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
          viewBox="0 0 4005 4005"
          role="img"
          aria-label="Atlas map showing grid squares"
          style={{
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            background: '#f0f2f4',
            borderRadius: 4,
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
          }}
        >
          {squares.map((sq) => {
            const isHovered = hoveredId === sq.uuid
            const fill = qualityColor(sq.quality)
            const opacity = isHovered ? 1.0 : sq.selected ? 0.8 : 0.5
            return (
              <circle
                key={sq.uuid}
                role="button"
                tabIndex={0}
                cx={sq.centerX}
                cy={sq.centerY}
                r={sq.sizeWidth / 2}
                fill={fill}
                opacity={opacity}
                stroke={isHovered ? '#1f2328' : 'none'}
                strokeWidth={isHovered ? 8 : 0}
                style={{ cursor: 'pointer', transition: 'opacity 0.1s' }}
                onMouseEnter={() => setHoveredId(sq.uuid)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSquareClick(sq.uuid)}
              />
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
          {gridName}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {squares.length} squares
        </Typography>
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
