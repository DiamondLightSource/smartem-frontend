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

export async function loader({ params }: Route.LoaderArgs) {
  const models = await fetch(`http://localhost:8000/prediction_models/${params.modelName}/grids/${params.gridId}/weights`);
  const result = await models.json();
  const xData = result.map((elem: ModelWeightResponse) => {return Date.parse(elem.timestamp)});
  const yData = result.map((elem: ModelWeightResponse) => {return elem.weight});
  return { xData, yData };
}

export default function PredictionModelWeights({ loaderData }: Route.ComponentProps) {

  return (
    <div>
    <ThemeProvider theme={theme}>
      <Navbar/>
      <Container component="main" content="center" style={{ width: "100%", paddingTop: "50px"  }}>
          <TimeSeriesChart xData={loaderData.xData} yData={loaderData.yData} />
      </Container>
    </ThemeProvider>
    </div>
  );
}