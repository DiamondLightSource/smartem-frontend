import type { Route } from "./+types/product";

import { Accordion, AccordionActions, AccordionSummary, Button, Container, ThemeProvider, Tooltip, Typography, Grid, CardContent, Card } from "@mui/material";

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { useNavigate } from "react-router";

import type { components } from "../schema"

import { Navbar } from "../components/navbar";
import { theme } from "../components/theme";

type PredictionModelResponse = components["schemas"]["PredictionModelResponse"]


export async function loader({ params }: Route.LoaderArgs) {
  const models = await fetch(`http://localhost:8000/prediction_models`);
  const result = await models.json();
  return { result };
}

export default function PredictionModels({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  return (
    <ThemeProvider theme={theme}>
      <Navbar/>
      <Container content="center" style={{ width: "100%", paddingTop: "50px" }}>
        <Grid container spacing={3}>
            {loaderData.result.map(
                (model: PredictionModelResponse) => {
                    return (
                      <Grid size={2}>
                        <Card variant="outlined">
                            <CardContent>{model.prediction_model.name}</CardContent>
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography component="span">Grids</Typography>
                                </AccordionSummary>
                                <AccordionActions>
                                    {model.grids.map((grid) => {return <Tooltip title={grid.name}><Button onClick={() => {navigate(`/models/${model.prediction_model.name}/grids/${grid.id}/weights`)}}>{grid.id}</Button></Tooltip>})}
                                </AccordionActions>
                            </Accordion>
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
