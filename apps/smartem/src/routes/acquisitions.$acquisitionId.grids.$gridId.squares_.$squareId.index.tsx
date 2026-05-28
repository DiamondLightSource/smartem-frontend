import {
  useGetGridsquareFoilholesGridsquaresGridsquareUuidFoilholesGet,
  useGetGridsquareGridsquaresGridsquareUuidGet,
} from '@smartem/api'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { SquareMap } from '~/components/spatial/SquareMap'
import { foilHoleResponseToMock, gridSquareResponseToMock } from '~/data/api-adapters'

export const Route = createFileRoute(
  '/acquisitions/$acquisitionId/grids/$gridId/squares_/$squareId/'
)({
  component: SquareIndexView,
})

function SquareIndexView() {
  const { acquisitionId, gridId, squareId } = Route.useParams()
  const navigate = useNavigate()
  const { data: squareResponse } = useGetGridsquareGridsquaresGridsquareUuidGet(squareId)
  const { data: foilholeResponses } =
    useGetGridsquareFoilholesGridsquaresGridsquareUuidFoilholesGet(squareId)

  const square = useMemo(
    () => (squareResponse ? gridSquareResponseToMock(squareResponse) : null),
    [squareResponse]
  )
  const foilholes = useMemo(
    () => (foilholeResponses ?? []).map(foilHoleResponseToMock),
    [foilholeResponses]
  )

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
