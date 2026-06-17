import { useEffect, useState } from 'react'

export interface ImageSize {
  width: number
  height: number
}

// Reads the intrinsic pixel dimensions of an (object-URL) image. The spatial overlays position
// their markers in the image's native pixel space, so the SVG viewBox must match the real image
// size rather than a hardcoded guess - otherwise a non-square image gets stretched and the overlay
// drifts off it. Returns null until the image has decoded.
export function useImageNaturalSize(url: string | undefined): ImageSize | null {
  const [size, setSize] = useState<ImageSize | null>(null)

  useEffect(() => {
    if (!url) {
      setSize(null)
      return
    }
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (!cancelled) setSize({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.src = url
    return () => {
      cancelled = true
    }
  }, [url])

  return size
}
