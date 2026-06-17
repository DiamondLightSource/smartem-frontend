import { Box, IconButton, Tooltip, Typography } from '@mui/material'
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
// never on hover - see the load-on-commit note on #68.
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
    predictionLayers,
    predictionValues,
    suggestedHoleIds,
  } = useSquareMapData(squareId)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          height: 28,
          backgroundColor: gray[100],
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.6875rem' }}>
          Grid Square
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', fontSize: '0.6875rem', minWidth: 0 }}
          noWrap
        >
          {squareLabel}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Tooltip title="Open full square view" placement="bottom">
          <IconButton
            onClick={() =>
              navigate({
                to: '/acquisitions/$acquisitionId/grids/$gridId/squares/$squareId',
                params: { acquisitionId, gridId, squareId },
              })
            }
            size="small"
            sx={{ p: 0.25 }}
            aria-label="Open full square view"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M6 3h7v7M13 3l-7 7M11 9v4H3V5h4"
                stroke={gray[600]}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </IconButton>
        </Tooltip>
        <CloseButton onClick={onClose} />
      </Box>
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <SquareMap
          foilholes={foilholes}
          squareLabel={squareLabel}
          imageUrl={imageUrl}
          imageLoading={imageLoading}
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
      </Box>
    </Box>
  )
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <IconButton
      onClick={onClick}
      size="small"
      sx={{ p: 0.25 }}
      aria-label="Close grid square panel"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M3 3l6 6M9 3l-6 6" stroke={gray[600]} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </IconButton>
  )
}
