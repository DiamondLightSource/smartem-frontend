import {
  Box,
  ButtonBase,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Pagination,
  Select,
  Typography,
} from '@mui/material'
import type { GridSquareResponse } from '@smartem/api'
import {
  useGetGridAtlasImageGridsGridUuidAtlasImageGet as useAtlasCrop,
  useGetGridGridsquaresGridsGridUuidGridsquaresGet,
} from '@smartem/api'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'
import { useBlobObjectUrl } from '~/hooks/useBlobObjectUrl'
import { gray, statusColors } from '~/theme'

const COLUMN_OPTIONS = [2, 3, 4, 5]
// Page size is capped: every tile is a heavy server-side atlas crop, so a larger page means a larger
// simultaneous crop fan-out against the backend.
const PAGE_SIZE_OPTIONS = [9, 18, 36]

// Per-user persisted numeric preference, validated against an allow-list so a stale or garbage
// localStorage value can't wedge the layout.
function usePersistedNumber(
  key: string,
  fallback: number,
  allowed: number[]
): [number, (n: number) => void] {
  const [value, setValue] = useState<number>(() => {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
    const n = raw != null ? Number(raw) : Number.NaN
    return allowed.includes(n) ? n : fallback
  })
  const set = useCallback(
    (n: number) => {
      setValue(n)
      try {
        window.localStorage.setItem(key, String(n))
      } catch {
        // ignore storage failures (private mode, quota) - the in-memory value still applies
      }
    },
    [key]
  )
  return [value, set]
}

export const Route = createFileRoute('/acquisitions/$acquisitionId/grids/$gridId/squares/gallery')({
  component: SquareGalleryView,
})

// Physical area for the size sort; squares missing dimensions sort last (negative area).
function squareArea(s: GridSquareResponse): number {
  if (s.size_width == null || s.size_height == null) return -1
  return s.size_width * s.size_height
}

function SquareGalleryView() {
  const { acquisitionId, gridId } = Route.useParams()
  const navigate = useNavigate()
  const {
    data: squares,
    isLoading,
    error,
  } = useGetGridGridsquaresGridsGridUuidGridsquaresGet(gridId)
  const [page, setPage] = useState(1)
  const [collectedOnly, setCollectedOnly] = useState(false)
  const [columns, setColumns] = usePersistedNumber('smartem.gallery.columns', 3, COLUMN_OPTIONS)
  const [pageSize, setPageSize] = usePersistedNumber(
    'smartem.gallery.pageSize',
    9,
    PAGE_SIZE_OPTIONS
  )

  const sorted = useMemo(() => {
    const list = (squares ?? []).filter((s) => (collectedOnly ? s.image_path != null : true))
    return [...list].sort((a, b) => squareArea(b) - squareArea(a))
  }, [squares, collectedOnly])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visible = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          rowGap: 1,
          flexWrap: 'wrap',
          px: 2,
          py: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={collectedOnly}
              onChange={(e) => {
                setCollectedOnly(e.target.checked)
                setPage(1)
              }}
              sx={{ p: 0.5 }}
            />
          }
          label={<Typography variant="caption">Collected only</Typography>}
          sx={{ mr: 0 }}
        />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {sorted.length} squares
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Columns
          </Typography>
          {COLUMN_OPTIONS.map((c) => (
            <ButtonBase
              key={c}
              onClick={() => setColumns(c)}
              aria-label={`${c} columns`}
              sx={{
                minWidth: 22,
                px: 0.75,
                py: 0.25,
                borderRadius: 0.5,
                fontSize: '0.6875rem',
                fontWeight: c === columns ? 600 : 400,
                color: c === columns ? 'text.primary' : 'text.secondary',
                backgroundColor: c === columns ? gray[100] : 'transparent',
                '&:hover': { backgroundColor: gray[100] },
              }}
            >
              {c}
            </ButtonBase>
          ))}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Per page
          </Typography>
          <Select
            size="small"
            variant="standard"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
            sx={{ fontSize: '0.6875rem', '& .MuiSelect-select': { py: 0.25, pr: 2.5 } }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <MenuItem key={n} value={n} sx={{ fontSize: '0.75rem' }}>
                {n}
              </MenuItem>
            ))}
          </Select>
        </Box>
        {pageCount > 1 && (
          <Pagination
            size="small"
            count={pageCount}
            page={currentPage}
            onChange={(_, v) => setPage(v)}
          />
        )}
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {visible.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No grid squares to show.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 2 }}>
            {visible.map((sq) => (
              <SquareThumbnail
                key={sq.uuid}
                gridId={gridId}
                square={sq}
                onClick={() =>
                  navigate({
                    to: '/acquisitions/$acquisitionId/grids/$gridId/squares/$squareId',
                    params: { acquisitionId, gridId, squareId: sq.uuid },
                  })
                }
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}

// One gallery tile: an authenticated atlas crop (object URL, like the other image views) over a
// checkered placeholder, the square label, and a collected dot. The crop reads from the grid atlas,
// which exists regardless of whether this square's own micrograph was collected.
function SquareThumbnail({
  gridId,
  square,
  onClick,
}: {
  gridId: string
  square: GridSquareResponse
  onClick: () => void
}) {
  const params = useMemo(
    () => ({ x: square.center_x, y: square.center_y, w: square.size_width, h: square.size_height }),
    [square.center_x, square.center_y, square.size_width, square.size_height]
  )
  const hasGeometry =
    square.center_x != null &&
    square.center_y != null &&
    square.size_width != null &&
    square.size_height != null
  const { data: blob, isLoading } = useAtlasCrop(gridId, params, {
    query: { enabled: hasGeometry },
  })
  const imageUrl = useBlobObjectUrl(blob as Blob | undefined)
  const collected = square.image_path != null

  return (
    <Box
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick()
      }}
      role="button"
      tabIndex={0}
      sx={{
        cursor: 'pointer',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
        backgroundColor: 'background.paper',
        transition: 'border-color 0.1s, box-shadow 0.1s',
        '&:hover': { borderColor: 'primary.main', boxShadow: 1 },
      }}
    >
      <Box sx={{ position: 'relative', aspectRatio: '1 / 1', backgroundColor: gray[900] }}>
        {!imageUrl && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: `repeating-conic-gradient(${gray[200]} 0% 25%, ${gray[50]} 0% 50%) 50% / 16px 16px`,
            }}
          />
        )}
        {imageUrl && (
          <Box
            component="img"
            src={imageUrl}
            alt={`Grid square ${square.gridsquare_id}`}
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
        {isLoading && hasGeometry && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress size={20} />
          </Box>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1, py: 0.5 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {square.gridsquare_id}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Box
          title={collected ? 'Collected' : 'Not collected'}
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: collected ? statusColors.running : gray[300],
            flexShrink: 0,
          }}
        />
      </Box>
    </Box>
  )
}
