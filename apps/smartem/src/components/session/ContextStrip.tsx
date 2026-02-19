import { Box, Typography } from '@mui/material'
import { Link, useParams } from '@tanstack/react-router'
import { sessions } from '~/data/mock-dashboard'
import {
  getFoilHole,
  getFoilHoles,
  getGrid,
  getGridSquare,
  getGridSquares,
} from '~/data/mock-session-detail'
import { gray, statusColors } from '~/theme'
import { qualityColor } from '~/utils/heatmap'

function StatusDot({ color, pulse }: { color: string; pulse?: boolean }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
        ...(pulse && {
          boxShadow: `0 0 0 0 ${color}60`,
          animation: 'ctxPulse 2s ease-in-out infinite',
          '@keyframes ctxPulse': {
            '0%, 100%': { boxShadow: `0 0 0 0 ${color}60` },
            '50%': { boxShadow: `0 0 0 3px ${color}00` },
          },
        }),
      }}
    />
  )
}

function formatDuration(startTime: string, endTime: string | null): string {
  const start = new Date(startTime).getTime()
  const end = endTime ? new Date(endTime).getTime() : Date.now()
  const hours = Math.floor((end - start) / 3_600_000)
  const mins = Math.floor(((end - start) % 3_600_000) / 60_000)
  if (hours === 0) return `${mins}m`
  return `${hours}h ${mins}m`
}

const statusLabelMap: Record<string, string> = {
  running: 'Running',
  paused: 'Paused',
  completed: 'Completed',
  abandoned: 'Abandoned',
}

const statusColorMap: Record<string, string> = {
  running: statusColors.running,
  paused: statusColors.paused,
  completed: statusColors.idle,
  abandoned: statusColors.error,
}

function AtlasThumbnail({ gridUuid }: { gridUuid: string }) {
  const squares = getGridSquares(gridUuid)
  return (
    <svg width="28" height="28" viewBox="0 0 4005 4005" fill="none" role="img" aria-label="Atlas">
      <rect width="4005" height="4005" rx="200" fill={gray[50]} />
      {squares.map((sq) => (
        <circle
          key={sq.uuid}
          cx={sq.centerX}
          cy={sq.centerY}
          r={sq.sizeWidth / 2}
          fill={qualityColor(sq.quality)}
          opacity={sq.selected ? 0.8 : 0.4}
        />
      ))}
    </svg>
  )
}

function SquareThumbnail({
  squareUuid,
  highlightHoleUuid,
}: {
  squareUuid: string
  highlightHoleUuid?: string
}) {
  const foilholes = getFoilHoles(squareUuid)
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 2880 2046"
      fill="none"
      role="img"
      aria-label="Grid square"
    >
      <rect width="2880" height="2046" rx="100" fill={gray[50]} />
      {foilholes.map((fh) => (
        <circle
          key={fh.uuid}
          cx={fh.xLocation}
          cy={fh.yLocation}
          r={fh.diameter / 2}
          fill={highlightHoleUuid === fh.uuid ? statusColors.idle : qualityColor(fh.quality)}
          opacity={highlightHoleUuid === fh.uuid ? 1.0 : 0.5}
        />
      ))}
    </svg>
  )
}

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

export function ContextStrip() {
  const params = useParams({ strict: false })
  const acquisitionId = (params as Record<string, string>).acquisitionId
  const gridId = (params as Record<string, string>).gridId
  const squareId = (params as Record<string, string>).squareId
  const holeId = (params as Record<string, string>).holeId

  const session = sessions.find((s) => s.id === acquisitionId)
  if (!session) return null

  const color = statusColorMap[session.status] ?? gray[600]
  const isRunning = session.status === 'running'

  const grid = gridId ? getGrid(gridId) : undefined
  const square = squareId ? getGridSquare(squareId) : undefined
  const foilhole = holeId ? getFoilHole(holeId) : undefined

  return (
    <Box
      sx={{
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
      }}
    >
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
          {session.name}
        </Typography>
      </Link>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <StatusDot color={color} pulse={isRunning} />
        <Typography variant="caption" sx={{ color, fontWeight: 500, fontSize: '0.6875rem' }}>
          {statusLabelMap[session.status] ?? session.status}
        </Typography>
      </Box>

      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6875rem' }}>
        {formatDuration(session.startTime, session.endTime)}
      </Typography>

      <Box sx={{ flex: 1 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {gridId && (
          <Link
            to="/acquisitions/$acquisitionId/grids/$gridId/atlas"
            params={{ acquisitionId, gridId }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              textDecoration: 'none',
              borderRadius: 4,
              padding: '2px 4px',
            }}
          >
            <AtlasThumbnail gridUuid={gridId} />
            <Typography
              variant="caption"
              sx={{ fontSize: '0.625rem', color: 'text.secondary', fontWeight: 500 }}
            >
              {grid?.name ?? gridId}
            </Typography>
          </Link>
        )}

        {squareId && gridId && (
          <>
            <ChevronRight />
            <Link
              to="/acquisitions/$acquisitionId/grids/$gridId/squares/$squareId"
              params={{ acquisitionId, gridId, squareId }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                textDecoration: 'none',
                borderRadius: 4,
                padding: '2px 4px',
              }}
            >
              <SquareThumbnail squareUuid={squareId} highlightHoleUuid={holeId} />
              <Typography
                variant="caption"
                sx={{ fontSize: '0.625rem', color: 'text.secondary', fontWeight: 500 }}
              >
                {square?.gridsquareId ?? squareId}
              </Typography>
            </Link>
          </>
        )}

        {holeId && squareId && gridId && (
          <>
            <ChevronRight />
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                borderRadius: 0.5,
                px: 0.5,
                py: 0.25,
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: foilhole ? qualityColor(foilhole.quality) : gray[600],
                }}
              />
              <Typography
                variant="caption"
                sx={{ fontSize: '0.625rem', color: 'text.secondary', fontWeight: 500 }}
              >
                {foilhole?.foilholeId ?? holeId}
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Box>
  )
}
