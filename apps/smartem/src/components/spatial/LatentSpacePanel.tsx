import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import type { MockLatentCoords } from '~/data/mock-session-detail'
import { CLUSTER_PALETTE } from '~/utils/heatmap'

interface LatentSpaceItem {
  id: string
  label: string
  latent: MockLatentCoords
  predictionValue?: number
}

interface LatentSpacePanelProps {
  items: LatentSpaceItem[]
  selectedId: string | null
  onItemClick?: (id: string) => void
  onItemHover?: (id: string | null) => void
}

export function LatentSpacePanel({
  items,
  selectedId,
  onItemClick,
  onItemHover,
}: LatentSpacePanelProps) {
  const [showUnselected, setShowUnselected] = useState(true)

  const { minX, maxX, minY, maxY } = useMemo(() => {
    if (items.length === 0) return { minX: -3, maxX: 3, minY: -3, maxY: 3 }
    let mnX = items[0].latent.x
    let mxX = items[0].latent.x
    let mnY = items[0].latent.y
    let mxY = items[0].latent.y
    for (const item of items) {
      if (item.latent.x < mnX) mnX = item.latent.x
      if (item.latent.x > mxX) mxX = item.latent.x
      if (item.latent.y < mnY) mnY = item.latent.y
      if (item.latent.y > mxY) mxY = item.latent.y
    }
    const padX = (mxX - mnX) * 0.1 || 0.5
    const padY = (mxY - mnY) * 0.1 || 0.5
    return { minX: mnX - padX, maxX: mxX + padX, minY: mnY - padY, maxY: mxY + padY }
  }, [items])

  const W = 400
  const H = 400
  const pad = { top: 10, right: 10, bottom: 10, left: 10 }
  const plotW = W - pad.left - pad.right
  const plotH = H - pad.top - pad.bottom

  const toSvgX = (x: number) => pad.left + ((x - minX) / (maxX - minX)) * plotW
  const toSvgY = (y: number) => pad.top + ((maxY - y) / (maxY - minY)) * plotH

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Latent space scatter plot"
          style={{
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            background: '#1f2328',
            borderRadius: 4,
          }}
        >
          {items.map((item) => {
            const isSelected = item.id === selectedId
            if (!showUnselected && !isSelected) return null
            const cx = toSvgX(item.latent.x)
            const cy = toSvgY(item.latent.y)
            const clusterColor = CLUSTER_PALETTE[item.latent.clusterIndex % CLUSTER_PALETTE.length]
            const r = item.predictionValue != null ? 3 + item.predictionValue * 5 : 5
            return (
              <circle
                key={item.id}
                role="button"
                tabIndex={0}
                cx={cx}
                cy={cy}
                r={isSelected ? r + 2 : r}
                fill={isSelected ? '#ffffff' : clusterColor}
                opacity={isSelected ? 1 : 0.75}
                stroke={isSelected ? '#ffffff' : 'none'}
                strokeWidth={isSelected ? 2 : 0}
                style={{ cursor: 'pointer', transition: 'r 0.15s, fill 0.15s' }}
                onClick={() => onItemClick?.(item.id)}
                onMouseEnter={() => onItemHover?.(item.id)}
                onMouseLeave={() => onItemHover?.(null)}
              />
            )
          })}
        </svg>
      </Box>

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
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          Latent Space
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {items.length} points
        </Typography>
        <Box sx={{ flex: 1 }} />
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={showUnselected}
              onChange={(e) => setShowUnselected(e.target.checked)}
              sx={{ p: 0.25 }}
            />
          }
          label={
            <Typography variant="caption" sx={{ fontSize: '0.625rem' }}>
              Show all
            </Typography>
          }
          sx={{ mr: 0 }}
        />
        <ClusterLegend />
      </Box>
    </Box>
  )
}

function ClusterLegend() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, ml: 1 }}>
      {CLUSTER_PALETTE.map((color) => (
        <Box
          key={color}
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: color,
          }}
        />
      ))}
    </Box>
  )
}
