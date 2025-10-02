import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/api'

// Query keys factory
export const queryKeys = {
  acquisitions: {
    all: ['acquisitions'] as const,
    list: () => [...queryKeys.acquisitions.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.acquisitions.all, id] as const,
  },
  grids: {
    all: ['grids'] as const,
    list: () => [...queryKeys.grids.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.grids.all, id] as const,
    byAcquisition: (acquisitionId: string) =>
      [...queryKeys.grids.all, 'acquisition', acquisitionId] as const,
    atlas: (gridId: string) => [...queryKeys.grids.all, gridId, 'atlas'] as const,
    atlasImage: (gridId: string) =>
      [...queryKeys.grids.all, gridId, 'atlas-image'] as const,
  },
  gridSquares: {
    all: ['gridSquares'] as const,
    list: () => [...queryKeys.gridSquares.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.gridSquares.all, id] as const,
    byGrid: (gridId: string) =>
      [...queryKeys.gridSquares.all, 'grid', gridId] as const,
    image: (gridsquareId: string) =>
      [...queryKeys.gridSquares.all, gridsquareId, 'image'] as const,
  },
  foilHoles: {
    all: ['foilHoles'] as const,
    list: () => [...queryKeys.foilHoles.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.foilHoles.all, id] as const,
    byGridSquare: (gridsquareId: string) =>
      [...queryKeys.foilHoles.all, 'gridsquare', gridsquareId] as const,
  },
  predictionModels: {
    all: ['predictionModels'] as const,
    list: () => [...queryKeys.predictionModels.all, 'list'] as const,
  },
  predictions: {
    all: ['predictions'] as const,
    byGridSquare: (gridsquareId: string) =>
      [...queryKeys.predictions.all, 'gridsquare', gridsquareId] as const,
    byGrid: (modelName: string, gridId: string) =>
      [...queryKeys.predictions.all, 'model', modelName, 'grid', gridId] as const,
    byGridSquareModel: (modelName: string, gridsquareId: string) =>
      [
        ...queryKeys.predictions.all,
        'model',
        modelName,
        'gridsquare',
        gridsquareId,
      ] as const,
  },
  foilHolePredictions: {
    all: ['foilHolePredictions'] as const,
    byGridSquare: (gridsquareId: string) =>
      [...queryKeys.foilHolePredictions.all, 'gridsquare', gridsquareId] as const,
  },
  qualityMetrics: {
    all: ['qualityMetrics'] as const,
    list: () => [...queryKeys.qualityMetrics.all, 'list'] as const,
  },
  latentRepresentations: {
    all: ['latentRepresentations'] as const,
    byGrid: (modelName: string, gridId: string) =>
      [
        ...queryKeys.latentRepresentations.all,
        'model',
        modelName,
        'grid',
        gridId,
      ] as const,
    byGridSquare: (modelName: string, gridsquareId: string) =>
      [
        ...queryKeys.latentRepresentations.all,
        'model',
        modelName,
        'gridsquare',
        gridsquareId,
      ] as const,
  },
}

// Acquisitions hooks
export function useGetAcquisitions() {
  return useQuery({
    queryKey: queryKeys.acquisitions.list(),
    queryFn: api.getAcquisitions,
  })
}

export function useGetAcquisition(acquisitionId: string) {
  return useQuery({
    queryKey: queryKeys.acquisitions.detail(acquisitionId),
    queryFn: () => api.getAcquisition(acquisitionId),
    enabled: !!acquisitionId,
  })
}

export function useCreateAcquisition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.createAcquisition,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.acquisitions.list(),
      })
    },
  })
}

export function useUpdateAcquisition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      acquisitionId,
      data,
    }: {
      acquisitionId: string
      data: Parameters<typeof api.updateAcquisition>[1]
    }) => api.updateAcquisition(acquisitionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.acquisitions.detail(variables.acquisitionId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.acquisitions.list(),
      })
    },
  })
}

export function useDeleteAcquisition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.deleteAcquisition,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.acquisitions.list(),
      })
    },
  })
}

// Grids hooks
export function useGetGrids() {
  return useQuery({
    queryKey: queryKeys.grids.list(),
    queryFn: api.getGrids,
  })
}

export function useGetGrid(gridId: string) {
  return useQuery({
    queryKey: queryKeys.grids.detail(gridId),
    queryFn: () => api.getGrid(gridId),
    enabled: !!gridId,
  })
}

export function useGetAcquisitionGrids(acquisitionId: string) {
  return useQuery({
    queryKey: queryKeys.grids.byAcquisition(acquisitionId),
    queryFn: () => api.getAcquisitionGrids(acquisitionId),
    enabled: !!acquisitionId,
  })
}

export function useUpdateGrid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      gridId,
      data,
    }: {
      gridId: string
      data: Parameters<typeof api.updateGrid>[1]
    }) => api.updateGrid(gridId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.grids.detail(variables.gridId),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.grids.list() })
    },
  })
}

export function useDeleteGrid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.deleteGrid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.grids.list() })
    },
  })
}

// Grid Squares hooks
export function useGetGridSquares(gridId: string) {
  return useQuery({
    queryKey: queryKeys.gridSquares.byGrid(gridId),
    queryFn: () => api.getGridSquares(gridId),
    enabled: !!gridId,
  })
}

export function useGetGridSquare(gridsquareId: string) {
  return useQuery({
    queryKey: queryKeys.gridSquares.detail(gridsquareId),
    queryFn: () => api.getGridSquare(gridsquareId),
    enabled: !!gridsquareId,
  })
}

export function useUpdateGridSquare() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      gridsquareId,
      data,
    }: {
      gridsquareId: string
      data: Parameters<typeof api.updateGridSquare>[1]
    }) => api.updateGridSquare(gridsquareId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.gridSquares.detail(variables.gridsquareId),
      })
    },
  })
}

export function useGetGridSquareImage(gridsquareId: string) {
  return useQuery({
    queryKey: queryKeys.gridSquares.image(gridsquareId),
    queryFn: () => api.getGridSquareImage(gridsquareId),
    enabled: !!gridsquareId,
  })
}

// Foil Holes hooks
export function useGetFoilHoles(gridsquareId: string) {
  return useQuery({
    queryKey: queryKeys.foilHoles.byGridSquare(gridsquareId),
    queryFn: () => api.getFoilHoles(gridsquareId),
    enabled: !!gridsquareId,
  })
}

export function useGetFoilHole(foilholeId: string) {
  return useQuery({
    queryKey: queryKeys.foilHoles.detail(foilholeId),
    queryFn: () => api.getFoilHole(foilholeId),
    enabled: !!foilholeId,
  })
}

// Prediction Models hooks
export function useGetPredictionModels() {
  return useQuery({
    queryKey: queryKeys.predictionModels.list(),
    queryFn: api.getPredictionModels,
  })
}

// Quality Predictions hooks
export function useGetGridSquareQualityPredictions(gridsquareId: string) {
  return useQuery({
    queryKey: queryKeys.predictions.byGridSquare(gridsquareId),
    queryFn: () => api.getGridSquareQualityPredictions(gridsquareId),
    enabled: !!gridsquareId,
  })
}

export function useGetFoilHoleQualityPredictions(gridsquareId: string) {
  return useQuery({
    queryKey: queryKeys.foilHolePredictions.byGridSquare(gridsquareId),
    queryFn: () => api.getFoilHoleQualityPredictions(gridsquareId),
    enabled: !!gridsquareId,
  })
}

export function useGetQualityMetrics() {
  return useQuery({
    queryKey: queryKeys.qualityMetrics.list(),
    queryFn: api.getQualityMetrics,
  })
}

// Model Predictions hooks
export function useGetModelPredictionsForGrid(modelName: string, gridId: string) {
  return useQuery({
    queryKey: queryKeys.predictions.byGrid(modelName, gridId),
    queryFn: () => api.getModelPredictionsForGrid(modelName, gridId),
    enabled: !!modelName && !!gridId,
  })
}

export function useGetModelPredictionsForGridSquare(
  modelName: string,
  gridsquareId: string
) {
  return useQuery({
    queryKey: queryKeys.predictions.byGridSquareModel(modelName, gridsquareId),
    queryFn: () => api.getModelPredictionsForGridSquare(modelName, gridsquareId),
    enabled: !!modelName && !!gridsquareId,
  })
}

// Latent Representations hooks
export function useGetLatentRepresentationForGrid(
  modelName: string,
  gridId: string
) {
  return useQuery({
    queryKey: queryKeys.latentRepresentations.byGrid(modelName, gridId),
    queryFn: () => api.getLatentRepresentationForGrid(modelName, gridId),
    enabled: !!modelName && !!gridId,
  })
}

export function useGetLatentRepresentationForGridSquare(
  modelName: string,
  gridsquareId: string
) {
  return useQuery({
    queryKey: queryKeys.latentRepresentations.byGridSquare(
      modelName,
      gridsquareId
    ),
    queryFn: () =>
      api.getLatentRepresentationForGridSquare(modelName, gridsquareId),
    enabled: !!modelName && !!gridsquareId,
  })
}

// Atlas hooks
export function useGetGridAtlas(gridId: string) {
  return useQuery({
    queryKey: queryKeys.grids.atlas(gridId),
    queryFn: () => api.getGridAtlas(gridId),
    enabled: !!gridId,
  })
}

export function useGetAtlasImage(gridId: string) {
  return useQuery({
    queryKey: queryKeys.grids.atlasImage(gridId),
    queryFn: () => api.getAtlasImage(gridId),
    enabled: !!gridId,
  })
}
