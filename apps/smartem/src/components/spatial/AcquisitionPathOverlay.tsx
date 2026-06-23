// SVG overlay (rendered inside SquareMap's <svg>, in native-pixel viewBox space) that draws the
// suggested acquisition path through a square's foilholes in order. Three switchable styles let us
// compare them in the UI before settling on one (issue #98, stage 2):
//   - 'gradient': a single line graded start->end (blue->orange) with a start dot and end arrow;
//                 direction reads from colour, no per-node numbers (cleanest on dense squares).
//   - 'numbered': the line plus a numbered badge at every hole (precise, but dense squares crowd).
//   - 'sparse':   the line plus an end arrow and numbered badges only at the start, end and a few
//                 milestones.
// The group is non-interactive so foilhole hover/click still works through it.

export type PathStyle = 'gradient' | 'numbered' | 'sparse'

export interface PathPoint {
  uuid: string
  x: number
  y: number
  rank: number
}

interface AcquisitionPathOverlayProps {
  points: PathPoint[]
  total: number
  style: PathStyle
  vbW: number
}

const START_COLOR = '#2f6feb'
const END_COLOR = '#e59344'
const LINE_COLOR = '#2f6feb'

function lerpColor(a: string, b: string, t: number): string {
  const pa = [
    Number.parseInt(a.slice(1, 3), 16),
    Number.parseInt(a.slice(3, 5), 16),
    Number.parseInt(a.slice(5, 7), 16),
  ]
  const pb = [
    Number.parseInt(b.slice(1, 3), 16),
    Number.parseInt(b.slice(3, 5), 16),
    Number.parseInt(b.slice(5, 7), 16),
  ]
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}

function arrowPoints(from: PathPoint, to: PathPoint, size: number): string {
  const angle = Math.atan2(to.y - from.y, to.x - from.x)
  const a1 = angle + Math.PI - Math.PI / 7
  const a2 = angle + Math.PI + Math.PI / 7
  const b1x = to.x + size * Math.cos(a1)
  const b1y = to.y + size * Math.sin(a1)
  const b2x = to.x + size * Math.cos(a2)
  const b2y = to.y + size * Math.sin(a2)
  return `${to.x},${to.y} ${b1x},${b1y} ${b2x},${b2y}`
}

export function AcquisitionPathOverlay({ points, total, style, vbW }: AcquisitionPathOverlayProps) {
  if (points.length < 2) return null

  // Sizes scale with the micrograph's native pixel space so they read at any zoom.
  const stroke = vbW / 480
  const dotR = vbW / 170
  const badgeR = vbW / 95
  const fontSize = vbW / 95
  const arrowSize = vbW / 70

  const first = points[0]
  const last = points[points.length - 1]
  const prevLast = points[points.length - 2]
  const polyPoints = points.map((p) => `${p.x},${p.y}`).join(' ')

  const badge = (p: PathPoint) => (
    <g key={`badge-${p.uuid}`}>
      <circle
        cx={p.x}
        cy={p.y}
        r={badgeR}
        fill={LINE_COLOR}
        stroke="#ffffff"
        strokeWidth={stroke / 2}
      />
      <text
        x={p.x}
        y={p.y}
        fill="#ffffff"
        fontSize={fontSize}
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {p.rank}
      </text>
    </g>
  )

  // 'sparse': start, end, and ~4 evenly spaced milestones in between.
  const step = Math.max(1, Math.round(total / 6))
  const sparseLabelled = points.filter(
    (p) => p.rank === 1 || p.rank === total || p.rank % step === 0
  )

  return (
    <g style={{ pointerEvents: 'none' }}>
      {style === 'gradient' ? (
        points.slice(0, -1).map((p, i) => {
          const next = points[i + 1]
          return (
            <line
              key={`seg-${p.uuid}`}
              x1={p.x}
              y1={p.y}
              x2={next.x}
              y2={next.y}
              stroke={lerpColor(START_COLOR, END_COLOR, i / (points.length - 1))}
              strokeWidth={stroke}
              strokeLinecap="round"
              opacity={0.9}
            />
          )
        })
      ) : (
        <polyline
          points={polyPoints}
          fill="none"
          stroke={LINE_COLOR}
          strokeWidth={stroke}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={0.5}
        />
      )}

      {/* End-of-path arrowhead for the styles that rely on it for direction. */}
      {(style === 'gradient' || style === 'sparse') && (
        <polygon
          points={arrowPoints(prevLast, last, arrowSize)}
          fill={style === 'gradient' ? END_COLOR : LINE_COLOR}
        />
      )}

      {/* Start marker for the gradient style (the badges already mark it for the others). */}
      {style === 'gradient' && (
        <circle
          cx={first.x}
          cy={first.y}
          r={dotR}
          fill={START_COLOR}
          stroke="#ffffff"
          strokeWidth={stroke / 2}
        />
      )}

      {style === 'numbered' && points.map(badge)}
      {style === 'sparse' && sparseLabelled.map(badge)}
    </g>
  )
}
