import type { Route } from "./+types/product";

import { Box, Container, Collapse, TableContainer, IconButton, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import Paper from '@mui/material/Paper';
import InsightsIcon from "@mui/icons-material/Insights";

import React from "react";

import type { components } from "../schema"

type GridSquareResponse = components["schemas"]["GridSquareResponse"]
type FoilHoleResponse = components["schemas"]["FoilHoleResponse"]
type SquareDetails = {
    square: GridSquareResponse,
    holes: FoilHoleResponse[];
}

export async function loader({ params }: Route.LoaderArgs) {
  const squares_response = await fetch(`http://localhost:8000/grids/${params.gridId}/gridsquares`);
  const squares_data: GridSquareResponse[] = await squares_response.json(); 
  const squares: SquareDetails[] = await Promise.all(squares_data.map((square) => fetch(`http://localhost:8000/gridsquares/${square.id}/foilholes`).then((response) => {return response.json()}).then((holes) => {return { square: square, holes: holes }})));
  return { squares };
}

const CollapsibleRow = ({ square, holes }: SquareDetails) => {
    const [open, setOpen] = React.useState(false);

    return (
        <React.Fragment>
            <TableRow hover onClick={() => {setOpen(!open)}} key={square.id}>
                <TableCell>{square.id}</TableCell>
                <TableCell>{square.name}</TableCell>
                <TableCell>{square.status}</TableCell>
                <TableCell>{holes.length}</TableCell>
                <TableCell>
                    <IconButton>
                        <InsightsIcon/>
                    </IconButton>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
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
    <div>
      <Container content="center" style={{ width: "100%", paddingTop: "25px" }}>
        <TableContainer component={Paper} style={{ width: "80%" }} sx={{ maxHeight: 650 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell style={{ backgroundColor: "orange" }}>Grid Square ID</TableCell>
                <TableCell style={{ backgroundColor: "orange" }}>Grid Square Name</TableCell>
                <TableCell style={{ backgroundColor: "orange" }}>Status</TableCell>
                <TableCell style={{ backgroundColor: "orange" }}>Number of Holes</TableCell>
                <TableCell style={{ backgroundColor: "orange" }}>More Info</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loaderData.squares.map((square: SquareDetails) => {
                return <CollapsibleRow square={square.square} holes={square.holes} />
              })
              }
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </div>
  );
}
