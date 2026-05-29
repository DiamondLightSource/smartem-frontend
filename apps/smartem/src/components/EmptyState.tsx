import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { gray } from '~/theme'

interface Props {
  title: string
  detail?: ReactNode
  height?: number | string
}

// Placeholder shown where a real-API path is not yet wired. The goal is to
// make gaps loudly visible during the mock-to-real migration so they cannot
// be confused with empty data.
export function EmptyState({ title, detail, height = '100%' }: Props) {
  return (
    <Box
      sx={{
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        p: 3,
        textAlign: 'center',
        backgroundColor: gray[50],
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
        {title}
      </Typography>
      {detail && (
        <Typography variant="caption" sx={{ color: 'text.disabled', maxWidth: 480 }}>
          {detail}
        </Typography>
      )}
    </Box>
  )
}
