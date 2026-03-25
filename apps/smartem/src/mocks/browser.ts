import { mswHandlers } from '@smartem/api'
import { setupWorker } from 'msw/browser'

export const worker = setupWorker(...mswHandlers.getDefaultMock())
