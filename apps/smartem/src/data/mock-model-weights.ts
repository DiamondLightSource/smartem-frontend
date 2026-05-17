import type { QualityPredictionModelWeight } from '@smartem/api'

export const mockGridIdForWeights = '11111111-1111-1111-1111-111111111111'

export const mockGridLabelForWeights = 'grid-A1 (mock)'

const HISTORY_TIMESTAMPS = [
  '2026-04-29T13:00:00.000Z',
  '2026-04-29T14:00:00.000Z',
  '2026-04-29T15:00:00.000Z',
  '2026-04-29T16:00:00.000Z',
  '2026-04-29T17:00:00.000Z',
  '2026-04-29T18:00:00.000Z',
] as const

type LatestWeight = { metric: string; weight: number }

const latestByModel: Record<string, LatestWeight[]> = {
  'resnet-atlas': [
    { metric: 'defocus', weight: 0.82 },
    { metric: 'astigmatism', weight: 0.71 },
    { metric: 'ice_thickness', weight: 0.45 },
    { metric: 'motion', weight: 0.68 },
    { metric: 'ctf_resolution', weight: 0.79 },
  ],
  'vit-gridsquare': [
    { metric: 'defocus', weight: 0.74 },
    { metric: 'astigmatism', weight: 0.88 },
    { metric: 'ice_thickness', weight: 0.62 },
    { metric: 'ctf_resolution', weight: 0.81 },
  ],
  'efficientnet-ice': [
    { metric: 'defocus', weight: 0.3 },
    { metric: 'astigmatism', weight: 0.35 },
    { metric: 'ice_thickness', weight: 0.92 },
    { metric: 'motion', weight: 0.4 },
    { metric: 'ctf_resolution', weight: 0.55 },
  ],
  'dae-atlas': [
    { metric: 'defocus', weight: 0.55 },
    { metric: 'astigmatism', weight: 0.62 },
    { metric: 'ice_thickness', weight: 0.4 },
    { metric: 'motion', weight: 0.5 },
    { metric: 'ctf_resolution', weight: 0.65 },
  ],
}

function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function buildHistory(modelName: string, latest: LatestWeight): QualityPredictionModelWeight[] {
  const seed = (modelName.length + latest.metric.length) % 7
  return HISTORY_TIMESTAMPS.map((timestamp, idx) => {
    const drift = ((idx + seed) % 5) * 0.02 - 0.04
    const w = idx === HISTORY_TIMESTAMPS.length - 1 ? latest.weight : clamp01(latest.weight + drift)
    return {
      grid_uuid: mockGridIdForWeights,
      timestamp,
      prediction_model_name: modelName,
      metric_name: latest.metric,
      weight: Number(w.toFixed(3)),
    }
  })
}

const weightsByModel: Record<string, QualityPredictionModelWeight[]> = Object.fromEntries(
  Object.entries(latestByModel).map(([modelName, metrics]) => [
    modelName,
    metrics.flatMap((m) => buildHistory(modelName, m)),
  ])
)

export function getModelWeightsForGrid(
  gridId: string
): Record<string, QualityPredictionModelWeight[]> {
  if (gridId !== mockGridIdForWeights) return {}
  return weightsByModel
}
