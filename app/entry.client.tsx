import { startTransition, StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { HydratedRouter } from 'react-router/dom'

// Enable mocking if VITE_ENABLE_MOCKS is set
if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
  const { enableMocking } = await import('./mocks')
  await enableMocking()
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  )
})
