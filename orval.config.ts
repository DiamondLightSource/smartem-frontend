import { defineConfig } from 'orval'

export default defineConfig({
  smartem: {
    input: {
      target: process.env.OPENAPI_URL || './src/api/openapi.json',
    },
    output: {
      mode: 'tags-split',
      target: 'src/api/generated/endpoints.ts',
      schemas: 'src/api/generated/models',
      client: 'react-query',
      mock: true,
      prettier: true,
      override: {
        mutator: {
          path: 'src/api/mutator.ts',
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
