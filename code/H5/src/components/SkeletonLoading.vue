<template>
  <div class="skeleton-container">
    <!-- Header skeleton -->
    <div class="skeleton-header">
      <div class="skeleton-line skeleton-title"></div>
    </div>
    <!-- Progress bar skeleton -->
    <div class="skeleton-progress">
      <div class="skeleton-line skeleton-progress-bar"></div>
    </div>
    <!-- Question card skeletons -->
    <div v-for="i in 4" :key="i" class="skeleton-card">
      <div class="skeleton-card-header">
        <div class="skeleton-line skeleton-badge"></div>
        <div class="skeleton-line skeleton-question-title"></div>
      </div>
      <div class="skeleton-options">
        <div
          v-for="j in (i % 2 === 0 ? 3 : 4)"
          :key="j"
          class="skeleton-line skeleton-option"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// SkeletonLoading - 骨架屏组件
// 纯展示组件，无需 props 或逻辑
</script>

<style scoped>
.skeleton-container {
  padding: var(--content-padding);
  padding-top: calc(var(--header-height) + var(--spacing-lg));
  padding-bottom: calc(var(--footer-height) + var(--spacing-lg));
}

.skeleton-header {
  margin-bottom: var(--spacing-lg);
}

.skeleton-progress {
  margin-bottom: var(--spacing-xl);
}

.skeleton-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl) var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

.skeleton-card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.skeleton-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.skeleton-line {
  background: linear-gradient(
    90deg,
    var(--color-bg-input) 25%,
    #eef1f6 37%,
    var(--color-bg-input) 63%
  );
  background-size: 400% 100%;
  animation: skeleton-shimmer 1.4s ease infinite;
  border-radius: var(--radius-sm);
}

.skeleton-title {
  width: 60%;
  height: 20px;
}

.skeleton-progress-bar {
  width: 100%;
  height: 6px;
  border-radius: var(--radius-full);
}

.skeleton-badge {
  width: 28px;
  height: 20px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.skeleton-question-title {
  width: 75%;
  height: 18px;
}

.skeleton-option {
  width: 100%;
  height: 48px;
  border-radius: var(--radius-md);
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}
</style>
