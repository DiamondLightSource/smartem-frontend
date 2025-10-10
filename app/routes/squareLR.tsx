import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import InsightsIcon from '@mui/icons-material/Insights'
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
import type { FoilHoleResponse } from '../api/generated/models/foilHoleResponse'
import type { LatentRepresentationResponse } from '../api/generated/models/latentRepresentationResponse'
import type { QualityPredictionModelResponse } from '../api/generated/models/qualityPredictionModelResponse'
import type { QualityPredictionResponse } from '../api/generated/models/qualityPredictionResponse'
import { apiUrl } from '../api/mutator'
import { Navbar } from '../components/navbar'
import { theme } from '../components/theme'

type FoilHole = FoilHoleResponse
type PredictionModel = QualityPredictionModelResponse
type Prediction = QualityPredictionResponse
type LatentRep = LatentRepresentationResponse

type Coords = {
  x: number
  y: number
  index: number
}

const getPredictions = async (modelName: string, gridSquareId: string) => {
  const holePredictionsResponse = await fetch(
    `${apiUrl()}/prediction_model/${modelName}/gridsquare/${gridSquareId}/prediction`
  )
  const holePredictions = await holePredictionsResponse.json()
  const holePredictionsMap = new Map<string, number>(
    holePredictions.map((elem: Prediction) => [elem.foilhole_uuid, elem.value])
  )
  return holePredictionsMap
}

const getOverallPredictions = async (gridSquareId: string) => {
  const holePredictionsResponse = await fetch(
    `${apiUrl()}/gridsquare/${gridSquareId}/overall_prediction`
  )
  const holePredictions = await holePredictionsResponse.json()
  const holePredictionsMap = new Map<string, number>(
    holePredictions.map((elem: Prediction) => [elem.foilhole_uuid, elem.value])
  )
  return holePredictionsMap
}

const getLatentRep = async (modelName: string, gridSquareId: string) => {
  const latentRepResponse = await fetch(
    `${apiUrl()}/prediction_model/${modelName}/gridsquare/${gridSquareId}/latent_representation`
  )
  const latentRepResult = await latentRepResponse.json()
  const latentRepMap = new Map<string, Coords>(
    latentRepResult.map((elem: LatentRep) => [
      elem.foilhole_uuid,
      { x: elem.x, y: elem.y, index: elem.index } as Coords,
    ])
  )
  return latentRepMap
}

export default function GridSquareLR() {
  const params = useParams()
  const navigate = useNavigate()
  const [holes, setHoles] = React.useState<FoilHole[]>([])
  const [models, setModels] = React.useState<PredictionModel[]>([])
  const [maxWidth] = React.useState(0)
  const [selectedSquare, setSelectedSquare] = React.useState('')

  React.useEffect(() => {
    const fetchData = async () => {
      const foilholesResponse = await fetch(
        `${apiUrl()}/gridsquares/${params.squareId}/foilholes?on_square_only=true`
      )
      const holesData = await foilholesResponse.json()
      const predictionModelsResponse = await fetch(`${apiUrl()}/prediction_models`)
      const modelsData = await predictionModelsResponse.json()
      setHoles(holesData)
      setModels(modelsData)
    }
    fetchData()
  }, [params.squareId])
  const [holeNameMap, setHoleNameMap] = React.useState<Map<string, string>>()
  const [selectedHole, setSelectedHole] = React.useState('')
  const [showPredictions, setShowPredictions] = React.useState(false)
  const [predictionModel, setPredictionModel] = React.useState('')
  const [repModel, setRepModel] = React.useState('')
  const [predictions, setPredictions] = React.useState<Map<string, number>>()
  const [predictionMin, setPredictionMin] = React.useState(0)
  const [predictionMax, setPredictionMax] = React.useState(1)
  const [latentRep, setLatentRep] = React.useState<Map<string, Coords>>()
  const [showLatentSpace, setShowLatentSpace] = React.useState(false)
  const [showUnselectedInLatentSpace, setShowUnselectedInLatentSpace] = React.useState(true)
  const [selectionFrozen, setSelectionFrozen] = React.useState(false)

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
    const squareId = params.squareId ?? ''
    const preds = await getPredictions(event.target.value, squareId)
    setPredictions(preds)
    if (event.target.value === 'overall') {
      const preds = await getOverallPredictions(squareId)
      setPredictions(preds)
    } else {
      const preds = await getPredictions(event.target.value, squareId)
      setPredictions(preds)
    }
  }

  const handlePredictionChange = async () => {
    setShowPredictions(!showPredictions)
  }

  const handleLatentRepChange = async (event: SelectChangeEvent) => {
    setRepModel(event.target.value)
    const latentRepValues: Map<string, Coords> = await getLatentRep(
      event.target.value,
      params.squareId ?? ''
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
    if (holes.length > 0) {
      setHoleNameMap(
        new Map<string, string>(holes.map((elem: FoilHole) => [elem.uuid, elem.foilhole_id]))
      )
    }
  }, [holes])

  React.useEffect(() => {
    if (predictions) {
      const min = Math.min(...Array.from(predictions).map((k) => k[1]))
      const max = Math.max(...Array.from(predictions).map((k) => k[1]))
      setPredictionMin(min)
      setPredictionMax(max)
    }
  }, [predictions])

  const url = apiUrl()

  return (
    <ThemeProvider theme={theme}>
      <Navbar />
      <Stack direction="row" spacing={2}>
        <Container maxWidth="lg" content="center" style={{ width: '100%', paddingTop: '50px' }}>
          <Card variant="outlined">
            <div
              style={{
                display: 'flex',
                flex: '1 0 300px',
                position: 'relative',
              }}
            >
              <img src={`${url}/gridsquares/${params.squareId}/gridsquare_image`} />
              <svg viewBox="0 0 2880 2046" style={{ position: 'absolute', top: 0, left: 0 }}>
                {holes.map((foilHole: FoilHole) => (
                  <Tooltip
                    key={foilHole.uuid}
                    title={
                      showPredictions && predictions
                        ? `${foilHole.foilhole_id}: ${predictions.get(foilHole.uuid)?.toFixed(3)}`
                        : foilHole.foilhole_id
                    }
                  >
                    <circle
                      cx={foilHole.x_location ?? 0}
                      cy={foilHole.y_location ?? 0}
                      r={
                        predictions?.get(foilHole.uuid) !== undefined
                          ? (((1.5 *
                              (foilHole.diameter ?? 0) *
                              ((predictions.get(foilHole.uuid) ?? 0) - predictionMin)) /
                              (predictionMax - predictionMin)) *
                              maxWidth) /
                            2
                          : (foilHole.diameter ?? 0) / 2
                      }
                      fillOpacity={0.5}
                      fill={
                        latentRep
                          ? colourPalette[latentRep.get(foilHole.uuid)?.index ?? 0]
                          : showPredictions
                            ? predictions?.get(foilHole.uuid) !== undefined
                              ? (predictions.get(foilHole.uuid) ?? 0) >= 0.5
                                ? 'green'
                                : 'red'
                              : 'dark gray'
                            : 'purple'
                      }
                      strokeWidth={
                        foilHole.uuid === selectedHole
                          ? 0.25 * (foilHole.diameter ?? 0)
                          : 0.1 * (foilHole.diameter ?? 0)
                      }
                      strokeOpacity={1}
                      stroke={
                        foilHole.uuid === selectedHole
                          ? 'orange'
                          : showPredictions
                            ? predictions?.get(foilHole.uuid) !== undefined
                              ? (predictions.get(foilHole.uuid) ?? 0) >= 0.5
                                ? 'green'
                                : 'red'
                              : 'gray'
                            : 'gray'
                      }
                      onClick={() => handleSelectionClick(foilHole.uuid)}
                      onMouseOver={() => (!selectionFrozen ? setSelectedHole(foilHole.uuid) : {})}
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
                    <MenuItem value="overall">overall</MenuItem>
                    {models.map((model: PredictionModel) => (
                      <MenuItem key={model.name} value={model.name}>
                        {model.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : null}
              <IconButton
                aria-label="add-label"
                style={{ display: 'flex' }}
                onClick={() =>
                  navigate(`../../square/${params.squareId}/predictions`, {
                    relative: 'path',
                  })
                }
              >
                <InsightsIcon />
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
                  series={Array.from(latentRep).map((k) => ({
                    label: k[0],
                    id: k[0],
                    data: [{ x: k[1].x, y: k[1].y, id: k[0] }],
                    markerSize:
                      k[0] === selectedHole || showUnselectedInLatentSpace
                        ? predictions
                          ? (7 * ((predictions?.get(k[0]) ?? 0) + 1)) / 2
                          : 5
                        : 0,
                    color: k[0] === selectedHole ? 'white' : colourPalette[k[1].index],
                    valueFormatter: (v) => {
                      if (!selectionFrozen) setSelectedHole(k[0])
                      return `${holeNameMap?.get(String(v?.id ?? '')) ?? ''}: ${String(k[1].index)}`
                    },
                  }))}
                  yAxis={[{ position: 'none' }]}
                  xAxis={[{ position: 'none' }]}
                  hideLegend={true}
                  onItemClick={(_: React.MouseEvent, d: ScatterItemIdentifier) =>
                    handleSelectionClick(d.seriesId.toString())
                  }
                />
              ) : null}
              <CardActions>
                <Tooltip
                  title={'Show unselected holes'}
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
                      <MenuItem key={model.name} value={model.name}>
                        {model.name}
                      </MenuItem>
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
          ) : null}
        </Container>
      </Stack>
    </ThemeProvider>
  )
}
