// src/utils/hexUtils.js

// ─── your hex “radius” ───────────────────────────────────────
export const hexSize    = 41
export const MAX_RADIUS = 22
export const TOTAL_HEX_COUNT = 1 + 3 * MAX_RADIUS * (MAX_RADIUS + 1) // = 817

// ─── axial distance (to origin by default) ───────────────────
export function axialDistance(a, b = { q: 0, r: 0 }) {
  const dq = a.q - b.q
  const dr = a.r - b.r
  const dy = -dq - dr
  return (Math.abs(dq) + Math.abs(dy) + Math.abs(dr)) / 2
}

// ─── axial → pixel (flat-top) ────────────────────────────────
export function axialToPixel({ q, r }) {
  return {
    cx: hexSize * (1.5 * q),
    cy: hexSize * (Math.sqrt(3) * (r + q / 2))
  }
}

// ─── corner points for a flat-top hex at (cx,cy) ─────────────
export function hexagonPoints(cx, cy) {
  const pts = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i
    pts.push({
      x: cx + hexSize * Math.cos(angle),
      y: cy + hexSize * Math.sin(angle)
    })
  }
  return pts
}

// ─── build our spiral once at load time ──────────────────────
const _SPIRAL = (() => {
  const all = []
  // 1) collect all coords in bounding square
  for (let q = -MAX_RADIUS; q <= MAX_RADIUS; q++) {
    for (let r = -MAX_RADIUS; r <= MAX_RADIUS; r++) {
      if (axialDistance({ q, r }) <= MAX_RADIUS) {
        all.push({ q, r })
      }
    }
  }
  // 2) sort by (ring, then clockwise angle from “north”)
  all.sort((A, B) => {
    const da = axialDistance(A)
    const db = axialDistance(B)
    if (da !== db) return da - db

    // compute small-angle from “straight up” N (0,-1)
    const aPx = axialToPixel(A)
    const bPx = axialToPixel(B)
    const rawA = Math.atan2(aPx.cx, -aPx.cy)
    const rawB = Math.atan2(bPx.cx, -bPx.cy)
    const angleA = rawA < 0 ? rawA + 2 * Math.PI : rawA
    const angleB = rawB < 0 ? rawB + 2 * Math.PI : rawB
    return angleA - angleB
  })
  return all
})()

// ─── your new spiral lookup ─────────────────────────────────
export function axialFromIndex(idx) {
  return _SPIRAL[idx] || { q: 0, r: 0 }
}
