import { mswHandlers } from '@smartem/api'
import type { RequestHandler } from 'msw'
import { setupWorker } from 'msw/browser'

const generatedHandlers = Object.values(mswHandlers)
  .filter((value) => typeof value === 'function')
  .filter((fn) => fn.name.includes('MockHandler'))
  .map((handlerFn) => (handlerFn as () => RequestHandler)())

export const worker = setupWorker(...generatedHandlers)
