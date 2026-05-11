import request from './request'
import type { ApiResponse } from './request'

export interface OverviewResult {
  totalResponses: number
  todayResponses: number
  totalVisits: number
  responseRate: number
  trend: Array<{ date: string; count: number }>
}

export interface QuestionStatistic {
  questionId: string
  title: string
  type: string
  totalAnswered: number
  averageRating?: number
  statistics: Array<{
    optionId: string
    content: string
    count: number
    percentage: number
  }> | null
}

export interface TextAnswerItem {
  answerId: string
  content: string
  submittedAt: string
}

export interface TextAnswerResult {
  total: number
  page: number
  pageSize: number
  totalPages: number
  items: TextAnswerItem[]
}

export interface ExportResult {
  exportId: string
  mode: 'sync' | 'async'
  status: 'completed' | 'processing' | 'failed'
  downloadUrl: string | null
  fileName: string
  fileSize: number | null
  totalRecords: number
  estimatedTime?: number
}

export interface ExportListItem {
  exportId: string
  questionnaireId: string
  questionnaireTitle: string
  format: string
  status: 'processing' | 'completed' | 'failed'
  totalRecords: number
  fileSize: number | null
  downloadUrl: string | null
  createdAt: string
  completedAt: string | null
  expiresAt: string | null
}

export function getStatisticsOverviewApi(
  questionnaireId: string,
  params?: { startDate?: string; endDate?: string }
): Promise<ApiResponse<OverviewResult>> {
  return request.get(`/statistics/${questionnaireId}/overview`, { params })
}

export function getQuestionStatisticsApi(
  questionnaireId: string,
  params?: { startDate?: string; endDate?: string }
): Promise<ApiResponse<{ questions: QuestionStatistic[] }>> {
  return request.get(`/statistics/${questionnaireId}/questions`, { params })
}

export function getTextAnswersApi(
  questionnaireId: string,
  qid: string,
  params?: { page?: number; pageSize?: number; keyword?: string; startDate?: string; endDate?: string }
): Promise<ApiResponse<TextAnswerResult>> {
  return request.get(`/statistics/${questionnaireId}/questions/${qid}/texts`, { params })
}

export function exportDataApi(
  questionnaireId: string,
  data: { format: 'xlsx' | 'csv'; startDate?: string; endDate?: string }
): Promise<ApiResponse<ExportResult>> {
  return request.post(`/statistics/${questionnaireId}/export`, data)
}

export function getExportListApi(
  params?: { page?: number; pageSize?: number; status?: string; questionnaireId?: string }
): Promise<ApiResponse<{ total: number; page: number; pageSize: number; totalPages: number; items: ExportListItem[] }>> {
  return request.get('/statistics/exports', { params })
}

export function getExportDownloadUrl(exportId: string): string {
  return `${import.meta.env.VITE_API_BASE_URL || '/api'}/statistics/exports/${exportId}/download`
}
