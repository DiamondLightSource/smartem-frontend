import type { Route } from "./+types/product";

import { Container, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, ThemeProvider } from "@mui/material";
import Paper from '@mui/material/Paper';

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

  const handleClick = (event: React.MouseEvent<unknown>, gridId: number) => {
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
              </TableRow>
            </TableHead>
            <TableBody>
              {loaderData.result.map((grid: GridResponse) => {
                return (
                <TableRow hover onClick={(event) => {handleClick(event, grid.id)}} key={grid.id}>
                  <TableCell>{grid.id}</TableCell>
                  <TableCell>{grid.name}</TableCell>
                  <TableCell>{grid.status}</TableCell>
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

