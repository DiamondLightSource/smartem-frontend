import { Box, Typography } from '@mui/material'
import { Link, useParams } from '@tanstack/react-router'
import { sessions } from '~/data/mock-dashboard'
import { getGrid, getGridSquare } from '~/data/mock-session-detail'
import { statusColors } from '~/theme'

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

function AtlasThumbnail() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" role="img" aria-label="Atlas">
      <rect width="28" height="28" rx="4" fill="#f0f2f4" />
      <circle cx="10" cy="10" r="3" fill="#656d76" opacity="0.5" />
      <circle cx="18" cy="12" r="2.5" fill="#656d76" opacity="0.5" />
      <circle cx="12" cy="19" r="2" fill="#656d76" opacity="0.5" />
      <circle cx="20" cy="20" r="2.5" fill="#656d76" opacity="0.5" />
      <circle cx="8" cy="15" r="1.5" fill="#656d76" opacity="0.3" />
    </svg>
  )
}

function SquareThumbnail() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" role="img" aria-label="Grid square">
      <rect width="28" height="28" rx="4" fill="#f0f2f4" />
      <rect
        x="4"
        y="4"
        width="20"
        height="20"
        rx="2"
        fill="none"
        stroke="#656d76"
        strokeWidth="1"
        opacity="0.4"
      />
      <circle cx="10" cy="10" r="2" fill="#656d76" opacity="0.4" />
      <circle cx="18" cy="10" r="2" fill="#656d76" opacity="0.4" />
      <circle cx="14" cy="17" r="2" fill="#656d76" opacity="0.4" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="#8b949e" role="img" aria-label="Navigate">
      <path
        d="M4.5 2.5L8 6l-3.5 3.5"
        stroke="#8b949e"
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
  const sessionId = (params as Record<string, string>).sessionId
  const gridId = (params as Record<string, string>).gridId
  const squareId = (params as Record<string, string>).squareId

  const session = sessions.find((s) => s.id === sessionId)
  if (!session) return null

  const color = statusColorMap[session.status] ?? '#656d76'
  const isRunning = session.status === 'running'

  const grid = gridId ? getGrid(gridId) : undefined
  const square = squareId ? getGridSquare(squareId) : undefined

  return (
    <Box
      sx={{
        height: 40,
        display: 'flex',
        alignItems: 'center',
        px: 2,
        gap: 1.5,
        backgroundColor: '#f6f8fa',
        borderBottom: '1px solid',
        borderColor: 'divider',
        flexShrink: 0,
      }}
    >
      <Link to="/sessions/$sessionId" params={{ sessionId }} style={{ textDecoration: 'none' }}>
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
            to="/sessions/$sessionId/grids/$gridId/atlas"
            params={{ sessionId, gridId }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              textDecoration: 'none',
              borderRadius: 4,
              padding: '2px 4px',
            }}
          >
            <AtlasThumbnail />
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
              to="/sessions/$sessionId/grids/$gridId/squares/$squareId"
              params={{ sessionId, gridId, squareId }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                textDecoration: 'none',
                borderRadius: 4,
                padding: '2px 4px',
              }}
            >
              <SquareThumbnail />
              <Typography
                variant="caption"
                sx={{ fontSize: '0.625rem', color: 'text.secondary', fontWeight: 500 }}
              >
                {square?.gridsquareId ?? squareId}
              </Typography>
            </Link>
          </>
        )}
      </Box>
    </Box>
  )
}
