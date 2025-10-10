import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import RouteIcon from '@mui/icons-material/Route'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
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
import { useNavigate, useParams } from 'react-router'
import {
  getGridGridsquaresGridsGridUuidGridsquaresGet,
  getLatentRepPredictionModelPredictionModelNameGridGridUuidLatentRepresentationGet,
  getPredictionForGridPredictionModelPredictionModelNameGridGridUuidPredictionGet,
  getPredictionModelsPredictionModelsGet,
} from '../api/generated/default/default'
import type {
  GridSquareResponse,
  LatentRepresentationResponse,
  QualityPredictionModelResponse,
  QualityPredictionResponse,
} from '../api/generated/models'
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
  const squarePredictions =
    await getPredictionForGridPredictionModelPredictionModelNameGridGridUuidPredictionGet(
      modelName,
      gridId
    )
  const squarePredictionsMap = new Map<string, number>(
    squarePredictions.map((elem: Prediction) => [elem.gridsquare_uuid ?? '', elem.value])
  )
  return squarePredictionsMap
}

const getLatentRep = async (modelName: string, gridId: string) => {
  const latentRepResult =
    await getLatentRepPredictionModelPredictionModelNameGridGridUuidLatentRepresentationGet(
      modelName,
      gridId
    )
  const latentRepMap = new Map<string, Coords>(
    latentRepResult.map((elem: LatentRep) => [
      elem.gridsquare_uuid ?? '',
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
  const suggestedIds = Array.from(suggestionResult, (s: { uuid: string }) => s.uuid)
  return suggestedIds
}

export default function Atlas() {
  const params = useParams()
  const gridId = params.gridId
  const [squares, setSquares] = React.useState<GridSquare[]>([])
  const [models, setModels] = React.useState<PredictionModel[]>([])
  const [maxWidth, setMaxWidth] = React.useState(0)
  const [squareNameMap, setSquareNameMap] = React.useState<Map<string, string>>()
  const [selectedSquare, setSelectedSquare] = React.useState('')

  React.useEffect(() => {
    const fetchData = async () => {
      if (!params.gridId) return
      const squaresData = await getGridGridsquaresGridsGridUuidGridsquaresGet(params.gridId)
      const modelsData = await getPredictionModelsPredictionModelsGet()
      setSquares(squaresData)
      setModels(modelsData)
    }
    fetchData()
  }, [params.gridId])
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
    const preds = await getPredictions(event.target.value, gridId ?? '')
    setPredictions(preds)
  }

  const handlePredictionChange = async () => {
    setShowPredictions(!showPredictions)
  }

  const handleLatentRepChange = async (event: SelectChangeEvent) => {
    setRepModel(event.target.value)
    const latentRepValues: Map<string, Coords> = await getLatentRep(
      event.target.value,
      gridId ?? ''
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

  const _handleSuggestionRequest = async () => {
    const suggestions = await getSuggestion(gridId ?? '')
    setSuggestions(suggestions)
  }

  React.useEffect(() => {
    if (squares.length > 0) {
      const widths = squares
        .map((elem: GridSquare) => elem.size_width)
        .filter((w): w is number => w !== null)
      setMaxWidth(Math.max(...widths))
      setSquareNameMap(
        new Map<string, string>(squares.map((elem: GridSquare) => [elem.uuid, elem.gridsquare_id]))
      )
    }
  }, [squares])

  React.useEffect(() => {
    if (predictions) {
      setPredictionMin(Math.min(...Array.from(predictions).map((k, _v) => k[1])))
      setPredictionMax(Math.max(...Array.from(predictions).map((k, _v) => k[1])))
    }
  }, [predictions])

  const url = apiUrl()

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
              <img src={`${url}/grids/${params.gridId}/atlas_image`} />
              <svg viewBox="0 0 4005 4005" style={{ position: 'absolute', top: 0, left: 0 }}>
                {squares.map((gridSquare: GridSquare) => (
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
                      fillOpacity={0.5}
                      r={
                        predictions?.get(gridSquare.uuid) !== undefined
                          ? (((1.5 * ((predictions.get(gridSquare.uuid) ?? 0) - predictionMin)) /
                              (predictionMax - predictionMin)) *
                              maxWidth) /
                            2
                          : (gridSquare.size_width ?? 0) / 2
                      }
                      fill={
                        latentRep
                          ? colourPalette[latentRep.get(gridSquare.uuid)?.index ?? 0]
                          : showPredictions
                            ? predictions?.get(gridSquare.uuid) !== undefined
                              ? (predictions.get(gridSquare.uuid) ?? 0) >= 0.5
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
                        suggestions.includes(gridSquare.uuid)
                          ? 'blue'
                          : gridSquare.uuid === selectedSquare
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
                    >
                      {gridSquare.image_path ? (
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
                    {models.map((model: PredictionModel) => (
                      <MenuItem value={model.name}>{model.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <></>
              )}
              {selectedSquare ? (
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
        <Container maxWidth="sm" content="center" style={{ width: '100%', paddingTop: '50px' }}>
          {showLatentSpace ? (
            <Card variant="outlined">
              {latentRep ? (
                <ScatterChart
                  sx={{ backgroundColor: 'black' }}
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
                    color: k[0] === selectedSquare ? 'white' : colourPalette[k[1].index],
                    valueFormatter: (v) => {
                      if (!selectionFrozen) setSelectedSquare(k[0])
                      return `${squareNameMap?.get(String(v?.id ?? '')) ?? ''}: ${String(k[1].index)}`
                    },
                  }))}
                  yAxis={[{ position: 'none' }]}
                  xAxis={[{ position: 'none' }]}
                  hideLegend={true}
                  onItemClick={(_event: React.MouseEvent, d: ScatterItemIdentifier) =>
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
                    {models.map((model: PredictionModel) => (
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
