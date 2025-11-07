import { faker } from '@faker-js/faker'
import { delay, http, HttpResponse } from 'msw'

// Custom mock handlers for debug endpoints that don't have proper schemas in the API

export interface MockSessionData {
  session_id: string
  agent_id: string
  acquisition_id: string
  created_at: string
  status: string
  last_activity?: string
}

export interface MockAgentConnection {
  agent_id: string
  session_id: string
  connected_at: string
  last_heartbeat: string
  status: string
  connection_type?: string
}

export interface MockConnectionStats {
  active_sessions: number
  active_connections: number
  total_sessions: number
  total_instructions_sent: number
  total_instructions_acked: number
}

// Generate mock sessions
function generateMockSessions(count = 5): MockSessionData[] {
  return Array.from({ length: count }, (_, i) => ({
    session_id: `session-${faker.string.alphanumeric(8)}`,
    agent_id: `agent-${faker.string.alphanumeric(6)}`,
    acquisition_id: faker.string.uuid(),
    created_at: faker.date.recent({ days: 7 }).toISOString(),
    status: faker.helpers.arrayElement(['active', 'running', 'idle', 'processing']),
    last_activity: faker.date.recent({ days: 1 }).toISOString(),
  }))
}

// Generate mock agent connections
function generateMockConnections(count = 5): MockAgentConnection[] {
  return Array.from({ length: count }, (_, i) => ({
    agent_id: `agent-${faker.string.alphanumeric(6)}`,
    session_id: `session-${faker.string.alphanumeric(8)}`,
    connected_at: faker.date.recent({ days: 7 }).toISOString(),
    last_heartbeat: faker.date.recent({ days: 0 }).toISOString(),
    status: faker.helpers.arrayElement(['connected', 'active', 'healthy']),
    connection_type: faker.helpers.arrayElement(['websocket', 'http', 'grpc']),
  }))
}

// Generate mock connection stats
function generateMockStats(): MockConnectionStats {
  const activeSessions = faker.number.int({ min: 3, max: 15 })
  const activeConnections = faker.number.int({ min: activeSessions, max: activeSessions + 5 })
  return {
    active_sessions: activeSessions,
    active_connections: activeConnections,
    total_sessions: faker.number.int({ min: activeSessions + 10, max: 100 }),
    total_instructions_sent: faker.number.int({ min: 100, max: 10000 }),
    total_instructions_acked: faker.number.int({ min: 80, max: 9500 }),
  }
}

// Handler for GET /debug/sessions
export const getActiveSessionsHandler = http.get('*/debug/sessions', async () => {
  await delay(500)
  const sessions = generateMockSessions(faker.number.int({ min: 3, max: 10 }))
  return HttpResponse.json(sessions, { status: 200 })
})

// Handler for GET /debug/agent-connections
export const getActiveConnectionsHandler = http.get('*/debug/agent-connections', async () => {
  await delay(500)
  const connections = generateMockConnections(faker.number.int({ min: 3, max: 10 }))
  return HttpResponse.json(connections, { status: 200 })
})

// Handler for GET /debug/connection-stats
export const getConnectionStatsHandler = http.get('*/debug/connection-stats', async () => {
  await delay(300)
  const stats = generateMockStats()
  return HttpResponse.json(stats, { status: 200 })
})

// Export all custom handlers
export const customHandlers = [
  getActiveSessionsHandler,
  getActiveConnectionsHandler,
  getConnectionStatsHandler,
]
