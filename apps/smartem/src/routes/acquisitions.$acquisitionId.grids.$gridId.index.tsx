import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/acquisitions/$acquisitionId/grids/$gridId/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/acquisitions/$acquisitionId/grids/$gridId/atlas',
      params,
    })
  },
})
