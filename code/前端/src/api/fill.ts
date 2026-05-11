import request from './request'
import type { ApiResponse } from './request'

export interface FillQuestionOption {
  optionId: string
  content: string
  sortOrder: number
}

export interface FillQuestion {
  questionId: string
  type: 'radio' | 'checkbox' | 'input' | 'rating' | 'dropdown'
  title: string
  required: boolean
  sortOrder: number
  inputType?: 'text' | 'textarea'
  maxLength?: number
  maxRating?: number
  minSelect?: number
  maxSelect?: number
  options?: FillQuestionOption[]
}

export interface FillQuestionnaireResult {
  questionnaireId: string
  title: string
  description: string
  status: 'active' | 'closed' | 'draft'
  questions: FillQuestion[]
}

export interface SubmitAnswer {
  questionId: string
  type: string
  value: string | string[] | number
}

export interface SubmitParams {
  deviceId: string
  answers: SubmitAnswer[]
  submitTime?: string
  duration?: number
}

export interface SubmitResult {
  responseId: string
  completionMessage: string
  submittedAt: string
}

export interface FillStatusResult {
  fillable: boolean
  submitted: boolean
  status: 'active' | 'closed' | 'draft'
  statusMessage: string
}

export function getFillQuestionnaireApi(linkId: string): Promise<ApiResponse<FillQuestionnaireResult>> {
  return request.get(`/fill/${linkId}`)
}

export function submitFillApi(linkId: string, data: SubmitParams): Promise<ApiResponse<SubmitResult>> {
  return request.post(`/fill/${linkId}/submit`, data)
}

export function checkFillStatusApi(linkId: string, deviceId: string): Promise<ApiResponse<FillStatusResult>> {
  return request.get(`/fill/${linkId}/status`, { params: { deviceId } })
}
