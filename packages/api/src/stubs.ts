// Stub implementations for API endpoints that don't exist yet
// These allow the UI to render with fallback behavior

import type { QualityPredictionModelResponse } from './generated/models'

const mockPredictionModels: QualityPredictionModelResponse[] = [
  {
    name: 'resnet-atlas',
    description: 'ResNet-based grid square quality prediction from atlas images',
  },
  {
    name: 'vit-gridsquare',
    description: 'Vision Transformer for high-mag grid square classification',
  },
  { name: 'efficientnet-ice', description: 'Ice thickness estimation using EfficientNet backbone' },
  { name: 'dae-atlas', description: 'Denoising autoencoder for latent space representation' },
]

export const useGetPredictionModelsPredictionModelsGet = (): {
  data: QualityPredictionModelResponse[] | undefined
  isLoading: false
  error: null
} => {
  return {
    data: mockPredictionModels,
    isLoading: false,
    error: null,
  }
}

export const getLatentRepPredictionModelPredictionModelNameGridGridUuidLatentRepresentationGet = (
  _modelName: string,
  _gridId: string
) => {
  return Promise.resolve([])
}

export const getPredictionForGridPredictionModelPredictionModelNameGridGridUuidPredictionGet = (
  _modelName: string,
  _gridId: string
) => {
  return Promise.resolve([])
}

export const getPredictionModelsPredictionModelsGet = (): Promise<
  QualityPredictionModelResponse[]
> => {
  return Promise.resolve(mockPredictionModels)
}
