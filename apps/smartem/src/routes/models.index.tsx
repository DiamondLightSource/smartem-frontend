import { Box, Chip, Typography } from '@mui/material'
import {
  type QualityPredictionModelResponse,
  useGetGridsGridsGet,
  useGetModelWeightsForGridGridGridUuidModelWeightsGet,
  useGetPredictionModelsPredictionModelsGet,
} from '@smartem/api'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { WeightsMatrix } from '~/components/weights/WeightsMatrix'
import { gray, statusColors } from '~/theme'

export const Route = createFileRoute('/models/')({
  component: ModelsCatalogue,
})

function ModelsCatalogue() {
  const { data: models, isLoading } = useGetPredictionModelsPredictionModelsGet()
  const { data: grids } = useGetGridsGridsGet()

  // Cross-model weight matrix: pick a grid, then show every model's latest metric weights at
  // once. The weights endpoint already returns all models keyed by name, and WeightsMatrix
  // already renders one row per model - the per-model detail page just narrows it to one.
  const [gridChoice, setGridChoice] = useState('')
  const gridUuid = gridChoice || grids?.[0]?.uuid || ''
  const { data: weightsData } = useGetModelWeightsForGridGridGridUuidModelWeightsGet(gridUuid, {
    query: { enabled: !!gridUuid },
  })

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
          quality-prediction models registered with the backend
        </Typography>
        <Box sx={{ flex: 1 }} />
        {models && (
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            {models.length} {models.length === 1 ? 'model' : 'models'}
          </Typography>
        )}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
          <Typography variant="h6">Weight matrix</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            metric weights across all models for the selected grid — scrub the slider to see history
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Grid
          </Typography>
          <Box
            component="select"
            value={gridUuid}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setGridChoice(e.target.value)}
            sx={{
              fontSize: '0.8125rem',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.paper',
              color: 'text.primary',
              cursor: 'pointer',
            }}
          >
            {(grids ?? []).map((g) => (
              <option key={g.uuid} value={g.uuid}>
                {g.name}
              </option>
            ))}
          </Box>
        </Box>

        {gridUuid ? (
          <WeightsMatrix weightsByModel={weightsData ?? {}} showTimeSlider />
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No grids available to show weights for.
          </Typography>
        )}

        <Box sx={{ my: 3, borderTop: '1px solid', borderColor: 'divider' }} />

        <Typography variant="h6" sx={{ mb: 2 }}>
          Registered models
        </Typography>
        {isLoading && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Loading models…
          </Typography>
        )}
        {!isLoading && (!models || models.length === 0) && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No prediction models are registered.
          </Typography>
        )}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 2,
          }}
        >
          {(models ?? []).map((model) => (
            <ModelCard key={model.name} model={model} />
          ))}
        </Box>
      </Box>
    </Box>
  )
}

function ModelCard({ model }: { model: QualityPredictionModelResponse }) {
  return (
    <Link
      to="/models/$modelName"
      params={{ modelName: model.name }}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          p: 2,
          height: '100%',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          backgroundColor: 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.1s',
          '&:hover': { borderColor: gray[400], backgroundColor: gray[50] },
        }}
      >
        <Typography variant="body1" fontWeight={600}>
          {model.name}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', flex: 1 }}>
          {model.description || 'No description provided.'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          <CapabilityChip label="train" enabled={model.can_train} />
          <CapabilityChip label="infer" enabled={model.can_infer} />
          <CapabilityChip label="update" enabled={model.can_update} />
        </Box>
      </Box>
    </Link>
  )
}

function CapabilityChip({ label, enabled }: { label: string; enabled: boolean }) {
  const color = enabled ? statusColors.running : gray[400]
  return (
    <Chip
      size="small"
      label={label}
      sx={{
        height: 18,
        fontSize: '0.625rem',
        fontWeight: 500,
        backgroundColor: enabled ? `${color}14` : 'transparent',
        color: enabled ? color : 'text.disabled',
        border: `1px solid ${enabled ? `${color}40` : gray[300]}`,
        textDecoration: enabled ? 'none' : 'line-through',
        '& .MuiChip-label': { px: 0.75 },
      }}
    />
  )
}
