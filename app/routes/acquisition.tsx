import type { Route } from "./+types/product";

import { Container, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, ThemeProvider, IconButton } from "@mui/material";
import Paper from '@mui/material/Paper';
import GridOnIcon from '@mui/icons-material/GridOn';

import { useNavigate } from "react-router";

import type { components } from "../schema"

import { Navbar } from "../components/navbar";
import { theme } from "../components/theme";

type GridResponse = components["schemas"]["GridResponse"]


export async function loader({ params }: Route.LoaderArgs) {
  const grids = await fetch(`http://localhost:8000/acquisitions/${params.acqId}/grids`);
  const result = await grids.json();
  return { result };
}

export default function Acquisition({ loaderData, params }: Route.ComponentProps) {
  const navigate = useNavigate();

  const handleClick = (event: React.MouseEvent<unknown>, gridId: string) => {
    navigate(`/acquisitions/${params.acqId}/grids/${gridId}`);
  }

  return (
    <ThemeProvider theme={theme}>
      <Navbar/>
      <Container content="center" style={{ width: "100%", paddingTop: "50px" }}>
        <TableContainer component={Paper} style={{ width: "80%" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Grid ID</TableCell>
                <TableCell>Grid Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Atlas</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loaderData.result.map((grid: GridResponse) => {
                return (
                <TableRow hover key={grid.uuid}>
                  <TableCell onClick={(event) => {handleClick(event, grid.uuid)}}>{grid.uuid}</TableCell>
                  <TableCell onClick={(event) => {handleClick(event, grid.uuid)}}>{grid.name}</TableCell>
                  <TableCell onClick={(event) => {handleClick(event, grid.uuid)}}>{grid.status}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => navigate(`./grids/${grid.uuid}/atlas`, { relative: "path" })}>
                      <GridOnIcon/>
                    </IconButton>
                  </TableCell>
                </TableRow>
                )
              })
              }
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </ThemeProvider>
  );
}

