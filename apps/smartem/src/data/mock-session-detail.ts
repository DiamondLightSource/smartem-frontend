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

export interface MockLatentCoords {
  x: number
  y: number
  clusterIndex: number
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
  latent: MockLatentCoords | null
  hasImageData: boolean
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
  resolution: number | null
  astigmatism: number | null
  particleCount: number | null
  latent: MockLatentCoords | null
}

export interface MockMicrograph {
  uuid: string
  micrographId: string
  foilholeUuid: string
  timestamp: string
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  resolution: number
  defocus: number
  astigmatism: number
  motionTotal: number
  ctfFitResolution: number
}

export interface MockPredictionModel {
  id: string
  name: string
  version: string
  description: string
  type: 'grid-quality' | 'ice-thickness' | 'particle-density' | 'ctf-quality'
}

export interface MockPredictionDataPoint {
  timestamp: string
  squareUuid: string
  quality: number
}

export interface MockModelPredictions {
  modelId: string
  gridUuid: string
  dataPoints: MockPredictionDataPoint[]
  squareQualities: Map<string, number>
  foilholeQualities: Map<string, number>
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

    const hasData = sqStatus !== 'registered'
    squares.push({
      uuid: `${grid.uuid}-sq-${String(i).padStart(3, '0')}`,
      gridsquareId: `GS-${String(i + 1).padStart(3, '0')}`,
      gridUuid: grid.uuid,
      status: sqStatus,
      centerX: Math.max(200, Math.min(3805, x)),
      centerY: Math.max(200, Math.min(3805, y)),
      sizeWidth,
      selected: rand() > 0.3,
      defocus: hasData ? +(-randRange(0.8, 3.0)).toFixed(1) : null,
      magnification: hasData ? Math.round(randRange(75000, 130000)) : null,
      quality,
      foilholeCount: fhCount,
      latent: hasData
        ? {
            x: +randRange(-3, 3).toFixed(2),
            y: +randRange(-3, 3).toFixed(2),
            clusterIndex: Math.floor(randRange(0, 10)),
          }
        : null,
      hasImageData: hasData && rand() > 0.2,
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

    const hasProcessed = status === 'processed'
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
      micrographCount: hasProcessed ? Math.round(randRange(1, 4)) : 0,
      resolution: hasProcessed ? +randRange(1.5, 5.0).toFixed(2) : null,
      astigmatism: hasProcessed ? +randRange(1, 50).toFixed(1) : null,
      particleCount: hasProcessed ? Math.round(randRange(10, 300)) : null,
      latent:
        status !== 'none'
          ? {
              x: +randRange(-3, 3).toFixed(2),
              y: +randRange(-3, 3).toFixed(2),
              clusterIndex: Math.floor(randRange(0, 10)),
            }
          : null,
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
// Prediction models (static)
// ---------------------------------------------------------------------------

const predictionModels: MockPredictionModel[] = [
  {
    id: 'model-resnet-gq',
    name: 'ResNet-GridQuality',
    version: '2.1.0',
    description: 'Grid square quality classifier using ResNet backbone',
    type: 'grid-quality',
  },
  {
    id: 'model-ice-thick',
    name: 'IceThickness-v2',
    version: '2.0.3',
    description: 'Ice thickness estimation from grid square images',
    type: 'ice-thickness',
  },
  {
    id: 'model-particle-cnn',
    name: 'ParticleDensity-CNN',
    version: '1.4.1',
    description: 'Particle density estimation using CNN',
    type: 'particle-density',
  },
  {
    id: 'model-ctf-qual',
    name: 'CTF-QualityNet',
    version: '1.2.0',
    description: 'CTF fit quality assessment network',
    type: 'ctf-quality',
  },
]

// ---------------------------------------------------------------------------
// Second PRNG seed for new data (avoids disturbing existing deterministic data)
// ---------------------------------------------------------------------------

const rand2 = mulberry32(137)

function rand2Range(min: number, max: number) {
  return min + rand2() * (max - min)
}

// ---------------------------------------------------------------------------
// Generate micrographs for a foilhole
// ---------------------------------------------------------------------------

function generateMicrographs(foilhole: MockFoilHole): MockMicrograph[] {
  const count = foilhole.micrographCount
  const micrographs: MockMicrograph[] = []

  for (let i = 0; i < count; i++) {
    const r = rand2()
    const status: MockMicrograph['processingStatus'] =
      r < 0.65 ? 'completed' : r < 0.8 ? 'processing' : r < 0.92 ? 'pending' : 'failed'

    micrographs.push({
      uuid: `${foilhole.uuid}-mic-${String(i).padStart(3, '0')}`,
      micrographId: `MIC-${String(i + 1).padStart(4, '0')}`,
      foilholeUuid: foilhole.uuid,
      timestamp: `2026-02-16T${String(8 + Math.floor(i * 0.5)).padStart(2, '0')}:${String(Math.round(rand2Range(0, 59))).padStart(2, '0')}:00Z`,
      processingStatus: status,
      resolution: +rand2Range(1.5, 4.5).toFixed(2),
      defocus: +(-rand2Range(0.8, 3.5)).toFixed(2),
      astigmatism: +rand2Range(0.01, 0.15).toFixed(3),
      motionTotal: +rand2Range(0.5, 8.0).toFixed(2),
      ctfFitResolution: +rand2Range(2.0, 6.0).toFixed(2),
    })
  }

  return micrographs
}

// ---------------------------------------------------------------------------
// Generate predictions for a grid
// ---------------------------------------------------------------------------

function generatePredictions(gridUuid: string, squares: MockGridSquare[]): MockModelPredictions[] {
  return predictionModels.map((model) => {
    const dataPoints: MockPredictionDataPoint[] = squares.map((sq, i) => ({
      timestamp: `2026-02-16T${String(6 + Math.floor((i * 20) / 60)).padStart(2, '0')}:${String((i * 20) % 60).padStart(2, '0')}:00Z`,
      squareUuid: sq.uuid,
      quality: +rand2Range(0.15, 0.95).toFixed(3),
    }))

    const squareQualities = new Map<string, number>()
    for (const sq of squares) {
      squareQualities.set(sq.uuid, +rand2Range(0.1, 0.98).toFixed(3))
    }

    const foilholeQualities = new Map<string, number>()
    for (const sq of squares) {
      const fhs = foilHolesBySquare.get(sq.uuid) ?? []
      for (const fh of fhs) {
        foilholeQualities.set(fh.uuid, +rand2Range(0.1, 0.98).toFixed(3))
      }
    }

    return { modelId: model.id, gridUuid, dataPoints, squareQualities, foilholeQualities }
  })
}

// ---------------------------------------------------------------------------
// Pre-generate micrographs and predictions
// ---------------------------------------------------------------------------

const micrographsByFoilhole = new Map<string, MockMicrograph[]>()
const predictionsByGrid = new Map<string, MockModelPredictions[]>()

for (const foilholes of foilHolesBySquare.values()) {
  for (const fh of foilholes) {
    micrographsByFoilhole.set(fh.uuid, generateMicrographs(fh))
  }
}

for (const grid of allGrids) {
  const squares = gridSquaresByGrid.get(grid.uuid) ?? []
  predictionsByGrid.set(grid.uuid, generatePredictions(grid.uuid, squares))
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

export function getFoilHole(foilholeUuid: string): MockFoilHole | undefined {
  for (const foilholes of foilHolesBySquare.values()) {
    const found = foilholes.find((fh) => fh.uuid === foilholeUuid)
    if (found) return found
  }
  return undefined
}

export function getMicrographs(foilholeUuid: string): MockMicrograph[] {
  return micrographsByFoilhole.get(foilholeUuid) ?? []
}

export function getPredictionModels(): MockPredictionModel[] {
  return predictionModels
}

export function getGridPredictions(gridUuid: string): MockModelPredictions[] {
  return predictionsByGrid.get(gridUuid) ?? []
}
