import type { Route } from "./+types/product";

import { Box, Container, Drawer, List, ListItem, ListItemButton, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, ThemeProvider } from "@mui/material";
import Paper from '@mui/material/Paper';

import React from "react";

import { useNavigate } from "react-router";

import type { components } from "../schema"

import { Navbar } from "../components/navbar";
import { theme } from "../components/theme";

type AcquisitionResponse = components["schemas"]["AcquisitionResponse"]

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const acquisitions = await fetch(`http://localhost:8000/acquisitions`);
  const result = await acquisitions.json();
  return { result };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const [menuToggle, setMenuToggle] = React.useState(false);

  const navigate = useNavigate();

  const handleClick = (event: React.MouseEvent<unknown>, acquisitionId: number) => {
    navigate(`/acquisitions/${acquisitionId}`);
  }

  return (
    <ThemeProvider theme={theme}>
      <Navbar/>
      <Container component="main" content="center" style={{ width: "100%", paddingTop: "50px"  }}>
        <TableContainer component={Paper} style={{ width: "80%" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell style={{ backgroundColor: "secondary" }}>Acquisition ID</TableCell>
                <TableCell>EPU ID</TableCell>
                <TableCell>Acquisition Name</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loaderData.result.map((acq: AcquisitionResponse) => {
                return (
                <TableRow hover onClick={(event) => handleClick(event, acq.id)} key={acq.id}>
                  <TableCell>{acq.id}</TableCell>
                  <TableCell>{acq.epu_id}</TableCell>
                  <TableCell>{acq.name}</TableCell>
                </TableRow>
                )
              })
              }
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      <Drawer open={menuToggle} onClose={() => setMenuToggle(false)}>
        <Box>
          <List>
            <ListItem>
              <ListItemButton>Models</ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </ThemeProvider>
  );
}

