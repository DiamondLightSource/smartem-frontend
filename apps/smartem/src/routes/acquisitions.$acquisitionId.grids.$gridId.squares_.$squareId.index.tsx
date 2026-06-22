import { Box, IconButton, Tooltip } from '@mui/material'
import {
  getGetSquareLatentRepPredictionModelPredictionModelNameGridsquareGridsquareUuidLatentRepresentationGetQueryOptions as squareLatentRepQueryOptions,
  useGetPredictionModelsPredictionModelsGet,
} from '@smartem/api'
import { useQueries } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { type LatentSpaceItem, LatentSpacePanel } from '~/components/spatial/LatentSpacePanel'
import { SquareMap } from '~/components/spatial/SquareMap'
import { latentResponsesToCoordsByFoilhole } from '~/data/api-adapters'
import { useSquareMapData } from '~/hooks/useSquareMapData'
import { gray } from '~/theme'

export const Route = createFileRoute(
  '/acquisitions/$acquisitionId/grids/$gridId/squares_/$squareId/'
)({
  component: SquareIndexView,
})

function SquareIndexView() {
  const { acquisitionId, gridId, squareId } = Route.useParams()
  const navigate = useNavigate()
  const {
    foilholes,
    squareLabel,
    imageUrl,
    imageLoading,
    imageWidth,
    imageHeight,
    predictionLayers,
    predictionValues,
    suggestedHoleIds,
  } = useSquareMapData(squareId)

  // Fan out one latent-rep query per model, scoped to this gridsquare. Mirrors the atlas, which does
  // the same at the grid level; React Query dedupes the models call with the one inside useSquareMapData.
  const { data: modelResponses } = useGetPredictionModelsPredictionModelsGet()
  const models = useMemo(() => modelResponses ?? [], [modelResponses])
  const latentResults = useQueries({
    queries: models.map((m) => squareLatentRepQueryOptions(m.name, squareId)),
  })

  // Lacking a model-type distinction in the API, use the first model that returns foilhole coordinates.
  const latentByFoilhole = useMemo(() => {
    for (const result of latentResults) {
      if (result?.data && result.data.length > 0) {
        const map = latentResponsesToCoordsByFoilhole(result.data)
        if (map.size > 0) return map
      }
    }
    return null
  }, [latentResults])

  const latentItems = useMemo<LatentSpaceItem[]>(() => {
    if (!latentByFoilhole) return []
    const lookup = latentByFoilhole
    return foilholes.flatMap((fh) => {
      const latent = lookup.get(fh.uuid)
      if (!latent) return []
      return [{ id: fh.uuid, label: fh.foilholeId, latent, predictionValue: fh.quality }]
    })
  }, [foilholes, latentByFoilhole])

  // Hover is owned here so the map and the latent scatter cross-highlight the same foilhole.
  const [showLatent, setShowLatent] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const openHole = (holeUuid: string) => {
    navigate({
      to: '/acquisitions/$acquisitionId/grids/$gridId/squares/$squareId/holes/$holeId',
      params: { acquisitionId, gridId, squareId, holeId: holeUuid },
    })
  }

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ flex: 1, overflow: 'hidden', minWidth: 0, position: 'relative' }}>
        <SquareMap
          foilholes={foilholes}
          squareLabel={squareLabel}
          imageUrl={imageUrl}
          imageLoading={imageLoading}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          predictionLayers={predictionLayers}
          predictionValues={predictionValues}
          suggestedHoleIds={suggestedHoleIds}
          onFoilholeClick={openHole}
          hoveredId={hoveredId}
          onHoveredIdChange={setHoveredId}
        />

        {/* Open latent space - floats over the map, top-right, only when there are coordinates to show. */}
        {!showLatent && latentItems.length > 0 && (
          <Tooltip title="Show latent space" placement="left">
            <IconButton
              onClick={() => setShowLatent(true)}
              size="small"
              sx={{
                position: 'absolute',
                right: 12,
                top: 12,
                zIndex: 5,
                backgroundColor: '#ffffff',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': { backgroundColor: gray[100] },
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                role="img"
                aria-label="Scatter plot"
              >
                <circle cx="4" cy="12" r="2" fill="#5878a3" />
                <circle cx="7" cy="5" r="2" fill="#e59344" />
                <circle cx="12" cy="9" r="2" fill="#6ba059" />
                <circle cx="10" cy="3" r="1.5" fill="#d1605e" />
                <circle cx="3" cy="7" r="1.5" fill="#a77c9f" />
              </svg>
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Latent-space pane: a foilhole scatter coloured by cluster, sharing the hovered foilhole with the
          map. Clicking a point opens that foilhole, matching a click on the map. */}
      {showLatent && (
        <Box
          sx={{
            flexShrink: 0,
            width: '50%',
            minWidth: 0,
            borderLeft: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <LatentSpacePanel
            items={latentItems}
            selectedId={hoveredId}
            onItemClick={openHole}
            onItemHover={setHoveredId}
            onClose={() => setShowLatent(false)}
          />
        </Box>
      )}
    </Box>
  )
}
