import {
  useGetFoilholeFoilholesFoilholeUuidGet,
  useGetFoilholeMicrographsFoilholesFoilholeUuidMicrographsGet,
} from '@smartem/api'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { FoilholeDetail } from '~/components/foilhole/FoilholeDetail'
import { foilHoleResponseToMock, micrographResponseToMock } from '~/data/api-adapters'

export const Route = createFileRoute(
  '/acquisitions/$acquisitionId/grids/$gridId/squares_/$squareId/holes_/$holeId'
)({
  component: FoilholeView,
})

function FoilholeView() {
  const { acquisitionId, gridId, squareId, holeId } = Route.useParams()
  const navigate = useNavigate()
  const { data: foilholeResponse } = useGetFoilholeFoilholesFoilholeUuidGet(holeId)
  const { data: micrographResponses } =
    useGetFoilholeMicrographsFoilholesFoilholeUuidMicrographsGet(holeId)

  const micrographs = useMemo(
    () => (micrographResponses ?? []).map(micrographResponseToMock),
    [micrographResponses]
  )
  const foilhole = useMemo(() => {
    if (!foilholeResponse) return null
    const adapted = foilHoleResponseToMock(foilholeResponse)
    // micrographCount is not in the API's FoilHoleResponse; derive it from the
    // sibling micrographs query we already make so the metadata panel matches
    // what the grid of cards renders.
    return { ...adapted, micrographCount: micrographs.length }
  }, [foilholeResponse, micrographs])

  if (!foilhole) return null

  return (
    <FoilholeDetail
      foilhole={foilhole}
      micrographs={micrographs}
      onBack={() =>
        navigate({
          to: '/acquisitions/$acquisitionId/grids/$gridId/squares/$squareId',
          params: { acquisitionId, gridId, squareId },
        })
      }
    />
  )
}
