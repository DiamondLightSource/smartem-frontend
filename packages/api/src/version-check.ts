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
 * Reduce a setuptools_scm version to the portion that matters for compatibility:
 * the release (and pre-release) segment, with the volatile PEP 440 local segment
 * (`+gsha…`) and the `.devN` suffix stripped. The backend version changes on every
 * commit, so comparing full strings is meaningless; comparing release portions is
 * the semantic signal. Example: `0.1.1rc48.dev3+gcd5206327` -> `0.1.1rc48`.
 */
function releasePortion(version: string): string {
  return version.split('+')[0].replace(/\.dev\d+$/, '')
}

/**
 * Fetches the live backend API version from the `/version` endpoint (ADR 0020).
 */
async function fetchServerVersion(): Promise<string | null> {
  try {
    const response = await fetch(`${apiUrl()}/version`)
    if (!response.ok) {
      return null
    }
    const body = (await response.json()) as { version?: string }
    return body.version ?? null
  } catch (error) {
    console.warn('Failed to fetch server API version:', error)
    return null
  }
}

/**
 * Compares the backend API version the client was generated against (`API_VERSION`)
 * with the live backend version, semantically. This is an OBSERVATION, never an
 * enforced gate (ADR 0020): rolling deploys where the two momentarily differ must
 * not break the app.
 */
export async function checkApiVersion(): Promise<VersionInfo> {
  const serverVersion = await fetchServerVersion()

  const compatible = serverVersion
    ? releasePortion(serverVersion) === releasePortion(API_VERSION)
    : true

  let message = ''
  if (!serverVersion) {
    message = 'Unable to determine server API version'
  } else if (compatible) {
    message = 'Client and server API versions are compatible'
  } else {
    message = `API version drift: client built against ${API_VERSION}, server reports ${serverVersion}`
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
 * Logs API version information to the console. Observe-only.
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
      '⚠️  API version drift detected (advisory). Run `npm run api:update` to rebuild the client against the current backend.'
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
