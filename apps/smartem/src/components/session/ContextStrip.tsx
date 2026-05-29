import { Box, Typography } from '@mui/material'
import { Link, useParams } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { gray } from '~/theme'

// Inline check (rather than the re-export in ~/data/mock-mode) so Vite's
// parse-time substitution constant-folds the lazy import away in live builds
// and Rollup drops the entire MockContextStrip chunk.
const MockContextStrip =
  import.meta.env.VITE_ENABLE_MOCKS === 'true' ? lazy(() => import('./MockContextStrip')) : null

const stripSx = {
  height: 40,
  display: 'flex',
  alignItems: 'center',
  px: 2,
  gap: 1.5,
  backgroundColor: 'background.paper',
  borderRadius: 1,
  border: '1px solid',
  borderColor: 'divider',
  flexShrink: 0,
} as const

const segmentSx = { color: 'text.secondary', fontSize: '0.6875rem', fontWeight: 500 } as const

function ChevronRight() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill={gray[500]}
      role="img"
      aria-label="Navigate"
    >
      <path
        d="M4.5 2.5L8 6l-3.5 3.5"
        stroke={gray[500]}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LiveContextStrip() {
  const params = useParams({ strict: false })
  const acquisitionId = (params as Record<string, string>).acquisitionId
  const gridId = (params as Record<string, string>).gridId
  const squareId = (params as Record<string, string>).squareId
  const holeId = (params as Record<string, string>).holeId

  if (!acquisitionId) return null

  return (
    <Box sx={stripSx}>
      <Link
        to="/acquisitions/$acquisitionId"
        params={{ acquisitionId }}
        style={{ textDecoration: 'none' }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {acquisitionId}
        </Typography>
      </Link>
      <Box sx={{ flex: 1 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        {gridId && (
          <Link
            to="/acquisitions/$acquisitionId/grids/$gridId/atlas"
            params={{ acquisitionId, gridId }}
            style={{ textDecoration: 'none' }}
          >
            <Typography variant="caption" sx={segmentSx}>
              {gridId}
            </Typography>
          </Link>
        )}
        {squareId && gridId && (
          <>
            <ChevronRight />
            <Link
              to="/acquisitions/$acquisitionId/grids/$gridId/squares/$squareId"
              params={{ acquisitionId, gridId, squareId }}
              style={{ textDecoration: 'none' }}
            >
              <Typography variant="caption" sx={segmentSx}>
                {squareId}
              </Typography>
            </Link>
          </>
        )}
        {holeId && squareId && gridId && (
          <>
            <ChevronRight />
            <Typography variant="caption" sx={segmentSx}>
              {holeId}
            </Typography>
          </>
        )}
      </Box>
    </Box>
  )
}

export function ContextStrip() {
  if (MockContextStrip) {
    return (
      <Suspense fallback={null}>
        <MockContextStrip />
      </Suspense>
    )
  }
  return <LiveContextStrip />
}
