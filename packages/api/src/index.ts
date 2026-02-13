// @smartem/api — barrel export

// API version constants
export { API_VERSION, GENERATED_AT } from './generated/api-version'
// Generated React Query hooks (default tag)
export * from './generated/default/default'
// Generated MSW handlers (namespaced to avoid collisions)
export * as mswHandlers from './generated/default/default.msw'
// Generated TypeScript models/types
export * from './generated/models'
// Axios mutator and helpers
export { ApiError, AXIOS_INSTANCE, apiUrl, customInstance } from './mutator'
// Stub implementations for not-yet-implemented endpoints
export {
  getLatentRepPredictionModelPredictionModelNameGridGridUuidLatentRepresentationGet,
  getPredictionForGridPredictionModelPredictionModelNameGridGridUuidPredictionGet,
  getPredictionModelsPredictionModelsGet,
  useGetPredictionModelsPredictionModelsGet,
} from './stubs'
// API version checking
export {
  checkApiVersion,
  getClientVersion,
  logApiVersion,
  type VersionInfo,
} from './version-check'
