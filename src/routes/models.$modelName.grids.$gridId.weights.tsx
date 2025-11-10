import { Container, ThemeProvider } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'
import React from 'react'

import type { QualityPredictionModelWeight } from '../api/generated/models/qualityPredictionModelWeight'
import { apiUrl } from '../api/mutator'
import { Navbar } from '../components/navbar'
import { theme } from '../components/theme'
import { TimeSeriesChart } from '../components/timeseries'

function PredictionModelWeights() {
  const { modelName, gridId } = Route.useParams()
  const [result, setResult] = React.useState<QualityPredictionModelWeight[] | null>(null)

  React.useEffect(() => {
    const fetchData = async () => {
      const models = await fetch(
        `${apiUrl()}/prediction_models/${modelName}/grids/${gridId}/weights`
      )
      const data = await models.json()
      setResult(data)
    }
    fetchData()
  }, [modelName, gridId])
  return (
    <div>
      <ThemeProvider theme={theme}>
        <Navbar />
        <Container component="main" content="center" style={{ width: '100%', paddingTop: '50px' }}>
          {result ? (
            <TimeSeriesChart
              xData={result.map((elem: QualityPredictionModelWeight) => {
                return Date.parse(elem.timestamp ?? '')
              })}
              yData={result.map((elem: QualityPredictionModelWeight) => {
                return elem.weight
              })}
            />
          ) : (
            <TimeSeriesChart xData={[]} yData={[]} />
          )}
        </Container>
      </ThemeProvider>
    </div>
  )
}

export const Route = createFileRoute('/models/$modelName/grids/$gridId/weights')({
  component: PredictionModelWeights,
})
