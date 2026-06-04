import {
  getGetPredictionForGridPredictionModelPredictionModelNameGridGridUuidPredictionGetQueryOptions as gridPredictionQueryOptions,
  useGetPredictionModelsPredictionModelsGet,
} from '@smartem/api'
import { useQueries } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { PredictionsView } from '~/components/predictions/PredictionsView'
import {
  predictionModelResponseToMock,
  predictionResponsesToMockPredictions,
} from '~/data/api-adapters'

export const Route = createFileRoute('/acquisitions/$acquisitionId/grids/$gridId/predictions')({
  component: PredictionsRoute,
})

function PredictionsRoute() {
  const { gridId } = Route.useParams()
  const { data: modelResponses } = useGetPredictionModelsPredictionModelsGet()
  const models = useMemo(
    () => (modelResponses ?? []).map(predictionModelResponseToMock),
    [modelResponses]
  )

  const predictionResults = useQueries({
    queries: models.map((m) => gridPredictionQueryOptions(m.id, gridId)),
  })

  const predictions = useMemo(
    () =>
      models.map((m, i) =>
        predictionResponsesToMockPredictions(m.id, gridId, predictionResults[i]?.data ?? [])
      ),
    [models, gridId, predictionResults]
  )

  return <PredictionsView models={models} predictions={predictions} />
}
