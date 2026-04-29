import {
  Box,
  CircularProgress,
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
import { useGetGridGridsquaresGridsGridUuidGridsquaresGet } from '@smartem/api'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { statusColors } from '~/theme'

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
          {sorted.map((sq) => (
            <TableRow
              key={sq.uuid}
              hover
              sx={{ cursor: 'pointer' }}
              onClick={() =>
                navigate({
                  to: '/acquisitions/$acquisitionId/grids/$gridId/squares/$squareId',
                  params: { acquisitionId, gridId, squareId: sq.uuid },
                })
              }
            >
              <TableCell>
                <Typography variant="body2" fontWeight={500}>
                  {sq.gridsquare_id}
                </Typography>
              </TableCell>
              <TableCell>
                <StatusLabel status={sq.status} />
              </TableCell>
              <TableCell>
                <Typography variant="body2" color={sq.selected ? 'text.primary' : 'text.disabled'}>
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
          ))}
        </TableBody>
      </Table>
    </TableContainer>
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
