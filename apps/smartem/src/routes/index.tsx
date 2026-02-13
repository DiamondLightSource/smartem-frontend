import { Typography } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <Typography variant="h4" component="h1">
      Hello, SmartEM
    </Typography>
  )
}
