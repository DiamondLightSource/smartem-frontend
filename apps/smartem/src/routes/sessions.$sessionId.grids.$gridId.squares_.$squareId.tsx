import { createFileRoute } from '@tanstack/react-router'
import { SquareMap } from '~/components/spatial/SquareMap'
import { getFoilHoles, getGridSquare } from '~/data/mock-session-detail'

export const Route = createFileRoute('/sessions/$sessionId/grids/$gridId/squares_/$squareId')({
  component: SquareDetailView,
})

function SquareDetailView() {
  const { squareId } = Route.useParams()
  const square = getGridSquare(squareId)
  const foilholes = getFoilHoles(squareId)

  return <SquareMap foilholes={foilholes} squareLabel={square?.gridsquareId ?? squareId} />
}
