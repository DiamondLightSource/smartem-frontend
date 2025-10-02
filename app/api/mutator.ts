import Axios from 'axios'
import type { AxiosRequestConfig, AxiosError } from 'axios'

export const apiUrl = () => {
  return import.meta.env.VITE_API_ENDPOINT
    ? import.meta.env.VITE_API_ENDPOINT
    : 'http://localhost:8000'
}

export const AXIOS_INSTANCE = Axios.create({
  baseURL: apiUrl(),
})

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError = new ApiError(
      error.message || 'API Error',
      error.response?.status || 500,
      error.response?.data
    )
    return Promise.reject(apiError)
  }
)

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const source = Axios.CancelToken.source()
  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data)

  // @ts-ignore
  promise.cancel = () => {
    source.cancel('Query was cancelled')
  }

  return promise
}

export default customInstance
