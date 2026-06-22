import { Typography } from '@mui/material'
import { PaneFrame } from '~/components/layout/PaneFrame'
import { gray } from '~/theme'

// Placeholder shown in the persistent right-hand panel before any grid square is selected. Composes the
// shared PaneFrame so it lines up (header / canvas / footer) with the atlas pane and is replaced in place
// by the real grid-square panel without the layout shifting.
export function EmptySquarePanel() {
  return (
    <PaneFrame title="Grid square" subtitle="None selected" titleMuted bodyBackground={gray[900]}>
      <Typography variant="caption" sx={{ color: gray[500], px: 3, textAlign: 'center' }}>
        Click a square on the atlas to preview it
      </Typography>
    </PaneFrame>
  )
}
