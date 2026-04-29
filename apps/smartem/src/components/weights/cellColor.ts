import { gray } from '~/theme'

const LOW_RGB = { r: 246, g: 248, b: 250 }
const HIGH_RGB = { r: 5, g: 80, b: 174 }
const TEXT_LIGHT = '#ffffff'
const TEXT_DARK = gray[900]

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t)
}

function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

export function cellFillColor(weight: number): string {
  const t = clamp01(weight)
  const r = lerp(LOW_RGB.r, HIGH_RGB.r, t)
  const g = lerp(LOW_RGB.g, HIGH_RGB.g, t)
  const b = lerp(LOW_RGB.b, HIGH_RGB.b, t)
  return `rgb(${r}, ${g}, ${b})`
}

export function cellTextColor(weight: number): string {
  return clamp01(weight) >= 0.55 ? TEXT_LIGHT : TEXT_DARK
}
