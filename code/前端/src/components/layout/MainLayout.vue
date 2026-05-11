<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-left">
        <span class="header-logo">📋 问卷平台</span>
      </div>
      <div class="header-right">
        <div class="header-user">
          <el-avatar :size="32" style="background: var(--color-primary-light); color: var(--color-primary);">
            {{ username.charAt(0).toUpperCase() }}
          </el-avatar>
          <span>{{ username }}</span>
        </div>
        <el-button text @click="handleLogout">退出登录</el-button>
      </div>
    </header>

    <aside class="app-sidebar">
      <el-menu
        :default-active="activeMenu"
        background-color="#1e293b"
        text-color="rgba(255,255,255,0.7)"
        active-text-color="#ffffff"
        :router="true"
      >
        <el-menu-item-group title="概览">
          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>首页概览</span>
          </el-menu-item>
        </el-menu-item-group>
        <el-menu-item-group title="问卷管理">
          <el-menu-item index="/questionnaire/list">
            <el-icon><Document /></el-icon>
            <span>问卷列表</span>
          </el-menu-item>
          <el-menu-item index="/questionnaire/edit">
            <el-icon><EditPen /></el-icon>
            <span>创建问卷</span>
          </el-menu-item>
        </el-menu-item-group>
        <el-menu-item-group title="数据统计">
          <el-menu-item index="/statistics/overview/latest">
            <el-icon><DataAnalysis /></el-icon>
            <span>统计概览</span>
          </el-menu-item>
          <el-menu-item index="/statistics/detail/latest">
            <el-icon><PieChart /></el-icon>
            <span>逐题统计</span>
          </el-menu-item>
          <el-menu-item index="/statistics/export">
            <el-icon><Download /></el-icon>
            <span>数据导出</span>
          </el-menu-item>
        </el-menu-item-group>
      </el-menu>
    </aside>

    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { logoutApi } from '@/api/auth'
import { ElMessage } from 'element-plus'
import { Odometer, Document, EditPen, Download, DataAnalysis, PieChart } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const username = computed(() => authStore.username || 'admin')
const activeMenu = computed(() => route.path)

async function handleLogout() {
  try {
    await logoutApi()
  } catch {
    // ignore logout error
  }
  authStore.clearAuth()
  router.push('/login')
  ElMessage.success('已退出登录')
}
</script>

<style scoped lang="scss">
.app-container {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}

.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background: var(--color-bg-header);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--content-padding);
  z-index: 100;
  box-shadow: var(--shadow-sm);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.header-logo {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  letter-spacing: -0.5px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.header-user {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.app-sidebar {
  position: fixed;
  top: var(--header-height);
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: var(--color-bg-sidebar);
  overflow-y: auto;
  z-index: 90;
  padding-top: var(--spacing-lg);

  :deep(.el-menu) {
    border-right: none;
  }

  :deep(.el-menu-item-group__title) {
    padding: 8px 20px;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  :deep(.el-menu-item) {
    height: 42px;
    line-height: 42px;
    margin: 2px 0;

    &.is-active {
      background: rgba(37, 99, 235, 0.2) !important;
      border-left: 3px solid var(--color-primary);
    }
  }
}

.app-main {
  margin-left: var(--sidebar-width);
  margin-top: var(--header-height);
  padding: var(--content-padding);
  min-height: calc(100vh - var(--header-height));
  background: var(--color-bg-page);
}
</style>
