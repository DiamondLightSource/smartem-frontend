import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { EmptyState } from '~/components/EmptyState'
import { ErrorBoundary } from '~/components/ErrorBoundary'

// Inline check (rather than import from ~/data/mock-mode) so Vite's parse-time
// substitution of import.meta.env makes this a constant `false` in live builds.
// Rollup then drops the lazy import + the entire MockDashboard chunk.
const MockDashboard =
  import.meta.env.VITE_ENABLE_MOCKS === 'true'
    ? lazy(() => import('~/components/dashboard/MockDashboard'))
    : null

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  if (MockDashboard) {
    return (
      <ErrorBoundary label="Dashboard">
        <Suspense fallback={null}>
          <MockDashboard />
        </Suspense>
      </ErrorBoundary>
    )
  }
  return (
    <EmptyState
      title="Dashboard not yet wired to the live API"
      detail="The acquisitions, instruments and timeline panels rendered in mock mode are stubs against unimplemented endpoints. Use the Acquisitions link in the header to browse real data."
    />
  )
}
