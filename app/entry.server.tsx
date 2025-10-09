import { renderToString } from 'react-dom/server'
import { ServerRouter } from 'react-router'

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: any
) {
  // In SPA mode, this is only used for build-time prerendering
  const html = renderToString(
    <ServerRouter context={remixContext} url={request.url} />
  )

  responseHeaders.set('Content-Type', 'text/html')

  return new Response('<!DOCTYPE html>' + html, {
    headers: responseHeaders,
    status: responseStatusCode,
  })
}
