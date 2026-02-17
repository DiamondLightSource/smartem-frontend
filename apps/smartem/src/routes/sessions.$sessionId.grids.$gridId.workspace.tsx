import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { WorkspaceView } from '~/components/workspace/WorkspaceView'
import { getGrid, getGridSquares } from '~/data/mock-session-detail'

export const Route = createFileRoute('/sessions/$sessionId/grids/$gridId/workspace')({
  component: WorkspaceRoute,
})

function WorkspaceRoute() {
  const { sessionId, gridId } = Route.useParams()
  const navigate = useNavigate()
  const grid = getGrid(gridId)
  const squares = getGridSquares(gridId)

  if (!grid) return null

  return (
    <WorkspaceView
      grid={grid}
      squares={squares}
      onSquareClick={(squareUuid) => {
        navigate({
          to: '/sessions/$sessionId/grids/$gridId/squares/$squareId',
          params: { sessionId, gridId, squareId: squareUuid },
        })
      }}
    />
  )
}
