import type { components, paths } from '../schema'

export const apiUrl = () => {
  return import.meta.env.VITE_API_ENDPOINT
    ? import.meta.env.VITE_API_ENDPOINT
    : 'http://localhost:8000'
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${apiUrl()}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(
      `API Error: ${response.statusText}`,
      response.status,
      errorData
    )
  }

  return response.json()
}

// Type-safe API client functions
export const api = {
  // Acquisitions
  getAcquisitions: () =>
    apiFetch<
      paths['/acquisitions']['get']['responses'][200]['content']['application/json']
    >('/acquisitions'),

  getAcquisition: (acquisitionId: string) =>
    apiFetch<
      paths['/acquisitions/{acquisition_uuid}']['get']['responses'][200]['content']['application/json']
    >(`/acquisitions/${acquisitionId}`),

  createAcquisition: (
    data: paths['/acquisitions']['post']['requestBody']['content']['application/json']
  ) =>
    apiFetch<
      paths['/acquisitions']['post']['responses'][200]['content']['application/json']
    >('/acquisitions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAcquisition: (
    acquisitionId: string,
    data: paths['/acquisitions/{acquisition_uuid}']['put']['requestBody']['content']['application/json']
  ) =>
    apiFetch<
      paths['/acquisitions/{acquisition_uuid}']['put']['responses'][200]['content']['application/json']
    >(`/acquisitions/${acquisitionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteAcquisition: (acquisitionId: string) =>
    apiFetch<
      paths['/acquisitions/{acquisition_uuid}']['delete']['responses'][200]['content']['application/json']
    >(`/acquisitions/${acquisitionId}`, {
      method: 'DELETE',
    }),

  // Grids
  getGrids: () =>
    apiFetch<
      paths['/grids']['get']['responses'][200]['content']['application/json']
    >('/grids'),

  getGrid: (gridId: string) =>
    apiFetch<
      paths['/grids/{grid_uuid}']['get']['responses'][200]['content']['application/json']
    >(`/grids/${gridId}`),

  getAcquisitionGrids: (acquisitionId: string) =>
    apiFetch<
      paths['/acquisitions/{acquisition_uuid}/grids']['get']['responses'][200]['content']['application/json']
    >(`/acquisitions/${acquisitionId}/grids`),

  updateGrid: (
    gridId: string,
    data: paths['/grids/{grid_uuid}']['put']['requestBody']['content']['application/json']
  ) =>
    apiFetch<
      paths['/grids/{grid_uuid}']['put']['responses'][200]['content']['application/json']
    >(`/grids/${gridId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteGrid: (gridId: string) =>
    apiFetch<
      paths['/grids/{grid_uuid}']['delete']['responses'][200]['content']['application/json']
    >(`/grids/${gridId}`, {
      method: 'DELETE',
    }),

  // Grid Squares
  getGridSquares: (gridId: string) =>
    apiFetch<
      paths['/grids/{grid_uuid}/gridsquares']['get']['responses'][200]['content']['application/json']
    >(`/grids/${gridId}/gridsquares`),

  getGridSquare: (gridsquareId: string) =>
    apiFetch<
      paths['/gridsquares/{gridsquare_uuid}']['get']['responses'][200]['content']['application/json']
    >(`/gridsquares/${gridsquareId}`),

  updateGridSquare: (
    gridsquareId: string,
    data: paths['/gridsquares/{gridsquare_uuid}']['put']['requestBody']['content']['application/json']
  ) =>
    apiFetch<
      paths['/gridsquares/{gridsquare_uuid}']['put']['responses'][200]['content']['application/json']
    >(`/gridsquares/${gridsquareId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Foil Holes
  getFoilHoles: (gridsquareId: string) =>
    apiFetch<
      paths['/gridsquares/{gridsquare_uuid}/foilholes']['get']['responses'][200]['content']['application/json']
    >(`/gridsquares/${gridsquareId}/foilholes`),

  getFoilHole: (foilholeId: string) =>
    apiFetch<
      paths['/foilholes/{foilhole_uuid}']['get']['responses'][200]['content']['application/json']
    >(`/foilholes/${foilholeId}`),

  // Prediction Models
  getPredictionModels: () =>
    apiFetch<
      paths['/prediction_models']['get']['responses'][200]['content']['application/json']
    >('/prediction_models'),

  // Quality Predictions
  getGridSquareQualityPredictions: (gridsquareId: string) =>
    apiFetch<
      paths['/gridsquares/{gridsquare_uuid}/quality_predictions']['get']['responses'][200]['content']['application/json']
    >(`/gridsquares/${gridsquareId}/quality_predictions`),

  getFoilHoleQualityPredictions: (gridsquareId: string) =>
    apiFetch<
      paths['/gridsquares/{gridsquare_uuid}/foilhole_quality_predictions']['get']['responses'][200]['content']['application/json']
    >(`/gridsquares/${gridsquareId}/foilhole_quality_predictions`),

  getQualityMetrics: () =>
    apiFetch<
      paths['/quality_metrics']['get']['responses'][200]['content']['application/json']
    >('/quality_metrics'),

  // Model Predictions
  getModelPredictionsForGrid: (modelName: string, gridId: string) =>
    apiFetch<
      paths['/prediction_model/{prediction_model_name}/grid/{grid_uuid}/prediction']['get']['responses'][200]['content']['application/json']
    >(`/prediction_model/${modelName}/grid/${gridId}/prediction`),

  getModelPredictionsForGridSquare: (modelName: string, gridsquareId: string) =>
    apiFetch<
      paths['/prediction_model/{prediction_model_name}/gridsquare/{gridsquare_uuid}/prediction']['get']['responses'][200]['content']['application/json']
    >(`/prediction_model/${modelName}/gridsquare/${gridsquareId}/prediction`),

  // Latent Representations
  getLatentRepresentationForGrid: (modelName: string, gridId: string) =>
    apiFetch<
      paths['/prediction_model/{prediction_model_name}/grid/{grid_uuid}/latent_representation']['get']['responses'][200]['content']['application/json']
    >(`/prediction_model/${modelName}/grid/${gridId}/latent_representation`),

  getLatentRepresentationForGridSquare: (
    modelName: string,
    gridsquareId: string
  ) =>
    apiFetch<
      paths['/prediction_model/{prediction_model_name}/gridsquare/{gridsquare_uuid}/latent_representation']['get']['responses'][200]['content']['application/json']
    >(`/prediction_model/${modelName}/gridsquare/${gridsquareId}/latent_representation`),

  // Atlas
  getGridAtlas: (gridId: string) =>
    apiFetch<
      paths['/grids/{grid_uuid}/atlas']['get']['responses'][200]['content']['application/json']
    >(`/grids/${gridId}/atlas`),

  // Images
  getAtlasImage: (gridId: string) =>
    apiFetch<
      paths['/grids/{grid_uuid}/atlas_image']['get']['responses'][200]['content']['application/json']
    >(`/grids/${gridId}/atlas_image`),

  getGridSquareImage: (gridsquareId: string) =>
    apiFetch<
      paths['/gridsquares/{gridsquare_uuid}/gridsquare_image']['get']['responses'][200]['content']['application/json']
    >(`/gridsquares/${gridsquareId}/gridsquare_image`),
}

// Export types for convenience
export type AcquisitionResponse = components['schemas']['AcquisitionResponse']
export type GridResponse = components['schemas']['GridResponse']
export type GridSquareResponse = components['schemas']['GridSquareResponse']
export type FoilHoleResponse = components['schemas']['FoilHoleResponse']
export type QualityPredictionModelResponse =
  components['schemas']['QualityPredictionModelResponse']
export type QualityPredictionResponse =
  components['schemas']['QualityPredictionResponse']
export type LatentRepresentationResponse =
  components['schemas']['LatentRepresentationResponse']
