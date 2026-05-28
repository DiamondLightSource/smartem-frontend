import {
  useGetGridGridsGridUuidGet,
  useGetGridGridsquaresGridsGridUuidGridsquaresGet,
} from '@smartem/api'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { WorkspaceView } from '~/components/workspace/WorkspaceView'
import { gridResponseToMock, gridSquareResponseToMock } from '~/data/api-adapters'

export const Route = createFileRoute('/acquisitions/$acquisitionId/grids/$gridId/workspace')({
  component: WorkspaceRoute,
})

function WorkspaceRoute() {
  const { acquisitionId, gridId } = Route.useParams()
  const navigate = useNavigate()
  const { data: gridResponse } = useGetGridGridsGridUuidGet(gridId)
  const { data: squareResponses } = useGetGridGridsquaresGridsGridUuidGridsquaresGet(gridId)

  const grid = useMemo(
    () => (gridResponse ? gridResponseToMock(gridResponse) : null),
    [gridResponse]
  )
  const squares = useMemo(
    () => (squareResponses ?? []).map(gridSquareResponseToMock),
    [squareResponses]
  )

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
