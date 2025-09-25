import type { Route } from './+types/product'

import {
  Card,
  CardMedia,
  Container,
  ThemeProvider,
  Checkbox,
  CardHeader,
  CardActionArea,
  Grid,
  Pagination,
} from '@mui/material'

import type { components } from '../schema'

import React from 'react'

import { Navbar } from '../components/navbar'
import { theme } from '../components/theme'

import { apiUrl } from '../utils/api'

type GridSquare = components['schemas']['GridSquareResponse']

export async function loader({ params }: Route.LoaderArgs) {
  const gridsquares = await fetch(
    `${apiUrl()}/grids/${params.gridId}/gridsquares`
  )
  const squares = await gridsquares.json()
  return { squares }
}

export default function GridSquareGallery({
  loaderData,
  params,
}: Route.ComponentProps) {
  const [pageIndex, setPageIndex] = React.useState(0)
  const [numPages, setNumPages] = React.useState(
    Math.ceil(loaderData.squares.length / 9)
  )
  const [showCollectedOnly, setShowCollectedOnly] = React.useState(false)
  const [filteredSquares, setFilteredSquares] = React.useState<GridSquare[]>([])

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPageIndex(value - 1)
  }

  const sizeComparator = (gs01: GridSquare, gs02: GridSquare) => {
    if (gs01.size_height === null || gs01.size_width === null) return 1
    else if (gs02.size_height === null || gs02.size_width === null) return -1
    return (
      gs02.size_width * gs02.size_height - gs01.size_width * gs01.size_height
    )
  }

  React.useEffect(() => {
    setFilteredSquares(
      showCollectedOnly
        ? loaderData.squares
            .filter((square: GridSquare) => {
              return square.image_path !== null
            })
            .sort(sizeComparator)
        : loaderData.squares.sort(sizeComparator)
    )
  }, [showCollectedOnly])

  React.useEffect(() => {
    setNumPages(Math.ceil(filteredSquares.length / 9))
  }, [filteredSquares])

  return (
    <ThemeProvider theme={theme}>
      <Navbar />
      <Container
        maxWidth="sm"
        content="center"
        style={{
          width: '100%',
          paddingTop: '50px',
          paddingBottom: '50px',
          borderColor: 'gray',
          borderWidth: '5px',
        }}
      >
        <Pagination
          count={numPages}
          color="primary"
          onChange={handlePageChange}
          sx={{ padding: '20px' }}
        />
        <Checkbox
          checked={showCollectedOnly}
          onChange={(event) => setShowCollectedOnly(event.target.checked)}
        />
        <Grid container spacing={2} columns={3}>
          {filteredSquares
            .slice(9 * pageIndex, 9 * (pageIndex + 1))
            .map((square: GridSquare) => {
              return (
                <Grid size={1}>
                  <Card
                    variant="outlined"
                    sx={{
                      maxWidth: 256,
                      backgroundColor: square.image_path
                        ? '#5C9EAD'
                        : '#b927d9',
                    }}
                  >
                    <CardActionArea>
                      <CardHeader title={square.gridsquare_id} />
                      <CardMedia
                        component="img"
                        image={`${apiUrl()}/grids/${params.gridId}/atlas_image?x=${square.center_x}&y=${square.center_y}&w=${square.size_width}&h=${square.size_height}`}
                      />
                    </CardActionArea>
                  </Card>
                </Grid>
              )
            })}
        </Grid>
      </Container>
    </ThemeProvider>
  )
}
