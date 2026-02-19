import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/acquisitions')({
  component: AcquisitionsLayout,
})

function AcquisitionsLayout() {
  return <Outlet />
}
