import CloseIcon from '@mui/icons-material/Close'
import { Card, CardActions, CardContent, Container, IconButton, Tooltip } from '@mui/material'

import React from 'react'
import type { GridSquareResponse } from '../api/generated/models/gridSquareResponse'

import { apiUrl } from '../api/mutator'

type GridSquare = GridSquareResponse

export default function Atlas({
  params,
  onClose,
}: {
  params: { gridId: string }
  onClose: () => void
}) {
  // const [maxWidth, setMaxWidth] = React.useState(0);
  // const [squareNameMap, setSquareNameMap] = React.useState<Map<string, string>>()
  const [selectedSquare, setSelectedSquare] = React.useState('')
  const [squares, setSquares] = React.useState<GridSquare[]>([])

  const [selectionFrozen, setSelectionFrozen] = React.useState(false)

  const handleSelectionClick = (uuid: string) => {
    if (uuid === selectedSquare) {
      setSelectionFrozen(!selectionFrozen)
    } else {
      setSelectionFrozen(true)
      setSelectedSquare(uuid)
    }
  }

  React.useEffect(() => {
    const loadData = async () => {
      const gridsquares = await fetch(`${apiUrl()}/grids/${params.gridId}/gridsquares`)
      const squares = await gridsquares.json()
      setSquares(squares)
      return squares
    }
    loadData()
  }, [params.gridId])

  return (
    <Container maxWidth="sm" content="center" style={{ width: '100%' }}>
      <Card variant="outlined">
        <CardActions>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </CardActions>
        <CardContent>
          <div
            style={{
              display: 'flex',
              flex: '1 0 300px',
              position: 'relative',
            }}
          >
            <img src={`${apiUrl()}/grids/${params.gridId}/atlas_image`} alt="Grid atlas" />
            <svg viewBox="0 0 4005 4005" style={{ position: 'absolute', top: 0, left: 0 }}>
              <title>Grid squares overlay</title>
              {squares.map((gridSquare: GridSquare) => (
                <Tooltip key={gridSquare.uuid} title={gridSquare.gridsquare_id}>
                  <circle
                    role="button"
                    tabIndex={0}
                    cx={gridSquare.center_x ?? 0}
                    cy={gridSquare.center_y ?? 0}
                    r={gridSquare.size_width ? gridSquare.size_width / 2 : 0}
                    fillOpacity={0.5}
                    fill={'purple'}
                    strokeWidth={
                      gridSquare.uuid === selectedSquare
                        ? 0.25 * (gridSquare.size_width ?? 0)
                        : 0.1 * (gridSquare.size_width ?? 0)
                    }
                    onClick={() => handleSelectionClick(gridSquare.uuid)}
                    onMouseOver={() => (!selectionFrozen ? setSelectedSquare(gridSquare.uuid) : {})}
                    onFocus={() => !selectionFrozen && setSelectedSquare(gridSquare.uuid)}
                    strokeOpacity={1}
                    stroke={gridSquare.uuid === selectedSquare ? 'orange' : 'gray'}
                  />
                </Tooltip>
              ))}
            </svg>
          </div>
        </CardContent>
      </Card>
    </Container>
  )
}
