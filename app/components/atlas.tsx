import type { Route } from "./+types/product";

import { Card, Container, Tooltip, ThemeProvider, CardContent, CardActions, IconButton } from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

import type { components } from "../schema"

import React from "react";

import { theme } from "../components/theme";

import { apiUrl } from "../utils/api";

type GridSquare = components["schemas"]["GridSquareResponse"]

export async function loader({ params }: Route.LoaderArgs) {
  const gridsquares = await fetch(`${apiUrl()}/grids/${params.gridId}/gridsquares`);
  const squares = await gridsquares.json();
  return { squares };
}


export default function Atlas({ params, onClose })  {
    // const [maxWidth, setMaxWidth] = React.useState(0);
    // const [squareNameMap, setSquareNameMap] = React.useState<Map<string, string>>()
    const [selectedSquare, setSelectedSquare] = React.useState("");
    const [squares, setSquares] = React.useState<GridSquare[]>([]);
  
    const [selectionFrozen, setSelectionFrozen] = React.useState(false);


    const handleSelectionClick = (uuid: string) => {
        if(uuid === selectedSquare){
            setSelectionFrozen(!selectionFrozen);
        }
        else{
            setSelectionFrozen(true);
            setSelectedSquare(uuid);
        }
    }

    React.useEffect(
        () => {
            const loadData = async () => {
                const gridsquares = await fetch(`${apiUrl()}/grids/${params.gridId}/gridsquares`);
                const squares = await gridsquares.json();
                setSquares(squares);
                return squares;
            }
            loadData();
        },
        []
    )

    return (
        <ThemeProvider theme={theme}>
            <Container maxWidth="sm" content="center" style={{ width: "100%", paddingTop: "50px" }}>
                <Card variant="outlined">
                    <CardActions>
                        <IconButton onClick={onClose}>
                            <CloseIcon/>
                        </IconButton>
                    </CardActions>
                    <CardContent>
                        <div style={{ display: "flex", flex: "1 0 300px", "position": "relative" }}>
                        <img src={`${apiUrl()}/grids/${params.gridId}/atlas_image`} />
                        <svg viewBox='0 0 4005 4005' style={{ "position": "absolute", "top": 0, "left": 0 }}>
                            {squares.map((gridSquare: GridSquare) => (
                            <Tooltip title={gridSquare.gridsquare_id}>
                            <circle
                                key={gridSquare.uuid}
                                cx={gridSquare.center_x}
                                cy={gridSquare.center_y}
                                r={gridSquare.size_width ? gridSquare.size_width / 2: 0}
                                fillOpacity={0.5}
                                fill={"purple"}
                                strokeWidth={(gridSquare.uuid === selectedSquare) ? 0.25*gridSquare.size_width: 0.1*gridSquare.size_width}
                                onClick={() => handleSelectionClick(gridSquare.uuid)}
                                onMouseOver={() => !selectionFrozen ? setSelectedSquare(gridSquare.uuid): {}}
                                strokeOpacity={1}
                                stroke={(gridSquare.uuid === selectedSquare) ? "orange": "gray"}
                            />
                            </Tooltip>
                            ))}
                        </svg> 
                        </div>
                    </CardContent>
                </Card>
            </Container>
        </ThemeProvider>
    )
}