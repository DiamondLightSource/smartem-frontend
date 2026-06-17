import { Box, IconButton, Tooltip } from '@mui/material'
import { useNavigate } from '@tanstack/react-router'
import { useSquareMapData } from '~/hooks/useSquareMapData'
import { gray } from '~/theme'
import { SquareMap } from './SquareMap'

interface SquarePreviewPanelProps {
  acquisitionId: string
  gridId: string
  squareId: string
  onClose: () => void
}

// The atlas-embedded grid-square preview (issue #68): clicking a square on the atlas locks it and
// fills this panel with the same SquareMap the full-page view uses, so the square sits alongside
// the atlas. The micrograph only loads while this panel is mounted (i.e. on an explicit click),
// never on hover - see the load-on-commit note on #68. Framed to match the atlas (image fills the
// panel + a bottom control bar); the controls float top-right so both image areas line up at the
// top.
export function SquarePreviewPanel({
  acquisitionId,
  gridId,
  squareId,
  onClose,
}: SquarePreviewPanelProps) {
  const navigate = useNavigate()
  const {
    foilholes,
    squareLabel,
    imageUrl,
    imageLoading,
    imageWidth,
    imageHeight,
    predictionLayers,
    predictionValues,
    suggestedHoleIds,
  } = useSquareMapData(squareId)

  return (
    <Box sx={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      <SquareMap
        foilholes={foilholes}
        squareLabel={squareLabel}
        imageUrl={imageUrl}
        imageLoading={imageLoading}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        predictionLayers={predictionLayers}
        predictionValues={predictionValues}
        suggestedHoleIds={suggestedHoleIds}
        onFoilholeClick={(holeUuid) => {
          navigate({
            to: '/acquisitions/$acquisitionId/grids/$gridId/squares/$squareId/holes/$holeId',
            params: { acquisitionId, gridId, squareId, holeId: holeUuid },
          })
        }}
      />

      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 5, display: 'flex', gap: 0.5 }}>
        <Tooltip title="Open full square view" placement="bottom">
          <IconButton
            onClick={() =>
              navigate({
                to: '/acquisitions/$acquisitionId/grids/$gridId/squares/$squareId',
                params: { acquisitionId, gridId, squareId },
              })
            }
            size="small"
            sx={floatingButtonSx}
            aria-label="Open full square view"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M6 3h7v7M13 3l-7 7M11 9v4H3V5h4"
                stroke={gray[700]}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </IconButton>
        </Tooltip>
        <Tooltip title="Close grid square" placement="bottom">
          <IconButton
            onClick={onClose}
            size="small"
            sx={floatingButtonSx}
            aria-label="Close grid square panel"
          >
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="M3 3l6 6M9 3l-6 6"
                stroke={gray[700]}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}

const floatingButtonSx = {
  p: 0.5,
  backgroundColor: '#ffffff',
  border: '1px solid',
  borderColor: 'divider',
  '&:hover': { backgroundColor: gray[100] },
} as const
