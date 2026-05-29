import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { ErrorBoundary } from '~/components/ErrorBoundary'

// Inline check (rather than import from ~/data/mock-mode) so Vite's parse-time
// substitution makes this a constant `false` in live builds. Rollup then drops
// the lazy import + the entire MockDashboard chunk.
const Dashboard =
  import.meta.env.VITE_ENABLE_MOCKS === 'true'
    ? lazy(() => import('~/components/dashboard/MockDashboard'))
    : lazy(() => import('~/components/dashboard/RealDashboard'))

export const Route = createFileRoute('/')({
  component: DashboardRoute,
})

function DashboardRoute() {
  return (
    <ErrorBoundary label="Dashboard">
      <Suspense fallback={null}>
        <Dashboard />
      </Suspense>
    </ErrorBoundary>
  )
}
