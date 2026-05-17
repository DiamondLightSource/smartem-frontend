import { Box, Typography } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'
import { WeightsMatrix } from '~/components/weights/WeightsMatrix'
import {
  getModelWeightsForGrid,
  mockGridIdForWeights,
  mockGridLabelForWeights,
} from '~/data/mock-model-weights'
import { gray } from '~/theme'

export const Route = createFileRoute('/models')({
  component: ModelsPage,
})

function ModelsPage() {
  const weightsByModel = getModelWeightsForGrid(mockGridIdForWeights)

  return (
    <Box
      sx={{
        height: 'calc(100vh - 56px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        p: 0.5,
        gap: 0.5,
        backgroundColor: gray[50],
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 1.5,
          px: 3,
          py: 1.5,
          flexShrink: 0,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Typography variant="h4">Models</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          weights for {mockGridLabelForWeights}
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          p: 3,
        }}
      >
        <WeightsMatrix weightsByModel={weightsByModel} />
      </Box>
    </Box>
  )
}
