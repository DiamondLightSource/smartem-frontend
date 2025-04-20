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

export async function loader({ params }: Route.LoaderArgs) {
  const models = await fetch(`http://localhost:8000/prediction_models/${params.modelName}/grids/${params.gridId}/weights`);
  const result = await models.json();
  return { result };
}

export default function PredictionModelWeights({ loaderData }: Route.ComponentProps) {
  const [axisScale, setAxisScale] = React.useState(true);

  const weightArray = loaderData.result.map((elem: ModelWeightResponse) => {return elem.weight});
  const weightAverage = weightArray.reduce((a: number, b: number) => a + b, 0) / weightArray.length;
  const weightAverageLastTenPercent = weightArray.slice(-(weightArray.length / 10)).reduce((a: number, b: number) => a + b, 0) / (weightArray.length / 10);
  const weightSdev = Math.sqrt(weightArray.map((x: number) => Math.pow(x - weightAverage, 2)).reduce((a: number, b: number) => a + b) / weightArray.length);
  const currentWeight = weightArray.slice(-1)[0];

  return (
    <div>
    <ThemeProvider theme={theme}>
      <Navbar/>
      <Container component="main" content="center" style={{ width: "100%", paddingTop: "50px"  }}>
          <Grid container spacing={2} columns={{ xs: 10 }}>
            <Grid size={8}>
              <LineChart
                  dataset={loaderData.result}
                  grid={{ horizontal: true }}
                  xAxis={[
                  {
                      id: 'Timestamp',
                      dataKey: 'timestamp',
                      scaleType: axisScale ? "time": "band",

                  },
                  ]}
                  series={[
                  {
                      id: 'Weight',
                      dataKey: 'weight',
                  },
                  ]}
                  height={400}
              />
            </Grid>
            <Grid size={2}>
              <List>
                <ListItem style={{ backgroundColor: "#303030", margin: "2px" }}>
                  <ListItemText primary={"Mean weight"} secondary={weightAverage.toLocaleString(undefined, { maximumSignificantDigits: 3 })} />
                </ListItem>
                <ListItem style={{ backgroundColor: "#303030", margin: "2px" }}>
                  <ListItemText primary={"Current weight"} secondary={currentWeight.toLocaleString(undefined, { maximumSignificantDigits: 3 })} />
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "#b927d9" }}>
                      {currentWeight > weightAverageLastTenPercent ? <ArrowUpwardIcon/>: <ArrowDownwardIcon/>}
                    </Avatar>
                  </ListItemAvatar>
                </ListItem>
                <ListItem style={{ backgroundColor: "#303030", margin: "2px" }}>
                  <ListItemText primary={"Weight standard deviation"} secondary={weightSdev.toLocaleString(undefined, { maximumSignificantDigits: 3 })} />
                  <ListItemText style={{ color: weightSdev > 0.2 ? "red": weightSdev > 0.1 ? "yellow": "green", textAlign: "center" }} primary={weightSdev > 0.2 ? "Highly uncertain": weightSdev > 0.1 ? "Uncertain": "Confident"} />
                </ListItem>
              </List>
            </Grid>
            <Grid size={1}>
              <FormControlLabel control={<Switch defaultChecked={true} />} onChange={(event) => {setAxisScale(!axisScale)}} label="Scaling" />
            </Grid>
          </Grid>
      </Container>
    </ThemeProvider>
    </div>
  );
}