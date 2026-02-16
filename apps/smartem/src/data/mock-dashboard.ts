export type InstrumentStatus = 'running' | 'idle' | 'paused' | 'error' | 'offline'
export type SessionStatus = 'running' | 'paused' | 'completed' | 'abandoned'

export interface Instrument {
  id: string
  name: string
  model: string
  status: InstrumentStatus
  currentSessionId: string | null
}

export interface Session {
  id: string
  name: string
  instrumentId: string
  instrumentName: string
  status: SessionStatus
  startTime: string
  endTime: string | null
  gridsCompleted: number
  gridsTotal: number
  avgQuality: number | null
}

export interface TimelineBlock {
  sessionId: string
  sessionName: string
  instrumentName: string
  startHour: number
  endHour: number
  status: SessionStatus
  color: string
}

export interface TimelineDay {
  date: string
  dayLabel: string
  blocks: TimelineBlock[]
}

const now = new Date('2026-02-16T14:30:00Z')

function hoursAgo(h: number): string {
  return new Date(now.getTime() - h * 3600_000).toISOString()
}

function daysAgo(d: number, hour = 0): string {
  const date = new Date(now)
  date.setDate(date.getDate() - d)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

export const instruments: Instrument[] = [
  {
    id: 'krios-1',
    name: 'Krios I',
    model: 'Titan Krios G4',
    status: 'running',
    currentSessionId: 'ses-001',
  },
  {
    id: 'krios-2',
    name: 'Krios II',
    model: 'Titan Krios G4',
    status: 'running',
    currentSessionId: 'ses-002',
  },
  {
    id: 'krios-3',
    name: 'Krios III',
    model: 'Titan Krios G3i',
    status: 'idle',
    currentSessionId: null,
  },
  {
    id: 'krios-4',
    name: 'Krios IV',
    model: 'Titan Krios G4',
    status: 'running',
    currentSessionId: 'ses-003',
  },
  {
    id: 'glacios-1',
    name: 'Glacios I',
    model: 'Glacios 2',
    status: 'paused',
    currentSessionId: 'ses-004',
  },
  {
    id: 'glacios-2',
    name: 'Glacios II',
    model: 'Glacios 2',
    status: 'idle',
    currentSessionId: null,
  },
  {
    id: 'glacios-3',
    name: 'Glacios III',
    model: 'Glacios 2',
    status: 'idle',
    currentSessionId: null,
  },
  {
    id: 'talos-1',
    name: 'Talos I',
    model: 'Talos Arctica',
    status: 'offline',
    currentSessionId: null,
  },
  {
    id: 'talos-2',
    name: 'Talos II',
    model: 'Talos Arctica',
    status: 'offline',
    currentSessionId: null,
  },
  {
    id: 'titan-1',
    name: 'Titan I',
    model: 'Titan Halo',
    status: 'offline',
    currentSessionId: null,
  },
  {
    id: 'titan-2',
    name: 'Titan II',
    model: 'Titan Halo',
    status: 'offline',
    currentSessionId: null,
  },
  {
    id: 'titan-3',
    name: 'Titan III',
    model: 'Titan Halo',
    status: 'offline',
    currentSessionId: null,
  },
]

export const sessions: Session[] = [
  // Active sessions
  {
    id: 'ses-001',
    name: 'ribosome-highres-003',
    instrumentId: 'krios-1',
    instrumentName: 'Krios I',
    status: 'running',
    startTime: hoursAgo(6.5),
    endTime: null,
    gridsCompleted: 7,
    gridsTotal: 12,
    avgQuality: 0.82,
  },
  {
    id: 'ses-002',
    name: 'EM-2026-0216-krios2',
    instrumentId: 'krios-2',
    instrumentName: 'Krios II',
    status: 'running',
    startTime: hoursAgo(3.2),
    endTime: null,
    gridsCompleted: 3,
    gridsTotal: 8,
    avgQuality: 0.74,
  },
  {
    id: 'ses-003',
    name: 'proteasome-tilt-007',
    instrumentId: 'krios-4',
    instrumentName: 'Krios IV',
    status: 'running',
    startTime: hoursAgo(1.5),
    endTime: null,
    gridsCompleted: 1,
    gridsTotal: 6,
    avgQuality: null,
  },
  {
    id: 'ses-004',
    name: 'membrane-prot-screen',
    instrumentId: 'glacios-1',
    instrumentName: 'Glacios I',
    status: 'paused',
    startTime: hoursAgo(4),
    endTime: null,
    gridsCompleted: 4,
    gridsTotal: 10,
    avgQuality: 0.68,
  },
  // Recent completed sessions
  {
    id: 'ses-005',
    name: 'spike-variant-012',
    instrumentId: 'krios-1',
    instrumentName: 'Krios I',
    status: 'completed',
    startTime: daysAgo(1, 2),
    endTime: daysAgo(0, 8),
    gridsCompleted: 12,
    gridsTotal: 12,
    avgQuality: 0.91,
  },
  {
    id: 'ses-006',
    name: 'chaperonin-cryo-004',
    instrumentId: 'krios-3',
    instrumentName: 'Krios III',
    status: 'completed',
    startTime: daysAgo(1, 8),
    endTime: daysAgo(1, 18),
    gridsCompleted: 8,
    gridsTotal: 8,
    avgQuality: 0.87,
  },
  {
    id: 'ses-007',
    name: 'EM-2026-0214-glac2',
    instrumentId: 'glacios-2',
    instrumentName: 'Glacios II',
    status: 'completed',
    startTime: daysAgo(2, 9),
    endTime: daysAgo(2, 16),
    gridsCompleted: 6,
    gridsTotal: 6,
    avgQuality: 0.79,
  },
  {
    id: 'ses-008',
    name: 'ion-channel-screen-02',
    instrumentId: 'krios-2',
    instrumentName: 'Krios II',
    status: 'completed',
    startTime: daysAgo(2, 0),
    endTime: daysAgo(1, 14),
    gridsCompleted: 10,
    gridsTotal: 10,
    avgQuality: 0.85,
  },
  {
    id: 'ses-009',
    name: 'tubulin-dynamics-001',
    instrumentId: 'krios-4',
    instrumentName: 'Krios IV',
    status: 'abandoned',
    startTime: daysAgo(3, 10),
    endTime: daysAgo(3, 13),
    gridsCompleted: 2,
    gridsTotal: 8,
    avgQuality: 0.31,
  },
  {
    id: 'ses-010',
    name: 'EM-2026-0213-krios1',
    instrumentId: 'krios-1',
    instrumentName: 'Krios I',
    status: 'completed',
    startTime: daysAgo(3, 1),
    endTime: daysAgo(2, 12),
    gridsCompleted: 14,
    gridsTotal: 14,
    avgQuality: 0.88,
  },
  {
    id: 'ses-011',
    name: 'abc-transporter-009',
    instrumentId: 'glacios-1',
    instrumentName: 'Glacios I',
    status: 'completed',
    startTime: daysAgo(3, 6),
    endTime: daysAgo(3, 15),
    gridsCompleted: 5,
    gridsTotal: 6,
    avgQuality: 0.72,
  },
  {
    id: 'ses-012',
    name: 'nucleosome-remod-003',
    instrumentId: 'krios-3',
    instrumentName: 'Krios III',
    status: 'completed',
    startTime: daysAgo(4, 14),
    endTime: daysAgo(4, 22),
    gridsCompleted: 4,
    gridsTotal: 4,
    avgQuality: 0.93,
  },
  {
    id: 'ses-013',
    name: 'polymerase-screen-06',
    instrumentId: 'glacios-3',
    instrumentName: 'Glacios III',
    status: 'completed',
    startTime: daysAgo(5, 8),
    endTime: daysAgo(5, 17),
    gridsCompleted: 8,
    gridsTotal: 8,
    avgQuality: 0.76,
  },
  {
    id: 'ses-014',
    name: 'EM-2026-0210-krios2',
    instrumentId: 'krios-2',
    instrumentName: 'Krios II',
    status: 'completed',
    startTime: daysAgo(6, 3),
    endTime: daysAgo(5, 18),
    gridsCompleted: 12,
    gridsTotal: 12,
    avgQuality: 0.84,
  },
  {
    id: 'ses-015',
    name: 'gpcr-ligand-bind-002',
    instrumentId: 'krios-4',
    instrumentName: 'Krios IV',
    status: 'abandoned',
    startTime: daysAgo(5, 20),
    endTime: daysAgo(5, 22),
    gridsCompleted: 1,
    gridsTotal: 10,
    avgQuality: 0.22,
  },
]

export const activeSessions = sessions.filter(
  (s) => s.status === 'running' || s.status === 'paused'
)

export const recentSessions = sessions
  .filter((s) => s.status === 'completed' || s.status === 'abandoned')
  .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

const instrumentColors: Record<string, string> = {
  'krios-1': '#0969da',
  'krios-2': '#1a7f37',
  'krios-3': '#8250df',
  'krios-4': '#bf3989',
  'glacios-1': '#cf222e',
  'glacios-2': '#e16f24',
  'glacios-3': '#bf8700',
  'talos-1': '#6e7781',
  'talos-2': '#6e7781',
  'titan-1': '#6e7781',
  'titan-2': '#6e7781',
  'titan-3': '#6e7781',
}

function buildTimeline(): TimelineDay[] {
  const days: TimelineDay[] = []
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  for (let d = 6; d >= 0; d--) {
    const dayDate = new Date(now)
    dayDate.setDate(dayDate.getDate() - d)
    const dateStr = dayDate.toISOString().slice(0, 10)
    const dayLabel = dayNames[dayDate.getDay()]

    const blocks: TimelineBlock[] = []

    for (const session of sessions) {
      const start = new Date(session.startTime)
      const end = session.endTime ? new Date(session.endTime) : now

      const dayStart = new Date(dateStr)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dateStr)
      dayEnd.setHours(23, 59, 59, 999)

      if (start <= dayEnd && end >= dayStart) {
        const overlapStart = start < dayStart ? dayStart : start
        const overlapEnd = end > dayEnd ? dayEnd : end

        blocks.push({
          sessionId: session.id,
          sessionName: session.name,
          instrumentName: session.instrumentName,
          startHour: overlapStart.getUTCHours() + overlapStart.getUTCMinutes() / 60,
          endHour: overlapEnd.getUTCHours() + overlapEnd.getUTCMinutes() / 60,
          status: session.status,
          color: instrumentColors[session.instrumentId] ?? '#6e7781',
        })
      }
    }

    days.push({ date: dateStr, dayLabel, blocks })
  }

  return days
}

export const timelineDays = buildTimeline()

export function formatDuration(startTime: string, endTime: string | null): string {
  const start = new Date(startTime).getTime()
  const end = endTime ? new Date(endTime).getTime() : now.getTime()
  const hours = Math.floor((end - start) / 3_600_000)
  const mins = Math.floor(((end - start) % 3_600_000) / 60_000)
  if (hours === 0) return `${mins}m`
  return `${hours}h ${mins}m`
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} ${formatTime(iso)}`
}
