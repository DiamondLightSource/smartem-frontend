import type { Route } from "./+types/product";

import { Box, Grid, ThemeProvider, Card, CardContent, Container, IconButton, Typography } from "@mui/material";
import { Science } from "@mui/icons-material";
import { BarChart } from '@mui/x-charts';

import { useNavigate } from "react-router";

import { bin } from "d3-array";

import { Navbar } from "../components/navbar";
import { theme } from "../components/theme";

import type { components } from "../schema"

type QualityPrediction = components["schemas"]["QualityPrediction"]
type PredictionResponse = { [key: string]: QualityPrediction[][] }

export async function loader({ params }: Route.LoaderArgs) {
  const grids = await fetch(`http://localhost:8000/gridsquares/${params.squareId}/quality_predictions`);
  const result  = await grids.json();
  return { result };
}

export default function QualityPredictionsForSquare({ loaderData, params }: Route.ComponentProps) {
  const navigate = useNavigate();

  const mostRecentsMean = (arr: QualityPrediction[][]) => {
    const mostRecents = arr.map((el) => {return el.slice(-1)[0].value});
    return mostRecents.reduce((a: number, b: number) => a + b, 0) / mostRecents.length;
  }

  const histGenerator = bin().domain([0, 1]).thresholds(19);

  return <ThemeProvider theme={theme}>
    <Navbar/>
    <Container content="center" style={{ width: "100%", paddingTop: "50px" }}> 
      <Grid container spacing={3}>
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
                </Card>
                {value.length > 1 ? <BarChart xAxis={[{ scaleType: "band", data: histGenerator(value.map((elem) => {return elem.slice(-1)[0].value})).map((b) => {return (b.x0 !== undefined && b.x1 !== undefined) ? b.x0 + (b.x1-b.x0): 0}) }]} series={[{ data: histGenerator(value.map((elem) => {return elem.slice(-1)[0].value})).map((b) => {return b.length}) }]} />: <></>}
              </Grid>
            )
          })
        }
      </Grid>
    </Container>
  </ThemeProvider>
}
