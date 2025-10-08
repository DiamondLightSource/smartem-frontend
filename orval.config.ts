import { defineConfig } from 'orval'

export default defineConfig({
  smartem: {
    input: {
      target: process.env.OPENAPI_URL || './app/api/openapi.json',
    },
    output: {
      mode: 'tags-split',
      target: 'app/api/generated/endpoints.ts',
      schemas: 'app/api/generated/models',
      client: 'react-query',
      mock: true,
      prettier: true,
      override: {
        mutator: {
          path: 'app/api/mutator.ts',
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
