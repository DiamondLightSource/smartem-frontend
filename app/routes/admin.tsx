import {
  Alert,
  Box,
  Container,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ThemeProvider,
  Typography,
} from '@mui/material'
import React from 'react'
import { Navbar } from '../components/navbar'
import { theme } from '../components/theme'
import type { Route } from './+types/admin'

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'Admin Dashboard - SmartEM' },
    { name: 'description', content: 'Admin dashboard for managing all sessions and acquisitions' },
  ]
}

export default function Admin() {
  return (
    <ThemeProvider theme={theme}>
      <Navbar />
      <Container component="main" style={{ width: '100%', paddingTop: '50px' }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Overview of all sessions and acquisitions
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Active Sessions Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" gutterBottom>
            Active Sessions
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Placeholder: This section will display currently active sessions
          </Alert>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Session ID</TableCell>
                  <TableCell>Acquisition ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Started</TableCell>
                  <TableCell>Progress</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary">
                      No active sessions - Implementation pending
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Past Sessions Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" gutterBottom>
            Past Sessions
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Placeholder: This section will display completed/historical sessions
          </Alert>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Session ID</TableCell>
                  <TableCell>Acquisition ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Started</TableCell>
                  <TableCell>Completed</TableCell>
                  <TableCell>Duration</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary">
                      No past sessions - Implementation pending
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* All Acquisitions Overview Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" gutterBottom>
            All Acquisitions Overview
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Placeholder: This section will display statistics and overview of all acquisitions
          </Alert>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Acquisition ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Total Grids</TableCell>
                  <TableCell>Total Squares</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary">
                      No acquisition data - Implementation pending
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Container>
    </ThemeProvider>
  )
}
