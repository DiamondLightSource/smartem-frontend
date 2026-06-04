import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import {
  getGetPredictionForGridPredictionModelPredictionModelNameGridGridUuidPredictionGetQueryOptions as gridPredictionQueryOptions,
  getGetLatentRepPredictionModelPredictionModelNameGridGridUuidLatentRepresentationGetQueryOptions as latentRepQueryOptions,
  useGetGridGridsGridUuidGet,
  useGetGridGridsquaresGridsGridUuidGridsquaresGet,
  useGetPredictionModelsPredictionModelsGet,
} from '@smartem/api'
import { useQueries } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { AtlasMap } from '~/components/spatial/AtlasMap'
import { LatentSpacePanel } from '~/components/spatial/LatentSpacePanel'
import {
  gridResponseToMock,
  gridSquareResponseToMock,
  latentResponsesToCoordsByUuid,
  predictionModelResponseToMock,
  predictionResponsesToMockPredictions,
} from '~/data/api-adapters'
import type { MockLatentCoords } from '~/data/mock-session-detail'
import { gray } from '~/theme'

export const Route = createFileRoute('/acquisitions/$acquisitionId/grids/$gridId/atlas')({
  component: AtlasView,
})

function AtlasView() {
  const { acquisitionId, gridId } = Route.useParams()
  const navigate = useNavigate()
  const { data: gridResponse } = useGetGridGridsGridUuidGet(gridId)
  const { data: squareResponses } = useGetGridGridsquaresGridsGridUuidGridsquaresGet(gridId)
  const { data: modelResponses } = useGetPredictionModelsPredictionModelsGet()

  const grid = useMemo(
    () => (gridResponse ? gridResponseToMock(gridResponse) : null),
    [gridResponse]
  )

  const models = useMemo(
    () => (modelResponses ?? []).map(predictionModelResponseToMock),
    [modelResponses]
  )

  // Fan out one prediction + one latent query per model; both endpoints are scoped to
  // (model, grid). React Query dedupes and caches each, and disables until ids resolve.
  const predictionResults = useQueries({
    queries: models.map((m) => gridPredictionQueryOptions(m.id, gridId)),
  })
  const latentResults = useQueries({
    queries: models.map((m) => latentRepQueryOptions(m.id, gridId)),
  })

  const predictions = useMemo(
    () =>
      models.map((m, i) =>
        predictionResponsesToMockPredictions(m.id, gridId, predictionResults[i]?.data ?? [])
      ),
    [models, gridId, predictionResults]
  )

  // Latent representation comes from a specific latent-rep model; lacking a picker, use the
  // first model that returns coordinates and merge them onto the squares.
  const squares = useMemo(() => {
    const base = (squareResponses ?? []).map(gridSquareResponseToMock)
    let latentByUuid: Map<string, MockLatentCoords> | null = null
    for (const result of latentResults) {
      if (result?.data && result.data.length > 0) {
        const map = latentResponsesToCoordsByUuid(result.data)
        if (map.size > 0) {
          latentByUuid = map
          break
        }
      }
    }
    if (!latentByUuid) return base
    const lookup = latentByUuid
    return base.map((sq) => {
      const latent = lookup.get(sq.uuid)
      return latent ? { ...sq, latent } : sq
    })
  }, [squareResponses, latentResults])

  const [showLatent, setShowLatent] = useState(false)
  const [selectedSquareId, setSelectedSquareId] = useState<string | null>(null)
  const [frozen, setFrozen] = useState(false)

  const latentItems = useMemo(
    () =>
      squares.flatMap((sq) => {
        if (sq.latent === null) return []
        return [
          {
            id: sq.uuid,
            label: sq.gridsquareId,
            latent: sq.latent,
            predictionValue: sq.quality,
          },
        ]
      }),
    [squares]
  )

  const handleSquareClick = (uuid: string) => {
    if (frozen && uuid === selectedSquareId) {
      setFrozen(false)
      setSelectedSquareId(null)
    } else {
      setFrozen(true)
      setSelectedSquareId(uuid)
    }
  }

  const handleSquareNavigate = (uuid: string) => {
    navigate({
      to: '/acquisitions/$acquisitionId/grids/$gridId/squares/$squareId',
      params: { acquisitionId, gridId, squareId: uuid },
    })
  }

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <AtlasMap
          squares={squares}
          gridName={grid?.name ?? gridId}
          onSquareClick={handleSquareNavigate}
          predictions={predictions}
          models={models}
          selectedSquareId={selectedSquareId}
          onSquareHover={(id) => {
            if (!frozen) setSelectedSquareId(id)
          }}
          frozenSelection={frozen}
          onFreezeToggle={() => {
            setFrozen((f) => !f)
            if (frozen) setSelectedSquareId(null)
          }}
        />
      </Box>

      {/* Latent space side panel */}
      {showLatent && (
        <Box
          sx={{
            width: 360,
            flexShrink: 0,
            borderLeft: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 1.5,
              height: 28,
              backgroundColor: gray[100],
              borderBottom: '1px solid',
              borderColor: 'divider',
              flexShrink: 0,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.6875rem' }}>
              Latent Space
            </Typography>
            <Box sx={{ flex: 1 }} />
            <CloseButton onClick={() => setShowLatent(false)} />
          </Box>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <LatentSpacePanel
              items={latentItems}
              selectedId={selectedSquareId}
              onItemClick={handleSquareClick}
              onItemHover={(id) => {
                if (!frozen) setSelectedSquareId(id)
              }}
            />
          </Box>
        </Box>
      )}

      {/* Floating action button to open latent panel */}
      {!showLatent && (
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
  )
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <IconButton onClick={onClick} size="small" sx={{ p: 0.25 }}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" role="img" aria-label="Close">
        <path d="M3 3l6 6M9 3l-6 6" stroke={gray[600]} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </IconButton>
  )
}
