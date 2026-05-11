<template>
  <div
    :id="`question-${question.questionId}`"
    :class="['question-card', { 'question-card--error': !!error, 'question-card--shake': shaking }]"
  >
    <div class="question-header">
      <span class="question-index">{{ index + 1 }}.</span>
      <h3 class="question-title">
        <span v-if="question.required" class="question-required">*</span>
        {{ question.title }}
      </h3>
    </div>

    <div class="question-body">
      <RadioQuestion
        v-if="question.type === 'radio'"
        :question="question"
        :model-value="stringValue"
        @update:model-value="onStringChange"
      />
      <CheckboxQuestion
        v-else-if="question.type === 'checkbox'"
        :question="question"
        :model-value="arrayValue"
        @update:model-value="onArrayChange"
      />
      <InputQuestion
        v-else-if="question.type === 'input'"
        :question="question"
        :model-value="stringValue"
        @update:model-value="onStringChange"
      />
      <RatingQuestion
        v-else-if="question.type === 'rating'"
        :question="question"
        :model-value="numberValue"
        @update:model-value="onNumberChange"
      />
      <DropdownQuestion
        v-else-if="question.type === 'dropdown'"
        :question="question"
        :model-value="stringValue"
        @update:model-value="onStringChange"
      />
    </div>

    <p v-if="error" class="question-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Question } from '@/types'
import { useSurveyStore } from '@/stores/survey'
import RadioQuestion from './RadioQuestion.vue'
import CheckboxQuestion from './CheckboxQuestion.vue'
import InputQuestion from './InputQuestion.vue'
import RatingQuestion from './RatingQuestion.vue'
import DropdownQuestion from './DropdownQuestion.vue'

const props = defineProps<{
  question: Question
  index: number
  error: string
}>()

const store = useSurveyStore()
const shaking = ref(false)

// 从 store.answers 读取当前值
const currentAnswer = computed(() => store.answers.get(props.question.questionId))

const stringValue = computed(() => {
  const val = currentAnswer.value?.value
  return typeof val === 'string' ? val : ''
})

const arrayValue = computed(() => {
  const val = currentAnswer.value?.value
  return Array.isArray(val) ? val : []
})

const numberValue = computed(() => {
  const val = currentAnswer.value?.value
  return typeof val === 'number' ? val : 0
})

function onStringChange(value: string) {
  store.setAnswer(props.question.questionId, props.question.type, value)
}

function onArrayChange(value: string[]) {
  store.setAnswer(props.question.questionId, props.question.type, value)
}

function onNumberChange(value: number) {
  store.setAnswer(props.question.questionId, props.question.type, value)
}

// 当 error 变为有值时触发 shake 动画
watch(() => props.error, (newErr) => {
  if (newErr) {
    shaking.value = true
    setTimeout(() => {
      shaking.value = false
    }, 500)
  }
})
</script>

<style scoped>
.question-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl) var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  border: 1.5px solid transparent;
  transition: border-color var(--duration-normal) var(--ease-out);
}

.question-card--error {
  border-color: var(--color-border-error);
}

.question-card--shake {
  animation: shake 0.4s var(--ease-out);
}

.question-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.question-index {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  min-width: 24px;
  flex-shrink: 0;
  margin-top: 1px;
}

.question-title {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  line-height: var(--line-height-normal);
  word-break: break-word;
}

.question-required {
  color: var(--color-text-danger);
  margin-right: 2px;
}

.question-body {
  width: 100%;
}

.question-error {
  margin-top: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-danger);
  line-height: var(--line-height-normal);
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 50%, 90% {
    transform: translateX(-4px);
  }
  30%, 70% {
    transform: translateX(4px);
  }
}
</style>
