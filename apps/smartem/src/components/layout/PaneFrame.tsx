import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { gray } from '~/theme'

// Shared footer-height floor for the two-column panes. Both columns' footers pin to it so their control
// bars line up the same way the header bars do; the frame owns this so panes can't drift apart.
export const PANE_FOOTER_MIN_HEIGHT = 60

interface PaneFrameProps {
  // Header title (bold, single line). `titleMuted` greys it for placeholder panes (e.g. "no selection").
  title: ReactNode
  subtitle?: ReactNode
  titleMuted?: boolean
  // 3px accent strip down the left of the header; defaults to a neutral grey.
  accentColor?: string
  // Right-aligned header slot for icon buttons (expand, close, ...).
  actions?: ReactNode
  // Footer content; the frame supplies the height floor, top border and centring, the caller the layout.
  // Omit for an empty footer bar (kept so the pane stays symmetric with its neighbour).
  footer?: ReactNode
  // Canvas colour for the body (e.g. dark matting behind a micrograph). Omit for the default surface.
  bodyBackground?: string
  children: ReactNode
}

// Generic frame for a two-column-view pane: a fixed-height titled header, a flexible body, and a
// fixed-floor footer. Composing this (rather than re-implementing the chrome per pane) keeps every pane's
// header and footer aligned with its neighbour structurally instead of by hand.
export function PaneFrame({
  title,
  subtitle,
  titleMuted,
  accentColor = gray[400],
  actions,
  footer,
  bodyBackground,
  children,
}: PaneFrameProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.5,
          py: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: gray[50],
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: '3px',
            alignSelf: 'stretch',
            minHeight: 20,
            borderRadius: 1,
            backgroundColor: accentColor,
          }}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="caption"
            noWrap
            sx={{
              fontWeight: 700,
              display: 'block',
              lineHeight: 1.25,
              color: titleMuted ? 'text.secondary' : 'text.primary',
            }}
          >
            {title}
          </Typography>
          {subtitle != null && (
            <Typography
              variant="caption"
              sx={{ color: titleMuted ? 'text.disabled' : 'text.secondary', fontSize: '0.625rem' }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions}
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...(bodyBackground ? { backgroundColor: bodyBackground } : {}),
        }}
      >
        {children}
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          minHeight: PANE_FOOTER_MIN_HEIGHT,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {footer}
      </Box>
    </Box>
  )
}
