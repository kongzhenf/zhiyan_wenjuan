<template>
  <div class="dashboard-page" v-loading="loading">
    <div class="page-header">
      <h1 class="page-title">首页概览</h1>
      <p class="page-subtitle">问卷调查平台数据总览</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <div class="stat-card">
          <span class="stat-label">问卷总数</span>
          <span class="stat-value">{{ stats.total }}</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <span class="stat-label">进行中</span>
          <span class="stat-value">{{ stats.active }}</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <span class="stat-label">总回收量</span>
          <span class="stat-value">{{ stats.totalResponses }}</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <span class="stat-label">今日新增</span>
          <span class="stat-value">{{ stats.todayNew }}</span>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-section">
      <el-col :span="12">
        <div class="chart-card">
          <h3 class="chart-title">回收趋势</h3>
          <v-chart :option="lineChartOption" class="chart" autoresize />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-card">
          <h3 class="chart-title">问卷状态分布</h3>
          <v-chart :option="pieChartOption" class="chart" autoresize />
        </div>
      </el-col>
    </el-row>

    <!-- 最近问卷表格 -->
    <div class="table-section">
      <div class="table-header">
        <h3 class="table-title">最近问卷</h3>
        <router-link to="/questionnaire/list" class="view-all">查看全部</router-link>
      </div>
      <el-table :data="questionnaires" stripe>
        <el-table-column prop="title" label="问卷标题" min-width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="responseCount" label="回收数量" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <router-link :to="`/statistics/overview/${row.id}`" class="action-link">统计</router-link>
            <router-link :to="`/questionnaire/edit/${row.id}`" class="action-link">编辑</router-link>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import dayjs from 'dayjs'
import { getQuestionnairesApi, type QuestionnaireListItem } from '@/api/questionnaire'
import { getStatisticsOverviewApi } from '@/api/statistics'

use([CanvasRenderer, LineChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const loading = ref(false)
const questionnaires = ref<QuestionnaireListItem[]>([])
const trendData = ref<Array<{ date: string; count: number }>>([])
const overviewData = ref<{ totalResponses: number; todayResponses: number }>({ totalResponses: 0, todayResponses: 0 })

const stats = computed(() => {
  const list = questionnaires.value
  const total = list.length
  const active = list.filter(q => q.status === 'active').length
  return {
    total,
    active,
    totalResponses: overviewData.value.totalResponses || list.reduce((sum, q) => sum + q.responseCount, 0),
    todayNew: overviewData.value.todayResponses
  }
})

const lineChartOption = computed(() => {
  const dates = trendData.value.map(t => t.date.substring(5))
  const counts = trendData.value.map(t => t.count)
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: dates, boundaryGap: false },
    yAxis: { type: 'value' },
    series: [{
      name: '回收量',
      type: 'line',
      smooth: true,
      data: counts,
      areaStyle: { opacity: 0.15 },
      itemStyle: { color: '#2563eb' }
    }]
  }
})

const pieChartOption = computed(() => {
  const list = questionnaires.value
  const draftCount = list.filter(q => q.status === 'draft').length
  const activeCount = list.filter(q => q.status === 'active').length
  const closedCount = list.filter(q => q.status === 'closed').length
  return {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: [
        { value: draftCount, name: '草稿', itemStyle: { color: '#94a3b8' } },
        { value: activeCount, name: '进行中', itemStyle: { color: '#059669' } },
        { value: closedCount, name: '已关闭', itemStyle: { color: '#64748b' } }
      ]
    }]
  }
})

function statusTagType(status: string): '' | 'success' | 'info' {
  if (status === 'active') return 'success'
  if (status === 'closed') return 'info'
  return ''
}

function statusLabel(status: string): string {
  const map: Record<string, string> = { draft: '草稿', active: '进行中', closed: '已关闭' }
  return map[status] || status
}

function formatDate(dateStr: string): string {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

async function fetchData() {
  loading.value = true
  try {
    const res = await getQuestionnairesApi({ page: 1, pageSize: 5 })
    questionnaires.value = res.result.list

    const activeQuestionnaire = res.result.list.find(q => q.status === 'active')
    if (activeQuestionnaire) {
      try {
        const statsRes = await getStatisticsOverviewApi(activeQuestionnaire.id)
        overviewData.value = {
          totalResponses: statsRes.result.totalResponses,
          todayResponses: statsRes.result.todayResponses
        }
        trendData.value = statsRes.result.trend
      } catch {
        trendData.value = []
      }
    }
  } catch (err: any) {
    ElMessage.error(err.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => { fetchData() })
</script>

<style scoped lang="scss">
.dashboard-page {
  padding: var(--content-padding);
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.page-subtitle {
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  margin: 0;
}

.stat-cards {
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.stat-trend {
  font-size: var(--font-size-xs);
  &.up {
    color: var(--color-success);
  }
  &.down {
    color: var(--color-danger);
  }
}

.chart-section {
  margin-bottom: var(--spacing-xl);
}

.chart-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

.chart-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-lg) 0;
}

.chart {
  width: 100%;
  height: 300px;
}

.table-section {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.table-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.view-all {
  font-size: var(--font-size-sm);
  color: var(--color-text-link);
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}

.action-link {
  font-size: var(--font-size-sm);
  color: var(--color-text-link);
  text-decoration: none;
  margin-right: var(--spacing-md);
  &:hover {
    text-decoration: underline;
  }
}
</style>
