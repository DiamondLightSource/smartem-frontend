import {
  Box,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material'
import type { GridSquareStatus } from '@smartem/api'
import {
  useGetGridGridsquaresGridsGridUuidGridsquaresGet,
  useGetGridsquareFoilholesGridsquaresGridsquareUuidFoilholesGet,
} from '@smartem/api'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Fragment, useMemo, useState } from 'react'
import { gray, statusColors } from '~/theme'

export const Route = createFileRoute('/acquisitions/$acquisitionId/grids/$gridId/squares')({
  component: SquaresTable,
})

type SortField = 'defocus' | 'magnification' | 'gridsquareId'
type SortDir = 'asc' | 'desc'

function SquaresTable() {
  const { acquisitionId, gridId } = Route.useParams()
  const navigate = useNavigate()
  const {
    data: squares,
    isLoading,
    error,
  } = useGetGridGridsquaresGridsGridUuidGridsquaresGet(gridId)

  const [sortField, setSortField] = useState<SortField>('gridsquareId')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggleExpanded = (uuid: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(uuid)) next.delete(uuid)
      else next.add(uuid)
      return next
    })
  }

  const sorted = useMemo(() => {
    const arr = [...(squares ?? [])]
    arr.sort((a, b) => {
      let cmp = 0
      if (sortField === 'defocus') cmp = (a.defocus ?? 0) - (b.defocus ?? 0)
      else if (sortField === 'magnification') cmp = (a.magnification ?? 0) - (b.magnification ?? 0)
      else cmp = a.gridsquare_id.localeCompare(b.gridsquare_id)
      return sortDir === 'desc' ? -cmp : cmp
    })
    return arr
  }, [squares, sortField, sortDir])

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="error">
          Failed to load grid squares
        </Typography>
      </Box>
    )
  }

  return (
    <TableContainer sx={{ height: '100%', overflow: 'auto' }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 36 }} />
            <TableCell>
              <TableSortLabel
                active={sortField === 'gridsquareId'}
                direction={sortField === 'gridsquareId' ? sortDir : 'asc'}
                onClick={() => handleSort('gridsquareId')}
              >
                ID
              </TableSortLabel>
            </TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Selected</TableCell>
            <TableCell>
              <TableSortLabel
                active={sortField === 'defocus'}
                direction={sortField === 'defocus' ? sortDir : 'desc'}
                onClick={() => handleSort('defocus')}
              >
                Defocus
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortField === 'magnification'}
                direction={sortField === 'magnification' ? sortDir : 'desc'}
                onClick={() => handleSort('magnification')}
              >
                Magnification
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((sq) => {
            const isOpen = expanded.has(sq.uuid)
            return (
              <Fragment key={sq.uuid}>
                <TableRow
                  hover
                  sx={{
                    cursor: 'pointer',
                    '& > td': { borderBottom: isOpen ? 'none' : undefined },
                  }}
                  onClick={() =>
                    navigate({
                      to: '/acquisitions/$acquisitionId/grids/$gridId/squares/$squareId',
                      params: { acquisitionId, gridId, squareId: sq.uuid },
                    })
                  }
                >
                  <TableCell sx={{ width: 36, pr: 0 }}>
                    <IconButton
                      size="small"
                      aria-label={isOpen ? 'Collapse foilholes' : 'Expand foilholes'}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleExpanded(sq.uuid)
                      }}
                      sx={{ p: 0.25 }}
                    >
                      <Chevron open={isOpen} />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {sq.gridsquare_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusLabel status={sq.status} />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color={sq.selected ? 'text.primary' : 'text.disabled'}
                    >
                      {sq.selected ? 'Yes' : 'No'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.secondary' }}
                    >
                      {sq.defocus != null ? `${sq.defocus} um` : '--'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.secondary' }}
                    >
                      {sq.magnification != null ? `${(sq.magnification / 1000).toFixed(0)}k` : '--'}
                    </Typography>
                  </TableCell>
                </TableRow>
                {isOpen && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 0, backgroundColor: gray[50] }}>
                      <FoilholeSubTable squareUuid={sq.uuid} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

// Lazily loaded when a square row is expanded: its foilholes with a weighted aggregate
// (mean predicted quality) and a per-foilhole table sortable by quality.
function FoilholeSubTable({ squareUuid }: { squareUuid: string }) {
  const { data: foilholes, isLoading } =
    useGetGridsquareFoilholesGridsquaresGridsquareUuidFoilholesGet(squareUuid)
  const [dir, setDir] = useState<SortDir>('desc')

  const rows = useMemo(() => {
    const arr = [...(foilholes ?? [])]
    arr.sort((a, b) => {
      const cmp = (a.quality ?? 0) - (b.quality ?? 0)
      return dir === 'desc' ? -cmp : cmp
    })
    return arr
  }, [foilholes, dir])

  if (isLoading) {
    return (
      <Box sx={{ p: 1.5 }}>
        <CircularProgress size={16} />
      </Box>
    )
  }

  if (rows.length === 0) {
    return (
      <Typography variant="caption" sx={{ color: 'text.disabled', p: 1.5, display: 'block' }}>
        No foilholes recorded for this square.
      </Typography>
    )
  }

  const qualities = rows.map((r) => r.quality).filter((q): q is number => q != null)
  const avg = qualities.length > 0 ? qualities.reduce((s, q) => s + q, 0) / qualities.length : null

  return (
    <Box sx={{ pl: 6, pr: 2, py: 1 }}>
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        {rows.length} foilholes
        {avg != null ? ` · weighted quality ${Math.round(avg * 100)}%` : ''}
      </Typography>
      <Table size="small" sx={{ mt: 0.5, maxWidth: 460 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ py: 0.25 }}>Foilhole</TableCell>
            <TableCell sx={{ py: 0.25 }}>
              <TableSortLabel
                active
                direction={dir}
                onClick={() => setDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              >
                Quality
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ py: 0.25 }}>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((fh) => (
            <TableRow key={fh.uuid}>
              <TableCell sx={{ py: 0.25 }}>
                <Typography variant="caption">
                  {fh.foilhole_id}
                  {fh.is_near_grid_bar ? ' · grid bar' : ''}
                </Typography>
              </TableCell>
              <TableCell sx={{ py: 0.25 }}>
                <Typography variant="caption" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {fh.quality != null ? `${Math.round(fh.quality * 100)}%` : '--'}
                </Typography>
              </TableCell>
              <TableCell sx={{ py: 0.25 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {fh.status}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
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

const statusColorMap: Record<GridSquareStatus, string> = {
  none: statusColors.offline,
  'all foil holes registered': statusColors.idle,
  'foil holes decision started': statusColors.paused,
  'foil holes decision completed': statusColors.running,
}

const statusLabelMap: Record<GridSquareStatus, string> = {
  none: 'None',
  'all foil holes registered': 'Holes registered',
  'foil holes decision started': 'Deciding',
  'foil holes decision completed': 'Completed',
}

function StatusLabel({ status }: { status: GridSquareStatus | null }) {
  const s = status ?? 'none'
  return (
    <Typography
      variant="caption"
      sx={{ color: statusColorMap[s], fontWeight: 500, fontSize: '0.6875rem' }}
    >
      {statusLabelMap[s]}
    </Typography>
  )
}
