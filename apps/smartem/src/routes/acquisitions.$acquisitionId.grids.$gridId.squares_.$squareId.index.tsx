import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SquareMap } from '~/components/spatial/SquareMap'
import { getFoilHoles, getGridSquare } from '~/data/mock-session-detail'

export const Route = createFileRoute(
  '/acquisitions/$acquisitionId/grids/$gridId/squares_/$squareId/'
)({
  component: SquareIndexView,
})

function SquareIndexView() {
  const { acquisitionId, gridId, squareId } = Route.useParams()
  const navigate = useNavigate()
  const square = getGridSquare(squareId)
  const foilholes = getFoilHoles(squareId)

  return (
    <SquareMap
      foilholes={foilholes}
      squareLabel={square?.gridsquareId ?? squareId}
      onFoilholeClick={(holeUuid) => {
        navigate({
          to: '/acquisitions/$acquisitionId/grids/$gridId/squares/$squareId/holes/$holeId',
          params: { acquisitionId, gridId, squareId, holeId: holeUuid },
        })
      }}
    />
  )
}
