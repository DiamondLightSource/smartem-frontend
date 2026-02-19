import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { WorkspaceView } from '~/components/workspace/WorkspaceView'
import { getGrid, getGridSquares } from '~/data/mock-session-detail'

export const Route = createFileRoute('/acquisitions/$acquisitionId/grids/$gridId/workspace')({
  component: WorkspaceRoute,
})

function WorkspaceRoute() {
  const { acquisitionId, gridId } = Route.useParams()
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
          to: '/acquisitions/$acquisitionId/grids/$gridId/squares/$squareId',
          params: { acquisitionId, gridId, squareId: squareUuid },
        })
      }}
    />
  )
}
