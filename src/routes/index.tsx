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
} from '@mui/material'
import Paper from '@mui/material/Paper'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useGetAcquisitionsAcquisitionsGet } from '../api/generated/default/default'
import type { AcquisitionResponse } from '../api/generated/models'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { data: acquisitions, isLoading, error } = useGetAcquisitionsAcquisitionsGet()
  const navigate = useNavigate()

  const handleClick = (_event: React.MouseEvent<unknown>, acquisitionId: string) => {
    navigate({ to: '/acquisitions/$acqId', params: { acqId: acquisitionId } })
  }

  return (
    <Container component="main" content="center" style={{ width: '100%' }}>
      {isLoading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">Error loading acquisitions: {String(error)}</Alert>
      ) : (
        <TableContainer component={Paper} style={{ width: '80%' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell style={{ backgroundColor: 'secondary' }}>Acquisition ID</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>Acquisition Name</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {acquisitions?.map((acq: AcquisitionResponse) => {
                return (
                  <TableRow hover onClick={(event) => handleClick(event, acq.uuid)} key={acq.uuid}>
                    <TableCell>{acq.uuid}</TableCell>
                    <TableCell>
                      {acq.start_time ? new Date(acq.start_time).toString() : null}
                    </TableCell>
                    <TableCell>{acq.name}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  )
}
