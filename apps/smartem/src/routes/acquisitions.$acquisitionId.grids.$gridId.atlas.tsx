import { Box, IconButton, Tooltip } from '@mui/material'
import {
  getGetPredictionForGridPredictionModelPredictionModelNameGridGridUuidPredictionGetQueryOptions as gridPredictionQueryOptions,
  getGetLatentRepPredictionModelPredictionModelNameGridGridUuidLatentRepresentationGetQueryOptions as latentRepQueryOptions,
  useGetGridGridsGridUuidGet,
  useGetGridGridsquaresGridsGridUuidGridsquaresGet,
  useGetPredictionModelsPredictionModelsGet,
  useGetGridAtlasImageGridsGridUuidAtlasImageGet as useGridAtlasImage,
  useGetSuggestedSquareCollectionsGridGridUuidPredictionModelPredictionModelNameLatentRepLatentRepModelNameSuggestedSquaresGet as useSuggestedSquares,
} from '@smartem/api'
import { useQueries } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { AtlasMap } from '~/components/spatial/AtlasMap'
import { EmptySquarePanel } from '~/components/spatial/EmptySquarePanel'
import { LatentSpacePanel } from '~/components/spatial/LatentSpacePanel'
import { SquarePreviewPanel } from '~/components/spatial/SquarePreviewPanel'
import {
  gridResponseToMock,
  gridSquareResponseToMock,
  latentResponsesToCoordsByUuid,
  predictionModelResponseToMock,
  predictionResponsesToMockPredictions,
} from '~/data/api-adapters'
import type { MockLatentCoords } from '~/data/mock-session-detail'
import { useBlobObjectUrl } from '~/hooks/useBlobObjectUrl'
import { useImageNaturalSize } from '~/hooks/useImageNaturalSize'
import { gray } from '~/theme'

export const Route = createFileRoute('/acquisitions/$acquisitionId/grids/$gridId/atlas')({
  component: AtlasView,
})

function AtlasView() {
  const { acquisitionId, gridId } = Route.useParams()
  const { data: gridResponse } = useGetGridGridsGridUuidGet(gridId)
  const { data: squareResponses } = useGetGridGridsquaresGridsGridUuidGridsquaresGet(gridId)
  const { data: modelResponses } = useGetPredictionModelsPredictionModelsGet()
  // Image route is auth-protected; fetch as an authenticated blob and hand the
  // <image> element an object URL rather than a token-less direct URL.
  const { data: atlasImageBlob, isLoading: atlasImageLoading } = useGridAtlasImage(
    gridId,
    undefined
  )
  const atlasImageUrl = useBlobObjectUrl(atlasImageBlob as Blob | undefined)
  const atlasSize = useImageNaturalSize(atlasImageUrl)
  // "Pending" spans the whole wait: the blob fetch plus the extra tick useBlobObjectUrl needs
  // to mint the object URL. Without the second term the overlay would briefly flash in between
  // the fetch resolving and the URL existing.
  const atlasImagePending = atlasImageLoading || (!!atlasImageBlob && !atlasImageUrl)

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

  // Squares the system suggests collecting next. The endpoint needs a prediction model and a
  // separate latent-rep model; the API doesn't expose model types, so we default to the first
  // model for prediction and the second (if any) for the latent representation. A proper
  // model-type distinction is tracked in #111.
  const predictionModelName = models[0]?.id ?? ''
  const latentModelName = models[1]?.id ?? models[0]?.id ?? ''
  const { data: suggestedSquares } = useSuggestedSquares(
    gridId,
    predictionModelName,
    latentModelName,
    { query: { enabled: !!predictionModelName } }
  )
  const suggestedSquareIds = useMemo(
    () => new Set((suggestedSquares ?? []).map((s) => s.uuid)),
    [suggestedSquares]
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

  // Clicking a square commits it (issue #68): hover only highlights, the heavy micrograph loads on the
  // explicit commit. The right-hand panel is always present (committed square / latent space / empty
  // placeholder), so the atlas never reflows when a square is picked.
  const committedSquareId = frozen ? selectedSquareId : null

  const lockSquare = (uuid: string) => {
    setSelectedSquareId(uuid)
    setFrozen(true)
    setShowLatent(false)
  }

  const closePreview = () => {
    setFrozen(false)
    setSelectedSquareId(null)
  }

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Atlas pane - always the complementary width of the persistent panel, so it never reflows. */}
      <Box sx={{ flex: 1, overflow: 'hidden', minWidth: 0, position: 'relative' }}>
        <AtlasMap
          squares={squares}
          gridName={grid?.name ?? gridId}
          imageUrl={atlasImageUrl}
          imageLoading={atlasImagePending}
          imageWidth={atlasSize?.width}
          imageHeight={atlasSize?.height}
          onSquareClick={lockSquare}
          predictions={predictions}
          models={models}
          suggestedSquareIds={suggestedSquareIds}
          selectedSquareId={selectedSquareId}
          onSquareHover={(id) => {
            if (!frozen) setSelectedSquareId(id)
          }}
          frozenSelection={frozen}
          onFreezeToggle={() => {
            if (frozen) closePreview()
            else {
              setFrozen(true)
              setShowLatent(false)
            }
          }}
        />

        {/* Open latent space - floats over the atlas, top-right, while the latent panel is closed. */}
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

      {/* Persistent right-hand panel (issue #68): latent space, the committed grid square, or an empty
          placeholder. Fixed share of the row so the atlas keeps its position when a square is clicked. */}
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
        {showLatent ? (
          <LatentSpacePanel
            items={latentItems}
            selectedId={selectedSquareId}
            onItemClick={lockSquare}
            onItemHover={(id) => {
              if (!frozen) setSelectedSquareId(id)
            }}
            onClose={() => setShowLatent(false)}
          />
        ) : committedSquareId ? (
          <SquarePreviewPanel
            acquisitionId={acquisitionId}
            gridId={gridId}
            squareId={committedSquareId}
            onClose={closePreview}
          />
        ) : (
          <EmptySquarePanel />
        )}
      </Box>
    </Box>
  )
}
