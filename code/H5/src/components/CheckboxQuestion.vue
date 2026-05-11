<template>
  <div class="checkbox-question">
    <div
      v-for="option in question.options"
      :key="option.optionId"
      :class="['checkbox-option', { 'checkbox-option--selected': isSelected(option.optionId) }]"
      @click="toggleOption(option.optionId)"
    >
      <div class="checkbox-indicator">
        <svg
          v-if="isSelected(option.optionId)"
          class="checkbox-check"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M3.5 8.5L6.5 11.5L12.5 4.5"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <span class="checkbox-label">{{ option.content }}</span>
    </div>
    <p v-if="limitHint" class="checkbox-hint">{{ limitHint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Question } from '@/types'

const props = defineProps<{
  question: Question
  modelValue: string[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const limitHint = computed(() => {
  const parts: string[] = []
  if (props.question.minSelect) {
    parts.push(`至少选${props.question.minSelect}项`)
  }
  if (props.question.maxSelect) {
    parts.push(`最多选${props.question.maxSelect}项`)
  }
  return parts.join('，')
})

function isSelected(optionId: string): boolean {
  return props.modelValue.includes(optionId)
}

function toggleOption(optionId: string) {
  const current = [...props.modelValue]
  const idx = current.indexOf(optionId)
  if (idx > -1) {
    current.splice(idx, 1)
  } else {
    const max = props.question.maxSelect
    if (max && current.length >= max) {
      return
    }
    current.push(optionId)
  }
  emit('update:modelValue', current)
}
</script>

<style scoped>
.checkbox-question {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.checkbox-option:active {
  transform: scale(0.98);
}

.checkbox-option--selected {
  border-color: var(--color-primary);
  background: rgba(61, 90, 254, 0.04);
}

.checkbox-indicator {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--duration-fast) var(--ease-out);
}

.checkbox-option--selected .checkbox-indicator {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.checkbox-check {
  width: 14px;
  height: 14px;
  animation: check-pop 0.2s var(--ease-out);
}

.checkbox-label {
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  line-height: var(--line-height-normal);
  word-break: break-word;
}

.checkbox-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-hint);
  margin-top: var(--spacing-xs);
}

@keyframes check-pop {
  0% {
    transform: scale(0);
  }
  60% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style>
