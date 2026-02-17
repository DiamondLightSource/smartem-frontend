import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AtlasMap } from '~/components/spatial/AtlasMap'
import { getGrid, getGridSquares } from '~/data/mock-session-detail'

export const Route = createFileRoute('/sessions/$sessionId/grids/$gridId/atlas')({
  component: AtlasView,
})

function AtlasView() {
  const { sessionId, gridId } = Route.useParams()
  const navigate = useNavigate()
  const grid = getGrid(gridId)
  const squares = getGridSquares(gridId)

  return (
    <AtlasMap
      squares={squares}
      gridName={grid?.name ?? gridId}
      onSquareClick={(squareUuid) => {
        navigate({
          to: '/sessions/$sessionId/grids/$gridId/squares/$squareId',
          params: { sessionId, gridId, squareId: squareUuid },
        })
      }}
    />
  )
}
