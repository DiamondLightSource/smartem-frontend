import { useGetPredictionModelsPredictionModelsGet } from '@smartem/api'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { PredictionsView } from '~/components/predictions/PredictionsView'
import { predictionModelResponseToMock } from '~/data/api-adapters'
import type { MockModelPredictions } from '~/data/mock-session-detail'

export const Route = createFileRoute('/acquisitions/$acquisitionId/grids/$gridId/predictions')({
  component: PredictionsRoute,
})

// Time-series prediction data per (model, grid) is fetched from the per-square /
// per-foilhole quality-prediction endpoints; that wiring is a separate concern.
// Until then, render the view with a real model list and an empty predictions array
// so the picker is functional but charts are empty.
const NO_PREDICTIONS: MockModelPredictions[] = []

function PredictionsRoute() {
  const { data: modelResponses } = useGetPredictionModelsPredictionModelsGet()
  const models = useMemo(
    () => (modelResponses ?? []).map(predictionModelResponseToMock),
    [modelResponses]
  )

  return <PredictionsView models={models} predictions={NO_PREDICTIONS} />
}
