import type { Route } from './+types/product'

import {
  Card,
  CardActions,
  Checkbox,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Tooltip,
  ThemeProvider,
  Select,
  Stack,
  Switch,
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'
import { ScatterChart } from '@mui/x-charts/ScatterChart'
import type { ScatterItemIdentifier } from '@mui/x-charts/models'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import RouteIcon from '@mui/icons-material/Route'

import type { components } from '../schema'

import { useNavigate } from 'react-router'

import React from 'react'

import { Navbar } from '../components/navbar'
import { theme } from '../components/theme'

import { apiUrl } from '../utils/api'

type GridSquare = components['schemas']['GridSquareResponse']
type PredictionModel = components['schemas']['QualityPredictionModelResponse']
type Prediction = components['schemas']['QualityPredictionResponse']
type LatentRep = components['schemas']['LatentRepresentationResponse']

type Coords = {
  x: number
  y: number
  index: number
}

export async function loader({ params }: Route.LoaderArgs) {
  const gridsquares = await fetch(
    `${apiUrl()}/grids/${params.gridId}/gridsquares`
  )
  const squares = await gridsquares.json()
  const predictionModels = await fetch(`${apiUrl()}/prediction_models`)
  const models = await predictionModels.json()
  return { squares, models }
}

const getPredictions = async (modelName: string, gridId: string) => {
  const squarePredictionsResponse = await fetch(
    `${apiUrl()}/prediction_model/${modelName}/grid/${gridId}/prediction`
  )
  const squarePredictions = await squarePredictionsResponse.json()
  const squarePredictionsMap = new Map<string, number>(
    squarePredictions.map((elem: Prediction) => [
      elem.gridsquare_uuid,
      elem.value,
    ])
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

const getSuggestion = async (gridId: string) => {
  const suggestionResponse = await fetch(
    `${apiUrl()}/grid/${gridId}/prediction_model/resnet-atlas/latent_rep/dae-atlas/suggested_squares`
  )
  const suggestionResult = await suggestionResponse.json()
  const suggestedIds = Array.from(suggestionResult, (s) => s.uuid)
  return suggestedIds
}

export default function Atlas({ loaderData, params }: Route.ComponentProps) {
  const [maxWidth, setMaxWidth] = React.useState(0)
  const [squareNameMap, setSquareNameMap] =
    React.useState<Map<string, string>>()
  const [selectedSquare, setSelectedSquare] = React.useState('')
  const [showPredictions, setShowPredictions] = React.useState(false)
  const [predictionModel, setPredictionModel] = React.useState('')
  const [repModel, setRepModel] = React.useState('')
  const [predictions, setPredictions] = React.useState<Map<string, number>>()
  const [predictionMin, setPredictionMin] = React.useState(0)
  const [predictionMax, setPredictionMax] = React.useState(0)
  const [latentRep, setLatentRep] = React.useState<Map<string, Coords>>()
  const [showLatentSpace, setShowLatentSpace] = React.useState(false)
  const [showUnselectedInLatentSpace, setShowUnselectedInLatentSpace] =
    React.useState(true)
  const [selectionFrozen, setSelectionFrozen] = React.useState(false)
  const [suggestions, setSuggestions] = React.useState<string[]>([])

  const navigate = useNavigate()

  const colourPalette = [
    '#f2a2a9',
    '#85b6b2',
    '#a77c9f',
    '#e59344',
    '#6ba059',
    '#d1605e',
    '#5878a3',
    '#e7cc60',
    '#c1ff9b',
    '#fb62f6',
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

  const handleSuggestionRequest = async () => {
    const suggestions = await getSuggestion(params.gridId)
    setSuggestions(suggestions)
  }

  React.useEffect(() => {
    const widths = loaderData.squares.map((elem: GridSquare) => {
      return elem.size_width
    })
    setMaxWidth(Math.max(...widths))
    setSquareNameMap(
      new Map<string, string>(
        loaderData.squares.map((elem: GridSquare) => [
          elem.uuid,
          elem.gridsquare_id,
        ])
      )
    )
  }, [])

  React.useEffect(() => {
    if (predictions) {
      setPredictionMin(Math.min(...Array.from(predictions).map((k, v) => k[1])))
      setPredictionMax(Math.max(...Array.from(predictions).map((k, v) => k[1])))
    }
  }, [predictions])

  const url = apiUrl()

  return (
    <ThemeProvider theme={theme}>
      <Navbar />
      <Stack direction="row" spacing={2}>
        <Container
          maxWidth="sm"
          content="center"
          style={{ width: '100%', paddingTop: '50px' }}
        >
          <Card variant="outlined">
            <div
              style={{
                display: 'flex',
                flex: '1 0 300px',
                position: 'relative',
              }}
            >
              <img src={`${url}/grids/${params.gridId}/atlas_image`} />
              <svg
                viewBox="0 0 4005 4005"
                style={{ position: 'absolute', top: 0, left: 0 }}
              >
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
                      cx={gridSquare.center_x}
                      cy={gridSquare.center_y}
                      fillOpacity={0.5}
                      r={
                        predictions?.get(gridSquare.uuid)
                          ? (((1.5 *
                              (predictions.get(gridSquare.uuid) -
                                predictionMin)) /
                              (predictionMax - predictionMin)) *
                              maxWidth) /
                            2
                          : gridSquare.size_width / 2
                      }
                      fill={
                        latentRep
                          ? colourPalette[latentRep.get(gridSquare.uuid).index]
                          : showPredictions
                            ? predictions?.get(gridSquare.uuid)
                              ? predictions.get(gridSquare.uuid) >= 0.5
                                ? 'green'
                                : 'red'
                              : 'dark gray'
                            : 'purple'
                      }
                      strokeWidth={
                        gridSquare.uuid === selectedSquare
                          ? 0.25 * gridSquare.size_width
                          : 0.1 * gridSquare.size_width
                      }
                      strokeOpacity={1}
                      stroke={
                        suggestions.includes(gridSquare.uuid)
                          ? 'blue'
                          : gridSquare.uuid === selectedSquare
                            ? 'orange'
                            : showPredictions
                              ? predictions?.get(gridSquare.uuid)
                                ? predictions.get(gridSquare.uuid) >= 0
                                  ? 'green'
                                  : 'red'
                                : 'gray'
                              : 'gray'
                      }
                      onClick={() => handleSelectionClick(gridSquare.uuid)}
                      onMouseOver={() =>
                        !selectionFrozen
                          ? setSelectedSquare(gridSquare.uuid)
                          : {}
                      }
                    >
                      {!!gridSquare.image_path ? (
                        <animate
                          attributeName="fill-opacity"
                          dur="1s"
                          values="0.25;1;0.25"
                          repeatCount="indefinite"
                          begin="0.25"
                        />
                      ) : (
                        <></>
                      )}
                    </circle>
                  </Tooltip>
                ))}
              </svg>
            </div>
            <CardActions>
              <Switch
                checked={showPredictions}
                onChange={handlePredictionChange}
              />
              {showPredictions ? (
                <FormControl fullWidth>
                  <InputLabel id="model-select-label">
                    Prediction Model
                  </InputLabel>
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
              {!!selectedSquare ? (
                <IconButton
                  aria-label="inspect-square"
                  style={{ display: 'flex' }}
                  onClick={() =>
                    navigate(`../squares/${selectedSquare}`, {
                      relative: 'path',
                    })
                  }
                >
                  <ZoomInIcon />
                </IconButton>
              ) : (
                <></>
              )}
              <IconButton
                aria-label="suggest-route"
                style={{ display: 'flex' }}
                onClick={() => setShowLatentSpace(true)}
              >
                <RouteIcon />
              </IconButton>
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
        <Container
          maxWidth="sm"
          content="center"
          style={{ width: '100%', paddingTop: '50px' }}
        >
          {showLatentSpace ? (
            <Card variant="outlined">
              {latentRep ? (
                <ScatterChart
                  sx={{ backgroundColor: 'black' }}
                  height={500}
                  series={Array.from(latentRep).map((k, v) => ({
                    label: k[0],
                    id: k[0],
                    data: [{ x: k[1].x, y: k[1].y, id: k[0] }],
                    markerSize:
                      k[0] == selectedSquare || showUnselectedInLatentSpace
                        ? predictions
                          ? (7 * (predictions?.get(k[0]) + 1)) / 2
                          : 5
                        : 0,
                    color:
                      k[0] == selectedSquare
                        ? 'white'
                        : colourPalette[k[1].index],
                    valueFormatter: (v) => {
                      if (!selectionFrozen) setSelectedSquare(k[0])
                      return `${squareNameMap?.get(v?.id)}: ${k[1].index}`
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
                  <InputLabel id="rep-model-select-label">
                    Prediction Model
                  </InputLabel>
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
