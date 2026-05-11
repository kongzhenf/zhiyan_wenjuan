export interface ApiResponse<T = unknown> {
  success: boolean
  code: number
  message: string
  result: T | null
}

export interface QuestionOption {
  optionId: string
  content: string
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
  questionId: string
  type: 'radio' | 'checkbox' | 'input' | 'rating' | 'dropdown'
  title: string
  required: boolean
  sortOrder: number
  options?: QuestionOption[]
  inputType?: string
  maxLength?: number
  maxRating?: number
  minSelect?: number
  maxSelect?: number
}

export interface Questionnaire {
  questionnaireId: string
  title: string
  description: string
  status: 'draft' | 'active' | 'closed'
  questions: Question[]
}

export interface AnswerItem {
  questionId: string
  type: string
  value: string | string[] | number
}

export interface SubmitPayload {
  deviceId: string
  answers: AnswerItem[]
  submitTime: string
  duration: number
}

export interface SubmitResult {
  responseId: string
  completionMessage: string
  submittedAt: string
}

export interface StatusResult {
  fillable: boolean
  submitted: boolean
  status: string
  statusMessage: string
}
