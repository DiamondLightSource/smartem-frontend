import { Box, Typography } from '@mui/material'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: (error: Error) => ReactNode
  label?: string
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error(`[ErrorBoundary${this.props.label ? ` ${this.props.label}` : ''}]`, error, info)
    }
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children
    if (this.props.fallback) return this.props.fallback(error)
    return <DefaultFallback label={this.props.label} error={error} />
  }
}

function DefaultFallback({ label, error }: { label?: string; error: Error }) {
  return (
    <Box
      role="alert"
      sx={{
        p: 1.5,
        m: 0.5,
        border: '1px solid',
        borderColor: 'error.light',
        borderRadius: 1,
        backgroundColor: 'error.50',
        color: 'error.dark',
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
        {label ? `${label} failed to render` : 'Component failed to render'}
      </Typography>
      <Typography
        variant="caption"
        component="pre"
        sx={{
          m: 0,
          fontSize: '0.6875rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          opacity: 0.85,
        }}
      >
        {error.message}
      </Typography>
    </Box>
  )
}
