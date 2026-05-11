<template>
  <div class="input-question">
    <div v-if="isTextarea" class="textarea-wrapper">
      <textarea
        class="input-textarea"
        :value="modelValue"
        :placeholder="placeholderText"
        :maxlength="maxLen"
        rows="4"
        @input="onInput"
      ></textarea>
      <span class="char-count">{{ charCount }}/{{ maxLen }}</span>
    </div>
    <input
      v-else
      class="input-text"
      type="text"
      :value="modelValue"
      :placeholder="placeholderText"
      :maxlength="maxLen"
      @input="onInput"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Question } from '@/types'

const props = defineProps<{
  question: Question
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const isTextarea = computed(() => props.question.inputType === 'textarea')

const maxLen = computed(() => props.question.maxLength || 500)

const placeholderText = computed(() =>
  isTextarea.value ? '请输入您的回答...' : '请输入'
)

const charCount = computed(() => (props.modelValue || '').length)

function onInput(e: Event) {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>

<style scoped>
.input-question {
  width: 100%;
}

.input-text {
  width: 100%;
  height: 48px;
  padding: 0 var(--spacing-lg);
  background: var(--color-bg-input);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  transition: border-color var(--duration-fast) var(--ease-out);
}

.input-text:focus {
  border-color: var(--color-primary);
  background: var(--color-bg-card);
}

.input-text::placeholder {
  color: var(--color-text-hint);
}

.textarea-wrapper {
  position: relative;
}

.input-textarea {
  width: 100%;
  min-height: 120px;
  padding: var(--spacing-md) var(--spacing-lg);
  padding-bottom: var(--spacing-2xl);
  background: var(--color-bg-input);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  resize: vertical;
  line-height: var(--line-height-relaxed);
  transition: border-color var(--duration-fast) var(--ease-out);
}

.input-textarea:focus {
  border-color: var(--color-primary);
  background: var(--color-bg-card);
}

.input-textarea::placeholder {
  color: var(--color-text-hint);
}

.char-count {
  position: absolute;
  right: var(--spacing-md);
  bottom: var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--color-text-hint);
  pointer-events: none;
}
</style>
