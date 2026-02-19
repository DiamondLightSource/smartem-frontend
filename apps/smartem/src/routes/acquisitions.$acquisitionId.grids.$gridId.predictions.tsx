import { createFileRoute } from '@tanstack/react-router'
import { PredictionsView } from '~/components/predictions/PredictionsView'
import { getGridPredictions, getPredictionModels } from '~/data/mock-session-detail'

export const Route = createFileRoute('/acquisitions/$acquisitionId/grids/$gridId/predictions')({
  component: PredictionsRoute,
})

function PredictionsRoute() {
  const { gridId } = Route.useParams()
  const models = getPredictionModels()
  const predictions = getGridPredictions(gridId)

  return <PredictionsView models={models} predictions={predictions} />
}
