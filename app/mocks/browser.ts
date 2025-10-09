import { setupWorker } from 'msw/browser'
import * as mswHandlers from '../api/generated/default/default.msw'

// Get all the mock handlers from Orval by collecting all handler functions
const handlers = Object.values(mswHandlers)
  .filter((value) => typeof value === 'function')
  .filter((fn) => fn.name.includes('MockHandler'))
  .map((handlerFn) => (handlerFn as () => any)())

// Set up the service worker with all handlers
export const worker = setupWorker(...handlers)
