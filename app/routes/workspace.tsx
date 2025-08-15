import type { Route } from "./+types/product";

import { Container, ThemeProvider, Paper, IconButton, Menu, MenuItem, Stack } from "@mui/material";

import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";

import React from "react";

import { Navbar } from "../components/navbar";
import Atlas from "../components/atlas";
import { theme } from "../components/theme";

export async function loader({ params }: Route.LoaderArgs) {
  return {};
}


export default function Workspace({ loaderData, params }: Route.ComponentProps) {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [atlasView, setAtlasView] = React.useState(false);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    const addAtlasCard = () => {
        setAtlasView(true);
        setAnchorEl(null);
    };

    return (
        <ThemeProvider theme={theme}>
            <Navbar/>
            <Container content="center" style={{ width: "100%", paddingTop: "20px" }} >
                <Paper square={false} sx={{ backgroundColor: "#493657", width: "90%", padding: "10px", display: "flex" }} >
                    <Stack style={{ width: "100%" }}>
                        <Stack direction="row" style={{ width: "100%", display: "flex" }}>
                            <Stack direction="row">
                                <IconButton sx={{ marginRight: "auto" }} onClick={handleClick} >
                                    <KeyboardArrowDown />
                                </IconButton>
                                <IconButton sx={{ marginRight: "auto" }} onClick={handleClick} >
                                    <KeyboardArrowUp />
                                </IconButton>
                            </Stack>
                            <IconButton sx={{ marginLeft: "auto" }} onClick={handleClick} >
                                <AddIcon />
                            </IconButton>
                        </Stack>
                        <Menu
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleClose}
                        >
                            <MenuItem onClick={addAtlasCard}>Atlas</MenuItem>
                        </Menu>
                        {
                            atlasView ? <Atlas params={params} onClose={() => setAtlasView(false)}></Atlas>: <></>
                        }
                    </Stack>
                </Paper>
            </Container>
        </ThemeProvider>
    )
}