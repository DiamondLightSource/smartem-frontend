import type { Route } from "./+types/product";

import { Container, ThemeProvider, Grid, CardContent, Card, CardHeader } from "@mui/material";

import Avatar from "boring-avatars";

import { useNavigate } from "react-router";

import type { components } from "../schema"

import { Navbar } from "../components/navbar";
import { theme } from "../components/theme";

import { apiUrl } from "../utils/api";

type PredictionModelResponse = components["schemas"]["QualityPredictionModelResponse"]


export async function loader({ params }: Route.LoaderArgs) {
  const models = await fetch(`${apiUrl()}/prediction_models`);
  const result = await models.json();
  return { result };
}

export default function PredictionModels({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  return (
    <ThemeProvider theme={theme}>
      <Navbar/>
      <Container content="center" style={{ width: "100%", paddingTop: "50px" }}>
        <Grid container spacing={1}>
            {loaderData.result.map(
                (model: PredictionModelResponse) => {
                    return (
                      <Grid size={4}>
                        <Card variant="outlined">
                            <CardHeader
                              avatar={
                                <Avatar name={model.name} variant="ring" size={60}/>
                              }
                              title={model.name}
                            />
                            <CardContent>{model.description}</CardContent>
                        </Card>
                    </Grid>
                    )
                })
            }
        </Grid>
      </Container>
    </ThemeProvider>
  );
}
