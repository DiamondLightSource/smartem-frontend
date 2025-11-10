import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  ThemeProvider,
  Typography,
} from '@mui/material'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import React from 'react'
// Import working endpoints from generated client
import { useGetAcquisitionsAcquisitionsGet } from '../api/generated/default/default'
import type { AcquisitionResponse } from '../api/generated/models'
// Import stub endpoints that don't exist in backend yet
import {
  useGetActiveConnectionsDebugAgentConnectionsGet,
  useGetActiveSessionsDebugSessionsGet,
  useGetConnectionStatsDebugConnectionStatsGet,
} from '../api/stubs'
import { Navbar } from '../components/navbar'
import { theme } from '../components/theme'

// Type definitions for API responses (since API schema is empty)
interface SessionData {
  session_id: string
  agent_id?: string
  acquisition_id?: string
  created_at?: string
  status?: string
  [key: string]: unknown
}

interface AgentConnection {
  agent_id: string
  session_id?: string
  connected_at?: string
  last_heartbeat?: string
  status?: string
  [key: string]: unknown
}

interface ConnectionStats {
  active_sessions?: number
  active_connections?: number
  total_sessions?: number
  [key: string]: unknown
}

type Order = 'asc' | 'desc'

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  const aVal = a[orderBy]
  const bVal = b[orderBy]

  if (bVal === null || bVal === undefined) return -1
  if (aVal === null || aVal === undefined) return 1

  if (bVal < aVal) return -1
  if (bVal > aVal) return 1
  return 0
}

function getComparator<T>(order: Order, orderBy: keyof T): (a: T, b: T) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy)
}

function Admin() {
  const navigate = useNavigate()

  // API queries
  const {
    data: sessions,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = useGetActiveSessionsDebugSessionsGet()
  const {
    data: connections,
    isLoading: connectionsLoading,
    error: connectionsError,
  } = useGetActiveConnectionsDebugAgentConnectionsGet()
  const { data: stats, isLoading: statsLoading } = useGetConnectionStatsDebugConnectionStatsGet()
  const {
    data: acquisitions,
    isLoading: acquisitionsLoading,
    error: acquisitionsError,
  } = useGetAcquisitionsAcquisitionsGet()

  // Sessions table state
  const [sessionsPage, setSessionsPage] = React.useState(0)
  const [sessionsRowsPerPage, setSessionsRowsPerPage] = React.useState(10)
  const [sessionsOrderBy, setSessionsOrderBy] = React.useState<keyof SessionData>('session_id')
  const [sessionsOrder, setSessionsOrder] = React.useState<Order>('asc')

  // Connections table state
  const [connectionsPage, setConnectionsPage] = React.useState(0)
  const [connectionsRowsPerPage, setConnectionsRowsPerPage] = React.useState(10)
  const [connectionsOrderBy, setConnectionsOrderBy] =
    React.useState<keyof AgentConnection>('agent_id')
  const [connectionsOrder, setConnectionsOrder] = React.useState<Order>('asc')

  // Acquisitions table state
  const [acquisitionsPage, setAcquisitionsPage] = React.useState(0)
  const [acquisitionsRowsPerPage, setAcquisitionsRowsPerPage] = React.useState(10)
  const [acquisitionsOrderBy, setAcquisitionsOrderBy] =
    React.useState<keyof AcquisitionResponse>('uuid')
  const [acquisitionsOrder, setAcquisitionsOrder] = React.useState<Order>('asc')

  // Handlers
  const handleSessionsSort = (property: keyof SessionData) => {
    const isAsc = sessionsOrderBy === property && sessionsOrder === 'asc'
    setSessionsOrder(isAsc ? 'desc' : 'asc')
    setSessionsOrderBy(property)
  }

  const handleConnectionsSort = (property: keyof AgentConnection) => {
    const isAsc = connectionsOrderBy === property && connectionsOrder === 'asc'
    setConnectionsOrder(isAsc ? 'desc' : 'asc')
    setConnectionsOrderBy(property)
  }

  const handleAcquisitionsSort = (property: keyof AcquisitionResponse) => {
    const isAsc = acquisitionsOrderBy === property && acquisitionsOrder === 'asc'
    setAcquisitionsOrder(isAsc ? 'desc' : 'asc')
    setAcquisitionsOrderBy(property)
  }

  const handleAcquisitionClick = (_event: React.MouseEvent<unknown>, acquisitionId: string) => {
    navigate({ to: '/acquisitions/$acqId', params: { acqId: acquisitionId } })
  }

  // Process data
  const sessionsArray: SessionData[] = React.useMemo(() => {
    if (!sessions) return []
    if (Array.isArray(sessions)) return sessions as SessionData[]
    if (typeof sessions === 'object' && sessions !== null) {
      return Object.entries(sessions).map(([key, value]) => ({
        session_id: key,
        ...(typeof value === 'object' && value !== null ? value : {}),
      })) as SessionData[]
    }
    return []
  }, [sessions])

  const connectionsArray: AgentConnection[] = React.useMemo(() => {
    if (!connections) return []
    if (Array.isArray(connections)) return connections as AgentConnection[]
    if (typeof connections === 'object' && connections !== null) {
      return Object.entries(connections).map(([key, value]) => ({
        agent_id: key,
        ...(typeof value === 'object' && value !== null ? value : {}),
      })) as AgentConnection[]
    }
    return []
  }, [connections])

  const sortedSessions = React.useMemo(() => {
    return [...sessionsArray].sort(getComparator(sessionsOrder, sessionsOrderBy))
  }, [sessionsArray, sessionsOrder, sessionsOrderBy])

  const sortedConnections = React.useMemo(() => {
    return [...connectionsArray].sort(getComparator(connectionsOrder, connectionsOrderBy))
  }, [connectionsArray, connectionsOrder, connectionsOrderBy])

  const sortedAcquisitions = React.useMemo(() => {
    if (!acquisitions) return []
    return [...acquisitions].sort(getComparator(acquisitionsOrder, acquisitionsOrderBy))
  }, [acquisitions, acquisitionsOrder, acquisitionsOrderBy])

  const paginatedSessions = React.useMemo(() => {
    return sortedSessions.slice(
      sessionsPage * sessionsRowsPerPage,
      sessionsPage * sessionsRowsPerPage + sessionsRowsPerPage
    )
  }, [sortedSessions, sessionsPage, sessionsRowsPerPage])

  const paginatedConnections = React.useMemo(() => {
    return sortedConnections.slice(
      connectionsPage * connectionsRowsPerPage,
      connectionsPage * connectionsRowsPerPage + connectionsRowsPerPage
    )
  }, [sortedConnections, connectionsPage, connectionsRowsPerPage])

  const paginatedAcquisitions = React.useMemo(() => {
    return sortedAcquisitions.slice(
      acquisitionsPage * acquisitionsRowsPerPage,
      acquisitionsPage * acquisitionsRowsPerPage + acquisitionsRowsPerPage
    )
  }, [sortedAcquisitions, acquisitionsPage, acquisitionsRowsPerPage])

  const statsData = stats as ConnectionStats | undefined

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

        {/* Connection Statistics */}
        {statsLoading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        ) : statsData ? (
          <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
            {statsData.active_sessions !== undefined && (
              <Chip label={`Active Sessions: ${statsData.active_sessions}`} color="primary" />
            )}
            {statsData.active_connections !== undefined && (
              <Chip
                label={`Active Connections: ${statsData.active_connections}`}
                color="secondary"
              />
            )}
            {statsData.total_sessions !== undefined && (
              <Chip label={`Total Sessions: ${statsData.total_sessions}`} />
            )}
          </Box>
        ) : null}

        <Divider sx={{ mb: 4 }} />

        {/* Active Sessions Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" gutterBottom>
            Active Sessions
          </Typography>
          {sessionsLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : sessionsError ? (
            <Alert severity="error">Error loading sessions: {String(sessionsError)}</Alert>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={sessionsOrderBy === 'session_id'}
                          direction={sessionsOrderBy === 'session_id' ? sessionsOrder : 'asc'}
                          onClick={() => handleSessionsSort('session_id')}
                        >
                          Session ID
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sessionsOrderBy === 'agent_id'}
                          direction={sessionsOrderBy === 'agent_id' ? sessionsOrder : 'asc'}
                          onClick={() => handleSessionsSort('agent_id')}
                        >
                          Agent ID
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sessionsOrderBy === 'acquisition_id'}
                          direction={sessionsOrderBy === 'acquisition_id' ? sessionsOrder : 'asc'}
                          onClick={() => handleSessionsSort('acquisition_id')}
                        >
                          Acquisition ID
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sessionsOrderBy === 'status'}
                          direction={sessionsOrderBy === 'status' ? sessionsOrder : 'asc'}
                          onClick={() => handleSessionsSort('status')}
                        >
                          Status
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sessionsOrderBy === 'created_at'}
                          direction={sessionsOrderBy === 'created_at' ? sessionsOrder : 'asc'}
                          onClick={() => handleSessionsSort('created_at')}
                        >
                          Created At
                        </TableSortLabel>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedSessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="text.secondary">No active sessions</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedSessions.map((session) => (
                        <TableRow hover key={session.session_id}>
                          <TableCell>{session.session_id}</TableCell>
                          <TableCell>{session.agent_id || 'N/A'}</TableCell>
                          <TableCell>{session.acquisition_id || 'N/A'}</TableCell>
                          <TableCell>{session.status || 'active'}</TableCell>
                          <TableCell>
                            {session.created_at
                              ? new Date(session.created_at as string).toLocaleString()
                              : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {sortedSessions.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={sortedSessions.length}
                  rowsPerPage={sessionsRowsPerPage}
                  page={sessionsPage}
                  onPageChange={(_event, newPage) => setSessionsPage(newPage)}
                  onRowsPerPageChange={(event) => {
                    setSessionsRowsPerPage(parseInt(event.target.value, 10))
                    setSessionsPage(0)
                  }}
                />
              )}
            </>
          )}
        </Box>

        {/* Active Agent Connections Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" gutterBottom>
            Active Agent Connections
          </Typography>
          {connectionsLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : connectionsError ? (
            <Alert severity="error">Error loading connections: {String(connectionsError)}</Alert>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={connectionsOrderBy === 'agent_id'}
                          direction={connectionsOrderBy === 'agent_id' ? connectionsOrder : 'asc'}
                          onClick={() => handleConnectionsSort('agent_id')}
                        >
                          Agent ID
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={connectionsOrderBy === 'session_id'}
                          direction={connectionsOrderBy === 'session_id' ? connectionsOrder : 'asc'}
                          onClick={() => handleConnectionsSort('session_id')}
                        >
                          Session ID
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={connectionsOrderBy === 'connected_at'}
                          direction={
                            connectionsOrderBy === 'connected_at' ? connectionsOrder : 'asc'
                          }
                          onClick={() => handleConnectionsSort('connected_at')}
                        >
                          Connected At
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={connectionsOrderBy === 'last_heartbeat'}
                          direction={
                            connectionsOrderBy === 'last_heartbeat' ? connectionsOrder : 'asc'
                          }
                          onClick={() => handleConnectionsSort('last_heartbeat')}
                        >
                          Last Heartbeat
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={connectionsOrderBy === 'status'}
                          direction={connectionsOrderBy === 'status' ? connectionsOrder : 'asc'}
                          onClick={() => handleConnectionsSort('status')}
                        >
                          Status
                        </TableSortLabel>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedConnections.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="text.secondary">No active connections</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedConnections.map((connection) => (
                        <TableRow hover key={connection.agent_id}>
                          <TableCell>{connection.agent_id}</TableCell>
                          <TableCell>{connection.session_id || 'N/A'}</TableCell>
                          <TableCell>
                            {connection.connected_at
                              ? new Date(connection.connected_at as string).toLocaleString()
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {connection.last_heartbeat
                              ? new Date(connection.last_heartbeat as string).toLocaleString()
                              : 'N/A'}
                          </TableCell>
                          <TableCell>{connection.status || 'connected'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {sortedConnections.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={sortedConnections.length}
                  rowsPerPage={connectionsRowsPerPage}
                  page={connectionsPage}
                  onPageChange={(_event, newPage) => setConnectionsPage(newPage)}
                  onRowsPerPageChange={(event) => {
                    setConnectionsRowsPerPage(parseInt(event.target.value, 10))
                    setConnectionsPage(0)
                  }}
                />
              )}
            </>
          )}
        </Box>

        {/* All Acquisitions Overview Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" gutterBottom>
            All Acquisitions Overview
          </Typography>
          {acquisitionsLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : acquisitionsError ? (
            <Alert severity="error">Error loading acquisitions: {String(acquisitionsError)}</Alert>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={acquisitionsOrderBy === 'uuid'}
                          direction={acquisitionsOrderBy === 'uuid' ? acquisitionsOrder : 'asc'}
                          onClick={() => handleAcquisitionsSort('uuid')}
                        >
                          Acquisition ID
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={acquisitionsOrderBy === 'name'}
                          direction={acquisitionsOrderBy === 'name' ? acquisitionsOrder : 'asc'}
                          onClick={() => handleAcquisitionsSort('name')}
                        >
                          Name
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={acquisitionsOrderBy === 'status'}
                          direction={acquisitionsOrderBy === 'status' ? acquisitionsOrder : 'asc'}
                          onClick={() => handleAcquisitionsSort('status')}
                        >
                          Status
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={acquisitionsOrderBy === 'start_time'}
                          direction={
                            acquisitionsOrderBy === 'start_time' ? acquisitionsOrder : 'asc'
                          }
                          onClick={() => handleAcquisitionsSort('start_time')}
                        >
                          Start Time
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={acquisitionsOrderBy === 'end_time'}
                          direction={acquisitionsOrderBy === 'end_time' ? acquisitionsOrder : 'asc'}
                          onClick={() => handleAcquisitionsSort('end_time')}
                        >
                          End Time
                        </TableSortLabel>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedAcquisitions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="text.secondary">No acquisitions found</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedAcquisitions.map((acq: AcquisitionResponse) => (
                        <TableRow
                          hover
                          key={acq.uuid}
                          onClick={(event) => handleAcquisitionClick(event, acq.uuid)}
                          style={{ cursor: 'pointer' }}
                        >
                          <TableCell>{acq.uuid}</TableCell>
                          <TableCell>{acq.name || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              label={acq.status || 'unknown'}
                              color={
                                acq.status === 'active' || acq.status === 'running'
                                  ? 'success'
                                  : acq.status === 'completed'
                                    ? 'default'
                                    : 'warning'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {acq.start_time ? new Date(acq.start_time).toLocaleString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {acq.end_time ? new Date(acq.end_time).toLocaleString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {sortedAcquisitions.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={sortedAcquisitions.length}
                  rowsPerPage={acquisitionsRowsPerPage}
                  page={acquisitionsPage}
                  onPageChange={(_event, newPage) => setAcquisitionsPage(newPage)}
                  onRowsPerPageChange={(event) => {
                    setAcquisitionsRowsPerPage(parseInt(event.target.value, 10))
                    setAcquisitionsPage(0)
                  }}
                />
              )}
            </>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  )
}

export const Route = createFileRoute('/admin')({ component: Admin })
