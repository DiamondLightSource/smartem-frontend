import { useNavigate } from '@tanstack/react-router'
import { useSquareMapData } from '~/hooks/useSquareMapData'
import { SquareMap } from './SquareMap'

interface SquarePreviewPanelProps {
  acquisitionId: string
  gridId: string
  squareId: string
  onClose: () => void
}

// The atlas-embedded grid-square preview (issue #68): clicking a square on the atlas locks it and
// fills this panel with the same SquareMap the full-page view uses, rendered in its "panel" variant -
// a header, the micrograph fitted to its aspect ratio at the top (aligned with the atlas), and the
// controls in the space below. The micrograph only loads while this panel is mounted (i.e. on an
// explicit click), never on hover - see the load-on-commit note on #68.
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
    orderByFoilhole,
  } = useSquareMapData(squareId)

  return (
    <SquareMap
      variant="panel"
      foilholes={foilholes}
      squareLabel={squareLabel}
      imageUrl={imageUrl}
      imageLoading={imageLoading}
      imageWidth={imageWidth}
      imageHeight={imageHeight}
      predictionLayers={predictionLayers}
      predictionValues={predictionValues}
      suggestedHoleIds={suggestedHoleIds}
      orderByFoilhole={orderByFoilhole}
      onClose={onClose}
      onExpand={() =>
        navigate({
          to: '/acquisitions/$acquisitionId/grids/$gridId/squares/$squareId',
          params: { acquisitionId, gridId, squareId },
        })
      }
      onFoilholeClick={(holeUuid) => {
        navigate({
          to: '/acquisitions/$acquisitionId/grids/$gridId/squares/$squareId/holes/$holeId',
          params: { acquisitionId, gridId, squareId, holeId: holeUuid },
        })
      }}
    />
  )
}
