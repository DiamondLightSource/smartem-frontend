import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import {
  Avatar,
  Container,
  FormControlLabel,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Switch,
  ThemeProvider,
} from '@mui/material'
import { LineChart } from '@mui/x-charts'
import React from 'react'
import { useParams } from 'react-router'

import type { QualityPredictionModelWeight } from '../api/generated/models/qualityPredictionModelWeight'
import { apiUrl } from '../api/mutator'
import { Navbar } from '../components/navbar'
import { theme } from '../components/theme'
import { TimeSeriesChart } from '../components/timeseries'
import type { Route } from './+types/predictionModelWeights'

export default function PredictionModelWeights() {
  const params = useParams()
  const [result, setResult] = React.useState<QualityPredictionModelWeight[] | null>(null)

  React.useEffect(() => {
    const fetchData = async () => {
      const models = await fetch(
        `${apiUrl()}/prediction_models/${params.modelName}/grids/${params.gridId}/weights`
      )
      const data = await models.json()
      setResult(data)
    }
    fetchData()
  }, [params.modelName, params.gridId])
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
