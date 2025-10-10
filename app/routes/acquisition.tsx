import GridOnIcon from '@mui/icons-material/GridOn'

import {
  Alert,
  Box,
  CircularProgress,
  Container,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ThemeProvider,
} from '@mui/material'
import Paper from '@mui/material/Paper'
import { useNavigate } from 'react-router'
import { useGetAcquisitionGridsAcquisitionsAcquisitionUuidGridsGet } from '../api/generated/default/default'
import type { GridResponse } from '../api/generated/models'
import { Navbar } from '../components/navbar'
import { theme } from '../components/theme'
import type { Route } from './+types/acquisition'

export default function Acquisition({ params }: Route.ComponentProps) {
  const navigate = useNavigate()
  const {
    data: grids,
    isLoading,
    error,
  } = useGetAcquisitionGridsAcquisitionsAcquisitionUuidGridsGet(params.acqId)

  const handleClick = (event: React.MouseEvent<unknown>, gridId: string) => {
    navigate(`./grids/${gridId}/atlas`, { relative: 'path' })
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
