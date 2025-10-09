import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'

// Enable mocking if VITE_ENABLE_MOCKS is set
if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
  const { enableMocking } = await import('./mocks')
  await enableMocking()
}

createRoot(document).render(
  <StrictMode>
    <RouterProvider />
  </StrictMode>
)
