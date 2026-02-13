import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardHeader,
  CardMedia,
  Checkbox,
  CircularProgress,
  Container,
  Grid,
  Pagination,
  ThemeProvider,
} from '@mui/material'
import type { GridSquareResponse } from '@smartem/api'
import { useGetGridGridsquaresGridsGridUuidGridsquaresGet } from '@smartem/api'
import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { Navbar } from '../components/navbar'
import { theme } from '../components/theme'

function GridSquareGallery() {
  const { gridId } = Route.useParams()
  const {
    data: squares,
    isLoading,
    error,
  } = useGetGridGridsquaresGridsGridUuidGridsquaresGet(gridId)

  const [pageIndex, setPageIndex] = React.useState(0)
  const [numPages, setNumPages] = React.useState(Math.ceil((squares?.length || 0) / 9))
  const [showCollectedOnly, setShowCollectedOnly] = React.useState(false)
  const [filteredSquares, setFilteredSquares] = React.useState<GridSquareResponse[]>([])

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPageIndex(value - 1)
  }

  const sizeComparator = React.useCallback((gs01: GridSquareResponse, gs02: GridSquareResponse) => {
    if (gs01.size_height === null || gs01.size_width === null) return 1
    else if (gs02.size_height === null || gs02.size_width === null) return -1
    return gs02.size_width * gs02.size_height - gs01.size_width * gs01.size_height
  }, [])

  React.useEffect(() => {
    if (squares) {
      setFilteredSquares(
        showCollectedOnly
          ? squares
              .filter((square: GridSquareResponse) => {
                return square.image_path !== null
              })
              .sort(sizeComparator)
          : squares.sort(sizeComparator)
      )
    }
  }, [showCollectedOnly, squares, sizeComparator])

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
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">Error loading grid squares: {String(error)}</Alert>
        ) : (
          <>
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
                .map((square: GridSquareResponse) => {
                  return (
                    <Grid size={1} key={square.uuid}>
                      <Card
                        variant="outlined"
                        sx={{
                          maxWidth: 256,
                          backgroundColor: square.image_path ? '#5C9EAD' : '#b927d9',
                        }}
                      >
                        <CardActionArea>
                          <CardHeader title={square.gridsquare_id} />
                          <CardMedia
                            component="img"
                            image={`http://localhost:8000/grids/${gridId}/atlas_image?x=${square.center_x}&y=${square.center_y}&w=${square.size_width}&h=${square.size_height}`}
                          />
                        </CardActionArea>
                      </Card>
                    </Grid>
                  )
                })}
            </Grid>
          </>
        )}
      </Container>
    </ThemeProvider>
  )
}

export const Route = createFileRoute('/acquisitions/$acqId/grids/$gridId/gridsquares')({
  component: GridSquareGallery,
})
