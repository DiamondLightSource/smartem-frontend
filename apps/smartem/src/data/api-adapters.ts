import type {
  FoilHoleResponse,
  FoilHoleStatus,
  GridResponse,
  GridSquareResponse,
  GridSquareStatus,
  GridStatus,
  LatentRepresentationResponse,
  MicrographResponse,
  MicrographStatus,
  OverallQualityPrediction,
  QualityPredictionModelResponse,
  QualityPredictionResponse,
} from '@smartem/api'
import type {
  MockFoilHole,
  MockGrid,
  MockGridSquare,
  MockLatentCoords,
  MockMicrograph,
  MockModelPredictions,
  MockPredictionDataPoint,
  MockPredictionModel,
} from './mock-session-detail'

// Bridge between the API-shaped responses (snake_case, nullable, richer schema) and the
// UI components' MockGridSquare/MockFoilHole/MockMicrograph shapes (camelCase, denser).
// Fields the API does not (yet) expose - quality predictions, latent coordinates, per-row
// counts - are filled with safe defaults so the UI degrades gracefully until those
// endpoints are wired.

const gridSquareStatusMap: Record<GridSquareStatus, MockGridSquare['status']> = {
  none: 'registered',
  'all foil holes registered': 'registered',
  'foil holes decision started': 'collected',
  'foil holes decision completed': 'completed',
}

const foilHoleStatusMap: Record<FoilHoleStatus, MockFoilHole['status']> = {
  none: 'none',
  'micrographs detected': 'processed',
}

const micrographStatusMap: Record<MicrographStatus, MockMicrograph['processingStatus']> = {
  none: 'pending',
  'motion correction started': 'processing',
  'motion correction completed': 'processing',
  'ctf started': 'processing',
  'ctf completed': 'processing',
  'particle picking started': 'processing',
  'particle picking completed': 'processing',
  'particle selection started': 'processing',
  'particle selection completed': 'completed',
}

const gridStatusMap: Record<GridStatus, MockGrid['status']> = {
  none: 'queued',
  'scan started': 'screening',
  'scan completed': 'collecting',
  'grid squares decision started': 'collecting',
  'grid squares decision completed': 'completed',
}

export function gridResponseToMock(r: GridResponse): MockGrid {
  return {
    uuid: r.uuid,
    name: r.name,
    sessionId: r.acquisition_uuid ?? '',
    status: r.status ? gridStatusMap[r.status] : 'queued',
    scanStartTime: r.scan_start_time,
    scanEndTime: r.scan_end_time,
    squareCount: 0,
    foilholeCount: 0,
    micrographCount: 0,
    avgQuality: null,
  }
}

export function gridSquareResponseToMock(r: GridSquareResponse): MockGridSquare {
  return {
    uuid: r.uuid,
    gridsquareId: r.gridsquare_id,
    gridUuid: r.grid_uuid ?? '',
    status: r.status ? gridSquareStatusMap[r.status] : 'registered',
    centerX: r.center_x ?? 0,
    centerY: r.center_y ?? 0,
    sizeWidth: r.size_width ?? 200,
    selected: r.selected ?? false,
    defocus: r.defocus,
    magnification: r.magnification,
    quality: 0,
    foilholeCount: 0,
    latent: null,
    hasImageData: r.image_path != null,
  }
}

export function foilHoleResponseToMock(r: FoilHoleResponse): MockFoilHole {
  return {
    uuid: r.uuid,
    foilholeId: r.foilhole_id,
    gridsquareUuid: r.gridsquare_id ?? '',
    status: r.status ? foilHoleStatusMap[r.status] : 'none',
    xLocation: r.x_location ?? 0,
    yLocation: r.y_location ?? 0,
    diameter: r.diameter ?? 0,
    quality: r.quality ?? 0,
    isNearGridBar: r.is_near_grid_bar,
    micrographCount: 0,
    resolution: null,
    astigmatism: null,
    particleCount: null,
    latent: null,
  }
}

export function predictionModelResponseToMock(
  r: QualityPredictionModelResponse
): MockPredictionModel {
  return {
    id: r.name,
    name: r.name,
    version: 'unknown',
    description: r.description,
    type: 'grid-quality',
  }
}

export function micrographResponseToMock(r: MicrographResponse): MockMicrograph {
  return {
    uuid: r.uuid,
    micrographId: r.micrograph_id ?? '',
    foilholeUuid: r.foilhole_uuid,
    timestamp: r.acquisition_datetime ?? '',
    processingStatus: micrographStatusMap[r.status],
    resolution: r.ctf_max_resolution_estimate ?? 0,
    defocus: r.defocus ?? 0,
    astigmatism: 0,
    motionTotal: r.total_motion ?? 0,
    ctfFitResolution: r.ctf_max_resolution_estimate ?? 0,
  }
}

// Builds the MockModelPredictions shape the atlas/predictions views consume from the
// grid-level quality-prediction response. The backend returns the latest prediction per
// grid square (gridsquare_uuid set); when no square-level predictions exist it falls back
// to per-foilhole rows, still tagged with their parent gridsquare_uuid - so several rows
// can share a square, which we average for the square heatmap.
export function predictionResponsesToMockPredictions(
  modelId: string,
  gridUuid: string,
  responses: QualityPredictionResponse[]
): MockModelPredictions {
  const sorted = [...responses].sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  const squareSums = new Map<string, { sum: number; count: number }>()
  const foilholeQualities = new Map<string, number>()
  const dataPoints: MockPredictionDataPoint[] = []

  for (const r of sorted) {
    if (r.foilhole_uuid) {
      foilholeQualities.set(r.foilhole_uuid, r.value)
    }
    if (r.gridsquare_uuid) {
      const acc = squareSums.get(r.gridsquare_uuid)
      if (acc) {
        acc.sum += r.value
        acc.count += 1
      } else {
        squareSums.set(r.gridsquare_uuid, { sum: r.value, count: 1 })
      }
      dataPoints.push({ timestamp: r.timestamp, squareUuid: r.gridsquare_uuid, quality: r.value })
    }
  }

  const squareQualities = new Map<string, number>()
  for (const [uuid, { sum, count }] of squareSums) {
    squareQualities.set(uuid, sum / count)
  }

  return { modelId, gridUuid, dataPoints, squareQualities, foilholeQualities }
}

// Maps a grid's latent-representation response to per-square coordinates for the atlas
// cluster colouring and latent-space scatter. Rows without coordinates are skipped.
export function latentResponsesToCoordsByUuid(
  responses: LatentRepresentationResponse[]
): Map<string, MockLatentCoords> {
  const byUuid = new Map<string, MockLatentCoords>()
  for (const r of responses) {
    if (r.gridsquare_uuid == null || r.x == null || r.y == null) continue
    byUuid.set(r.gridsquare_uuid, { x: r.x, y: r.y, clusterIndex: r.index ?? 0 })
  }
  return byUuid
}

// Maps a gridsquare's latent-representation response to per-foilhole coordinates for the
// square-level latent-space scatter. Keyed by foilhole uuid (vs the grid version's square
// uuid); rows without coordinates are skipped.
export function latentResponsesToCoordsByFoilhole(
  responses: LatentRepresentationResponse[]
): Map<string, MockLatentCoords> {
  const byUuid = new Map<string, MockLatentCoords>()
  for (const r of responses) {
    if (r.foilhole_uuid == null || r.x == null || r.y == null) continue
    byUuid.set(r.foilhole_uuid, { x: r.x, y: r.y, clusterIndex: r.index ?? 0 })
  }
  return byUuid
}

// Latest predicted value per foilhole for one (model, gridsquare), keyed by foilhole uuid -
// drives the per-model prediction overlay on the square map.
export function foilholePredictionMap(responses: QualityPredictionResponse[]): Map<string, number> {
  const sorted = [...responses].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  const byFoilhole = new Map<string, number>()
  for (const r of sorted) {
    if (r.foilhole_uuid) byFoilhole.set(r.foilhole_uuid, r.value)
  }
  return byFoilhole
}

// Cross-model "overall" predicted value per foilhole for a gridsquare.
export function overallPredictionMap(responses: OverallQualityPrediction[]): Map<string, number> {
  const byFoilhole = new Map<string, number>()
  for (const r of responses) {
    byFoilhole.set(r.foilhole_uuid, r.value)
  }
  return byFoilhole
}
