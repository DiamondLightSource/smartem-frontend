import type { Route } from "./+types/product";

import { Card, CardActions, Checkbox, Container, FormControl, IconButton, InputLabel, MenuItem, Tooltip, ThemeProvider, Select, Stack, Switch } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { ScatterChart } from '@mui/x-charts/ScatterChart';
import type { ScatterItemIdentifier } from '@mui/x-charts/models';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

import type { components } from "../schema"

import React from "react";

import { Navbar } from "../components/navbar";
import { theme } from "../components/theme";

import { apiUrl } from "../utils/api";

type FoilHole = components["schemas"]["FoilHoleResponse"]
type PredictionModel = components["schemas"]["QualityPredictionModelResponse"]
type Prediction = components["schemas"]["QualityPredictionResponse"]
type LatentRep = components["schemas"]["LatentRepresentationResponse"]

type Coords = {
    x: number,
    y: number,
    index: number,
}

export async function loader({ params }: Route.LoaderArgs) {
  const foilholes = await fetch(`${apiUrl()}/gridsquares/${params.squareId}/foilholes?on_square_only=true`);
  const holes = await foilholes.json();
  const predictionModels = await fetch(`${apiUrl()}/prediction_models`);
  const models = await predictionModels.json();
  return { holes, models };
}

const getPredictions = async (modelName: string, gridSquareId: string) => {
        const holePredictionsResponse = await fetch(`${apiUrl()}/prediction_model/${modelName}/gridsquare/${gridSquareId}/prediction`);
        const squarePredictions = await squarePredictionsResponse.json();
        const squarePredictionsMap = new Map<string, number>(squarePredictions.map((elem: Prediction) => [elem.gridsquare_uuid, elem.value]));
        return squarePredictionsMap;
    }

const getLatentRep = async (modelName: string, gridSquareId: string) => {
        const latentRepResponse = await fetch(`${apiUrl()}/prediction_model/${modelName}/gridsquare/${gridSquareId}/latent_representation`);
        const latentRepResult = await latentRepResponse.json();
        const latentRepMap = new Map<string, Coords>(latentRepResult.map((elem: LatentRep) => [elem.foilhole_uuid, {"x": elem.x, "y": elem.y, "index": elem.index} as Coords]));
        return latentRepMap;
    }

export default function GridSquareLR({ loaderData, params }: Route.ComponentProps) {
    const [maxWidth, setMaxWidth] = React.useState(0);
    const [holeNameMap, setHoleNameMap] = React.useState<Map<string, string>>()
    const [selectedHole, setSelectedHole] = React.useState("");
    const [showPredictions, setShowPredictions] = React.useState(false);
    const [predictionModel, setPredictionModel] = React.useState("");
    const [repModel, setRepModel] = React.useState("");
    const [predictions, setPredictions] = React.useState<Map<string, number>>();
    const [predictionMin, setPredictionMin] = React.useState(0);
    const [predictionMax, setPredictionMax] = React.useState(0);
    const [latentRep, setLatentRep] = React.useState<Map<string, Coords>>();
    const [showLatentSpace, setShowLatentSpace] = React.useState(false);
    const [showUnselectedInLatentSpace, setShowUnselectedInLatentSpace] = React.useState(true);
    const [selectionFrozen, setSelectionFrozen] = React.useState(false);

    const colourPalette = ["#E3B505", "#95190C", "#610345", "#107E7D", "#044B7F", "#916953", "#CF8E80", "#FCB5B5", "#FCDDF2", "#D8DC6A"]

    const handleChange = async (event: SelectChangeEvent) => {
        setPredictionModel(event.target.value);
        const preds = await getPredictions(event.target.value, params.squareId);        
        setPredictions(preds);
    }

    const handlePredictionChange = async () => {
        setShowPredictions(!showPredictions);
    }

    const handleLatentRepChange = async (event: SelectChangeEvent) => {
        setRepModel(event.target.value);
        const latentRepValues: Map<string, Coords> = await getLatentRep(event.target.value, params.squareId);      
        setLatentRep(latentRepValues);
    }

    const handleSelectionClick = (uuid: string) => {
        if(uuid === selectedSquare){
            setSelectionFrozen(!selectionFrozen);
        }
        else{
            setSelectionFrozen(true);
            setSelectedSquare(uuid);
        }
    }

    React.useEffect(
        () => {
            const widths = loaderData.holes.map((elem: FoilHole) => {return elem.size_width});
            setMaxWidth(Math.max(...widths));
            setHoleNameMap(new Map<string, string>(loaderData.holes.map((elem: FoilHole) => [elem.uuid, elem.foilhole_id])));
        },
        []
    )

    React.useEffect(
        () => {
            if(predictions){
                setPredictionMin(Math.min(...Array.from(predictions).map((k, v) => (k[1]))));
                setPredictionMax(Math.max(...Array.from(predictions).map((k, v) => (k[1]))));
            }
        },
        [predictions]
    )

    const url = apiUrl();

    return (
        <ThemeProvider theme={theme}>
            <Navbar/>
            <Stack direction="row" spacing={2}>
            <Container maxWidth="sm" content="center" style={{ width: "100%", paddingTop: "50px" }}>
                <Card variant="outlined">
                    <div style={{ display: "flex", flex: "1 0 300px", "position": "relative" }}>
                    <img src={`${url}/gridsquares/${params.squareId}/gridsquare_image`} />
                    <svg viewBox='0 0 4096 4096' style={{ "position": "absolute", "top": 0, "left": 0 }}>
                        {loaderData.holes.map((foilHole: FoilHole) => (
                        <Tooltip title={(showPredictions && predictions) ? `${foilHole.foilhole_id}: ${predictions.get(foilHole.uuid)?.toFixed(3)}` : foilHole.foilhole_id}>
                        <circle
                            key={foilHole.uuid}
                            cx={foilHole.x_location}
                            cy={foilHole.y_location}
                            r={predictions?.get(foilHole.uuid) ? (1.5*(predictions.get(foilHole.uuid)-predictionMin)/(predictionMax-predictionMin))*maxWidth / 2: foilHole.diameter / 2}
                            fillOpacity={0.5}
                            fill={latentRep ?
                                colourPalette[latentRep.get(foilHole.uuid).index] :
                                showPredictions ? 
                                predictions?.get(foilHole.uuid) ? 
                                predictions.get(foilHole.uuid) >= 0 ? 
                                "green" : 
                                "red": 
                                "dark gray": 
                                "purple"
                            }
                            strokeWidth={(foilHole.uuid === selectedHole) ? 0.25*foilHole.diameter: 0.1*foilHole.diameter}
                            strokeOpacity={1}
                            stroke={(foilHole.uuid === selectedHole) ? "orange": showPredictions ? predictions?.get(foilHole.uuid) ? predictions.get(foilHole.uuid) >= 0 ? "green": "red": "gray": "gray"}
                            onClick={() => handleSelectionClick(foilHole.uuid)}
                            onMouseOver={() => !selectionFrozen ? setSelectedHole(foilHole.uuid): {}}
                        />
                        </Tooltip>
                        ))}
                    </svg> 
                    </div>
                    <CardActions>
                        <Switch checked={showPredictions} onChange={handlePredictionChange} />
                        {
                            showPredictions ? 
                            <FormControl fullWidth>
                                <InputLabel id="model-select-label">Prediction Model</InputLabel>
                                <Select
                                    labelId="model-select-label"
                                    id="model-select"
                                    value={predictionModel}
                                    label="Prediction Model"
                                    onChange={handleChange}
                                >
                                    {
                                        (loaderData.models.map((model: PredictionModel) => (<MenuItem value={model.name}>{model.name}</MenuItem>)))
                                    }
                                </Select>
                            </FormControl> :
                            <></>
                        }
                        <Tooltip title={"Add latent panel"}>
                            <IconButton aria-label="add-panel" style={{"display": "flex", "marginLeft": "auto"}} onClick={() => setShowLatentSpace(true)}>
                                <AddIcon />
                            </IconButton>
                        </Tooltip>
                    </CardActions>
                </Card>
            </Container>
            <Container maxWidth="sm" content="center" style={{ width: "100%", paddingTop: "50px" }}>
            {
                showLatentSpace ? <Card>
                    { 
                        latentRep ?
                        <ScatterChart
                            height={500} 
                            series={
                                Array.from(latentRep).map((k, v) => 
                                    (  
                                        {
                                            label: k[0],
                                            id: k[0],
                                            data: [{x: k[1].x, y: k[1].y, id: k[0]}],
                                            markerSize: ((k[0] == selectedHole) || showUnselectedInLatentSpace) ? predictions ? 7 * (predictions?.get(k[0]) + 1)/2: 5: 0,
                                            color: k[0] == selectedHole ? "black" : colourPalette[k[1].index],
                                            valueFormatter: (v) => {
                                                if(!selectionFrozen) setSelectedHole(k[0]);
                                                return `${holeNameMap?.get(v?.id)}: ${k[1].index}`;
                                            },
                                        }
                                    )  
                                )
                            }
                            yAxis={[{ position: 'none' }]}
                            xAxis={[{ position: 'none' }]}
                            hideLegend={true}
                            onItemClick={(_: any, d: ScatterItemIdentifier) => handleSelectionClick(d.seriesId.toString())}
                        /> :
                        <></>
                        }
                    <CardActions>
                        <Tooltip title={"Show unselected holes"} onChange={(event: React.ChangeEvent<HTMLInputElement>) => {setShowUnselectedInLatentSpace(event.target.checked)}}>
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
                                {
                                    (loaderData.models.map((model: PredictionModel) => (<MenuItem value={model.name}>{model.name}</MenuItem>)))
                                }
                            </Select>
                        </FormControl>
                        <Tooltip title={"Close latent panel"}>
                        <IconButton aria-label="close-panel" style={{"display": "flex", "marginLeft": "auto"}} onClick={() => setShowLatentSpace(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                    </CardActions>
                </Card> :
                <></>
            }
            </Container>
            </Stack>
        </ThemeProvider>
    )
}
