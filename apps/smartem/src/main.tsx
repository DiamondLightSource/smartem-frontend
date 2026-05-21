import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthGate, type RuntimeConfig, setRuntimeConfig } from './auth'
import { routeTree } from './routeTree.gen'
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

async function enableMocking(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') {
    return
  }

  const { worker } = await import('./mocks/browser')

  await worker.start({
    onUnhandledRequest: 'warn',
  })
}

const rootElement = document.getElementById('root')
if (rootElement && !rootElement.innerHTML) {
  loadRuntimeConfig()
    .then(() => enableMocking())
    .then(() => {
      const root = createRoot(rootElement)
      root.render(
        <StrictMode>
          <AuthGate>
            <RouterProvider router={router} />
          </AuthGate>
        </StrictMode>
      )
    })
    .catch((err) => {
      console.error('App boot failed:', err)
      rootElement.innerHTML = `<pre style="padding:24px;font-family:system-ui;color:#b91c1c">Failed to start SmartEM: ${err instanceof Error ? err.message : String(err)}</pre>`
    })
}
