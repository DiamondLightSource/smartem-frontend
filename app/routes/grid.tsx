import type { Route } from "./+types/product";

import { Box, Container, Collapse, TableContainer, IconButton, Table, TableHead, TableRow, TableCell, TableBody, ThemeProvider, CircularProgress } from "@mui/material";
import Paper from '@mui/material/Paper';
import InsightsIcon from "@mui/icons-material/Insights";

import React from "react";
import { useNavigate, Await } from "react-router";

import type { components } from "../schema"

import { Navbar } from "../components/navbar";
import { theme } from "../components/theme";

type GridSquareResponse = components["schemas"]["GridSquareResponse"]
type FoilHoleResponse = components["schemas"]["FoilHoleResponse"]
type Score = components["schemas"]["Score"]
type SquareDetails = {
    square: GridSquareResponse,
    holes: FoilHoleResponse[];
}
type FullSquareDetails = {
    square: GridSquareResponse,
    holes: FoilHoleResponse[],
    weightedPrediction: number | null;
}

export async function loader({ params }: Route.LoaderArgs) {
  const squares_response = await fetch(`http://localhost:8000/grids/${params.gridId}/gridsquares`);
  const squares_data: GridSquareResponse[] = await squares_response.json(); 
  const squares = await Promise.all(
    squares_data.map((square) => fetch(`http://localhost:8000/gridsquares/${square.id}/foilholes`)
    .then((response) => {return response.json()})
    .then((holes) => {return { square: square, holes: holes }}))
  );
  const weightedPredictions: Promise<number[][]> = Promise.all(
    squares_data.map((square) => fetch(`http://localhost:8000/gridsquares/${square.id}/weighted_predictions`)
    .then((response) => {return response.json()})
    .then((scores) => { return Object.entries(scores as {[key: number]: Score[]}).map(([fh, elem]) => {return elem.slice(-1)[0].value}) }))
  );
  // const weightedPredictions = weightedPredictionsAll.map((elem) => {return elem.reduce((a: number, b: number) => a + b, 0) / elem.length});
  return { squares, weightedPredictions };
}

const CollapsibleRow = ({ square, holes, weightedPrediction }: FullSquareDetails) => {
    const [open, setOpen] = React.useState(false);
    const navigate = useNavigate();

    return (
        <React.Fragment>
            <TableRow hover onClick={() => {setOpen(!open)}} key={square.id}>
                <TableCell>{square.id}</TableCell>
                <TableCell>{square.name}</TableCell>
                <TableCell>{square.status}</TableCell>
                <TableCell>{holes.length}</TableCell>
                {(weightedPrediction === null) ?
                <TableCell>
                  <CircularProgress size={25}/>
                </TableCell>:
                <TableCell>
                  {isNaN(weightedPrediction) ? 0: 
                  weightedPrediction.toLocaleString(undefined, { minimumSignificantDigits: 3, maximumSignificantDigits: 3 })}
                </TableCell>
                }
                <TableCell>
                    <IconButton onClick={() => navigate(`./square/${square.id}/predictions`, { relative: "path" })}>
                        <InsightsIcon/>
                    </IconButton>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell style={{ backgroundColor: "silver" }}>Hole Name</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {holes.map((hole) => {return <TableRow key={hole.id}><TableCell>{hole.name}</TableCell></TableRow>})}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
}

export default function Grid({ loaderData }: Route.ComponentProps) {
  return (
    <ThemeProvider theme={theme}>
      <Navbar/>
      <Container content="center" style={{ width: "100%", paddingTop: "25px" }}>
        <TableContainer component={Paper} style={{ width: "80%" }} sx={{ maxHeight: 650 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Grid Square ID</TableCell>
                <TableCell>Grid Square Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Number of Holes</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>More Info</TableCell>
              </TableRow>
            </TableHead>
            <React.Suspense fallback={
              <TableBody>
                {loaderData.squares.map((square: SquareDetails, i: number) => {
                  return <CollapsibleRow square={square.square} holes={square.holes} weightedPrediction={null} />
                })
                }
              </TableBody>
            }>
            <Await resolve={loaderData.weightedPredictions}>
              { (result) =>
              <TableBody>
                {loaderData.squares.map((square: SquareDetails, i: number) => {
                  return <CollapsibleRow square={square.square} holes={square.holes} weightedPrediction={(result[i]).reduce((a: number, b: number) => a + b, 0) / result[i].length} />
                })
                }
              </TableBody>
}
            </Await>
          </React.Suspense>
          </Table>
        </TableContainer>
      </Container>
    </ThemeProvider>
  );
}
