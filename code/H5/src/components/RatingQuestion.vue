<template>
  <div class="rating-question">
    <div class="rating-stars">
      <button
        v-for="star in maxStars"
        :key="star"
        class="rating-star"
        :class="{ 'rating-star--active': star <= (modelValue || 0) }"
        type="button"
        @click="selectRating(star)"
      >
        <svg viewBox="0 0 24 24" class="star-icon">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            :fill="star <= (modelValue || 0) ? 'var(--color-warning)' : 'none'"
            :stroke="star <= (modelValue || 0) ? 'var(--color-warning)' : 'var(--color-border)'"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
    <span v-if="modelValue" class="rating-value">{{ modelValue }}/{{ maxStars }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Question } from '@/types'

const props = defineProps<{
  question: Question
  modelValue: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const maxStars = computed(() => props.question.maxRating || 5)

function selectRating(value: number) {
  emit('update:modelValue', value)
}
</script>

<style scoped>
.rating-question {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.rating-stars {
  display: flex;
  gap: var(--spacing-sm);
}

.rating-star {
  padding: var(--spacing-xs);
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-out);
  -webkit-tap-highlight-color: transparent;
  background: none;
  border: none;
}

.rating-star:active {
  transform: scale(0.85);
}

.rating-star--active .star-icon {
  animation: star-pop 0.3s var(--ease-out);
}

.star-icon {
  width: 32px;
  height: 32px;
  display: block;
}

.rating-value {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

@keyframes star-pop {
  0% {
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}
</style>
