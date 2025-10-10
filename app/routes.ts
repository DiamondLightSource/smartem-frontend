import { type RouteConfig, route } from '@react-router/dev/routes'

export default [
  route('/', './routes/home.tsx'),
  route('/models', './routes/predictionModels.tsx'),
  route('/models/:modelName/grids/:gridId/weights', './routes/predictionModelWeights.tsx'),
  route('/acquisitions/:acqId', './routes/acquisition.tsx'),
  route('/acquisitions/:acqId/grids/:gridId/workspace', './routes/workspace.tsx'),
  route('/acquisitions/:acqId/grids/:gridId/atlas', './routes/atlas.tsx'),
  route('/acquisitions/:acqId/grids/:gridId/squares/:squareId', './routes/squareLR.tsx'),
  route('/acquisitions/:acqId/grids/:gridId/gridsquares', './routes/gridsquares.tsx'),
  route('/acquisitions/:acqId/grids/:gridId', './routes/grid.tsx'),
  route(
    '/acquisitions/:acqId/grids/:gridId/square/:squareId/predictions',
    './routes/qualityPredictions.tsx'
  ),
] satisfies RouteConfig
