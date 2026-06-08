import {
  getGetPredictionForGridsquarePredictionModelPredictionModelNameGridsquareGridsquareUuidPredictionGetQueryOptions as squarePredictionQueryOptions,
  useGetGridsquareFoilholesGridsquaresGridsquareUuidFoilholesGet,
  useGetGridsquareGridsquaresGridsquareUuidGet,
  useGetOverallPredictionForGridsquareGridsquareGridsquareUuidOverallPredictionGet,
  useGetPredictionModelsPredictionModelsGet,
  useGetGridsquareImageGridsquaresGridsquareUuidGridsquareImageGet as useGridsquareImage,
} from '@smartem/api'
import { useQueries } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { type PredictionLayer, SquareMap } from '~/components/spatial/SquareMap'
import {
  foilHoleResponseToMock,
  foilholePredictionMap,
  gridSquareResponseToMock,
  overallPredictionMap,
} from '~/data/api-adapters'
import { useBlobObjectUrl } from '~/hooks/useBlobObjectUrl'

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
  const { data: modelResponses } = useGetPredictionModelsPredictionModelsGet()
  const { data: overallResponse } =
    useGetOverallPredictionForGridsquareGridsquareGridsquareUuidOverallPredictionGet(squareId)
  // Image route is auth-protected; fetch as an authenticated blob and hand the
  // <image> element an object URL rather than a token-less direct URL.
  const { data: squareImageBlob } = useGridsquareImage(squareId)
  const squareImageUrl = useBlobObjectUrl(squareImageBlob as Blob | undefined)

  const square = useMemo(
    () => (squareResponse ? gridSquareResponseToMock(squareResponse) : null),
    [squareResponse]
  )
  const foilholes = useMemo(
    () => (foilholeResponses ?? []).map(foilHoleResponseToMock),
    [foilholeResponses]
  )

  const models = useMemo(() => modelResponses ?? [], [modelResponses])

  // One per-foilhole prediction query per model, scoped to this gridsquare.
  const predictionResults = useQueries({
    queries: models.map((m) => squarePredictionQueryOptions(m.name, squareId)),
  })

  // Assemble the selectable prediction layers (each model that returned data, plus the
  // cross-model "overall") and their foilhole -> value maps for the square map overlay.
  const { predictionLayers, predictionValues } = useMemo(() => {
    const layers: PredictionLayer[] = []
    const values: Record<string, Map<string, number>> = {}
    models.forEach((m, i) => {
      const map = foilholePredictionMap(predictionResults[i]?.data ?? [])
      if (map.size > 0) {
        layers.push({ id: m.name, label: m.name.split('-')[0] })
        values[m.name] = map
      }
    })
    if (overallResponse?.length) {
      const overall = overallPredictionMap(overallResponse)
      if (overall.size > 0) {
        layers.push({ id: 'overall', label: 'Overall' })
        values.overall = overall
      }
    }
    return { predictionLayers: layers, predictionValues: values }
  }, [models, predictionResults, overallResponse])

  return (
    <SquareMap
      foilholes={foilholes}
      squareLabel={square?.gridsquareId ?? squareId}
      imageUrl={squareImageUrl}
      predictionLayers={predictionLayers}
      predictionValues={predictionValues}
      onFoilholeClick={(holeUuid) => {
        navigate({
          to: '/acquisitions/$acquisitionId/grids/$gridId/squares/$squareId/holes/$holeId',
          params: { acquisitionId, gridId, squareId, holeId: holeUuid },
        })
      }}
    />
  )
}
