<template>
  <div class="status-page">
    <div class="status-icon-wrapper">
      <div :class="['status-icon', `status-icon--${type}`]">
        <svg v-if="type === 'success'" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="56" fill="#00C853" opacity="0.12" />
          <circle cx="60" cy="60" r="42" fill="#00C853" />
          <path d="M40 60l13 13 27-27" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <svg v-else-if="type === 'closed'" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="56" fill="#97A0B4" opacity="0.12" />
          <circle cx="60" cy="60" r="42" stroke="#97A0B4" stroke-width="3" fill="none" />
          <path d="M60 40v22l14 8" stroke="#97A0B4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <svg v-else-if="type === 'not-found'" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="56" fill="#FFB300" opacity="0.12" />
          <circle cx="60" cy="60" r="42" fill="#FFB300" />
          <text x="60" y="72" text-anchor="middle" fill="white" font-size="44" font-weight="bold" font-family="sans-serif">?</text>
        </svg>
        <svg v-else-if="type === 'submitted'" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="56" fill="#3D5AFE" opacity="0.12" />
          <circle cx="60" cy="60" r="42" fill="#3D5AFE" />
          <rect x="57" y="42" width="6" height="24" rx="3" fill="white" />
          <circle cx="60" cy="78" r="4" fill="white" />
        </svg>
        <svg v-else-if="type === 'limit-reached'" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="56" fill="#F44336" opacity="0.12" />
          <circle cx="60" cy="60" r="42" fill="#F44336" />
          <path d="M44 44l32 32M76 44L44 76" stroke="white" stroke-width="5" stroke-linecap="round" />
        </svg>
      </div>
    </div>
    <h2 class="status-title">{{ titleText }}</h2>
    <p class="status-message">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type: 'success' | 'closed' | 'not-found' | 'submitted' | 'limit-reached'
  message: string
}>()

const titleMap: Record<string, string> = {
  success: '提交成功',
  closed: '问卷已结束',
  'not-found': '问卷不存在',
  submitted: '您已填写过本问卷',
  'limit-reached': '已达回收上限'
}

const titleText = computed(() => titleMap[props.type] || '提示')
</script>

<style scoped>
.status-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--spacing-2xl) var(--content-padding);
  text-align: center;
}

.status-icon-wrapper {
  margin-bottom: var(--spacing-xl);
}

.status-icon {
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: status-bounce 0.5s var(--ease-out);
}

.status-icon svg {
  width: 120px;
  height: 120px;
}

.status-icon--success {
  color: var(--color-success);
}

.status-icon--closed {
  color: var(--color-warning);
}

.status-icon--not-found {
  color: var(--color-text-hint);
}

.status-icon--submitted {
  color: var(--color-primary);
}

.status-icon--limit-reached {
  color: var(--color-danger);
}

.status-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  line-height: var(--line-height-tight);
}

.status-message {
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  max-width: 280px;
}

@keyframes status-bounce {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  60% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
