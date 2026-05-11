import request from './request'
import type { ApiResponse } from './request'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
  username: string
}

export interface RefreshResult {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
}

export function loginApi(params: LoginParams): Promise<ApiResponse<LoginResult>> {
  return request.post('/auth/login', params)
}

export function refreshTokenApi(refreshToken: string): Promise<ApiResponse<RefreshResult>> {
  return request.post('/auth/refresh', { refreshToken })
}

export function logoutApi(): Promise<ApiResponse<null>> {
  return request.post('/auth/logout', {})
}
