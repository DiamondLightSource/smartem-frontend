import { Box, Typography } from '@mui/material'
import { useMemo } from 'react'
import { AtlasMap } from '~/components/spatial/AtlasMap'
import type { MockGrid, MockGridSquare } from '~/data/mock-session-detail'
import { statusColors } from '~/theme'
import { qualityColor } from '~/utils/heatmap'

interface WorkspaceViewProps {
  grid: MockGrid
  squares: MockGridSquare[]
  onSquareClick: (squareUuid: string) => void
}

export function WorkspaceView({ grid, squares, onSquareClick }: WorkspaceViewProps) {
  const qualityBins = useMemo(() => {
    const bins = Array(10).fill(0) as number[]
    for (const sq of squares) {
      const idx = Math.min(9, Math.floor(sq.quality * 10))
      bins[idx]++
    }
    return bins
  }, [squares])

  const maxBin = Math.max(1, ...qualityBins)

  const statusCounts = useMemo(() => {
    const counts = { registered: 0, collected: 0, completed: 0 }
    for (const sq of squares) {
      counts[sq.status]++
    }
    return counts
  }, [squares])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'auto',
        p: 2,
        gap: 2,
      }}
    >
      {/* Top row: Atlas + Squares summary */}
      <Box sx={{ display: 'flex', gap: 2, minHeight: 300 }}>
        {/* Atlas panel */}
        <Panel title="Atlas" sx={{ flex: 1 }}>
          <AtlasMap squares={squares} gridName={grid.name} onSquareClick={onSquareClick} />
        </Panel>

        {/* Squares summary */}
        <Panel title="Squares Summary" sx={{ flex: 1 }}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
              <StatBlock label="Total" value={squares.length} />
              <StatBlock
                label="Completed"
                value={statusCounts.completed}
                color={statusColors.running}
              />
              <StatBlock
                label="Collected"
                value={statusCounts.collected}
                color={statusColors.paused}
              />
              <StatBlock
                label="Registered"
                value={statusCounts.registered}
                color={statusColors.offline}
              />
            </Box>

            <Typography variant="h6" sx={{ mb: 1 }}>
              Top squares by quality
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {[...squares]
                .sort((a, b) => b.quality - a.quality)
                .slice(0, 8)
                .map((sq) => (
                  <Box
                    key={sq.uuid}
                    onClick={() => onSquareClick(sq.uuid)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      py: 0.5,
                      px: 1,
                      borderRadius: 0.5,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#f6f8fa' },
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: qualityColor(sq.quality),
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="caption" sx={{ fontWeight: 500, minWidth: 60 }}>
                      {sq.gridsquareId}
                    </Typography>
                    <Box
                      sx={{
                        flex: 1,
                        height: 4,
                        backgroundColor: '#e8eaed',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          width: `${Math.round(sq.quality * 100)}%`,
                          height: '100%',
                          backgroundColor: qualityColor(sq.quality),
                          borderRadius: 2,
                        }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{ fontVariantNumeric: 'tabular-nums', minWidth: 32, textAlign: 'right' }}
                    >
                      {Math.round(sq.quality * 100)}%
                    </Typography>
                  </Box>
                ))}
            </Box>
          </Box>
        </Panel>
      </Box>

      {/* Full-width: Quality distribution chart */}
      <Panel title="Quality Distribution">
        <Box sx={{ p: 2 }}>
          <svg
            viewBox="0 0 600 160"
            style={{ width: '100%', height: 'auto' }}
            role="img"
            aria-label="Quality distribution"
          >
            {qualityBins.map((count, i) => {
              const barW = 50
              const barH = (count / maxBin) * 120
              const x = 40 + i * 54
              const y = 130 - barH
              const midQ = (i + 0.5) / 10
              const binLabel = (i / 10).toFixed(1)
              return (
                <g key={binLabel}>
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={barH}
                    fill={qualityColor(midQ)}
                    opacity="0.7"
                    rx="2"
                  />
                  <text x={x + barW / 2} y={148} textAnchor="middle" fontSize="9" fill="#8b949e">
                    {(i / 10).toFixed(1)}
                  </text>
                  {count > 0 && (
                    <text
                      x={x + barW / 2}
                      y={y - 4}
                      textAnchor="middle"
                      fontSize="8"
                      fill="#656d76"
                    >
                      {count}
                    </text>
                  )}
                </g>
              )
            })}
            <line x1="40" y1="130" x2="580" y2="130" stroke="#d1d9e0" strokeWidth="1" />
          </svg>
        </Box>
      </Panel>
    </Box>
  )
}

function Panel({
  title,
  children,
  sx,
}: {
  title: string
  children: React.ReactNode
  sx?: Record<string, unknown>
}) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...sx,
      }}
    >
      <Box
        sx={{
          height: 28,
          display: 'flex',
          alignItems: 'center',
          px: 1.5,
          backgroundColor: '#f6f8fa',
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.6875rem' }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto' }}>{children}</Box>
    </Box>
  )
}

function StatBlock({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <Box>
      <Typography
        variant="h4"
        sx={{
          fontVariantNumeric: 'tabular-nums',
          color: color ?? 'text.primary',
        }}
      >
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
    </Box>
  )
}
