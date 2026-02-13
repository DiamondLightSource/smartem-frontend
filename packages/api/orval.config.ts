import { defineConfig } from 'orval'

export default defineConfig({
  smartem: {
    input: {
      target: process.env.OPENAPI_URL || './src/openapi.json',
    },
    output: {
      mode: 'tags-split',
      target: 'src/generated/endpoints.ts',
      schemas: 'src/generated/models',
      client: 'react-query',
      httpClient: 'axios',
      mock: true,
      prettier: true,
      override: {
        mutator: {
          path: 'src/mutator.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useMutation: true,
          version: 5,
          options: {
            staleTime: 300000, // 5 minutes
            retry: 1,
          },
        },
      },
    },
  },
})
