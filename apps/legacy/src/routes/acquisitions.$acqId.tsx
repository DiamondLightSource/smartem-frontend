import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ThemeProvider,
} from '@mui/material'
import Paper from '@mui/material/Paper'
import type { GridResponse } from '@smartem/api'
import { useGetAcquisitionGridsAcquisitionsAcquisitionUuidGridsGet } from '@smartem/api'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Navbar } from '../components/navbar'
import { theme } from '../components/theme'

function Acquisition() {
  const { acqId } = Route.useParams()
  const navigate = useNavigate()
  const {
    data: grids,
    isLoading,
    error,
  } = useGetAcquisitionGridsAcquisitionsAcquisitionUuidGridsGet(acqId)

  const handleClick = (_event: React.MouseEvent<unknown>, gridId: string) => {
    navigate({
      to: '/acquisitions/$acqId/grids/$gridId/atlas',
      params: { acqId, gridId },
    })
  }

  return (
    <ThemeProvider theme={theme}>
      <Navbar />
      <Container content="center" style={{ width: '100%', paddingTop: '50px' }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">Error loading grids: {String(error)}</Alert>
        ) : (
          <TableContainer component={Paper} style={{ width: '80%' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Grid ID</TableCell>
                  <TableCell>Grid Name</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {grids?.map((grid: GridResponse) => {
                  return (
                    <TableRow hover key={grid.uuid}>
                      <TableCell
                        onClick={(event) => {
                          handleClick(event, grid.uuid)
                        }}
                      >
                        {grid.uuid}
                      </TableCell>
                      <TableCell
                        onClick={(event) => {
                          handleClick(event, grid.uuid)
                        }}
                      >
                        {grid.name}
                      </TableCell>
                      <TableCell
                        onClick={(event) => {
                          handleClick(event, grid.uuid)
                        }}
                      >
                        {grid.status}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </ThemeProvider>
  )
}

export const Route = createFileRoute('/acquisitions/$acqId')({ component: Acquisition })
