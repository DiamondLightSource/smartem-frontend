import type { Route } from "./+types/product";

import { Avatar, ThemeProvider, Switch, FormControlLabel, Container, Grid, List, ListItem, ListItemText, ListItemAvatar } from "@mui/material";
import { LineChart } from '@mui/x-charts';

import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import React from "react";

import type { components } from "../schema"

type ModelWeightResponse  = components["schemas"]["ModelWeightResponse"]

import { Navbar } from "../components/navbar";
import { theme } from "../components/theme";
import { TimeSeriesChart } from "../components/timeseries";
import { Await } from "react-router";

import { apiUrl } from "../utils/api";

export async function loader({ params }: Route.LoaderArgs) {
  const models = await fetch(`${apiUrl()}/prediction_models/${params.modelName}/grids/${params.gridId}/weights`);
  const result = models.json();
  return { result };
}

export default function PredictionModelWeights({ loaderData }: Route.ComponentProps) {

  return (
    <div>
    <ThemeProvider theme={theme}>
      <Navbar/>
      <Container component="main" content="center" style={{ width: "100%", paddingTop: "50px"  }}>
          <React.Suspense fallback={
            <TimeSeriesChart xData={[]} yData={[]} />
          }>
          <Await resolve={loaderData.result}>
            {(result) => 
              <TimeSeriesChart 
                xData={result.map((elem: ModelWeightResponse) => {return Date.parse(elem.timestamp)})} 
                yData={result.map((elem: ModelWeightResponse) => {return elem.weight})} 
              />
            }          
          </Await>
          </React.Suspense>
      </Container>
    </ThemeProvider>
    </div>
  );
}