<template>
  <div class="dropdown-question">
    <div
      class="dropdown-trigger"
      :class="{ 'dropdown-trigger--active': !!selectedLabel }"
      @click="showPicker = true"
    >
      <span :class="['dropdown-text', { 'dropdown-placeholder': !selectedLabel }]">
        {{ selectedLabel || '请选择' }}
      </span>
      <svg class="dropdown-arrow" viewBox="0 0 16 16" fill="none">
        <path
          d="M4 6l4 4 4-4"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>

    <van-action-sheet v-model:show="showPicker" title="请选择">
      <div class="dropdown-options">
        <div
          v-for="option in question.options"
          :key="option.optionId"
          :class="['dropdown-option-item', { 'dropdown-option-item--selected': modelValue === option.optionId }]"
          @click="selectOption(option.optionId)"
        >
          <span class="dropdown-option-text">{{ option.content }}</span>
          <svg
            v-if="modelValue === option.optionId"
            class="dropdown-option-check"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M3 8l4 4 6-8"
              stroke="var(--color-primary)"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>
    </van-action-sheet>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ActionSheet as VanActionSheet } from 'vant'
import type { Question } from '@/types'

const props = defineProps<{
  question: Question
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const showPicker = ref(false)

const selectedLabel = computed(() => {
  if (!props.modelValue || !props.question.options) return ''
  const found = props.question.options.find(o => o.optionId === props.modelValue)
  return found ? found.content : ''
})

function selectOption(optionId: string) {
  emit('update:modelValue', optionId)
  showPicker.value = false
}
</script>

<style scoped>
.dropdown-question {
  width: 100%;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 var(--spacing-lg);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-input);
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-out);
  -webkit-tap-highlight-color: transparent;
}

.dropdown-trigger:active {
  transform: scale(0.98);
}

.dropdown-trigger--active {
  border-color: var(--color-primary);
}

.dropdown-text {
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-placeholder {
  color: var(--color-text-hint);
}

.dropdown-arrow {
  width: 16px;
  height: 16px;
  color: var(--color-text-hint);
  flex-shrink: 0;
  margin-left: var(--spacing-sm);
}

.dropdown-options {
  padding: var(--spacing-sm) 0;
  padding-bottom: env(safe-area-inset-bottom, 0);
  max-height: 50vh;
  overflow-y: auto;
}

.dropdown-option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out);
  -webkit-tap-highlight-color: transparent;
}

.dropdown-option-item:active {
  background: var(--color-bg-input);
}

.dropdown-option-item--selected {
  background: rgba(61, 90, 254, 0.04);
}

.dropdown-option-text {
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  line-height: var(--line-height-normal);
}

.dropdown-option-item--selected .dropdown-option-text {
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

.dropdown-option-check {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
</style>
