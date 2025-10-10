import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import type { SelectChangeEvent } from '@mui/material'
import {
  Card,
  CardActions,
  Checkbox,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  ThemeProvider,
  Tooltip,
} from '@mui/material'
import type { ScatterItemIdentifier } from '@mui/x-charts/models'
import { ScatterChart } from '@mui/x-charts/ScatterChart'

import React from 'react'
import type { GridSquareResponse } from '../api/generated/models/gridSquareResponse'
import type { LatentRepresentationResponse } from '../api/generated/models/latentRepresentationResponse'
import type { QualityPredictionModelResponse } from '../api/generated/models/qualityPredictionModelResponse'
import type { QualityPredictionResponse } from '../api/generated/models/qualityPredictionResponse'
import { apiUrl } from '../api/mutator'
import { Navbar } from '../components/navbar'
import { theme } from '../components/theme'

type GridSquare = GridSquareResponse
type PredictionModel = QualityPredictionModelResponse
type Prediction = QualityPredictionResponse
type LatentRep = LatentRepresentationResponse

type Coords = {
  x: number
  y: number
  index: number
}

const getPredictions = async (modelName: string, gridId: string) => {
  const squarePredictionsResponse = await fetch(
    `${apiUrl()}/prediction_model/${modelName}/grid/${gridId}/prediction`
  )
  const squarePredictions = await squarePredictionsResponse.json()
  const squarePredictionsMap = new Map<string, number>(
    squarePredictions.map((elem: Prediction) => [elem.gridsquare_uuid, elem.value])
  )
  return squarePredictionsMap
}

const getLatentRep = async (modelName: string, gridId: string) => {
  const latentRepResponse = await fetch(
    `${apiUrl()}/prediction_model/${modelName}/grid/${gridId}/latent_representation`
  )
  const latentRepResult = await latentRepResponse.json()
  const latentRepMap = new Map<string, Coords>(
    latentRepResult.map((elem: LatentRep) => [
      elem.gridsquare_uuid,
      { x: elem.x, y: elem.y, index: elem.index } as Coords,
    ])
  )
  return latentRepMap
}

export default function Atlas({ loaderData, params }: any) {
  const [maxWidth, setMaxWidth] = React.useState(0)
  const [squareNameMap, setSquareNameMap] = React.useState<Map<string, string>>()
  const [selectedSquare, setSelectedSquare] = React.useState('')
  const [showPredictions, setShowPredictions] = React.useState(false)
  const [predictionModel, setPredictionModel] = React.useState('')
  const [repModel, setRepModel] = React.useState('')
  const [predictions, setPredictions] = React.useState<Map<string, number>>()
  const [predictionMin, setPredictionMin] = React.useState(0)
  const [predictionMax, setPredictionMax] = React.useState(0)
  const [latentRep, setLatentRep] = React.useState<Map<string, Coords>>()
  const [showLatentSpace, setShowLatentSpace] = React.useState(false)
  const [showUnselectedInLatentSpace, setShowUnselectedInLatentSpace] = React.useState(true)
  const [selectionFrozen, setSelectionFrozen] = React.useState(false)

  const colourPalette = [
    '#E3B505',
    '#95190C',
    '#610345',
    '#107E7D',
    '#044B7F',
    '#916953',
    '#CF8E80',
    '#FCB5B5',
    '#FCDDF2',
    '#D8DC6A',
  ]

  const handleChange = async (event: SelectChangeEvent) => {
    setPredictionModel(event.target.value)
    const preds = await getPredictions(event.target.value, params.gridId)
    setPredictions(preds)
  }

  const handlePredictionChange = async () => {
    setShowPredictions(!showPredictions)
  }

  const handleLatentRepChange = async (event: SelectChangeEvent) => {
    setRepModel(event.target.value)
    const latentRepValues: Map<string, Coords> = await getLatentRep(
      event.target.value,
      params.gridId
    )
    setLatentRep(latentRepValues)
  }

  const handleSelectionClick = (uuid: string) => {
    if (uuid === selectedSquare) {
      setSelectionFrozen(!selectionFrozen)
    } else {
      setSelectionFrozen(true)
      setSelectedSquare(uuid)
    }
  }

  React.useEffect(() => {
    const widths = loaderData.squares.map((elem: GridSquare) => {
      return elem.size_width
    })
    setMaxWidth(Math.max(...widths))
    setSquareNameMap(
      new Map<string, string>(
        loaderData.squares.map((elem: GridSquare) => [elem.uuid, elem.gridsquare_id])
      )
    )
  }, [loaderData.squares.map])

  React.useEffect(() => {
    if (predictions) {
      setPredictionMin(Math.min(...Array.from(predictions).map((k, _v) => k[1])))
      setPredictionMax(Math.max(...Array.from(predictions).map((k, _v) => k[1])))
    }
  }, [predictions])

  return (
    <ThemeProvider theme={theme}>
      <Navbar />
      <Stack direction="row" spacing={2}>
        <Container maxWidth="sm" content="center" style={{ width: '100%', paddingTop: '50px' }}>
          <Card variant="outlined">
            <div
              style={{
                display: 'flex',
                flex: '1 0 300px',
                position: 'relative',
              }}
            >
              <img src={`${apiUrl()}/grids/${params.gridId}/atlas_image`} />
              <svg viewBox="0 0 4005 4005" style={{ position: 'absolute', top: 0, left: 0 }}>
                {loaderData.squares.map((gridSquare: GridSquare) => (
                  <Tooltip
                    title={
                      showPredictions && predictions
                        ? `${gridSquare.gridsquare_id}: ${predictions.get(gridSquare.uuid)?.toFixed(3)}`
                        : gridSquare.gridsquare_id
                    }
                  >
                    <circle
                      key={gridSquare.uuid}
                      cx={gridSquare.center_x ?? 0}
                      cy={gridSquare.center_y ?? 0}
                      r={
                        predictions?.get(gridSquare.uuid) !== undefined
                          ? (((1.5 * ((predictions.get(gridSquare.uuid) ?? 0) - predictionMin)) /
                              (predictionMax - predictionMin)) *
                              maxWidth) /
                            2
                          : (gridSquare.size_width ?? 0) / 2
                      }
                      fillOpacity={0.5}
                      fill={
                        latentRep
                          ? colourPalette[latentRep.get(gridSquare.uuid)?.index ?? 0]
                          : showPredictions
                            ? predictions?.get(gridSquare.uuid) !== undefined
                              ? (predictions.get(gridSquare.uuid) ?? 0) >= 0
                                ? 'green'
                                : 'red'
                              : 'dark gray'
                            : 'purple'
                      }
                      strokeWidth={
                        gridSquare.uuid === selectedSquare
                          ? 0.25 * (gridSquare.size_width ?? 0)
                          : 0.1 * (gridSquare.size_width ?? 0)
                      }
                      strokeOpacity={1}
                      stroke={
                        gridSquare.uuid === selectedSquare
                          ? 'orange'
                          : showPredictions
                            ? predictions?.get(gridSquare.uuid) !== undefined
                              ? (predictions.get(gridSquare.uuid) ?? 0) >= 0
                                ? 'green'
                                : 'red'
                              : 'gray'
                            : 'gray'
                      }
                      onClick={() => handleSelectionClick(gridSquare.uuid)}
                      onMouseOver={() =>
                        !selectionFrozen ? setSelectedSquare(gridSquare.uuid) : {}
                      }
                    />
                  </Tooltip>
                ))}
              </svg>
            </div>
            <CardActions>
              <Switch checked={showPredictions} onChange={handlePredictionChange} />
              {showPredictions ? (
                <FormControl fullWidth>
                  <InputLabel id="model-select-label">Prediction Model</InputLabel>
                  <Select
                    labelId="model-select-label"
                    id="model-select"
                    value={predictionModel}
                    label="Prediction Model"
                    onChange={handleChange}
                  >
                    {loaderData.models.map((model: PredictionModel) => (
                      <MenuItem value={model.name}>{model.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <></>
              )}
              <Tooltip title={'Add latent panel'}>
                <IconButton
                  aria-label="add-panel"
                  style={{ display: 'flex', marginLeft: 'auto' }}
                  onClick={() => setShowLatentSpace(true)}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            </CardActions>
          </Card>
        </Container>
        <Container maxWidth="sm" content="center" style={{ width: '100%', paddingTop: '50px' }}>
          {showLatentSpace ? (
            <Card>
              {latentRep ? (
                <ScatterChart
                  height={500}
                  series={Array.from(latentRep).map((k, _v) => ({
                    label: k[0],
                    id: k[0],
                    data: [{ x: k[1].x, y: k[1].y, id: k[0] }],
                    markerSize:
                      k[0] === selectedSquare || showUnselectedInLatentSpace
                        ? predictions
                          ? (7 * ((predictions?.get(k[0]) ?? 0) + 1)) / 2
                          : 5
                        : 0,
                    color: k[0] === selectedSquare ? 'black' : colourPalette[k[1].index],
                    valueFormatter: (v) => {
                      if (!selectionFrozen) setSelectedSquare(k[0])
                      return `${squareNameMap?.get(String(v?.id ?? '')) ?? ''}: ${String(k[1].index)}`
                    },
                  }))}
                  yAxis={[{ position: 'none' }]}
                  xAxis={[{ position: 'none' }]}
                  hideLegend={true}
                  onItemClick={(_: any, d: ScatterItemIdentifier) =>
                    handleSelectionClick(d.seriesId.toString())
                  }
                />
              ) : (
                <></>
              )}
              <CardActions>
                <Tooltip
                  title={'Show unselected squares'}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setShowUnselectedInLatentSpace(event.target.checked)
                  }}
                >
                  <Checkbox defaultChecked />
                </Tooltip>
                <FormControl fullWidth>
                  <InputLabel id="rep-model-select-label">Prediction Model</InputLabel>
                  <Select
                    labelId="rep-model-select-label"
                    id="model-select"
                    value={repModel}
                    label="Latent Representation Model"
                    onChange={handleLatentRepChange}
                  >
                    {loaderData.models.map((model: PredictionModel) => (
                      <MenuItem value={model.name}>{model.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Tooltip title={'Close latent panel'}>
                  <IconButton
                    aria-label="close-panel"
                    style={{ display: 'flex', marginLeft: 'auto' }}
                    onClick={() => setShowLatentSpace(false)}
                  >
                    <CloseIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          ) : (
            <></>
          )}
        </Container>
      </Stack>
    </ThemeProvider>
  )
}
