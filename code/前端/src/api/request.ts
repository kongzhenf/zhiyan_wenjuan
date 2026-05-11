import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import router from '@/router'

const instance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

instance.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

let isRefreshing = false
let pendingRequests: Array<(token: string) => void> = []

instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const data = response.data
    if (data.success === false) {
      if (data.code === 401000 || data.code === 4010) {
        return handleTokenExpired(response.config, data)
      }
      return Promise.reject(data)
    }
    return data
  },
  (error) => {
    if (error.response?.status === 401) {
      return handleTokenExpired(error.config, error.response.data)
    }
    ElMessage.error('网络异常，请检查网络后重试')
    return Promise.reject(error)
  }
)

async function handleTokenExpired(config: AxiosRequestConfig, errorData: any) {
  const authStore = useAuthStore()

  if (!authStore.refreshToken) {
    authStore.clearAuth()
    router.push('/login')
    return Promise.reject(errorData)
  }

  if (!isRefreshing) {
    isRefreshing = true
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/refresh`,
        { refreshToken: authStore.refreshToken }
      )
      if (res.data.success) {
        const { accessToken, refreshToken } = res.data.result
        authStore.setTokens(accessToken, refreshToken)
        pendingRequests.forEach((cb) => cb(accessToken))
        pendingRequests = []
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${accessToken}`
        return instance(config)
      } else {
        authStore.clearAuth()
        router.push('/login')
        return Promise.reject(errorData)
      }
    } catch {
      authStore.clearAuth()
      router.push('/login')
      return Promise.reject(errorData)
    } finally {
      isRefreshing = false
    }
  }

  return new Promise((resolve) => {
    pendingRequests.push((token: string) => {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
      resolve(instance(config))
    })
  })
}

export interface ApiResponse<T = any> {
  success: boolean
  code: number
  message: string
  result: T
}

export interface PaginatedResult<T> {
  list: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export default instance
