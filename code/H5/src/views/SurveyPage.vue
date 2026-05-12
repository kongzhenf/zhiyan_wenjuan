<template>
  <div class="survey-page">
    <!-- Loading state -->
    <SkeletonLoading v-if="store.pageState === 'loading'" />

    <!-- Status pages (non-form states) -->
    <StatusPage
      v-else-if="isStatusPage"
      :type="statusType"
      :message="store.statusMessage || defaultStatusMessage"
    />

    <!-- Form state -->
    <template v-else-if="store.pageState === 'form'">
      <!-- Fixed Header -->
      <header class="survey-header">
        <h1 class="survey-header-title">{{ store.questionnaire?.title }}</h1>
      </header>

      <!-- Progress Bar -->
      <div class="survey-progress-wrapper">
        <div class="survey-progress">
          <div class="survey-progress-bar" :style="{ width: store.progress + '%' }"></div>
        </div>
        <span class="survey-progress-text">{{ store.progress }}%</span>
      </div>

      <!-- Question List -->
      <main class="survey-content">
        <!-- Description -->
        <p v-if="store.questionnaire?.description" class="survey-description">
          {{ store.questionnaire.description }}
        </p>

        <QuestionCard
          v-for="(question, idx) in store.questions"
          :key="question.questionId"
          :question="question"
          :index="idx"
          :error="store.errors.get(question.questionId) || ''"
        />
      </main>

      <!-- Fixed Footer -->
      <footer class="survey-footer">
        <button
          class="survey-submit-btn"
          :class="{ 'survey-submit-btn--loading': store.submitting }"
          :disabled="store.submitting"
          @click="handleSubmit"
        >
          <span v-if="store.submitting" class="submit-loading">
            <span class="submit-spinner"></span>
            提交中...
          </span>
          <span v-else>提交问卷</span>
        </button>
      </footer>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'
import { useSurveyStore } from '@/stores/survey'
import SkeletonLoading from '@/components/SkeletonLoading.vue'
import StatusPage from '@/components/StatusPage.vue'
import QuestionCard from '@/components/QuestionCard.vue'

const route = useRoute()
const store = useSurveyStore()

const linkId = computed(() => route.params.id as string)

const statusPages = ['success', 'closed', 'not-found', 'submitted', 'limit-reached'] as const

const isStatusPage = computed(() =>
  statusPages.includes(store.pageState as typeof statusPages[number])
)

const statusType = computed(() =>
  store.pageState as 'success' | 'closed' | 'not-found' | 'submitted' | 'limit-reached'
)

const defaultStatusMessage = computed(() => {
  const map: Record<string, string> = {
    success: '感谢您的参与！您的反馈对我们非常重要。',
    closed: '本问卷已停止收集，感谢您的关注。',
    'not-found': '请检查访问链接是否正确，或联系问卷发布者获取最新链接。',
    submitted: '每台设备仅可提交一次，感谢您的参与。',
    'limit-reached': '本问卷已达回收上限，感谢关注'
  }
  return map[store.pageState] || ''
})

onMounted(() => {
  if (linkId.value) {
    store.fetchQuestionnaire(linkId.value)
  }
})

async function handleSubmit() {
  if (store.submitting) return

  const success = await store.submitSurvey(linkId.value)

  if (!success && store.errors.size > 0) {
    // 滚动到第一个错误题目
    await nextTick()
    scrollToFirstError()
    showToast('请完善必填项')
  }
}

function scrollToFirstError() {
  for (const question of store.questions) {
    if (store.errors.has(question.questionId)) {
      const el = document.getElementById(`question-${question.questionId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      break
    }
  }
}
</script>

<style scoped>
.survey-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-page);
}

/* Header */
.survey-header {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--content-max-width);
  height: var(--header-height);
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--content-padding);
  z-index: 100;
}

.survey-header-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  text-align: center;
}

/* Progress */
.survey-progress-wrapper {
  position: fixed;
  top: var(--header-height);
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--content-max-width);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--content-padding);
  background: var(--color-bg-card);
  z-index: 99;
}

.survey-progress {
  flex: 1;
  height: 6px;
  background: var(--color-bg-input);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.survey-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  border-radius: var(--radius-full);
  transition: width var(--duration-normal) var(--ease-out);
  min-width: 0;
}

.survey-progress-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-hint);
  font-weight: var(--font-weight-medium);
  flex-shrink: 0;
  min-width: 32px;
  text-align: right;
}

/* Content */
.survey-content {
  flex: 1;
  padding: var(--content-padding);
  padding-top: calc(var(--header-height) + 30px + var(--spacing-md));
  padding-bottom: calc(var(--footer-height) + var(--spacing-lg));
}

.survey-description {
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  background: rgba(61, 90, 254, 0.04);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-primary);
}

/* Footer */
.survey-footer {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--content-max-width);
  height: var(--footer-height);
  background: var(--color-bg-card);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  padding: 0 var(--content-padding);
  padding-bottom: env(safe-area-inset-bottom, 0);
  z-index: 100;
}

.survey-submit-btn {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: var(--color-text-inverse);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  -webkit-tap-highlight-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.survey-submit-btn:active:not(:disabled) {
  transform: scale(0.98);
  opacity: 0.9;
}

.survey-submit-btn--loading {
  opacity: 0.7;
  cursor: not-allowed;
}

.submit-loading {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.submit-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
