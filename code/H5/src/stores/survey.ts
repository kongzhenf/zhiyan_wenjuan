import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { get, post } from '@/utils/request'
import { getDeviceId } from '@/utils/fingerprint'
import type { Questionnaire, Question, AnswerItem, SubmitResult, StatusResult, ApiResponse } from '@/types'

export type PageState = 'loading' | 'form' | 'success' | 'closed' | 'not-found' | 'submitted' | 'limit-reached'

export const useSurveyStore = defineStore('survey', () => {
  const pageState = ref<PageState>('loading')
  const questionnaire = ref<Questionnaire | null>(null)
  const answers = ref<Map<string, AnswerItem>>(new Map())
  const errors = ref<Map<string, string>>(new Map())
  const submitting = ref(false)
  const startTime = ref(Date.now())
  const statusMessage = ref('')

  const questions = computed<Question[]>(() => {
    return questionnaire.value?.questions || []
  })

  const answeredCount = computed(() => {
    let count = 0
    for (const q of questions.value) {
      const ans = answers.value.get(q.questionId)
      if (ans && hasValue(ans.value)) {
        count++
      }
    }
    return count
  })

  const progress = computed(() => {
    const total = questions.value.length
    if (total === 0) return 0
    return Math.round((answeredCount.value / total) * 100)
  })

  function hasValue(value: string | string[] | number | undefined | null): boolean {
    if (value === undefined || value === null) return false
    if (typeof value === 'string') return value.trim().length > 0
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'number') return value > 0
    return false
  }

  async function fetchQuestionnaire(linkId: string) {
    pageState.value = 'loading'
    startTime.value = Date.now()

    const deviceId = getDeviceId()

    try {
      const statusRes = await get<StatusResult>(`/fill/${linkId}/status`, { deviceId })

      if (!statusRes.success && statusRes.code === 4040) {
        pageState.value = 'not-found'
        return
      }

      if (statusRes.success && statusRes.result) {
        const st = statusRes.result
        if (st.submitted) {
          pageState.value = 'submitted'
          statusMessage.value = st.statusMessage || '您已填写过本问卷'
          return
        }
        if (!st.fillable) {
          if (st.status === 'closed') {
            pageState.value = 'closed'
            statusMessage.value = st.statusMessage || '本问卷已结束，感谢关注'
          } else {
            pageState.value = 'closed'
            statusMessage.value = st.statusMessage || '问卷暂不可填写'
          }
          return
        }
      }

      const res = await get<Questionnaire>(`/fill/${linkId}`)

      if (!res.success) {
        if (res.code === 4040) {
          pageState.value = 'not-found'
        } else if (res.code === 4031) {
          pageState.value = 'closed'
          statusMessage.value = res.message || '本问卷已结束'
        } else if (res.code === 4032) {
          pageState.value = 'closed'
          statusMessage.value = res.message || '问卷暂不可填写'
        }
        return
      }

      if (res.result) {
        questionnaire.value = res.result
        pageState.value = 'form'
      }
    } catch {
      pageState.value = 'not-found'
    }
  }

  function setAnswer(questionId: string, type: string, value: string | string[] | number) {
    answers.value.set(questionId, { questionId, type, value })
    errors.value.delete(questionId)
  }

  function validate(): boolean {
    errors.value.clear()
    let valid = true

    for (const q of questions.value) {
      if (!q.required) continue
      const ans = answers.value.get(q.questionId)
      if (!ans || !hasValue(ans.value)) {
        errors.value.set(q.questionId, '此题为必填项')
        valid = false
      } else if (q.type === 'checkbox' && Array.isArray(ans.value)) {
        const min = q.minSelect || 1
        if (ans.value.length < min) {
          errors.value.set(q.questionId, `至少选择${min}项`)
          valid = false
        }
        const max = q.maxSelect
        if (max && ans.value.length > max) {
          errors.value.set(q.questionId, `最多选择${max}项`)
          valid = false
        }
      }
    }

    return valid
  }

  async function submitSurvey(linkId: string): Promise<boolean> {
    if (!validate()) return false

    submitting.value = true
    const deviceId = getDeviceId()
    const duration = Math.round((Date.now() - startTime.value) / 1000)

    const payload = {
      deviceId,
      answers: Array.from(answers.value.values()),
      submitTime: new Date().toISOString(),
      duration
    }

    try {
      const res = await post<SubmitResult>(`/fill/${linkId}/submit`, payload)

      if (res.success) {
        pageState.value = 'success'
        return true
      }

      if (res.code === 4091) {
        pageState.value = 'submitted'
        statusMessage.value = res.message || '您已填写过本问卷'
        return false
      }

      if (res.code === 4031) {
        pageState.value = 'closed'
        statusMessage.value = res.message || '问卷已结束'
        return false
      }

      if (res.code === 4032) {
        pageState.value = 'limit-reached'
        statusMessage.value = res.message || '问卷已达回收上限'
        return false
      }

      if (res.code === 4001 && res.result) {
        const result = res.result as unknown as { errors: Array<{ questionId: string; message: string }> }
        if (result.errors) {
          for (const err of result.errors) {
            errors.value.set(err.questionId, err.message)
          }
        }
        return false
      }

      return false
    } catch {
      return false
    } finally {
      submitting.value = false
    }
  }

  return {
    pageState,
    questionnaire,
    questions,
    answers,
    errors,
    submitting,
    answeredCount,
    progress,
    statusMessage,
    fetchQuestionnaire,
    setAnswer,
    validate,
    submitSurvey
  }
})
