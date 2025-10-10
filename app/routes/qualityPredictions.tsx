import type { SelectChangeEvent } from '@mui/material'
import {
  Box,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  ThemeProvider,
} from '@mui/material'
import { BarChart, LineChart } from '@mui/x-charts'
import { bin } from 'd3-array'
import React from 'react'
import { useParams } from 'react-router'
import type { QualityPrediction } from '../api/generated/models/qualityPrediction'
import { apiUrl } from '../api/mutator'
import { Navbar } from '../components/navbar'
import { theme } from '../components/theme'

const GridSquarePredictionCharts = ({ predictions }: { predictions: QualityPrediction[] }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', margin: '5px' }}>
      <LineChart
        hideLegend
        grid={{ horizontal: true }}
        xAxis={[
          {
            data: predictions.map((elem) => {
              return elem.timestamp ? Date.parse(elem.timestamp) : 0
            }),
            scaleType: 'time',
          },
        ]}
        series={[
          {
            data: predictions.map((elem) => {
              return elem.value
            }),
          },
        ]}
        yAxis={[{ min: 0, max: 1 }]}
        height={400}
      />
    </Box>
  )
}

const FoilHolePredictionCharts = ({
  predictions,
}: {
  predictions: Map<string, QualityPrediction[]>
}) => {
  const mostRecentTimestamp = Math.max(
    ...Object.entries(predictions).map(([, value]) => {
      return Date.parse(value.slice(-1)[0].timestamp)
    })
  )
  const leastRecentTimestamp = Math.min(
    ...Object.entries(predictions).map(([, value]) => {
      return Date.parse(value[0].timestamp)
    })
  )
  const [selectedTime, setSelectedTime] = React.useState(mostRecentTimestamp)
  const histGenerator = bin().domain([0, 1]).thresholds(19)

  const getMostRecentBefore = (preds: QualityPrediction[]) => {
    let current = preds[0]
    for (const pred of preds) {
      if (Date.parse(pred.timestamp ?? '') > selectedTime) {
        return current
      } else {
        current = pred
      }
    }
    return current
  }

  return Object.entries(predictions).length ? (
    <Box sx={{ display: 'flex', alignItems: 'center', margin: '5px' }}>
      <Stack spacing={1}>
        <BarChart
          xAxis={[
            {
              scaleType: 'band',
              data: histGenerator(
                Object.entries(predictions).map(([, value]) => {
                  return value.slice(-1)[0].value
                })
              ).map((b) => {
                return b.x0 !== undefined && b.x1 !== undefined ? b.x0 + (b.x1 - b.x0) : 0
              }),
            },
          ]}
          series={[
            {
              data: histGenerator(
                Object.entries(predictions).map(([, value]) => {
                  return getMostRecentBefore(value).value
                })
              ).map((b) => {
                return b.length
              }),
              color: '#5C9EAD',
            },
          ]}
        />
        <Slider
          min={leastRecentTimestamp}
          max={mostRecentTimestamp}
          value={selectedTime}
          onChange={(_event: Event, newValue: number | number[]) =>
            setSelectedTime(typeof newValue === 'number' ? newValue : newValue[0])
          }
        />
      </Stack>
    </Box>
  ) : null
}

export default function QualityPredictionsForSquare() {
  const params = useParams()
  const [squarePredictions, setSquarePredictions] = React.useState<
    Record<string, QualityPrediction[]>
  >({})
  const [holePredictions, setHolePredictions] = React.useState<
    Record<string, Record<string, QualityPrediction[]>>
  >({})
  const [metrics, setMetrics] = React.useState<{ name: string }[]>([])

  React.useEffect(() => {
    const fetchData = async () => {
      const squarePredictionsResponse = await fetch(
        `${apiUrl()}/gridsquares/${params.squareId}/quality_predictions`
      )
      const holePredictionsResponse = await fetch(
        `${apiUrl()}/gridsquares/${params.squareId}/foilhole_quality_predictions`
      )
      const metricsResponse = await fetch(`${apiUrl()}/quality_metrics`)
      const squarePredictionsData = await squarePredictionsResponse.json()
      const holePredictionsData = await holePredictionsResponse.json()
      const metricsData = await metricsResponse.json()
      setSquarePredictions(squarePredictionsData)
      setHolePredictions(holePredictionsData)
      setMetrics(metricsData)
    }
    fetchData()
  }, [params.squareId])

  const mostRecentsMean = (fhPredictions: Map<string, QualityPrediction[]>) => {
    const mostRecents = Object.entries(fhPredictions).map(([, el]) => {
      return el.slice(-1)[0].value
    })
    return mostRecents.reduce((a: number, b: number) => a + b, 0) / mostRecents.length
  }

  const [metricName, setMetricName] = React.useState('')
  const [predictionsPerMetric, setPredictionsPerMetric] = React.useState<
    Record<string, Record<string, QualityPrediction[]>>
  >({})

  const handleChange = async (event: SelectChangeEvent) => {
    setMetricName(event.target.value)
    const holePredictionsResponse = await fetch(
      `${apiUrl()}/quality_metric/${event.target.value}/gridsquares/${params.squareId}/foilhole_quality_predictions`
    )
    const holePredictions = await holePredictionsResponse.json()
    setPredictionsPerMetric(holePredictions)
  }

  return (
    <ThemeProvider theme={theme}>
      <Navbar />
      <Stack content="center" style={{ width: '100%', paddingTop: '50px' }}>
        <FormControl fullWidth style={{ color: 'black', backgroundColor: '#b927d9' }}>
          <InputLabel id="metric-select-label">Metric</InputLabel>
          <Select
            labelId="metric-select-label"
            id="metric-select"
            label="metric"
            value={metricName}
            onChange={handleChange}
          >
            {metrics.map((metric) => (
              <MenuItem value={metric.name}>{metric.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Grid container spacing={3} sx={{ padding: '20px' }}>
          {Object.entries(squarePredictions).map(([key, value]) => {
            return (
              <Grid size={4} key={key}>
                <Card>
                  <CardContent style={{ backgroundColor: '#b927d9' }}>Model: {key}</CardContent>
                  <CardContent style={{ backgroundColor: '#b927d9' }}>
                    {value.slice(-1)[0].value.toLocaleString(undefined, {
                      maximumSignificantDigits: 3,
                      minimumSignificantDigits: 3,
                    })}
                  </CardContent>
                  <CardContent style={{ backgroundColor: '#b927d9' }}>
                    <GridSquarePredictionCharts predictions={value} />
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
          {Object.entries(holePredictions).map(([key, value]) => {
            return (
              <Grid size={4} key={key}>
                <Card>
                  <CardContent style={{ backgroundColor: '#b927d9' }}>Model: {key}</CardContent>
                  <CardContent style={{ backgroundColor: '#b927d9' }}>
                    {mostRecentsMean(new Map(Object.entries(value))).toLocaleString(undefined, {
                      maximumSignificantDigits: 3,
                      minimumSignificantDigits: 3,
                    })}
                  </CardContent>
                  <CardContent style={{ backgroundColor: '#b927d9' }}>
                    <FoilHolePredictionCharts predictions={new Map(Object.entries(value))} />
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
          {Object.entries(predictionsPerMetric).map(([key, value]) => {
            return (
              <Grid size={4} key={key}>
                <Card>
                  <CardContent style={{ backgroundColor: '#b927d9' }}>Model: {key}</CardContent>
                  <CardContent style={{ backgroundColor: '#b927d9' }}>
                    {mostRecentsMean(new Map(Object.entries(value))).toLocaleString(undefined, {
                      maximumSignificantDigits: 3,
                      minimumSignificantDigits: 3,
                    })}
                  </CardContent>
                  <CardContent style={{ backgroundColor: '#b927d9' }}>
                    <FoilHolePredictionCharts predictions={new Map(Object.entries(value))} />
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </Stack>
    </ThemeProvider>
  )
}
