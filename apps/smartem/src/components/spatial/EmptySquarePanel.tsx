import { Box, Typography } from '@mui/material'
import { gray } from '~/theme'
import { SPATIAL_FOOTER_MIN_HEIGHT } from './layout'

// Placeholder shown in the persistent right-hand panel before any grid square is selected. It mirrors
// the SquareMap "panel" frame (matching header height + dark viewer canvas + footer bar) so the layout
// does not shift, and stays symmetric with the atlas pane, before a square is clicked - the panel is
// simply populated in place.
export function EmptySquarePanel() {
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
            backgroundColor: gray[300],
          }}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="caption"
            noWrap
            sx={{ fontWeight: 700, display: 'block', lineHeight: 1.25, color: 'text.secondary' }}
          >
            Grid square
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.625rem' }}>
            None selected
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: gray[900],
          px: 3,
          textAlign: 'center',
        }}
      >
        <Typography variant="caption" sx={{ color: gray[500] }}>
          Click a square on the atlas to preview it
        </Typography>
      </Box>

      {/* Empty footer bar matching the atlas footer height/border so the two panes stay symmetric
          (header / canvas / footer) before any square is selected; populated once one is picked. */}
      <Box
        sx={{
          minHeight: SPATIAL_FOOTER_MIN_HEIGHT,
          borderTop: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      />
    </Box>
  )
}
