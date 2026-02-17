import { Box } from '@mui/material'
import type { InstrumentStatus } from '~/data/mock-dashboard'

const ledColor: Record<InstrumentStatus, string> = {
  running: '#33aa77',
  idle: '#4488ff',
  paused: '#cc9900',
  error: '#ee4444',
  offline: '#666',
}

interface MicroscopeIconProps {
  status: InstrumentStatus
  scale?: number
}

export function MicroscopeIcon({ status, scale = 1 }: MicroscopeIconProps) {
  const w = 110 * scale
  const isOff = status === 'offline'
  const led = ledColor[status]

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: w,
        opacity: isOff ? 0.35 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {/* Chamfer / tapered top */}
      <Box
        sx={{
          width: w * 0.818,
          height: 14 * scale,
          background: 'linear-gradient(#c0c6cc, #b4bac2)',
          clipPath: 'polygon(8% 100%, 92% 100%, 80% 0%, 20% 0%)',
        }}
      />
      {/* Upper panel */}
      <Box
        sx={{
          width: w,
          height: 140 * scale,
          background: 'linear-gradient(90deg, #a8aeb6, #c8ced6 20%, #d2d8de, #c8ced6 80%, #a8aeb6)',
          borderRight: `${2 * scale}px solid #9096a0`,
          borderBottom: `${2 * scale}px solid #9096a0`,
          borderLeft: `${2 * scale}px solid #9096a0`,
          borderTop: 'none',
          borderRadius: `0 0 ${2 * scale}px ${2 * scale}px`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '50%',
            width: '1px',
            height: '100%',
            background: 'rgba(0,0,0,0.06)',
          },
        }}
      >
        {/* THERMO logo */}
        <Box
          component="span"
          sx={{
            position: 'absolute',
            top: `${8 * scale}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: '"Segoe UI", system-ui, sans-serif',
            fontSize: `${7 * scale}px`,
            fontWeight: 700,
            letterSpacing: `${2 * scale}px`,
            color: '#8a9099',
            opacity: 0.6,
            lineHeight: 1,
          }}
        >
          THERMO
        </Box>
      </Box>
      {/* Seam */}
      <Box
        sx={{
          width: w,
          height: 3 * scale,
          background: 'linear-gradient(90deg, #7a8088, #9aa0a8, #7a8088)',
          borderRight: `${1 * scale}px solid #6a7078`,
          borderBottom: `${1 * scale}px solid #6a7078`,
          borderLeft: `${1 * scale}px solid #6a7078`,
          borderTop: 'none',
        }}
      />
      {/* Lower section */}
      <Box
        sx={{
          width: w,
          height: 100 * scale,
          background: 'linear-gradient(90deg, #4a5058, #5c636b 20%, #636a72, #5c636b 80%, #4a5058)',
          borderRight: `${2 * scale}px solid #3a4048`,
          borderBottom: `${2 * scale}px solid #3a4048`,
          borderLeft: `${2 * scale}px solid #3a4048`,
          borderTop: 'none',
          borderRadius: `0 0 ${4 * scale}px ${4 * scale}px`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Screen inset */}
        <Box
          sx={{
            position: 'absolute',
            top: `${12 * scale}px`,
            left: `${12 * scale}px`,
            right: `${12 * scale}px`,
            height: 40 * scale,
            background: 'linear-gradient(#3a4048, #2e343c)',
            borderRadius: `${3 * scale}px`,
            border: `${1 * scale}px solid #2a3038`,
            '&::after': {
              content: '""',
              position: 'absolute',
              top: `${8 * scale}px`,
              right: `${10 * scale}px`,
              width: 5 * scale,
              height: 5 * scale,
              background: led,
              borderRadius: '50%',
              boxShadow: isOff ? 'none' : `0 0 ${4 * scale}px ${led}`,
              transition: 'background 0.3s, box-shadow 0.3s',
            },
          }}
        />
        {/* Vent grilles */}
        <Box
          sx={{
            position: 'absolute',
            bottom: `${8 * scale}px`,
            left: `${12 * scale}px`,
            right: `${12 * scale}px`,
            height: 24 * scale,
            background: `repeating-linear-gradient(0deg, transparent, transparent ${2.5 * scale}px, #3a4048 ${2.5 * scale}px, #3a4048 ${4 * scale}px)`,
            borderRadius: `${2 * scale}px`,
            opacity: 0.5,
          }}
        />
      </Box>
      {/* Shadow */}
      <Box
        sx={{
          width: w * 1.18,
          height: 16 * scale,
          borderRadius: '50%',
          background: 'radial-gradient(rgba(0,0,0,0.25) 0%, transparent 70%)',
          mt: `-${4 * scale}px`,
          opacity: isOff ? 0.08 : 0.18,
        }}
      />
    </Box>
  )
}
