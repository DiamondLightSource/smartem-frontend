import type { Route } from './+types/product'

import {
  Box,
  Container,
  Collapse,
  TableContainer,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  ThemeProvider,
  CircularProgress,
  TableSortLabel,
  Alert,
} from '@mui/material'
import Paper from '@mui/material/Paper'
import InsightsIcon from '@mui/icons-material/Insights'

import React from 'react'
import { useNavigate, Await } from 'react-router'
import { useQueries } from '@tanstack/react-query'

import { Navbar } from '../components/navbar'
import { theme } from '../components/theme'
import { useGetGridSquares } from '../hooks/useApi'
import { api, queryKeys } from '../hooks/useApi'
import type {
  GridSquareResponse,
  FoilHoleResponse,
} from '../utils/api'

type SquareDetails = {
  square: GridSquareResponse
  holes: FoilHoleResponse[]
}
type HolePrediction = {
  prediction: number
  hole: string
}
type FullSquareDetails = {
  square: GridSquareResponse
  holes: FoilHoleResponse[]
  weightedPredictions: HolePrediction[] | null
}

const CollapsibleRow = ({
  square,
  holes,
  weightedPredictions,
}: FullSquareDetails) => {
  const [open, setOpen] = React.useState(false)
  const [sortOrderDescending, setSortOrderDescending] = React.useState(true)
  const navigate = useNavigate()

  let weightedPrediction = null
  const holeWeights = new Map()
  if (weightedPredictions) {
    weightedPrediction =
      weightedPredictions.reduce(
        (a: number, b: HolePrediction) => a + b.prediction,
        0
      ) / weightedPredictions.length
    weightedPredictions.map((elem) =>
      holeWeights.set(elem.hole, elem.prediction)
    )
  }

  const holeWeightComparator = (a: FoilHoleResponse, b: FoilHoleResponse) => {
    if (sortOrderDescending) {
      if (holeWeights.get(a.foilhole_id) < holeWeights.get(b.foilhole_id))
        return 1
      else if (holeWeights.get(a.foilhole_id) > holeWeights.get(b.foilhole_id))
        return -1
      return 0
    } else {
      if (holeWeights.get(a.foilhole_id) < holeWeights.get(b.foilhole_id))
        return -1
      else if (holeWeights.get(a.foilhole_id) > holeWeights.get(b.foilhole_id))
        return 1
      return 0
    }
  }

  return (
    <React.Fragment>
      <TableRow
        hover
        onClick={() => {
          setOpen(!open)
        }}
        key={square.uuid}
      >
        <TableCell>{square.uuid}</TableCell>
        <TableCell>{square.gridsquare_id}</TableCell>
        <TableCell>{square.status}</TableCell>
        <TableCell>{holes.length}</TableCell>
        {weightedPrediction === null ? (
          <TableCell>
            <CircularProgress size={25} />
          </TableCell>
        ) : (
          <TableCell>
            {isNaN(weightedPrediction)
              ? 0
              : weightedPrediction.toLocaleString(undefined, {
                  minimumSignificantDigits: 3,
                  maximumSignificantDigits: 3,
                })}
          </TableCell>
        )}
        <TableCell>
          <IconButton
            onClick={() =>
              navigate(`./square/${square.uuid}/predictions`, {
                relative: 'path',
              })
            }
          >
            <InsightsIcon />
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
                    <TableCell style={{ backgroundColor: 'silver' }}>
                      Hole Name
                    </TableCell>
                    <TableCell style={{ backgroundColor: 'silver' }}>
                      <TableSortLabel
                        active={true}
                        direction={sortOrderDescending ? 'desc' : 'asc'}
                        onClick={() => {
                          setSortOrderDescending(!sortOrderDescending)
                        }}
                      >
                        Score
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {holes.sort(holeWeightComparator).map((hole) => {
                    return (
                      <TableRow key={hole.uuid}>
                        <TableCell>{hole.foilhole_id}</TableCell>
                        {weightedPrediction === null ? (
                          <TableCell>
                            <CircularProgress size={10} />
                          </TableCell>
                        ) : (
                          <TableCell>
                            {holeWeights.get(hole.foilhole_id) ??
                              weightedPrediction}
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  )
}

export default function Grid({ params }: Route.ComponentProps) {
  const [holeNumberOrder, setHoleNumberOrder] = React.useState(true)
  const [sortOrderDescending, setSortOrderDescending] = React.useState(true)

  const {
    data: squares_data,
    isLoading: squaresLoading,
    error: squaresError,
  } = useGetGridSquares(params.gridId)

  // Fetch foil holes for each grid square with image_path
  const foilHoleQueries = useQueries({
    queries:
      squares_data?.map((square) => ({
        queryKey: queryKeys.foilHoles.byGridSquare(square.uuid),
        queryFn: () => api.getFoilHoles(square.uuid),
        enabled: !!square.image_path,
      })) || [],
  })

  const squares: SquareDetails[] = React.useMemo(() => {
    if (!squares_data) return []
    return squares_data.map((square, index) => ({
      square,
      holes: foilHoleQueries[index]?.data || [],
    }))
  }, [squares_data, foilHoleQueries])

  const isLoading = squaresLoading || foilHoleQueries.some((q) => q.isLoading)
  const error =
    squaresError || foilHoleQueries.find((q) => q.error)?.error

  console.log(squares)

  const holeNumberComparator = (a: SquareDetails, b: SquareDetails) => {
    if (sortOrderDescending) {
      if (a.holes.length < b.holes.length) return 1
      else if (a.holes.length > b.holes.length) return -1
      return 0
    } else {
      if (a.holes.length < b.holes.length) return -1
      else if (a.holes.length > b.holes.length) return 1
      return 0
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Navbar />
      <Container content="center" style={{ width: '100%', paddingTop: '25px' }}>
        <TableContainer
          component={Paper}
          style={{ width: '80%' }}
          sx={{ maxHeight: 650 }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Grid Square ID</TableCell>
                <TableCell>Grid Square Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell
                  sortDirection={
                    holeNumberOrder
                      ? sortOrderDescending
                        ? 'desc'
                        : 'asc'
                      : false
                  }
                >
                  <TableSortLabel
                    active={holeNumberOrder}
                    direction={sortOrderDescending ? 'desc' : 'asc'}
                    onClick={() => {
                      setSortOrderDescending(!sortOrderDescending)
                    }}
                  >
                    Number of Holes
                  </TableSortLabel>
                </TableCell>
                <TableCell>Score</TableCell>
                <TableCell>More Info</TableCell>
              </TableRow>
            </TableHead>
            <React.Suspense
              fallback={
                <TableBody>
                  {loaderData.squares.map(
                    (square: SquareDetails, i: number) => {
                      return (
                        <CollapsibleRow
                          square={square.square}
                          holes={square.holes}
                          weightedPredictions={null}
                        />
                      )
                    }
                  )}
                </TableBody>
              }
            >
              <Await resolve={loaderData.weightedPredictions}>
                {(result) => {
                  const mapResult: Map<string, HolePrediction[]> = new Map(
                    result
                  )
                  return (
                    <TableBody>
                      {loaderData.squares
                        .sort(holeNumberComparator)
                        .map((square: SquareDetails) => {
                          return (
                            <CollapsibleRow
                              square={square.square}
                              holes={square.holes}
                              weightedPredictions={
                                mapResult.get(square.square.gridsquare_id) ?? []
                              }
                            />
                          )
                        })}
                    </TableBody>
                  )
                }}
              </Await>
            </React.Suspense>
          </Table>
        </TableContainer>
      </Container>
    </ThemeProvider>
  )
}
