import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SquareMap } from '~/components/spatial/SquareMap'
import { getFoilHoles, getGridSquare } from '~/data/mock-session-detail'

export const Route = createFileRoute('/sessions/$sessionId/grids/$gridId/squares_/$squareId/')({
  component: SquareIndexView,
})

function SquareIndexView() {
  const { sessionId, gridId, squareId } = Route.useParams()
  const navigate = useNavigate()
  const square = getGridSquare(squareId)
  const foilholes = getFoilHoles(squareId)

  return (
    <SquareMap
      foilholes={foilholes}
      squareLabel={square?.gridsquareId ?? squareId}
      onFoilholeClick={(holeUuid) => {
        navigate({
          to: '/sessions/$sessionId/grids/$gridId/squares/$squareId/holes/$holeId',
          params: { sessionId, gridId, squareId, holeId: holeUuid },
        })
      }}
    />
  )
}
