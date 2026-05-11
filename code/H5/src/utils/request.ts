import axios from 'axios'
import type { ApiResponse } from '@/types'
import { showToast } from 'vant'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

service.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const status = error.response?.status
    if (status === 429) {
      showToast('操作过于频繁，请稍后重试')
    } else if (status === 404) {
      return Promise.reject(error)
    } else {
      showToast('网络异常，请检查网络后重试')
    }
    return Promise.reject(error)
  }
)

export function get<T>(url: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
  return service.get(url, { params }) as Promise<ApiResponse<T>>
}

export function post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
  return service.post(url, data) as Promise<ApiResponse<T>>
}

export default service
