import request from './request'
import type { ApiResponse, PaginatedResult } from './request'

export interface QuestionnaireListItem {
  id: string
  title: string
  status: 'draft' | 'active' | 'closed'
  responseCount: number
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

export interface QuestionOption {
  id: string
  text: string
  sortOrder: number
}

export interface QuestionConfig {
  inputType?: 'text' | 'textarea'
  maxLength?: number
  maxRating?: number
  minSelect?: number
  maxSelect?: number
}

export interface Question {
  id: string
  type: 'radio' | 'checkbox' | 'input' | 'rating' | 'dropdown'
  title: string
  required: boolean
  sortOrder: number
  options: QuestionOption[]
  config: QuestionConfig
}

export interface QuestionnaireDetail {
  id: string
  title: string
  description: string
  status: 'draft' | 'active' | 'closed'
  responseCount: number
  config: {
    deadline: string | null
    maxResponses: number | null
    allowDuplicateDevice: boolean
  }
  questions: Question[]
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

export interface QuestionnaireListQuery {
  page?: number
  pageSize?: number
  status?: string
  keyword?: string
  sortBy?: string
  sortOrder?: string
}

export interface PublishConfig {
  deadline?: string
  maxResponses?: number
  allowDuplicateDevice?: boolean
}

export interface PublishResult {
  id: string
  status: string
  publishedAt: string
  config: PublishConfig
  link: string
  qrcodeUrl: string
}

export interface LinkResult {
  link: string
  shortLink: string
  qrcodeUrl: string
}

export function getQuestionnairesApi(params: QuestionnaireListQuery): Promise<ApiResponse<PaginatedResult<QuestionnaireListItem>>> {
  return request.get('/questionnaires', { params })
}

export function createQuestionnaireApi(data: { title: string; description?: string }): Promise<ApiResponse<any>> {
  return request.post('/questionnaires', data)
}

export function getQuestionnaireDetailApi(id: string): Promise<ApiResponse<QuestionnaireDetail>> {
  return request.get(`/questionnaires/${id}`)
}

export function updateQuestionnaireApi(id: string, data: { title?: string; description?: string }): Promise<ApiResponse<any>> {
  return request.put(`/questionnaires/${id}`, data)
}

export function deleteQuestionnaireApi(id: string, confirm?: boolean): Promise<ApiResponse<null>> {
  return request.delete(`/questionnaires/${id}`, { params: { confirm } })
}

export function addQuestionApi(id: string, data: {
  type: string
  title: string
  required?: boolean
  options?: Array<{ text: string }>
  config?: QuestionConfig
}): Promise<ApiResponse<Question>> {
  return request.post(`/questionnaires/${id}/questions`, data)
}

export function updateQuestionApi(id: string, qid: string, data: {
  title?: string
  required?: boolean
  options?: Array<{ text: string }>
  config?: QuestionConfig
}): Promise<ApiResponse<Question>> {
  return request.put(`/questionnaires/${id}/questions/${qid}`, data)
}

export function deleteQuestionApi(id: string, qid: string): Promise<ApiResponse<null>> {
  return request.delete(`/questionnaires/${id}/questions/${qid}`)
}

export function sortQuestionsApi(id: string, questionIds: string[]): Promise<ApiResponse<null>> {
  return request.put(`/questionnaires/${id}/questions/sort`, { questionIds })
}

export function publishQuestionnaireApi(id: string, config: PublishConfig): Promise<ApiResponse<PublishResult>> {
  return request.post(`/questionnaires/${id}/publish`, config)
}

export function closeQuestionnaireApi(id: string): Promise<ApiResponse<any>> {
  return request.put(`/questionnaires/${id}/close`, {})
}

export function copyQuestionnaireApi(id: string): Promise<ApiResponse<any>> {
  return request.post(`/questionnaires/${id}/copy`, {})
}

export function saveDraftApi(id: string, data: any): Promise<ApiResponse<any>> {
  return request.put(`/questionnaires/${id}/draft`, data)
}

export function previewQuestionnaireApi(id: string): Promise<ApiResponse<any>> {
  return request.get(`/questionnaires/${id}/preview`)
}

export function getQrcodeUrl(id: string): string {
  return `${import.meta.env.VITE_API_BASE_URL || '/api'}/questionnaires/${id}/qrcode`
}

export function getLinkApi(id: string): Promise<ApiResponse<LinkResult>> {
  return request.get(`/questionnaires/${id}/link`)
}
