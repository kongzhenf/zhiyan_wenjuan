<template>
  <div class="radio-question">
    <div
      v-for="option in question.options"
      :key="option.optionId"
      :class="['radio-option', { 'radio-option--selected': modelValue === option.optionId }]"
      @click="selectOption(option.optionId)"
    >
      <div class="radio-indicator">
        <div v-if="modelValue === option.optionId" class="radio-indicator-dot"></div>
      </div>
      <span class="radio-label">{{ option.content }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Question } from '@/types'

defineProps<{
  question: Question
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

function selectOption(optionId: string) {
  emit('update:modelValue', optionId)
}
</script>

<style scoped>
.radio-question {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.radio-option {
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

.radio-option:active {
  transform: scale(0.98);
}

.radio-option--selected {
  border-color: var(--color-primary);
  background: rgba(61, 90, 254, 0.04);
}

.radio-indicator {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color var(--duration-fast) var(--ease-out);
}

.radio-option--selected .radio-indicator {
  border-color: var(--color-primary);
}

.radio-indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: radio-pop 0.2s var(--ease-out);
}

.radio-label {
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  line-height: var(--line-height-normal);
  word-break: break-word;
}

@keyframes radio-pop {
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
