import { Box, Button, IconButton, Menu, MenuItem, Typography } from '@mui/material'
import { useCallback, useMemo, useState } from 'react'
import { AtlasMap } from '~/components/spatial/AtlasMap'
import type { MockGrid, MockGridSquare } from '~/data/mock-session-detail'
import { gray, statusColors } from '~/theme'
import { qualityColor } from '~/utils/heatmap'

interface WorkspaceViewProps {
  grid: MockGrid
  squares: MockGridSquare[]
  onSquareClick: (squareUuid: string) => void
}

type PanelId = 'atlas' | 'summary' | 'distribution'
const PANEL_TITLES: Record<PanelId, string> = {
  atlas: 'Atlas',
  summary: 'Squares Summary',
  distribution: 'Quality Distribution',
}
const ALL_PANELS: PanelId[] = ['atlas', 'summary', 'distribution']

// Per-user persisted id set (panel hidden/collapsed state), validated against an allow-list so a
// stale localStorage value can't reference a panel that no longer exists.
function usePersistedSet(
  key: string,
  allowed: string[]
): [Set<string>, (next: Set<string>) => void] {
  const [value, setValue] = useState<Set<string>>(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
      if (raw) return new Set((JSON.parse(raw) as string[]).filter((id) => allowed.includes(id)))
    } catch {
      // ignore parse/storage failures - start empty
    }
    return new Set()
  })
  const set = useCallback(
    (next: Set<string>) => {
      setValue(next)
      try {
        window.localStorage.setItem(key, JSON.stringify([...next]))
      } catch {
        // ignore storage failures - the in-memory value still applies
      }
    },
    [key]
  )
  return [value, set]
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

  const [hidden, setHidden] = usePersistedSet('smartem.workspace.hidden', ALL_PANELS)
  const [collapsed, setCollapsed] = usePersistedSet('smartem.workspace.collapsed', ALL_PANELS)
  const [addAnchor, setAddAnchor] = useState<null | HTMLElement>(null)

  const toggleCollapse = (id: PanelId) => {
    const next = new Set(collapsed)
    next.has(id) ? next.delete(id) : next.add(id)
    setCollapsed(next)
  }
  const removePanel = (id: PanelId) => {
    const next = new Set(hidden)
    next.add(id)
    setHidden(next)
  }
  const addPanel = (id: PanelId) => {
    const next = new Set(hidden)
    next.delete(id)
    setHidden(next)
    setAddAnchor(null)
  }

  const hiddenList = ALL_PANELS.filter((id) => hidden.has(id))
  const topVisible = (['atlas', 'summary'] as PanelId[]).filter((id) => !hidden.has(id))

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
      {/* Toolbar: compose which panels are shown. */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          Workspace
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Button
          size="small"
          variant="outlined"
          disabled={hiddenList.length === 0}
          onClick={(e) => setAddAnchor(e.currentTarget)}
          sx={{ fontSize: '0.75rem', py: 0.25 }}
        >
          + Add panel
        </Button>
        <Menu anchorEl={addAnchor} open={!!addAnchor} onClose={() => setAddAnchor(null)}>
          {hiddenList.map((id) => (
            <MenuItem key={id} onClick={() => addPanel(id)} sx={{ fontSize: '0.8125rem' }}>
              {PANEL_TITLES[id]}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* Top row: Atlas + Squares summary (each collapsible/removable). */}
      {topVisible.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          {!hidden.has('atlas') && (
            <Panel
              title="Atlas"
              collapsed={collapsed.has('atlas')}
              onToggleCollapse={() => toggleCollapse('atlas')}
              onRemove={() => removePanel('atlas')}
              sx={{ flex: 1, height: collapsed.has('atlas') ? 'auto' : 360 }}
            >
              <AtlasMap squares={squares} gridName={grid.name} onSquareClick={onSquareClick} />
            </Panel>
          )}

          {!hidden.has('summary') && (
            <Panel
              title="Squares Summary"
              collapsed={collapsed.has('summary')}
              onToggleCollapse={() => toggleCollapse('summary')}
              onRemove={() => removePanel('summary')}
              sx={{ flex: 1, height: collapsed.has('summary') ? 'auto' : 360 }}
            >
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
                          '&:hover': { backgroundColor: gray[100] },
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
                            backgroundColor: gray[200],
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
                          sx={{
                            fontVariantNumeric: 'tabular-nums',
                            minWidth: 32,
                            textAlign: 'right',
                          }}
                        >
                          {Math.round(sq.quality * 100)}%
                        </Typography>
                      </Box>
                    ))}
                </Box>
              </Box>
            </Panel>
          )}
        </Box>
      )}

      {/* Full-width: Quality distribution chart. */}
      {!hidden.has('distribution') && (
        <Panel
          title="Quality Distribution"
          collapsed={collapsed.has('distribution')}
          onToggleCollapse={() => toggleCollapse('distribution')}
          onRemove={() => removePanel('distribution')}
        >
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
                    <text
                      x={x + barW / 2}
                      y={148}
                      textAnchor="middle"
                      fontSize="9"
                      fill={gray[500]}
                    >
                      {(i / 10).toFixed(1)}
                    </text>
                    {count > 0 && (
                      <text
                        x={x + barW / 2}
                        y={y - 4}
                        textAnchor="middle"
                        fontSize="8"
                        fill={gray[600]}
                      >
                        {count}
                      </text>
                    )}
                  </g>
                )
              })}
              <line x1="40" y1="130" x2="580" y2="130" stroke={gray[300]} strokeWidth="1" />
            </svg>
          </Box>
        </Panel>
      )}

      {/* Everything hidden: prompt to re-add. */}
      {hidden.size === ALL_PANELS.length && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            All panels hidden — use "Add panel" to bring them back.
          </Typography>
        </Box>
      )}
    </Box>
  )
}

function Panel({
  title,
  collapsed,
  onToggleCollapse,
  onRemove,
  children,
  sx,
}: {
  title: string
  collapsed?: boolean
  onToggleCollapse?: () => void
  onRemove?: () => void
  children: React.ReactNode
  sx?: Record<string, unknown>
}) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
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
          gap: 0.5,
          px: 1,
          backgroundColor: gray[100],
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        {onToggleCollapse && (
          <IconButton
            size="small"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
            sx={{ p: 0.25 }}
          >
            <Chevron open={!collapsed} />
          </IconButton>
        )}
        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.6875rem' }}>
          {title}
        </Typography>
        <Box sx={{ flex: 1 }} />
        {onRemove && (
          <IconButton size="small" onClick={onRemove} aria-label="Remove panel" sx={{ p: 0.25 }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="M3 3l6 6M9 3l-6 6"
                stroke={gray[600]}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </IconButton>
        )}
      </Box>
      {!collapsed && <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>{children}</Box>}
    </Box>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="currentColor"
      role="img"
      aria-hidden="true"
      style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.12s' }}
    >
      <path d="M6 4l4 4-4 4V4z" />
    </svg>
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
