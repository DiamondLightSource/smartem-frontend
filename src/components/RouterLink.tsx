import { Link } from '@tanstack/react-router'
import { forwardRef } from 'react'

// Cast to `any` to bridge React 19 (project) / React 18 (sci-react-ui peer) type gap.
// At runtime both versions are the same React 19 — only the type declarations differ.
const RouterLink = forwardRef<HTMLAnchorElement, { to: string; children?: React.ReactNode }>(
  ({ to, children, ...props }, ref) => (
    <Link to={to} ref={ref} {...props}>
      {children}
    </Link>
  )
  // biome-ignore lint/suspicious/noExplicitAny: bridges React 19/18 type gap with sci-react-ui
) as any

export { RouterLink }
