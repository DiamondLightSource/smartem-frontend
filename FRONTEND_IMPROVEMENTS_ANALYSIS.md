# SmartEM Frontend - Comprehensive Improvement Analysis

**Analysis Date:** 2025-10-07
**Framework:** React 19 + React Router 7 + TypeScript
**Current State:** Production-ready application with modern tooling

---

## Executive Summary

The SmartEM frontend is a well-architected React application using modern technologies including React 19, React Router 7, TanStack Query, and Material-UI. The codebase demonstrates good practices in several areas, particularly in API client generation and type safety. However, there are significant opportunities for improvement in code organization, component architecture, testing, and developer tooling.

**Overall Assessment:** 7/10 - Solid foundation with room for modernization and refinement.

---

## 1. Project Structure and Organization

### Current State

```
app/
├── api/
│   ├── generated/       # Auto-generated (300+ files)
│   ├── mutator.ts
│   ├── version-check.ts
│   └── openapi.json
├── components/          # 6 components, mixed purposes
├── hooks/              # Empty directory
├── mocks/              # MSW setup (2 files)
├── routes/             # 10 route components (94-432 lines each)
├── utils/              # Empty directory
├── routes.ts
├── root.tsx
└── entry.client.tsx
```

### Issues Identified

1. **Flat component structure** - All components in single directory without categorization
2. **Large route components** - Some routes have 400+ lines (atlas.tsx: 432 lines, squareLR.tsx: 396 lines)
3. **Empty directories** - `hooks/` and `utils/` directories exist but are empty
4. **Mixed responsibilities** - Components contain business logic, API calls, and presentation
5. **No feature-based organization** - Everything organized by technical type rather than domain

### Recommended Improvements

#### 1.1 Adopt Feature-Based Structure

**Effort:** Medium | **Priority:** High | **Impact:** High

Reorganize code by domain features:

```
app/
├── features/
│   ├── acquisitions/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── routes/
│   │   └── types.ts
│   ├── atlas/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── routes/
│   ├── grids/
│   └── predictions/
├── shared/
│   ├── components/      # Navbar, ApiVersionCheck, etc.
│   ├── hooks/
│   ├── utils/
│   └── theme/
├── api/
└── core/                # Root-level app setup
```

**Benefits:**

- Better code discoverability
- Easier to understand feature scope
- Reduced coupling between features
- Easier onboarding for new developers
- Clearer ownership boundaries

#### 1.2 Split Large Route Components

**Effort:** Medium | **Priority:** High | **Impact:** High

Break down large route files (atlas.tsx, squareLR.tsx, grid.tsx) into smaller, focused components:

**Current:** `app/routes/atlas.tsx` (432 lines)
**Proposed:**

```
app/features/atlas/
├── routes/
│   └── AtlasRoute.tsx (50-100 lines)
├── components/
│   ├── AtlasViewer.tsx
│   ├── LatentSpacePanel.tsx
│   ├── PredictionControls.tsx
│   └── GridSquareOverlay.tsx
├── hooks/
│   ├── useAtlasData.ts
│   ├── usePredictions.ts
│   └── useLatentRepresentation.ts
└── types.ts
```

**Benefits:**

- Improved testability
- Better code reuse
- Easier to understand and maintain
- Clearer separation of concerns

#### 1.3 Create Proper Barrel Exports

**Effort:** Low | **Priority:** Medium | **Impact:** Medium

Add index.ts files for cleaner imports:

```typescript
// app/features/atlas/index.ts
export { AtlasRoute } from './routes/AtlasRoute'
export * from './types'

// Usage
import { AtlasRoute } from '~/features/atlas'
```

**Benefits:**

- Cleaner import statements
- Better encapsulation
- Easier refactoring

---

## 2. TypeScript Usage and Type Safety

### Current State

**Strengths:**

- TypeScript strict mode enabled (`tsconfig.json`: `"strict": true`)
- Auto-generated types from OpenAPI spec
- Comprehensive API type coverage
- Proper type exports from generated code

**Issues:**

1. **4 instances of `@ts-ignore` or `any` types** in application code
2. **Inconsistent type imports** - Mix of `import type` and regular imports
3. **Missing custom types** - Domain types not formalized
4. **Inline type definitions** - Types defined in components instead of separate files

### Recommended Improvements

#### 2.1 Remove All Type Suppressions

**Effort:** Low | **Priority:** High | **Impact:** Medium

Current issues in `/home/vredchenko/dev/DLS/smartem-frontend/app/api/mutator.ts`:

```typescript
// @ts-ignore
promise.cancel = () => {
  source.cancel('Query was cancelled')
}
```

**Solution:**

```typescript
type CancellablePromise<T> = Promise<T> & {
  cancel: () => void
}

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): CancellablePromise<T> => {
  const source = Axios.CancelToken.source()
  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data) as CancellablePromise<T>

  promise.cancel = () => {
    source.cancel('Query was cancelled')
  }

  return promise
}
```

**Benefits:**

- Full type safety
- Better IDE autocomplete
- Catch errors at compile time

#### 2.2 Consolidate Types into Domain Files

**Effort:** Medium | **Priority:** Medium | **Impact:** Medium

**Current:** Types scattered across route files

```typescript
// In atlas.tsx
type GridSquare = GridSquareResponse
type PredictionModel = QualityPredictionModelResponse
type Coords = { x: number; y: number; index: number }
```

**Proposed:**

```typescript
// app/features/atlas/types.ts
export type GridSquare = GridSquareResponse
export type PredictionModel = QualityPredictionModelResponse
export type Coords = { x: number; y: number; index: number }
export type AtlasViewState = {
  selectedSquare: string
  showPredictions: boolean
  selectionFrozen: boolean
}
```

**Benefits:**

- Single source of truth for types
- Easier to share types across files
- Better type documentation

#### 2.3 Use Consistent Type Import Syntax

**Effort:** Low | **Priority:** Low | **Impact:** Low

Standardize on `import type` for all type-only imports:

```typescript
// Before (inconsistent)
import { GridSquareResponse } from '../api/generated/models'
import type { SelectChangeEvent } from '@mui/material'

// After (consistent)
import type { GridSquareResponse } from '../api/generated/models'
import type { SelectChangeEvent } from '@mui/material'
```

**Benefits:**

- Clearer intent
- Better tree-shaking
- Faster compilation

#### 2.4 Enable Additional TypeScript Strict Checks

**Effort:** Low | **Priority:** Medium | **Impact:** Medium

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true
  }
}
```

**Benefits:**

- Catch more potential runtime errors
- Better null/undefined handling
- Stronger type guarantees

---

## 3. React Patterns and Best Practices

### Current State

**Good Practices:**

- Using React 19 features
- Functional components throughout
- React.StrictMode enabled
- Using hooks appropriately

**Issues Identified:**

1. **72 instances of `React.useState`, `React.useEffect`** - Unnecessary namespace usage
2. **No custom hooks** - Business logic embedded in components
3. **Prop drilling** - No context usage for shared state
4. **Mixed concerns** - Components handle data fetching, state, and UI
5. **Inline styles** - Heavy use of `style={}` props (78 instances)
6. **No component composition patterns** - Monolithic components
7. **Missing error boundaries** - Only root-level error boundary
8. **No loading states abstraction** - Repeated loading/error patterns

### Recommended Improvements

#### 3.1 Remove React Namespace from Hooks

**Effort:** Low | **Priority:** Medium | **Impact:** Low

**Current:**

```typescript
import React from 'react'
const [state, setState] = React.useState(false)
```

**Proposed:**

```typescript
import { useState } from 'react'
const [state, setState] = useState(false)
```

**Benefits:**

- Cleaner code
- Modern React conventions
- Smaller bundle (tree-shaking)

#### 3.2 Extract Custom Hooks

**Effort:** Medium | **Priority:** High | **Impact:** High

**Current:** Business logic in components

```typescript
// In atlas.tsx (432 lines)
export default function Atlas({ loaderData, params }: Route.ComponentProps) {
  const [predictions, setPredictions] = React.useState<Map<string, number>>()
  const [latentRep, setLatentRep] = React.useState<Map<string, Coords>>()

  const handleChange = async (event: SelectChangeEvent) => {
    setPredictionModel(event.target.value)
    const preds = await getPredictions(event.target.value, params.gridId)
    setPredictions(preds)
  }
  // ... 400 more lines
}
```

**Proposed:**

```typescript
// app/features/atlas/hooks/usePredictions.ts
export function usePredictions(gridId: string) {
  const [predictions, setPredictions] = useState<Map<string, number>>()
  const [model, setModel] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const loadPredictions = useCallback(
    async (modelName: string) => {
      setIsLoading(true)
      setModel(modelName)
      try {
        const preds = await getPredictions(modelName, gridId)
        setPredictions(preds)
      } finally {
        setIsLoading(false)
      }
    },
    [gridId]
  )

  return { predictions, model, isLoading, loadPredictions }
}

// app/features/atlas/routes/AtlasRoute.tsx
export default function Atlas({ loaderData, params }: Route.ComponentProps) {
  const { predictions, loadPredictions } = usePredictions(params.gridId)
  const { latentRep, loadLatentRep } = useLatentRepresentation(params.gridId)
  // Component now 100 lines, focused on UI
}
```

**Benefits:**

- Testable business logic
- Reusable across components
- Easier to understand component purpose
- Better separation of concerns

#### 3.3 Create Shared UI Component Abstractions

**Effort:** Medium | **Priority:** High | **Impact:** High

**Pattern identified:** Repeated loading/error/data pattern

```typescript
// Appears in multiple routes
{isLoading ? (
  <Box display="flex" justifyContent="center" p={4}>
    <CircularProgress />
  </Box>
) : error ? (
  <Alert severity="error">Error: {error.message}</Alert>
) : (
  // render data
)}
```

**Proposed:**

```typescript
// app/shared/components/QueryStateHandler.tsx
export function QueryStateHandler<T>({
  isLoading,
  error,
  data,
  children,
  loadingMessage = 'Loading...',
  emptyMessage = 'No data found'
}: QueryStateHandlerProps<T>) {
  if (isLoading) return <LoadingSpinner message={loadingMessage} />
  if (error) return <ErrorAlert error={error} />
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return <EmptyState message={emptyMessage} />
  }
  return <>{children(data)}</>
}

// Usage
<QueryStateHandler
  isLoading={isLoading}
  error={error}
  data={acquisitions}
>
  {(data) => <AcquisitionTable acquisitions={data} />}
</QueryStateHandler>
```

**Benefits:**

- DRY principle
- Consistent UX
- Easier to update loading/error states globally

#### 3.4 Replace Inline Styles with Styled Components or Theme

**Effort:** High | **Priority:** Medium | **Impact:** Medium

**Current:** 78 instances of inline styles

```typescript
<Container style={{ width: '100%', paddingTop: '50px' }}>
<IconButton style={{ display: 'flex', marginLeft: 'auto' }}>
```

**Proposed Option 1 - MUI sx prop:**

```typescript
<Container sx={{ width: 1, pt: 6.25 }}>
<IconButton sx={{ display: 'flex', ml: 'auto' }}>
```

**Proposed Option 2 - styled components:**

```typescript
const StyledContainer = styled(Container)(({ theme }) => ({
  width: '100%',
  paddingTop: theme.spacing(6.25),
}))
```

**Benefits:**

- Theme-aware styling
- Type-safe style props
- Better performance (no style recalculation)
- Easier to maintain

#### 3.5 Implement Compound Components Pattern

**Effort:** Medium | **Priority:** Medium | **Impact:** Medium

For complex components like Atlas viewer:

```typescript
// app/features/atlas/components/AtlasViewer/index.tsx
export const AtlasViewer = {
  Root: AtlasViewerRoot,
  Image: AtlasImage,
  Overlay: GridSquareOverlay,
  Controls: AtlasControls,
  LatentPanel: LatentSpacePanel
}

// Usage
<AtlasViewer.Root>
  <AtlasViewer.Image src={atlasUrl} />
  <AtlasViewer.Overlay squares={squares} />
  <AtlasViewer.Controls>
    <PredictionToggle />
    <ModelSelector />
  </AtlasViewer.Controls>
  {showLatent && <AtlasViewer.LatentPanel />}
</AtlasViewer.Root>
```

**Benefits:**

- Better component composition
- Clearer component hierarchy
- More flexible layouts
- Self-documenting API

#### 3.6 Add Error Boundaries per Feature

**Effort:** Low | **Priority:** Medium | **Impact:** Medium

**Current:** Only root error boundary

**Proposed:**

```typescript
// app/shared/components/ErrorBoundary.tsx
export class FeatureErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logErrorToService(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />
    }
    return this.props.children
  }
}

// Usage in routes
<FeatureErrorBoundary>
  <AtlasRoute />
</FeatureErrorBoundary>
```

**Benefits:**

- Graceful degradation
- Better error isolation
- Improved UX
- Error tracking

---

## 4. Build Tooling and Configuration

### Current State

**Configuration Files:**

- `vite.config.ts` - Minimal config (18 lines)
- `react-router.config.ts` - Very basic (7 lines)
- `tsconfig.json` - Good strict settings
- `orval.config.ts` - Well configured

**Strengths:**

- Modern Vite setup
- Fast HMR
- Good proxy configuration
- TypeScript path aliases configured

**Issues:**

1. **No bundle analysis** - Can't analyze bundle size
2. **No environment validation** - No schema for env vars
3. **No source maps configuration** - Debug experience could be better
4. **No build optimization config** - Using defaults
5. **Missing performance budgets**

### Recommended Improvements

#### 4.1 Add Bundle Analysis

**Effort:** Low | **Priority:** Medium | **Impact:** Medium

```typescript
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => ({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    mode === 'analyze' &&
      visualizer({
        open: true,
        filename: 'bundle-analysis.html',
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),
}))
```

Add script to `package.json`:

```json
{
  "scripts": {
    "analyze": "vite build --mode analyze"
  }
}
```

**Benefits:**

- Identify large dependencies
- Optimize bundle size
- Find code splitting opportunities

#### 4.2 Add Environment Variable Validation

**Effort:** Low | **Priority:** High | **Impact:** Medium

```typescript
// app/config/env.ts
import { z } from 'zod'

const envSchema = z.object({
  VITE_API_ENDPOINT: z.string().url().optional(),
  VITE_ENABLE_MOCKS: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  MODE: z.enum(['development', 'production', 'test']),
  DEV: z.boolean(),
  PROD: z.boolean(),
})

export const env = envSchema.parse({
  VITE_API_ENDPOINT: import.meta.env.VITE_API_ENDPOINT,
  VITE_ENABLE_MOCKS: import.meta.env.VITE_ENABLE_MOCKS,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
})

// Usage
import { env } from '~/config/env'
const apiUrl = env.VITE_API_ENDPOINT || 'http://localhost:8000'
```

**Benefits:**

- Type-safe environment variables
- Fail fast on misconfiguration
- Clear documentation of required env vars

#### 4.3 Optimize Build Configuration

**Effort:** Medium | **Priority:** Medium | **Impact:** Medium

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],

  build: {
    target: 'es2022',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router'],
          'vendor-mui': ['@mui/material', '@mui/icons-material'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-charts': ['@mui/x-charts', 'd3-array'],
        },
      },
    },
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

**Benefits:**

- Better caching
- Faster initial load
- Smaller bundle sizes
- Better debugging

#### 4.4 Add Performance Budgets

**Effort:** Low | **Priority:** Low | **Impact:** Low

```json
// package.json
{
  "budgets": {
    "client/index.html": "500kb",
    "client/assets/*.js": "200kb",
    "client/assets/*.css": "50kb"
  }
}
```

**Benefits:**

- Prevent bundle bloat
- Maintain performance standards
- Early warning system

---

## 5. Testing Setup and Coverage

### Current State

**Issues:**

- **NO testing framework configured** (no vitest, jest, or playwright)
- **NO test files** found in the codebase
- **NO test scripts** in package.json
- **0% test coverage**
- NO CI/CD pipeline detected

This is the **most critical gap** in the codebase.

### Recommended Improvements

#### 5.1 Set Up Vitest for Unit/Integration Tests

**Effort:** Medium | **Priority:** CRITICAL | **Impact:** High

**Install dependencies:**

```json
{
  "devDependencies": {
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "@vitest/ui": "^2.0.0",
    "vitest": "^2.0.0",
    "happy-dom": "^12.10.3"
  }
}
```

**Create config:**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./app/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: ['app/api/generated/**', '**/*.config.{ts,js}', '**/types.ts'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
})
```

**Add scripts:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

**Benefits:**

- Catch bugs early
- Safer refactoring
- Documentation through tests
- Better code quality

#### 5.2 Create Test Structure

**Effort:** Low | **Priority:** High | **Impact:** Medium

```
app/
├── test/
│   ├── setup.ts
│   ├── utils/
│   │   ├── test-utils.tsx      # Custom render with providers
│   │   ├── mocks/               # Mock data factories
│   │   └── fixtures.ts
│   └── __mocks__/               # Global mocks
└── features/
    └── atlas/
        ├── components/
        │   ├── AtlasViewer.tsx
        │   └── __tests__/
        │       └── AtlasViewer.test.tsx
        └── hooks/
            ├── usePredictions.ts
            └── __tests__/
                └── usePredictions.test.ts
```

#### 5.3 Write Tests for Critical Paths

**Effort:** High | **Priority:** High | **Impact:** High

**Example hook test:**

```typescript
// app/features/atlas/hooks/__tests__/usePredictions.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePredictions } from '../usePredictions'

describe('usePredictions', () => {
  it('should load predictions when model changes', async () => {
    const { result } = renderHook(() => usePredictions('grid-123'), {
      wrapper: createQueryWrapper(),
    })

    expect(result.current.predictions).toBeUndefined()

    await act(() => result.current.loadPredictions('model-1'))

    await waitFor(() => {
      expect(result.current.predictions).toBeDefined()
      expect(result.current.isLoading).toBe(false)
    })
  })
})
```

**Example component test:**

```typescript
// app/shared/components/__tests__/QueryStateHandler.test.tsx
import { render, screen } from '@testing-library/react'
import { QueryStateHandler } from '../QueryStateHandler'

describe('QueryStateHandler', () => {
  it('shows loading state', () => {
    render(
      <QueryStateHandler isLoading={true} error={null} data={null}>
        {() => <div>Data</div>}
      </QueryStateHandler>
    )
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('shows error state', () => {
    const error = new Error('Failed to load')
    render(
      <QueryStateHandler isLoading={false} error={error} data={null}>
        {() => <div>Data</div>}
      </QueryStateHandler>
    )
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
  })
})
```

**Priority test coverage:**

1. Custom hooks (100% coverage goal)
2. Shared components (90% coverage goal)
3. API utilities (80% coverage goal)
4. Route components (60% coverage goal - mainly integration tests)

#### 5.4 Add E2E Testing with Playwright

**Effort:** Medium | **Priority:** Medium | **Impact:** High

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
  },
})
```

**Example E2E test:**

```typescript
// e2e/acquisition-flow.spec.ts
import { test, expect } from '@playwright/test'

test('user can view and select acquisition', async ({ page }) => {
  await page.goto('/')

  // Should show acquisitions table
  await expect(page.getByRole('table')).toBeVisible()

  // Click on first acquisition
  await page.getByRole('row').first().click()

  // Should navigate to grids page
  await expect(page).toHaveURL(/\/acquisitions\/.*/)
  await expect(page.getByRole('heading', { name: /grids/i })).toBeVisible()
})
```

**Benefits:**

- Catch UI regressions
- Test user workflows
- Confidence in deployments

---

## 6. Code Quality Tools

### Current State

**Configured:**

- Prettier (`.prettierrc`) - Basic configuration
- TypeScript (strict mode enabled)

**Missing:**

- ESLint
- Husky (git hooks)
- lint-staged
- Commitlint
- Import sorting

### Recommended Improvements

#### 6.1 Add ESLint Configuration

**Effort:** Low | **Priority:** High | **Impact:** Medium

```javascript
// eslint.config.js
import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': typescript,
      react: react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',

      // React
      'react/react-in-jsx-scope': 'off', // Not needed in React 19
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/prop-types': 'off', // Using TypeScript

      // Accessibility
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',

      // Imports
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
        },
      ],
      'import/no-duplicates': 'error',
    },
  },
]
```

**Add scripts:**

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix"
  }
}
```

**Benefits:**

- Catch common errors
- Enforce code style
- Improve code quality
- Better team consistency

#### 6.2 Set Up Git Hooks with Husky

**Effort:** Low | **Priority:** Medium | **Impact:** High

```bash
npm install -D husky lint-staged @commitlint/cli @commitlint/config-conventional
npx husky init
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write", "vitest related --run"],
    "*.{json,md,css}": "prettier --write"
  }
}
```

```javascript
// .husky/pre-commit
npm run lint-staged
```

```javascript
// .husky/commit-msg
npx --no -- commitlint --edit $1
```

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'chore',
        'perf',
        'ci',
        'build',
      ],
    ],
  },
}
```

**Benefits:**

- Prevent bad commits
- Enforce code quality
- Consistent commit messages
- Automated quality checks

#### 6.3 Add Import Sorting and Organization

**Effort:** Low | **Priority:** Low | **Impact:** Low

```json
// .prettierrc
{
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": false,
  "singleQuote": true,
  "importOrder": ["^react", "^@?\\w", "^~/", "^[./]"],
  "importOrderSeparation": true,
  "importOrderSortSpecifiers": true,
  "plugins": ["@trivago/prettier-plugin-sort-imports"]
}
```

**Benefits:**

- Cleaner imports
- Easier to scan
- Prevent merge conflicts

---

## 7. Dependencies and Package Management

### Current State

**Dependencies (16):**

- React 19.1.1
- React Router 7.9.2
- TanStack Query 5.90.2
- Material-UI 7.3.2
- Axios 1.12.2
- TypeScript 5.9.2

**DevDependencies (13):**

- Vite 5.4.20
- Orval 7.13.0
- MSW 2.11.3
- Tailwind CSS 4.1.13

**Issues:**

1. **No lockfile validation** in CI
2. **No dependency update automation**
3. **No security audit automation**
4. **Missing peer dependencies warnings**
5. **No bundle size tracking**

### Recommended Improvements

#### 7.1 Add Dependency Update Automation

**Effort:** Low | **Priority:** Medium | **Impact:** Medium

**Create Renovate config:**

```json
// renovate.json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:base"],
  "packageRules": [
    {
      "matchUpdateTypes": ["minor", "patch"],
      "matchCurrentVersion": "!/^0/",
      "automerge": true
    },
    {
      "groupName": "React ecosystem",
      "matchPackagePatterns": ["^react", "^@types/react"]
    },
    {
      "groupName": "MUI ecosystem",
      "matchPackagePatterns": ["^@mui/"]
    },
    {
      "matchDepTypes": ["devDependencies"],
      "automerge": true
    }
  ],
  "vulnerabilityAlerts": {
    "enabled": true
  }
}
```

**Benefits:**

- Keep dependencies updated
- Automatic security patches
- Reduce maintenance burden

#### 7.2 Add Security Audit Script

**Effort:** Low | **Priority:** High | **Impact:** Medium

```json
{
  "scripts": {
    "audit": "npm audit --audit-level=moderate",
    "audit:fix": "npm audit fix"
  }
}
```

**Add to CI:**

```yaml
# .github/workflows/security.yml
name: Security Audit
on:
  schedule:
    - cron: '0 0 * * 0' # Weekly
  pull_request:

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit --audit-level=moderate
```

**Benefits:**

- Early security vulnerability detection
- Automated fixes
- Compliance

#### 7.3 Evaluate Heavy Dependencies

**Effort:** Medium | **Priority:** Medium | **Impact:** Medium

**Current bundle (estimated):**

- node_modules: 662MB
- Largest dependencies: MUI, React Router, TanStack Query

**Recommendations:**

1. **Consider lighter alternatives:**
   - Material-UI (large) → Consider Radix UI + custom styling
   - d3-array → Consider native Array methods where possible

2. **Use selective imports:**

```typescript
// Before
import { Box, Container, Stack } from '@mui/material'

// After (if needed for bundle optimization)
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
```

3. **Lazy load heavy features:**

```typescript
const ChartsPanel = lazy(() => import('./components/ChartsPanel'))
```

**Benefits:**

- Smaller bundle size
- Faster initial load
- Better performance

#### 7.4 Add Package Size Limit

**Effort:** Low | **Priority:** Low | **Impact:** Low

```json
{
  "devDependencies": {
    "size-limit": "^11.0.0",
    "@size-limit/preset-app": "^11.0.0"
  },
  "scripts": {
    "size": "size-limit"
  }
}
```

```javascript
// .size-limit.js
export default [
  {
    name: 'Client bundle',
    path: 'build/client/**/*.js',
    limit: '500 KB',
  },
]
```

**Benefits:**

- Prevent bundle bloat
- Performance budget enforcement

---

## 8. Performance Optimizations

### Current State

**Strengths:**

- React Router 7 with SSR enabled
- TanStack Query for caching (5-minute stale time)
- Vite for fast builds

**Issues:**

1. **No code splitting** beyond route-level
2. **No lazy loading** for heavy components
3. **No image optimization**
4. **No memoization** in expensive computations
5. **Fetch waterfalls** in some routes
6. **No prefetching** of likely next pages

### Recommended Improvements

#### 8.1 Implement Component Code Splitting

**Effort:** Medium | **Priority:** High | **Impact:** High

```typescript
// app/routes/atlas.tsx
import { lazy, Suspense } from 'react'

const LatentSpacePanel = lazy(() =>
  import('../features/atlas/components/LatentSpacePanel')
)
const PredictionControls = lazy(() =>
  import('../features/atlas/components/PredictionControls')
)

export default function Atlas() {
  return (
    <ThemeProvider theme={theme}>
      <Navbar />
      <AtlasViewer />
      <Suspense fallback={<ComponentSkeleton />}>
        {showLatent && <LatentSpacePanel />}
      </Suspense>
    </ThemeProvider>
  )
}
```

**Benefits:**

- Smaller initial bundle
- Faster initial load
- Better caching

#### 8.2 Add React.memo for Expensive Components

**Effort:** Low | **Priority:** Medium | **Impact:** Medium

```typescript
// app/features/atlas/components/GridSquareOverlay.tsx
import { memo } from 'react'

export const GridSquareOverlay = memo(({
  squares,
  predictions,
  onSquareClick
}: Props) => {
  return (
    <svg>
      {squares.map(square => (
        <GridSquare
          key={square.uuid}
          square={square}
          prediction={predictions.get(square.uuid)}
          onClick={onSquareClick}
        />
      ))}
    </svg>
  )
}, (prev, next) => {
  // Custom comparison
  return prev.squares === next.squares &&
         prev.predictions === next.predictions
})
```

**Benefits:**

- Reduce unnecessary re-renders
- Better performance with large lists
- Smoother interactions

#### 8.3 Implement Virtual Scrolling for Large Lists

**Effort:** Medium | **Priority:** Medium | **Impact:** High

For grid squares or large tables:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

function GridSquareList({ squares }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: squares.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 10
  })

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <GridSquareRow
            key={virtualRow.index}
            square={squares[virtualRow.index]}
            style={{
              position: 'absolute',
              top: 0,
              transform: `translateY(${virtualRow.start}px)`
            }}
          />
        ))}
      </div>
    </div>
  )
}
```

**Benefits:**

- Handle thousands of items
- Constant performance regardless of list size
- Better UX

#### 8.4 Optimize TanStack Query Configuration

**Effort:** Low | **Priority:** Medium | **Impact:** Medium

```typescript
// app/root.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (was cacheTime)
      retry: 1,
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
      onError: (error) => {
        // Global error handling
        console.error('Mutation error:', error)
      },
    },
  },
})
```

**Add prefetching:**

```typescript
// app/routes/home.tsx
import { useQueryClient } from '@tanstack/react-query'

export default function Home() {
  const queryClient = useQueryClient()
  const { data: acquisitions } = useGetAcquisitionsAcquisitionsGet()

  const handleRowHover = (acqId: string) => {
    // Prefetch grids data
    queryClient.prefetchQuery({
      queryKey: getGetAcquisitionGridsQueryKey(acqId),
      queryFn: () => getAcquisitionGrids(acqId)
    })
  }

  return (
    <TableRow onMouseEnter={() => handleRowHover(acq.uuid)}>
      {/* ... */}
    </TableRow>
  )
}
```

**Benefits:**

- Better caching strategy
- Faster perceived performance
- Reduced API calls

#### 8.5 Implement Image Optimization

**Effort:** Medium | **Priority:** Medium | **Impact:** Medium

```typescript
// app/components/OptimizedImage.tsx
export function OptimizedImage({
  src,
  alt,
  width,
  height
}: Props) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        e.currentTarget.src = '/placeholder.png'
      }}
    />
  )
}

// Usage in atlas
<OptimizedImage
  src={`${apiUrl()}/grids/${params.gridId}/atlas_image`}
  alt="Atlas view"
  width={4005}
  height={4005}
/>
```

**Benefits:**

- Faster page loads
- Better UX
- Reduced bandwidth

---

## 9. Developer Experience Improvements

### Current State

**Strengths:**

- Good README documentation
- Mock API mode for development
- Fast HMR with Vite
- TypeScript for better DX

**Issues:**

1. **No component documentation** (Storybook, etc.)
2. **No dev tools extensions** configured
3. **No debugging configuration**
4. **Limited error messages**
5. **No development utilities**

### Recommended Improvements

#### 9.1 Add Storybook for Component Documentation

**Effort:** Medium | **Priority:** Medium | **Impact:** High

```bash
npx storybook@latest init
```

```typescript
// .storybook/main.ts
export default {
  stories: ['../app/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: '@storybook/react-vite',
}
```

**Example story:**

```typescript
// app/shared/components/QueryStateHandler.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { QueryStateHandler } from './QueryStateHandler'

const meta = {
  title: 'Shared/QueryStateHandler',
  component: QueryStateHandler,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof QueryStateHandler>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  args: {
    isLoading: true,
    error: null,
    data: null,
    children: () => <div>Data</div>
  }
}

export const Error: Story = {
  args: {
    isLoading: false,
    error: new Error('Failed to load'),
    data: null,
    children: () => <div>Data</div>
  }
}
```

**Benefits:**

- Component documentation
- Visual testing
- Isolated development
- Better collaboration

#### 9.2 Add React Query DevTools

**Effort:** Low | **Priority:** Low | **Impact:** Medium

```typescript
// app/root.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <ApiVersionCheck />
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
```

**Benefits:**

- Debug query state
- Inspect cache
- Better development experience

#### 9.3 Add VS Code Debug Configuration

**Effort:** Low | **Priority:** Low | **Impact:** Low

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome against localhost",
      "url": "http://localhost:5174",
      "webRoot": "${workspaceFolder}"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Vitest: Current File",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["--run", "${relativeFile}"],
      "smartStep": true,
      "console": "integratedTerminal"
    }
  ]
}
```

**Benefits:**

- Better debugging
- Faster development
- Easier troubleshooting

#### 9.4 Add Development Utilities

**Effort:** Low | **Priority:** Low | **Impact:** Medium

```typescript
// app/utils/dev.ts
export const devLog = {
  info: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log('[INFO]', ...args)
    }
  },
  warn: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn('[WARN]', ...args)
    }
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args)
  },
}

export const devAssert = (condition: boolean, message: string) => {
  if (import.meta.env.DEV && !condition) {
    console.error(`Assertion failed: ${message}`)
  }
}
```

**Benefits:**

- Better logging
- Easier debugging
- Development-only code

---

## 10. Modern Web Standards and Patterns

### Current State

**Strengths:**

- Using React 19 (latest)
- ES2022 target
- Modern bundler (Vite)

**Issues:**

1. **No Web Vitals tracking**
2. **No PWA support**
3. **No service worker** (except MSW for mocks)
4. **No dark mode implementation** (despite theme setup)
5. **Limited accessibility features**

### Recommended Improvements

#### 10.1 Add Web Vitals Monitoring

**Effort:** Low | **Priority:** Medium | **Impact:** Medium

```typescript
// app/utils/vitals.ts
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals'

export function reportWebVitals(onPerfEntry?: (metric: any) => void) {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    onCLS(onPerfEntry)
    onFID(onPerfEntry)
    onLCP(onPerfEntry)
    onFCP(onPerfEntry)
    onTTFB(onPerfEntry)
  }
}

// app/entry.client.tsx
import { reportWebVitals } from './utils/vitals'

reportWebVitals((metric) => {
  // Send to analytics
  console.log(metric)
})
```

**Benefits:**

- Track real user performance
- Identify performance issues
- Data-driven optimizations

#### 10.2 Implement Dark Mode Properly

**Effort:** Medium | **Priority:** Low | **Impact:** Medium

```typescript
// app/hooks/useTheme.ts
import { useState, useEffect } from 'react'

export function useThemeMode() {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark'
    const stored = localStorage.getItem('theme-mode')
    if (stored) return stored as 'light' | 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })

  useEffect(() => {
    localStorage.setItem('theme-mode', mode)
    document.documentElement.classList.toggle('dark', mode === 'dark')
  }, [mode])

  const toggleMode = () => setMode((m) => (m === 'light' ? 'dark' : 'light'))

  return { mode, toggleMode }
}

// Update theme.tsx
export function useAppTheme() {
  const { mode } = useThemeMode()

  return createTheme({
    palette: {
      mode,
      // ... rest of theme
    },
  })
}
```

**Benefits:**

- Better UX
- Reduced eye strain
- Modern user expectation

#### 10.3 Add Accessibility Improvements

**Effort:** Medium | **Priority:** High | **Impact:** High

**Current issues:**

- Missing aria labels
- Keyboard navigation not always clear
- Focus management issues

**Improvements:**

```typescript
// app/features/atlas/components/GridSquareOverlay.tsx
<circle
  role="button"
  aria-label={`Grid square ${gridSquare.gridsquare_id}${
    predictions ? `, prediction: ${predictions.get(gridSquare.uuid)}` : ''
  }`}
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleSelectionClick(gridSquare.uuid)
    }
  }}
  onClick={() => handleSelectionClick(gridSquare.uuid)}
/>
```

**Add skip links:**

```typescript
// app/root.tsx
<body>
  <a href="#main-content" className="skip-link">
    Skip to main content
  </a>
  {children}
</body>
```

**Benefits:**

- Better accessibility
- Legal compliance
- Wider user reach

#### 10.4 Add Offline Support

**Effort:** High | **Priority:** Low | **Impact:** Medium

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
            },
          },
        ],
      },
    }),
  ],
})
```

**Benefits:**

- Work offline
- Better reliability
- Faster loads on repeat visits

---

## 11. Additional Recommendations

### 11.1 API Client Improvements

**Current:** Good setup with Orval

**Enhancements:**

1. **Add request/response logging:**

```typescript
// app/api/mutator.ts
if (import.meta.env.DEV) {
  AXIOS_INSTANCE.interceptors.request.use((request) => {
    console.log('API Request:', request.method?.toUpperCase(), request.url)
    return request
  })
}
```

2. **Add retry logic:**

```typescript
import axiosRetry from 'axios-retry'

axiosRetry(AXIOS_INSTANCE, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 429
    )
  },
})
```

3. **Add request cancellation:**

```typescript
export function useApiQuery<T>(queryKey: QueryKey, queryFn: () => Promise<T>) {
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => {
      // Orval already handles this with CancelToken
      return queryFn()
    },
  })
}
```

### 11.2 State Management Considerations

**Current:** TanStack Query for server state only

**Potential additions:**

For complex client state, consider:

- Zustand (lightweight)
- Jotai (atomic state)
- React Context + useReducer (built-in)

**Not needed yet**, but worth considering if:

- Sharing state across many components
- Complex state interactions
- Need for state persistence

### 11.3 Form Management

**Current:** Manual form handling

**Recommendation:** Add React Hook Form for complex forms

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  name: z.string().min(1),
  description: z.string()
})

function CreateModelForm() {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema)
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {formState.errors.name && <span>{formState.errors.name.message}</span>}
    </form>
  )
}
```

**Benefits:**

- Better validation
- Less boilerplate
- Type-safe forms

### 11.4 Documentation Improvements

**Add:**

1. Architecture Decision Records (ADRs)
2. Component usage examples in README
3. API integration guide
4. Contributing guidelines
5. Deployment guide

---

## 12. Priority Implementation Roadmap

### Phase 1: Critical (Week 1-2)

**Focus: Testing & Quality**

1. Set up Vitest + Testing Library
2. Add ESLint configuration
3. Write tests for critical paths (hooks, shared components)
4. Set up git hooks (Husky + lint-staged)
5. Add environment variable validation

**Effort:** ~40 hours
**Impact:** Prevents bugs, improves code quality

### Phase 2: High Priority (Week 3-4)

**Focus: Code Organization & Architecture**

1. Extract custom hooks from route components
2. Create shared UI component abstractions
3. Implement feature-based folder structure
4. Split large route components
5. Remove React namespace from hooks
6. Fix TypeScript `@ts-ignore` issues

**Effort:** ~60 hours
**Impact:** Better maintainability, easier development

### Phase 3: Medium Priority (Week 5-6)

**Focus: Performance & DX**

1. Implement code splitting
2. Add React.memo for expensive components
3. Optimize TanStack Query configuration
4. Add Storybook
5. Set up bundle analysis
6. Add React Query DevTools

**Effort:** ~40 hours
**Impact:** Better performance, better DX

### Phase 4: Enhancement (Week 7-8)

**Focus: Polish & Modern Features**

1. Implement dark mode properly
2. Add accessibility improvements
3. Set up E2E testing with Playwright
4. Add Web Vitals monitoring
5. Improve error boundaries
6. Add dependency update automation

**Effort:** ~30 hours
**Impact:** Better UX, modern standards

---

## 13. Metrics and Success Criteria

### Code Quality Metrics

| Metric                 | Current  | Target | Timeline |
| ---------------------- | -------- | ------ | -------- |
| Test Coverage          | 0%       | 70%    | 4 weeks  |
| ESLint Errors          | Unknown  | 0      | 2 weeks  |
| TypeScript `any` usage | 4        | 0      | 2 weeks  |
| Bundle Size            | ~1.3MB   | <800KB | 6 weeks  |
| Lighthouse Score       | Unknown  | >90    | 8 weeks  |
| Component Count        | 6        | 30+    | 6 weeks  |
| Hook Count             | 0 custom | 15+    | 4 weeks  |

### Developer Experience Metrics

| Metric                         | Current | Target | Timeline |
| ------------------------------ | ------- | ------ | -------- |
| Build Time                     | ~5s     | <3s    | 4 weeks  |
| HMR Speed                      | Fast    | Faster | 4 weeks  |
| Time to First Meaningful Paint | Unknown | <1.5s  | 6 weeks  |
| Storybook Stories              | 0       | 25+    | 6 weeks  |

---

## 14. Conclusion

The SmartEM frontend is a solid React application with good foundations. The most critical gaps are:

1. **Testing** (0% coverage) - Highest priority
2. **Component organization** - Large, monolithic components
3. **Code quality tooling** - Missing ESLint
4. **Type safety** - Some type suppressions

The project would benefit most from:

- Immediate focus on testing infrastructure
- Gradual refactoring to extract hooks and split components
- Adding ESLint and git hooks
- Improving component reusability

Overall, with the recommended improvements, this codebase can evolve from a good application to an excellent, maintainable, and scalable frontend architecture.

---

## Appendix A: Useful Resources

- [React Router 7 Documentation](https://reactrouter.com/)
- [TanStack Query Best Practices](https://tanstack.com/query/latest/docs/react/guides/best-practices)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles/)
- [Web Vitals](https://web.dev/vitals/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

---

**Generated:** 2025-10-07
**Analyzer:** Claude Code
**Next Review:** 2025-11-07
