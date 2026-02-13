import { API_VERSION, GENERATED_AT } from './generated/api-version'
import { apiUrl } from './mutator'

export interface VersionInfo {
  clientVersion: string
  serverVersion: string | null
  compatible: boolean
  message: string
  generatedAt: string
}

/**
 * Fetches the server's API version from the /status endpoint
 */
async function fetchServerVersion(): Promise<string | null> {
  try {
    const response = await fetch(`${apiUrl()}/openapi.json`)
    if (!response.ok) {
      return null
    }
    const spec = await response.json()
    return spec.info?.version || null
  } catch (error) {
    console.warn('Failed to fetch server API version:', error)
    return null
  }
}

/**
 * Checks if the client API version matches the server API version
 * Returns version information and compatibility status
 */
export async function checkApiVersion(): Promise<VersionInfo> {
  const serverVersion = await fetchServerVersion()

  const compatible = serverVersion ? serverVersion === API_VERSION : true

  let message = ''
  if (!serverVersion) {
    message = 'Unable to determine server API version'
  } else if (compatible) {
    message = 'Client and server API versions match'
  } else {
    message = `API version mismatch: client expects ${API_VERSION} but server is ${serverVersion}`
  }

  return {
    clientVersion: API_VERSION,
    serverVersion,
    compatible,
    message,
    generatedAt: GENERATED_AT,
  }
}

/**
 * Logs API version information to console
 */
export async function logApiVersion(): Promise<void> {
  const versionInfo = await checkApiVersion()

  console.group('API Version Information')
  console.log('Client Version:', versionInfo.clientVersion)
  console.log('Server Version:', versionInfo.serverVersion || 'unknown')
  console.log('Generated At:', new Date(versionInfo.generatedAt).toLocaleString())
  console.log('Compatible:', versionInfo.compatible ? '✓' : '✗')
  console.log('Status:', versionInfo.message)
  console.groupEnd()

  if (!versionInfo.compatible) {
    console.warn(
      '⚠️  API version mismatch detected. Consider regenerating the client with `npm run api:update`'
    )
  }
}

/**
 * Gets the client API version without making network requests
 */
export function getClientVersion(): { version: string; generatedAt: string } {
  return {
    version: API_VERSION,
    generatedAt: GENERATED_AT,
  }
}
