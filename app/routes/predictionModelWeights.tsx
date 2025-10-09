import type { Route } from './+types/product'

import {
  Avatar,
  ThemeProvider,
  Switch,
  FormControlLabel,
  Container,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material'
import { LineChart } from '@mui/x-charts'

import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'

import React from 'react'

import type { components } from '../schema'

type ModelWeightResponse = components['schemas']['ModelWeightResponse']

import { Navbar } from '../components/navbar'
import { theme } from '../components/theme'
import { TimeSeriesChart } from '../components/timeseries'
import { useParams } from 'react-router'

import { apiUrl } from '../api/mutator'

export default function PredictionModelWeights() {
  const params = useParams()
  const [result, setResult] = React.useState<ModelWeightResponse[] | null>(null)

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
        <Container
          component="main"
          content="center"
          style={{ width: '100%', paddingTop: '50px' }}
        >
          {result ? (
            <TimeSeriesChart
              xData={result.map((elem: ModelWeightResponse) => {
                return Date.parse(elem.timestamp)
              })}
              yData={result.map((elem: ModelWeightResponse) => {
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
