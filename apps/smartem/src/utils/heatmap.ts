// Heatmap binning and coloring utilities
// Ported from pato-frontend's Heatmap.tsx — supports log/linear binning
// with a viridis-like 5-color palette.

export const HEATMAP_PALETTE = ['#fde725', '#5ec962', '#21918c', '#3b528b', '#440154'] as const

export const CLUSTER_PALETTE = [
  '#f2a2a9',
  '#85b6b2',
  '#a77c9f',
  '#e59344',
  '#6ba059',
  '#d1605e',
  '#5878a3',
  '#e7cc60',
  '#c1ff9b',
  '#fb62f6',
] as const

export interface HeatmapOptions {
  label: string
  min?: number
  max?: number
  type: 'linear' | 'log'
  binCount: number
}

export interface HeatmapBin {
  edge: number
  color: string
}

export interface ColoredValue {
  value: number | null
  color: string | null
}

export function computeHeatmapBins(
  values: (number | null)[],
  options: HeatmapOptions
): HeatmapBin[] {
  const nonNull = values.filter((v): v is number => v !== null).sort((a, b) => a - b)
  if (nonNull.length === 0) return []

  const min = options.min ?? nonNull[0]
  const max =
    options.max !== undefined && options.max >= min ? options.max : nonNull[nonNull.length - 1]
  const range = max - min

  if (range === 0) {
    return [{ edge: min, color: HEATMAP_PALETTE[0] }]
  }

  const bins: HeatmapBin[] = []
  const binCount = options.binCount

  if (options.type === 'log') {
    const binBase = (range + 1) ** (1 / (binCount - 1))
    bins.push({ edge: min, color: HEATMAP_PALETTE[0] })
    for (let i = 1; i < binCount; i++) {
      const colorIdx = Math.min(i, HEATMAP_PALETTE.length - 1)
      bins.push({ edge: min + binBase ** i - 1, color: HEATMAP_PALETTE[colorIdx] })
    }
  } else {
    const step = range / (binCount - 1)
    for (let i = 0; i < binCount; i++) {
      const colorIdx = Math.min(i, HEATMAP_PALETTE.length - 1)
      bins.push({ edge: min + step * i, color: HEATMAP_PALETTE[colorIdx] })
    }
  }

  return bins
}

export function valueToHeatmapColor(value: number | null, bins: HeatmapBin[]): string | null {
  if (value === null || bins.length === 0) return null

  for (let i = bins.length - 1; i >= 0; i--) {
    if (value >= bins[i].edge) return bins[i].color
  }
  return bins[0].color
}

export function qualityColor(q: number): string {
  if (q >= 0.7) return '#1a7f37'
  if (q >= 0.4) return '#bf8700'
  return '#cf222e'
}
