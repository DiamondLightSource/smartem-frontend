// Compatibility hooks for endpoints not yet in the live API spec
// TODO: Remove this file once backend implements these endpoints and we regenerate from Orval

import { useQuery } from '@tanstack/react-query'
import { customInstance } from '../api/mutator'

// Temporary hooks for missing prediction/quality endpoints
export function useGetPredictionModels() {
  return useQuery({
    queryKey: ['/prediction_models'],
    queryFn: () => customInstance({ url: '/prediction_models', method: 'GET' }),
  })
}

export function useGetQualityMetrics() {
  return useQuery({
    queryKey: ['/quality_metrics'],
    queryFn: () => customInstance({ url: '/quality_metrics', method: 'GET' }),
  })
}

export function useGetGridSquareQualityPredictions(gridsquareId: string) {
  return useQuery({
    queryKey: ['/gridsquares', gridsquareId, 'quality_predictions'],
    queryFn: () =>
      customInstance({
        url: `/gridsquares/${gridsquareId}/quality_predictions`,
        method: 'GET',
      }),
    enabled: !!gridsquareId,
  })
}

export function useGetFoilHoleQualityPredictions(gridsquareId: string) {
  return useQuery({
    queryKey: ['/gridsquares', gridsquareId, 'foilhole_quality_predictions'],
    queryFn: () =>
      customInstance({
        url: `/gridsquares/${gridsquareId}/foilhole_quality_predictions`,
        method: 'GET',
      }),
    enabled: !!gridsquareId,
  })
}

export function useGetModelPredictionsForGrid(modelName: string, gridId: string) {
  return useQuery({
    queryKey: ['/prediction_model', modelName, 'grid', gridId, 'prediction'],
    queryFn: () =>
      customInstance({
        url: `/prediction_model/${modelName}/grid/${gridId}/prediction`,
        method: 'GET',
      }),
    enabled: !!modelName && !!gridId,
  })
}

export function useGetLatentRepresentationForGrid(
  modelName: string,
  gridId: string
) {
  return useQuery({
    queryKey: [
      '/prediction_model',
      modelName,
      'grid',
      gridId,
      'latent_representation',
    ],
    queryFn: () =>
      customInstance({
        url: `/prediction_model/${modelName}/grid/${gridId}/latent_representation`,
        method: 'GET',
      }),
    enabled: !!modelName && !!gridId,
  })
}
