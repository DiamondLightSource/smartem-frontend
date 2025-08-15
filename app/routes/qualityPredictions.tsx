import type { Route } from "./+types/product";

import { Box, Grid, ThemeProvider, Card, CardContent, Container, IconButton } from "@mui/material";
import { BarChart as BarChartIcon, Science, Timeline } from "@mui/icons-material";
import { BarChart, LineChart } from '@mui/x-charts';

import { Await, useNavigate } from "react-router";

import { bin } from "d3-array";

import React from "react";


import { Navbar } from "../components/navbar";
import { theme } from "../components/theme";
import { TimeSeriesChart } from "../components/timeseries";

import type { components } from "../schema"

import { apiUrl } from "../utils/api";

type QualityPrediction = components["schemas"]["QualityPrediction"]
type Score = components["schemas"]["Score"]
type PredictionResponse = { [key: string]: QualityPrediction[][] }

export async function loader({ params }: Route.LoaderArgs) {
  const grids = await fetch(`${apiUrl()}/gridsquares/${params.squareId}/quality_predictions`);
  const weightedPredictions: Promise<Score[][]> = fetch(`${apiUrl()}/gridsquares/${params.squareId}/weighted_predictions`)
    .then((response) => {return response.json()})
    .then((scores) => { return Object.entries(scores as {[key: number]: Score[]}).map(([fh, elem]) => {return elem}) })
    .then(m => {return m[0].map((x,i) => {return m.map(x => x[i])})})
  ;
  //const weightedPredictions = weightedPredictionsAll.map((elem) => {return elem.reduce((a, b) => a + b.value, 0) / elem.length});
  //const predictionTimes = weightedPredictionsAll.map((elem) => {return Date.parse(elem[0].timestamp)});
  const result  = await grids.json();
  return { result, weightedPredictions };
}

const PredictionCharts = ({ predictions }: { predictions: QualityPrediction[][] }) => {
  const [showTimeSeries, setShowTimeSeries] = React.useState(false);
  const histGenerator = bin().domain([0, 1]).thresholds(19);

  const ChartSwitcher = () => {
    return <IconButton onClick={() => {setShowTimeSeries(!showTimeSeries)}} sx={{ marginBottom: "auto" }}>
      {showTimeSeries ? <BarChartIcon/>: <Timeline/>}
    </IconButton>
  }

  return (predictions.length > 1 ? 
    showTimeSeries ?
    <Box sx={{ display: "flex", alignItems: "center", margin: "5px" }}>
      <LineChart
          hideLegend
          grid={{ horizontal: true }}
          xAxis={predictions.map((elem) => {
            return {
                id: `timestamp-${elem.slice(-1)[0].foilhole_id}`,
                data: elem.map((e) => {return e.timestamp? Date.parse(e.timestamp): 0}),
                scaleType: "time",
            }})
          }
          series={predictions.map((elem) => {
            return {
                id: `prediction-${elem.slice(-1)[0].foilhole_id}`,
                data: elem.map((e) => {return e.value}),
                label: elem.slice(-1)[0].foilhole_id?.toString()
            }})
          }
          yAxis={[{ min:0, max: 1 }]}
          height={400}
      />
      <ChartSwitcher/>
    </Box>:
    <Box sx={{ display: "flex", alignItems: "center", margin: "5px" }}>
      <BarChart 
        xAxis={[{ scaleType: "band", 
                  data: histGenerator(
                    predictions.map((elem) => {
                      return elem.slice(-1)[0].value})).map((b) => {return (b.x0 !== undefined && b.x1 !== undefined) ? 
                        b.x0 + (b.x1-b.x0): 0}) 
                }]} 
        series={[{ 
          data: histGenerator(predictions.map((elem) => {return elem.slice(-1)[0].value})).map((b) => {return b.length}),
          color: "#5C9EAD" 
        }]} />
      <ChartSwitcher/>
    </Box>: <></>
  )
}


export default function QualityPredictionsForSquare({ loaderData, params }: Route.ComponentProps) {
  const navigate = useNavigate();

  const mostRecentsMean = (arr: QualityPrediction[][]) => {
    const mostRecents = arr.map((el) => {return el.slice(-1)[0].value});
    return mostRecents.reduce((a: number, b: number) => a + b, 0) / mostRecents.length;
  }

  return <ThemeProvider theme={theme}>
    <Navbar/>
    <Container content="center" style={{ width: "100%", paddingTop: "50px" }}> 
      <React.Suspense fallback={
        <TimeSeriesChart xData={[]} yData={[]} />
      }
      >
        <Await resolve={loaderData.weightedPredictions}>
          {(result: Score[][]) => 
            <TimeSeriesChart 
              xData={result.map((elem) => {return Date.parse(elem[0].timestamp)})} 
              yData={result.map((elem) => {return elem.reduce((a, b) => a + b.value, 0) / elem.length})}
            />
          }
        </Await>
      </React.Suspense>
      <Grid container spacing={3} sx={{ padding: "20px" }}>
        {      
          Object.entries(loaderData.result as PredictionResponse).map(([key, value]) => 
            {return (
              <Grid size={4}>
                <Card>
                  <Box sx={{ display: "flex", alignItems: "center", margin: "5px" }}>                
                    <CardContent>Model: {key}</CardContent>
                    <IconButton onClick={() => {navigate(`/models/${key}/grids/${params.gridId}/weights`)}} style={{ marginLeft: "auto" }}>
                      <Science/>
                    </IconButton>  
                  </Box>
                  <CardContent sx={{ margin: "5px" }}>
                    {mostRecentsMean(value).toLocaleString(undefined, { maximumSignificantDigits: 3, minimumSignificantDigits: 3 })}
                  </CardContent>
                  <CardContent>
                    <PredictionCharts predictions={value} />
                  </CardContent>
                </Card>
              </Grid>
            )
          })
        }
      </Grid>
    </Container>
  </ThemeProvider>
}
