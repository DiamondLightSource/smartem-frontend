import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/sessions/$sessionId/grids/$gridId/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/sessions/$sessionId/grids/$gridId/atlas',
      params,
    })
  },
})
