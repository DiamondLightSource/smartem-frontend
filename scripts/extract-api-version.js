#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const openApiPath = join(__dirname, '../app/api/openapi.json')
const versionPath = join(__dirname, '../app/api/generated/api-version.ts')

try {
  const openApiSpec = JSON.parse(readFileSync(openApiPath, 'utf-8'))
  const version = openApiSpec.info?.version || 'unknown'
  const generatedAt = new Date().toISOString()

  const content = `// Auto-generated file - do not edit manually
// Generated from OpenAPI specification

export const API_VERSION = '${version}' as const
export const GENERATED_AT = '${generatedAt}' as const
`

  writeFileSync(versionPath, content)
  console.log(`✓ Extracted API version: ${version}`)
  console.log(`✓ Generated at: ${generatedAt}`)
  console.log(`✓ Saved to: ${versionPath}`)
} catch (error) {
  console.error('Failed to extract API version:', error.message)
  process.exit(1)
}
