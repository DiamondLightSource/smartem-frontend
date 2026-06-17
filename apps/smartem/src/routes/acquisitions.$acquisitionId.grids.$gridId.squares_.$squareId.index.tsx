import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SquareMap } from '~/components/spatial/SquareMap'
import { useSquareMapData } from '~/hooks/useSquareMapData'

export const Route = createFileRoute(
  '/acquisitions/$acquisitionId/grids/$gridId/squares_/$squareId/'
)({
  component: SquareIndexView,
})

function SquareIndexView() {
  const { acquisitionId, gridId, squareId } = Route.useParams()
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
  )
}
