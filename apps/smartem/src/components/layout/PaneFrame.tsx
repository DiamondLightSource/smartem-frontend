import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { gray } from '~/theme'

// Shared footer height for the two-column panes. It is sized to hold the tallest footer (the grid-square
// panel's two rows) so every pane's footer settles at the same height and its content can be top-aligned
// across the columns. The frame owns this so the panes can't drift apart.
export const PANE_FOOTER_MIN_HEIGHT = 72

interface PaneFrameProps {
  // Header title (bold, single line). `titleMuted` greys it for placeholder panes (e.g. "no selection").
  title: ReactNode
  subtitle?: ReactNode
  titleMuted?: boolean
  // Right-aligned header slot for icon buttons (expand, close, ...).
  actions?: ReactNode
  // Footer content; the frame supplies the height, top border and top-alignment, the caller the layout.
  // Omit for an empty footer bar (kept so the pane stays symmetric with its neighbour).
  footer?: ReactNode
  // Canvas colour for the body (e.g. dark matting behind a micrograph). Omit for the default surface.
  bodyBackground?: string
  children: ReactNode
}

// Generic frame for a two-column-view pane: a fixed-height titled header, a flexible body, and a
// fixed-height footer. Composing this (rather than re-implementing the chrome per pane) keeps every pane's
// header and footer aligned with its neighbour structurally instead of by hand. Header title and footer
// content share the same left margin (px 1.5) so the chrome reads as one consistent indent.
export function PaneFrame({
  title,
  subtitle,
  titleMuted,
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
              noWrap
              sx={{
                display: 'block',
                color: titleMuted ? 'text.disabled' : 'text.secondary',
                fontSize: '0.625rem',
              }}
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
          justifyContent: 'flex-start',
        }}
      >
        {footer}
      </Box>
    </Box>
  )
}
