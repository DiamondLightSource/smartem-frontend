import { Box, Chip, Typography } from '@mui/material'
import {
  type QualityPredictionModelWeight,
  useGetGridsGridsGet,
  useGetModelWeightsForGridGridGridUuidModelWeightsGet,
  useGetPredictionModelPredictionModelsNameGet,
} from '@smartem/api'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { WeightsMatrix } from '~/components/weights/WeightsMatrix'
import { gray, statusColors } from '~/theme'

export const Route = createFileRoute('/models/$modelName')({
  component: ModelDetail,
})

function ModelDetail() {
  const { modelName } = Route.useParams()
  const { data: model, isLoading } = useGetPredictionModelPredictionModelsNameGet(modelName)
  const { data: grids } = useGetGridsGridsGet()

  const [gridChoice, setGridChoice] = useState('')
  const gridUuid = gridChoice || grids?.[0]?.uuid || ''

  const { data: weightsData } = useGetModelWeightsForGridGridGridUuidModelWeightsGet(gridUuid)

  // The weights endpoint returns every model's weights for the grid; narrow to this model.
  const weightsForModel = useMemo<Record<string, QualityPredictionModelWeight[]>>(
    () => ({ [modelName]: weightsData?.[modelName] ?? [] }),
    [weightsData, modelName]
  )

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
          flexDirection: 'column',
          gap: 1,
          px: 3,
          py: 1.5,
          flexShrink: 0,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Link to="/models" style={{ textDecoration: 'none' }}>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
          >
            ← Models
          </Typography>
        </Link>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="h4">{modelName}</Typography>
          {model && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <CapabilityChip label="train" enabled={model.can_train} />
              <CapabilityChip label="infer" enabled={model.can_infer} />
              <CapabilityChip label="update" enabled={model.can_update} />
            </Box>
          )}
        </Box>
        {isLoading && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Loading model…
          </Typography>
        )}
        {model && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {model.description || 'No description provided.'}
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
          <Typography variant="h6">Metric weights</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            latest recorded weight per metric for the selected grid
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
          <WeightsMatrix weightsByModel={weightsForModel} />
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No grids available to show weights for.
          </Typography>
        )}
      </Box>
    </Box>
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
