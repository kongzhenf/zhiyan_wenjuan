<template>
  <div class="statistics-overview-page" v-loading="loading">
    <!-- 面包屑 -->
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>数据统计</el-breadcrumb-item>
      <el-breadcrumb-item>统计概览</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h1 class="page-title">数据统计</h1>
        <p class="page-subtitle">当前问卷：{{ currentQuestionnaireName }}</p>
      </div>
      <div class="toolbar-right">
        <el-select
          v-model="questionnaireId"
          placeholder="选择问卷"
          style="width: 280px"
          @change="handleQuestionnaireChange"
        >
          <el-option
            v-for="item in questionnaireList"
            :key="item.id"
            :label="item.title"
            :value="item.id"
          />
        </el-select>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <div class="stat-card">
          <span class="stat-label">总回收量</span>
          <span class="stat-value">{{ overview.totalResponses.toLocaleString() }}</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <span class="stat-label">今日新增</span>
          <span class="stat-value">{{ overview.todayResponses }}</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <span class="stat-label">有效回收率</span>
          <span class="stat-value">{{ overview.responseRate }}%</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <span class="stat-label">平均完成时长</span>
          <span class="stat-value">{{ formatDuration(overview.totalVisits) }}</span>
        </div>
      </el-col>
    </el-row>

    <!-- 时间筛选工具栏 -->
    <div class="filter-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button-group>
            <el-button
              :type="activeRange === '7d' ? 'primary' : 'default'"
              size="small"
              @click="setRange('7d')"
            >近7天</el-button>
            <el-button
              :type="activeRange === '30d' ? 'primary' : 'default'"
              size="small"
              @click="setRange('30d')"
            >近30天</el-button>
            <el-button
              :type="activeRange === 'all' ? 'primary' : 'default'"
              size="small"
              @click="setRange('all')"
            >全部</el-button>
          </el-button-group>
        </div>
        <div class="toolbar-right">
          <el-date-picker
            v-model="startDate"
            type="date"
            placeholder="开始日期"
            value-format="YYYY-MM-DD"
            style="width: 150px"
          />
          <span class="date-separator">~</span>
          <el-date-picker
            v-model="endDate"
            type="date"
            placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 150px"
          />
          <el-button type="primary" size="small" @click="handleQuery">查询</el-button>
        </div>
      </div>
    </div>

    <!-- 折线图 -->
    <div class="chart-card">
      <h3 class="chart-title">每日回收数量趋势</h3>
      <v-chart :option="lineChartOption" class="chart" autoresize />
    </div>

    <!-- 底部快捷按钮 -->
    <div class="toolbar bottom-actions">
      <div class="toolbar-left">
        <el-button @click="goToDetail">📊 查看逐题统计</el-button>
        <el-button @click="goToExport">⬇️ 导出数据</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { TooltipComponent, GridComponent } from 'echarts/components'
import dayjs from 'dayjs'
import { getStatisticsOverviewApi, type OverviewResult } from '@/api/statistics'
import { getQuestionnairesApi, type QuestionnaireListItem } from '@/api/questionnaire'

use([CanvasRenderer, LineChart, TooltipComponent, GridComponent])

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const questionnaireId = ref('')
const questionnaireList = ref<QuestionnaireListItem[]>([])
const overview = ref<OverviewResult>({
  totalResponses: 0,
  todayResponses: 0,
  totalVisits: 0,
  responseRate: 0,
  trend: []
})

const activeRange = ref<'7d' | '30d' | 'all'>('30d')
const startDate = ref('')
const endDate = ref('')

const currentQuestionnaireName = computed(() => {
  const item = questionnaireList.value.find(q => q.id === questionnaireId.value)
  return item?.title || '未选择'
})

const lineChartOption = computed(() => {
  const trend = overview.value.trend
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trend.map(item => item.date)
    },
    yAxis: { type: 'value' },
    series: [{
      name: '回收数量',
      type: 'line',
      smooth: true,
      data: trend.map(item => item.count),
      areaStyle: { opacity: 0.15 },
      itemStyle: { color: '#2563eb' }
    }]
  }
})

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0秒'
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  if (min > 0) return `${min}分${sec}秒`
  return `${sec}秒`
}

function setRange(range: '7d' | '30d' | 'all') {
  activeRange.value = range
  if (range === '7d') {
    startDate.value = dayjs().subtract(7, 'day').format('YYYY-MM-DD')
    endDate.value = dayjs().format('YYYY-MM-DD')
  } else if (range === '30d') {
    startDate.value = dayjs().subtract(30, 'day').format('YYYY-MM-DD')
    endDate.value = dayjs().format('YYYY-MM-DD')
  } else {
    startDate.value = ''
    endDate.value = ''
  }
  fetchOverview()
}

function handleQuery() {
  activeRange.value = 'all'
  fetchOverview()
}

function handleQuestionnaireChange() {
  router.replace({ params: { id: questionnaireId.value } })
  fetchOverview()
}

function goToDetail() {
  router.push(`/statistics/detail/${questionnaireId.value}`)
}

function goToExport() {
  router.push('/statistics/export')
}

async function fetchQuestionnaireList() {
  try {
    const res = await getQuestionnairesApi({ pageSize: 100 })
    questionnaireList.value = res.result.list
  } catch (err: any) {
    ElMessage.error(err.message || '获取问卷列表失败')
  }
}

async function fetchOverview() {
  if (!questionnaireId.value) return
  loading.value = true
  try {
    const params: { startDate?: string; endDate?: string } = {}
    if (startDate.value) params.startDate = startDate.value
    if (endDate.value) params.endDate = endDate.value
    const res = await getStatisticsOverviewApi(questionnaireId.value, params)
    overview.value = res.result
  } catch (err: any) {
    ElMessage.error(err.message || '获取统计数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchQuestionnaireList()
  const idFromRoute = route.params.id as string
  if (idFromRoute) {
    questionnaireId.value = idFromRoute
  } else if (questionnaireList.value.length > 0) {
    questionnaireId.value = questionnaireList.value[0].id
  }
  setRange('30d')
})
</script>

<style scoped lang="scss">
.statistics-overview-page {
  padding: var(--content-padding);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
}

.toolbar-left {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  margin: 0;
}

.stat-cards {
  margin-bottom: var(--spacing-2xl);
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

.filter-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg) var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-2xl);

  .toolbar {
    margin-bottom: 0;
  }

  .toolbar-left {
    flex-direction: row;
    align-items: center;
  }
}

.date-separator {
  color: var(--color-text-tertiary);
}

.chart-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-2xl);
}

.chart-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-lg) 0;
}

.chart {
  width: 100%;
  height: 350px;
}

.bottom-actions {
  .toolbar-left {
    flex-direction: row;
    align-items: center;
    gap: var(--spacing-md);
  }
}
</style>
