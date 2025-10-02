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
