import { useEffect, useState } from 'react'

// The image routes are auth-protected, but a browser's SVG <image>/<img> load can't
// carry the bearer token. Callers fetch the image as an authenticated blob (via the
// generated query hooks, which go through the token-aware axios instance) and pass it
// here to obtain a short-lived object URL for the element's href/src. The URL is revoked
// when the blob changes or the component unmounts so blobs don't leak.
export function useBlobObjectUrl(blob: Blob | null | undefined): string | undefined {
  const [objectUrl, setObjectUrl] = useState<string>()

  useEffect(() => {
    if (!blob) {
      setObjectUrl(undefined)
      return
    }
    const url = URL.createObjectURL(blob)
    setObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [blob])

  return objectUrl
}
