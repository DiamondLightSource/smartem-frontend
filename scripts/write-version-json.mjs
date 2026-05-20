#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

const openapi = JSON.parse(readFileSync(resolve(root, 'packages/api/src/openapi.json'), 'utf8'))
const appPkg = JSON.parse(readFileSync(resolve(root, 'apps/smartem/package.json'), 'utf8'))

const info = {
  frontend: process.env.FRONTEND_VERSION ?? appPkg.version,
  backendApi: openapi.info?.version ?? 'unknown',
  gitSha: process.env.GIT_SHA ?? 'unknown',
  buildTime: process.env.BUILD_TIME ?? new Date().toISOString(),
}

const target = resolve(root, 'apps/smartem/public/version.json')
writeFileSync(target, `${JSON.stringify(info, null, 2)}\n`)
console.log(`Wrote ${target}`)
console.log(info)
