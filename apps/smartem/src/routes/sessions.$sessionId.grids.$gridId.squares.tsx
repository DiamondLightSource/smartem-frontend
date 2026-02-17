import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { getGridSquares, type MockGridSquare } from '~/data/mock-session-detail'
import { statusColors } from '~/theme'

export const Route = createFileRoute('/sessions/$sessionId/grids/$gridId/squares')({
  component: SquaresTable,
})

type SortField = 'quality' | 'foilholeCount' | 'gridsquareId'
type SortDir = 'asc' | 'desc'

function SquaresTable() {
  const { sessionId, gridId } = Route.useParams()
  const navigate = useNavigate()
  const squares = getGridSquares(gridId)

  const [sortField, setSortField] = useState<SortField>('quality')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const sorted = useMemo(() => {
    const arr = [...squares]
    arr.sort((a, b) => {
      let cmp = 0
      if (sortField === 'quality') cmp = a.quality - b.quality
      else if (sortField === 'foilholeCount') cmp = a.foilholeCount - b.foilholeCount
      else cmp = a.gridsquareId.localeCompare(b.gridsquareId)
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
            <TableCell>
              <TableSortLabel
                active={sortField === 'quality'}
                direction={sortField === 'quality' ? sortDir : 'desc'}
                onClick={() => handleSort('quality')}
              >
                Quality
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortField === 'foilholeCount'}
                direction={sortField === 'foilholeCount' ? sortDir : 'desc'}
                onClick={() => handleSort('foilholeCount')}
              >
                Foilholes
              </TableSortLabel>
            </TableCell>
            <TableCell>Defocus</TableCell>
            <TableCell>Magnification</TableCell>
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
                  to: '/sessions/$sessionId/grids/$gridId/squares/$squareId',
                  params: { sessionId, gridId, squareId: sq.uuid },
                })
              }
            >
              <TableCell>
                <Typography variant="body2" fontWeight={500}>
                  {sq.gridsquareId}
                </Typography>
              </TableCell>
              <TableCell>
                <StatusLabel status={sq.status} />
              </TableCell>
              <TableCell>
                <QualityCell value={sq.quality} />
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {sq.foilholeCount}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography
                  variant="body2"
                  sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.secondary' }}
                >
                  {sq.defocus != null ? `${sq.defocus} um` : '—'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography
                  variant="body2"
                  sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.secondary' }}
                >
                  {sq.magnification != null ? `${(sq.magnification / 1000).toFixed(0)}k` : '—'}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function StatusLabel({ status }: { status: MockGridSquare['status'] }) {
  const colorMap: Record<MockGridSquare['status'], string> = {
    completed: statusColors.running,
    collected: statusColors.paused,
    registered: statusColors.offline,
  }
  return (
    <Typography
      variant="caption"
      sx={{ color: colorMap[status], fontWeight: 500, fontSize: '0.6875rem' }}
    >
      {status}
    </Typography>
  )
}

function QualityCell({ value }: { value: number }) {
  const color =
    value >= 0.7 ? statusColors.running : value >= 0.4 ? statusColors.paused : statusColors.error
  const pct = Math.round(value * 100)
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        sx={{
          width: 40,
          height: 4,
          backgroundColor: '#e8eaed',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 2 }} />
      </Box>
      <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.75rem' }}>
        {pct}%
      </Typography>
    </Box>
  )
}
