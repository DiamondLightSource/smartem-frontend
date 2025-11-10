import { setupWorker } from 'msw/browser'
import * as mswHandlers from '../api/generated/default/default.msw'
import { customHandlers } from './customHandlers'

// Get all the mock handlers from Orval by collecting all handler functions
const generatedHandlers = Object.values(mswHandlers)
  .filter((value) => typeof value === 'function')
  .filter((fn) => fn.name.includes('MockHandler'))
  .map((handlerFn) => (handlerFn as () => any)())

// Set up the service worker with custom handlers first (they take precedence), then generated handlers
export const worker = setupWorker(...customHandlers, ...generatedHandlers)
