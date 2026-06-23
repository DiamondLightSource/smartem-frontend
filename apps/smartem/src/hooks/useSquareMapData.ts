import {
  getGetPredictionForGridsquarePredictionModelPredictionModelNameGridsquareGridsquareUuidPredictionGetQueryOptions as squarePredictionQueryOptions,
  useGetGridsquareFoilholesGridsquaresGridsquareUuidFoilholesGet,
  useGetGridsquareGridsquaresGridsquareUuidGet,
  useGetOverallPredictionForGridsquareGridsquareGridsquareUuidOverallPredictionGet,
  useGetPredictionModelsPredictionModelsGet,
  useGetGridsquareImageGridsquaresGridsquareUuidGridsquareImageGet as useGridsquareImage,
  useGetSuggestedHoleCollectionsGridsquaresGridsquareUuidPredictionModelPredictionModelNameLatentRepLatentRepModelNameSuggestedHolesGet as useSuggestedHoles,
} from '@smartem/api'
import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { PredictionLayer } from '~/components/spatial/SquareMap'
import {
  foilHoleResponseToMock,
  foilholePredictionMap,
  gridSquareResponseToMock,
  overallOrderMap,
  overallPredictionMap,
} from '~/data/api-adapters'
import type { MockFoilHole } from '~/data/mock-session-detail'
import { useBlobObjectUrl } from './useBlobObjectUrl'
import { useImageNaturalSize } from './useImageNaturalSize'

export interface SquareMapData {
  squareLabel: string
  foilholes: MockFoilHole[]
  imageUrl?: string
  imageLoading: boolean
  imageWidth?: number
  imageHeight?: number
  predictionLayers: PredictionLayer[]
  predictionValues: Record<string, Map<string, number>>
  suggestedHoleIds: Set<string>
  // foilhole uuid -> suggested grid-wide acquisition index (1-based; unranked holes are absent).
  orderByFoilhole: Map<string, number>
}

// Fetches everything SquareMap needs for one gridsquare: foilhole geometry, the authenticated
// micrograph blob, per-model + overall prediction overlays, and the suggested-holes set. Shared
// by the full-page square view and the atlas-embedded preview panel so both stay in sync.
export function useSquareMapData(squareId: string): SquareMapData {
  const { data: squareResponse } = useGetGridsquareGridsquaresGridsquareUuidGet(squareId)
  const { data: foilholeResponses } =
    useGetGridsquareFoilholesGridsquaresGridsquareUuidFoilholesGet(squareId)
  const { data: modelResponses } = useGetPredictionModelsPredictionModelsGet()
  const { data: overallResponse } =
    useGetOverallPredictionForGridsquareGridsquareGridsquareUuidOverallPredictionGet(squareId)
  // Image route is auth-protected; fetch as an authenticated blob and hand the <image> element an
  // object URL rather than a token-less direct URL.
  const { data: squareImageBlob, isLoading: squareImageLoading } = useGridsquareImage(squareId)
  const imageUrl = useBlobObjectUrl(squareImageBlob as Blob | undefined)
  // "Pending" spans the blob fetch plus the extra tick useBlobObjectUrl needs to mint the object
  // URL, so the overlay doesn't briefly flash in between the two.
  const imageLoading = squareImageLoading || (!!squareImageBlob && !imageUrl)
  const naturalSize = useImageNaturalSize(imageUrl)

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

  // Assemble the selectable prediction layers (each model that returned data, plus the cross-model
  // "overall") and their foilhole -> value maps for the square map overlay.
  const { predictionLayers, predictionValues } = useMemo(() => {
    const layers: PredictionLayer[] = []
    const values: Record<string, Map<string, number>> = {}
    models.forEach((m, i) => {
      const map = foilholePredictionMap(predictionResults[i]?.data ?? [])
      if (map.size > 0) {
        layers.push({ id: m.name, label: m.name })
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

  // Foilholes the system suggests collecting next. Mirrors the atlas suggested-squares endpoint: it
  // needs a prediction model and a separate latent-rep model, but the API doesn't expose model
  // types, so default to the first model for prediction and the second (if any) for the latent
  // representation. Proper model-type distinction is tracked in #111.
  const predictionModelName = models[0]?.name ?? ''
  const latentModelName = models[1]?.name ?? models[0]?.name ?? ''
  const { data: suggestedHoles } = useSuggestedHoles(
    squareId,
    predictionModelName,
    latentModelName,
    { query: { enabled: !!predictionModelName } }
  )
  const suggestedHoleIds = useMemo(
    () => new Set((suggestedHoles ?? []).map((h) => h.uuid)),
    [suggestedHoles]
  )

  // Reuse the overall-prediction response (already fetched for the "Overall" overlay) for the
  // acquisition-order path; no extra request.
  const orderByFoilhole = useMemo(() => overallOrderMap(overallResponse ?? []), [overallResponse])

  return {
    squareLabel: square?.gridsquareId ?? squareId,
    foilholes,
    imageUrl,
    imageLoading,
    imageWidth: naturalSize?.width,
    imageHeight: naturalSize?.height,
    predictionLayers,
    predictionValues,
    suggestedHoleIds,
    orderByFoilhole,
  }
}
