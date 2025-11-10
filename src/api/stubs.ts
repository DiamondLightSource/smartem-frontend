// Stub implementations for API endpoints that don't exist yet
// These allow the UI to render with fallback behavior

export const useGetPredictionModelsPredictionModelsGet = (): {
  data: undefined
  isLoading: false
  error: Error
} => {
  return {
    data: undefined,
    isLoading: false,
    error: new Error('Prediction models endpoint not yet implemented in backend'),
  }
}

export const useGetActiveConnectionsDebugAgentConnectionsGet = () => {
  return {
    data: undefined,
    isLoading: false,
    error: new Error('Debug connections endpoint not yet implemented in backend'),
  }
}

export const useGetActiveSessionsDebugSessionsGet = () => {
  return {
    data: undefined,
    isLoading: false,
    error: new Error('Debug sessions endpoint not yet implemented in backend'),
  }
}

export const useGetConnectionStatsDebugConnectionStatsGet = () => {
  return {
    data: undefined,
    isLoading: false,
    error: new Error('Debug connection stats endpoint not yet implemented in backend'),
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

export const getPredictionModelsPredictionModelsGet = (): Promise<never[]> => {
  return Promise.resolve([])
}
