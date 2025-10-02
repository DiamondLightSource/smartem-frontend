import { setupWorker } from 'msw/browser'
import { getDefaultMSWHandlers } from '../api/generated/default/default.msw'

// Get all the mock handlers from Orval
const handlers = getDefaultMSWHandlers()

// Set up the service worker with all handlers
export const worker = setupWorker(...handlers)
