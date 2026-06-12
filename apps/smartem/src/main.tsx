import { checkApiVersion } from '@smartem/api'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthGate, type RuntimeConfig, setRuntimeConfig } from './auth'
import { routeTree } from './routeTree.gen'
// Self-hosted Inter (variable, optical-size + weight axes, upright + italic) - no
// runtime Google Fonts CDN dependency. Matches the axes the CDN <link> used to serve.
import '@fontsource-variable/inter/opsz.css'
import '@fontsource-variable/inter/opsz-italic.css'
import './app.css'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

async function loadRuntimeConfig(): Promise<void> {
  const response = await fetch('/config.json', { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`Failed to load /config.json: ${response.status} ${response.statusText}`)
  }
  const config = (await response.json()) as RuntimeConfig
  setRuntimeConfig(config)
}

async function startMockWorker(): Promise<void> {
  const { worker } = await import('./mocks/browser')
  await worker.start({
    onUnhandledRequest: 'warn',
  })
}

// Observe-only backend compatibility check (ADR 0020). Fire-and-forget so it never
// blocks first paint; logs to the console always, and surfaces a non-blocking banner
// in development only. Never enforced - rolling deploys may momentarily differ.
function reportApiVersion(): void {
  void checkApiVersion().then((info) => {
    if (info.compatible) {
      console.info(
        `[API version] client ${info.clientVersion} <-> server ${info.serverVersion ?? 'unknown'} (compatible)`
      )
      return
    }
    console.warn(`[API version] ${info.message}`)
    if (import.meta.env.DEV) {
      const banner = document.createElement('div')
      banner.textContent = info.message
      banner.style.cssText =
        'position:fixed;bottom:0;left:0;right:0;z-index:99999;padding:6px 12px;font:12px system-ui;' +
        'background:#fef3c7;color:#92400e;border-top:1px solid #f59e0b;text-align:center'
      document.body.appendChild(banner)
    }
  })
}

const useMocks = import.meta.env.VITE_ENABLE_MOCKS === 'true'

const rootElement = document.getElementById('root')
if (rootElement && !rootElement.innerHTML) {
  ;(useMocks ? startMockWorker() : loadRuntimeConfig())
    .then(() => {
      const root = createRoot(rootElement)
      root.render(
        <StrictMode>
          <AuthGate>
            <RouterProvider router={router} />
          </AuthGate>
        </StrictMode>
      )
      // Live mode only - mock mode has no real backend to query.
      if (!useMocks) {
        reportApiVersion()
      }
    })
    .catch((err) => {
      console.error('App boot failed:', err)
      rootElement.innerHTML = `<pre style="padding:24px;font-family:system-ui;color:#b91c1c">Failed to start SmartEM: ${err instanceof Error ? err.message : String(err)}</pre>`
    })
}
