import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { FoilholeDetail } from '~/components/foilhole/FoilholeDetail'
import { getFoilHole, getMicrographs } from '~/data/mock-session-detail'

export const Route = createFileRoute(
  '/acquisitions/$acquisitionId/grids/$gridId/squares_/$squareId/holes_/$holeId'
)({
  component: FoilholeView,
})

function FoilholeView() {
  const { acquisitionId, gridId, squareId, holeId } = Route.useParams()
  const navigate = useNavigate()
  const foilhole = getFoilHole(holeId)
  const micrographs = getMicrographs(holeId)

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
