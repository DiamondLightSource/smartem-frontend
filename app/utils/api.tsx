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
}

// Export types for convenience
export type AcquisitionResponse = components['schemas']['AcquisitionResponse']
export type GridResponse = components['schemas']['GridResponse']
