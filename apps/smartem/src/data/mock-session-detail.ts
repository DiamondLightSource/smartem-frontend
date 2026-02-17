// Mock data for session detail views — grids, grid squares, foilholes
// Populated for ses-001 (running) and ses-005 (completed)

export interface MockGrid {
  uuid: string
  name: string
  sessionId: string
  status: 'queued' | 'screening' | 'collecting' | 'completed'
  scanStartTime: string | null
  scanEndTime: string | null
  squareCount: number
  foilholeCount: number
  micrographCount: number
  avgQuality: number | null
}

export interface MockGridSquare {
  uuid: string
  gridsquareId: string
  gridUuid: string
  status: 'registered' | 'collected' | 'completed'
  centerX: number
  centerY: number
  sizeWidth: number
  selected: boolean
  defocus: number | null
  magnification: number | null
  quality: number
  foilholeCount: number
}

export interface MockFoilHole {
  uuid: string
  foilholeId: string
  gridsquareUuid: string
  status: 'none' | 'acquired' | 'processed'
  xLocation: number
  yLocation: number
  diameter: number
  quality: number
  isNearGridBar: boolean
  micrographCount: number
}

// ---------------------------------------------------------------------------
// Seeded pseudo-random for deterministic data
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(42)

function randRange(min: number, max: number) {
  return min + rand() * (max - min)
}

function randQuality(): number {
  // Most values 0.5-0.9, occasional outliers
  const r = rand()
  if (r < 0.08) return +randRange(0.1, 0.35).toFixed(2)
  if (r < 0.15) return +randRange(0.35, 0.5).toFixed(2)
  if (r < 0.85) return +randRange(0.5, 0.85).toFixed(2)
  return +randRange(0.85, 0.98).toFixed(2)
}

function pickStatus<T>(options: T[], weights: number[]): T {
  const r = rand()
  let cum = 0
  for (let i = 0; i < options.length; i++) {
    cum += weights[i]
    if (r < cum) return options[i]
  }
  return options[options.length - 1]
}

// ---------------------------------------------------------------------------
// Grid names: A1..C4 (3 rows x 4 cols = 12)
// ---------------------------------------------------------------------------

const GRID_NAMES: string[] = []
for (const row of ['A', 'B', 'C']) {
  for (const col of [1, 2, 3, 4]) {
    GRID_NAMES.push(`Grid-${row}${col}`)
  }
}

// ---------------------------------------------------------------------------
// Generate grids for a session
// ---------------------------------------------------------------------------

function generateGrids(sessionId: string, isCompleted: boolean): MockGrid[] {
  return GRID_NAMES.map((name, i) => {
    const uuid = `${sessionId}-grid-${String(i).padStart(2, '0')}`
    const sqCount = Math.round(randRange(28, 42))
    const fhPerSq = Math.round(randRange(10, 14))
    const fhCount = sqCount * fhPerSq
    const micCount = isCompleted
      ? Math.round(fhCount * randRange(0.85, 1.0))
      : i < 7
        ? Math.round(fhCount * randRange(0.3, 0.9))
        : 0

    let status: MockGrid['status']
    if (isCompleted) {
      status = 'completed'
    } else if (i < 5) {
      status = 'completed'
    } else if (i === 5) {
      status = 'collecting'
    } else if (i === 6) {
      status = 'screening'
    } else {
      status = 'queued'
    }

    const hasStarted = status !== 'queued'
    const q = hasStarted ? randQuality() : null

    return {
      uuid,
      name,
      sessionId,
      status,
      scanStartTime: hasStarted ? `2026-02-16T${String(6 + i).padStart(2, '0')}:00:00Z` : null,
      scanEndTime:
        status === 'completed' ? `2026-02-16T${String(7 + i).padStart(2, '0')}:30:00Z` : null,
      squareCount: sqCount,
      foilholeCount: fhCount,
      micrographCount: micCount,
      avgQuality: q,
    }
  })
}

// ---------------------------------------------------------------------------
// Generate grid squares for a grid
// ---------------------------------------------------------------------------

function generateGridSquares(grid: MockGrid): MockGridSquare[] {
  const count = grid.squareCount
  const squares: MockGridSquare[] = []

  // Distribute squares in a roughly circular pattern within the 4005x4005 viewbox
  const cx = 2002
  const cy = 2002
  const maxR = 1600

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rand() * 0.3
    const radius = randRange(200, maxR)
    const x = Math.round(cx + Math.cos(angle) * radius)
    const y = Math.round(cy + Math.sin(angle) * radius)
    const sizeWidth = Math.round(randRange(180, 320))
    const quality = randQuality()
    const fhCount = Math.round(randRange(8, 16))

    const isActive = grid.status !== 'queued'
    const sqStatus: MockGridSquare['status'] = !isActive
      ? 'registered'
      : pickStatus(['registered', 'collected', 'completed'], [0.1, 0.3, 0.6])

    squares.push({
      uuid: `${grid.uuid}-sq-${String(i).padStart(3, '0')}`,
      gridsquareId: `GS-${String(i + 1).padStart(3, '0')}`,
      gridUuid: grid.uuid,
      status: sqStatus,
      centerX: Math.max(200, Math.min(3805, x)),
      centerY: Math.max(200, Math.min(3805, y)),
      sizeWidth,
      selected: rand() > 0.3,
      defocus: sqStatus !== 'registered' ? +(-randRange(0.8, 3.0)).toFixed(1) : null,
      magnification: sqStatus !== 'registered' ? Math.round(randRange(75000, 130000)) : null,
      quality,
      foilholeCount: fhCount,
    })
  }

  return squares
}

// ---------------------------------------------------------------------------
// Generate foilholes for a grid square
// ---------------------------------------------------------------------------

function generateFoilHoles(square: MockGridSquare): MockFoilHole[] {
  const count = square.foilholeCount
  const holes: MockFoilHole[] = []

  // Distribute within 2880x2046 viewbox
  const cx = 1440
  const cy = 1023
  const maxR = 800

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rand() * 0.4
    const radius = randRange(100, maxR)
    const x = Math.round(cx + Math.cos(angle) * radius)
    const y = Math.round(cy + Math.sin(angle) * radius)
    const diameter = Math.round(randRange(40, 80))
    const quality = randQuality()
    const isNearGridBar = rand() < 0.15
    const status: MockFoilHole['status'] = pickStatus(
      ['none', 'acquired', 'processed'],
      [0.1, 0.35, 0.55]
    )

    holes.push({
      uuid: `${square.uuid}-fh-${String(i).padStart(3, '0')}`,
      foilholeId: `FH-${String(i + 1).padStart(3, '0')}`,
      gridsquareUuid: square.uuid,
      status,
      xLocation: Math.max(50, Math.min(2830, x)),
      yLocation: Math.max(50, Math.min(1996, y)),
      diameter,
      quality,
      isNearGridBar,
      micrographCount: status === 'processed' ? Math.round(randRange(1, 4)) : 0,
    })
  }

  return holes
}

// ---------------------------------------------------------------------------
// Pre-generate all data
// ---------------------------------------------------------------------------

const allGrids: MockGrid[] = [...generateGrids('ses-001', false), ...generateGrids('ses-005', true)]

const gridSquaresByGrid = new Map<string, MockGridSquare[]>()
const foilHolesBySquare = new Map<string, MockFoilHole[]>()

for (const grid of allGrids) {
  const squares = generateGridSquares(grid)
  gridSquaresByGrid.set(grid.uuid, squares)
  for (const sq of squares) {
    foilHolesBySquare.set(sq.uuid, generateFoilHoles(sq))
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getSessionGrids(sessionId: string): MockGrid[] {
  return allGrids.filter((g) => g.sessionId === sessionId)
}

export function getGrid(gridUuid: string): MockGrid | undefined {
  return allGrids.find((g) => g.uuid === gridUuid)
}

export function getGridSquares(gridUuid: string): MockGridSquare[] {
  return gridSquaresByGrid.get(gridUuid) ?? []
}

export function getGridSquare(squareUuid: string): MockGridSquare | undefined {
  for (const squares of gridSquaresByGrid.values()) {
    const found = squares.find((s) => s.uuid === squareUuid)
    if (found) return found
  }
  return undefined
}

export function getFoilHoles(squareUuid: string): MockFoilHole[] {
  return foilHolesBySquare.get(squareUuid) ?? []
}
