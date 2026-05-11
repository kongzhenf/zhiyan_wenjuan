<template>
  <div class="statistics-detail-page" v-loading="loading">
    <!-- 面包屑 -->
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>数据统计</el-breadcrumb-item>
      <el-breadcrumb-item>逐题统计</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h1 class="page-title">逐题统计详情</h1>
        <p class="page-subtitle">{{ questionnaireName }}</p>
      </div>
      <div class="toolbar-right">
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
        <el-date-picker
          v-model="startDate"
          type="date"
          placeholder="开始日期"
          value-format="YYYY-MM-DD"
          style="width: 140px"
        />
        <span class="date-separator">~</span>
        <el-date-picker
          v-model="endDate"
          type="date"
          placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 140px"
        />
        <el-button type="primary" size="small" @click="handleQuery">查询</el-button>
      </div>
    </div>

    <!-- 逐题统计内容 -->
    <div v-if="questions.length === 0 && !loading" class="empty-state">
      <el-empty description="暂无统计数据" />
    </div>

    <div
      v-for="(question, index) in questions"
      :key="question.questionId"
      class="question-card"
    >
      <!-- 选择题: radio / checkbox / dropdown -->
      <template v-if="isChoiceType(question.type)">
        <div class="card-header">
          <div class="card-header-left">
            <h3 class="card-title">{{ index + 1 }}. {{ question.title }}</h3>
            <el-tag :type="getTypeTagType(question.type)" size="small">
              {{ getTypeLabel(question.type) }}
            </el-tag>
          </div>
          <div class="card-header-right">
            <el-button-group>
              <el-button
                :type="chartModes[question.questionId] === 'pie' ? 'primary' : 'default'"
                size="small"
                @click="setChartMode(question.questionId, 'pie')"
              >饼图</el-button>
              <el-button
                :type="chartModes[question.questionId] === 'bar' ? 'primary' : 'default'"
                size="small"
                @click="setChartMode(question.questionId, 'bar')"
              >柱状图</el-button>
            </el-button-group>
          </div>
        </div>
        <div class="choice-content">
          <div class="chart-area">
            <v-chart
              :option="getChoiceChartOption(question)"
              class="chart"
              autoresize
            />
          </div>
          <div class="stats-bars">
            <div
              v-for="(stat, sIdx) in question.statistics"
              :key="stat.optionId"
              class="stat-bar-item"
            >
              <div class="stat-bar-header">
                <span class="stat-bar-label">{{ stat.content }}</span>
                <span class="stat-bar-value">{{ stat.count }}人 ({{ stat.percentage }}%)</span>
              </div>
              <div class="stat-bar-track">
                <div
                  class="stat-bar-fill"
                  :style="{ width: stat.percentage + '%', background: getBarColor(sIdx) }"
                />
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 评分题: rating -->
      <template v-else-if="question.type === 'rating'">
        <div class="card-header">
          <div class="card-header-left">
            <h3 class="card-title">{{ index + 1 }}. {{ question.title }}</h3>
            <el-tag type="success" size="small">评分</el-tag>
          </div>
          <div class="card-header-right">
            <el-button-group>
              <el-button
                :type="chartModes[question.questionId] === 'pie' ? 'primary' : 'default'"
                size="small"
                @click="setChartMode(question.questionId, 'pie')"
              >饼图</el-button>
              <el-button
                :type="chartModes[question.questionId] === 'bar' ? 'primary' : 'default'"
                size="small"
                @click="setChartMode(question.questionId, 'bar')"
              >柱状图</el-button>
            </el-button-group>
          </div>
        </div>
        <div class="rating-content">
          <div class="rating-summary">
            <div class="rating-avg">{{ question.averageRating?.toFixed(1) || '0.0' }}</div>
            <div class="rating-max">/ 5 分</div>
            <div class="rating-count">共 {{ question.totalAnswered.toLocaleString() }} 人评分</div>
          </div>
          <div class="rating-chart-area">
            <v-chart
              :option="getRatingChartOption(question)"
              class="chart rating-chart"
              autoresize
            />
          </div>
        </div>
        <div class="rating-bars">
          <div
            v-for="stat in question.statistics"
            :key="stat.optionId"
            class="rating-bar-row"
          >
            <span class="rating-bar-label">{{ stat.content }}</span>
            <div class="stat-bar-track">
              <div
                class="stat-bar-fill"
                :style="{ width: stat.percentage + '%', background: getRatingBarColor(stat.content) }"
              />
            </div>
            <span class="rating-bar-value">{{ stat.count }}人 ({{ stat.percentage }}%)</span>
          </div>
        </div>
      </template>

      <!-- 填空题: input -->
      <template v-else-if="question.type === 'input'">
        <div class="card-header">
          <div class="card-header-left">
            <h3 class="card-title">{{ index + 1 }}. {{ question.title }}</h3>
            <el-tag type="info" size="small">填空</el-tag>
          </div>
        </div>
        <div class="text-answers">
          <el-table
            :data="textAnswersMap[question.questionId]?.items || []"
            stripe
            v-loading="textLoadingMap[question.questionId]"
          >
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="content" label="回答内容" min-width="300" />
            <el-table-column label="提交时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.submittedAt) }}
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="textPageMap[question.questionId]"
              :page-size="20"
              :total="textAnswersMap[question.questionId]?.total || 0"
              layout="total, prev, pager, next"
              @current-change="(page: number) => fetchTextAnswers(question.questionId, page)"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart } from 'echarts/charts'
import { TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import dayjs from 'dayjs'
import {
  getQuestionStatisticsApi,
  getTextAnswersApi,
  type QuestionStatistic,
  type TextAnswerResult
} from '@/api/statistics'
import { getQuestionnaireDetailApi } from '@/api/questionnaire'

use([CanvasRenderer, PieChart, BarChart, TooltipComponent, GridComponent, LegendComponent])

const route = useRoute()
const questionnaireId = ref(route.params.id as string)
const questionnaireName = ref('')
const loading = ref(false)
const questions = ref<QuestionStatistic[]>([])

const activeRange = ref<'7d' | '30d' | 'all'>('30d')
const startDate = ref('')
const endDate = ref('')

const chartModes = reactive<Record<string, 'pie' | 'bar'>>({})
const textAnswersMap = reactive<Record<string, TextAnswerResult>>({})
const textPageMap = reactive<Record<string, number>>({})
const textLoadingMap = reactive<Record<string, boolean>>({})

const COLORS = [
  'var(--color-primary)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-danger)',
  'var(--color-info)',
  'var(--color-text-tertiary)'
]
const COLOR_HEX = ['#2563eb', '#059669', '#d97706', '#dc2626', '#0891b2', '#94a3b8']

function isChoiceType(type: string): boolean {
  return ['radio', 'checkbox', 'dropdown'].includes(type)
}

function getTypeLabel(type: string): string {
  const map: Record<string, string> = {
    radio: '单选',
    checkbox: '多选',
    dropdown: '下拉',
    rating: '评分',
    input: '填空'
  }
  return map[type] || type
}

function getTypeTagType(type: string): '' | 'warning' | 'success' | 'info' {
  const map: Record<string, '' | 'warning' | 'success' | 'info'> = {
    radio: '',
    checkbox: 'warning',
    dropdown: 'info',
    rating: 'success',
    input: 'info'
  }
  return map[type] || ''
}

function getBarColor(index: number): string {
  return COLORS[index % COLORS.length]
}

function getRatingBarColor(label: string): string {
  if (label.includes('5')) return 'var(--color-success)'
  if (label.includes('4')) return 'var(--color-primary)'
  if (label.includes('3')) return 'var(--color-warning)'
  if (label.includes('2')) return 'var(--color-danger)'
  return 'var(--color-text-tertiary)'
}

function setChartMode(questionId: string, mode: 'pie' | 'bar') {
  chartModes[questionId] = mode
}

function getChoiceChartOption(question: QuestionStatistic) {
  const mode = chartModes[question.questionId] || 'pie'
  const stats = question.statistics || []

  if (mode === 'pie') {
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
      series: [{
        type: 'pie',
        radius: ['35%', '65%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}' },
        data: stats.map((s, i) => ({
          value: s.count,
          name: s.content,
          itemStyle: { color: COLOR_HEX[i % COLOR_HEX.length] }
        }))
      }]
    }
  }

  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: stats.map(s => s.content), axisLabel: { interval: 0 } },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: stats.map((s, i) => ({
        value: s.count,
        itemStyle: { color: COLOR_HEX[i % COLOR_HEX.length] }
      })),
      barMaxWidth: 40
    }]
  }
}

function getRatingChartOption(question: QuestionStatistic) {
  const stats = question.statistics || []
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: stats.map(s => s.content) },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: stats.map((s, i) => ({
        value: s.count,
        itemStyle: { color: COLOR_HEX[i % COLOR_HEX.length] }
      })),
      barMaxWidth: 40
    }]
  }
}

function formatDate(dateStr: string): string {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
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
  fetchStatistics()
}

function handleQuery() {
  activeRange.value = 'all'
  fetchStatistics()
}

async function fetchQuestionnaireName() {
  try {
    const res = await getQuestionnaireDetailApi(questionnaireId.value)
    questionnaireName.value = res.result.title
  } catch (err: any) {
    ElMessage.error(err.message || '获取问卷信息失败')
  }
}

async function fetchStatistics() {
  if (!questionnaireId.value) return
  loading.value = true
  try {
    const params: { startDate?: string; endDate?: string } = {}
    if (startDate.value) params.startDate = startDate.value
    if (endDate.value) params.endDate = endDate.value
    const res = await getQuestionStatisticsApi(questionnaireId.value, params)
    questions.value = res.result.questions

    // 初始化图表模式和填空题分页
    for (const q of res.result.questions) {
      if (!chartModes[q.questionId]) {
        chartModes[q.questionId] = 'pie'
      }
      if (q.type === 'input') {
        textPageMap[q.questionId] = 1
        fetchTextAnswers(q.questionId, 1)
      }
    }
  } catch (err: any) {
    ElMessage.error(err.message || '获取统计数据失败')
  } finally {
    loading.value = false
  }
}

async function fetchTextAnswers(questionId: string, page: number) {
  textLoadingMap[questionId] = true
  try {
    const params: { page: number; pageSize: number; startDate?: string; endDate?: string } = {
      page,
      pageSize: 20
    }
    if (startDate.value) params.startDate = startDate.value
    if (endDate.value) params.endDate = endDate.value
    const res = await getTextAnswersApi(questionnaireId.value, questionId, params)
    textAnswersMap[questionId] = res.result
    textPageMap[questionId] = page
  } catch (err: any) {
    ElMessage.error(err.message || '获取回答列表失败')
  } finally {
    textLoadingMap[questionId] = false
  }
}

onMounted(() => {
  fetchQuestionnaireName()
  setRange('30d')
})
</script>

<style scoped lang="scss">
.statistics-detail-page {
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

.date-separator {
  color: var(--color-text-tertiary);
}

.empty-state {
  padding: var(--spacing-3xl) 0;
}

.question-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-2xl);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.card-header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.card-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.choice-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
}

.chart-area {
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart {
  width: 100%;
  height: 280px;
}

.stats-bars {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  justify-content: center;
}

.stat-bar-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.stat-bar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-bar-label {
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
}

.stat-bar-value {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.stat-bar-track {
  height: 8px;
  background: var(--color-bg-stripe);
  border-radius: var(--radius-full);
  overflow: hidden;
  flex: 1;
}

.stat-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--transition-normal);
}

.rating-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-2xl);
  margin-bottom: var(--spacing-xl);
}

.rating-summary {
  text-align: center;
  min-width: 120px;
}

.rating-avg {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  line-height: 1.2;
}

.rating-max {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  margin-top: var(--spacing-xs);
}

.rating-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-sm);
}

.rating-chart-area {
  flex: 1;
}

.rating-chart {
  height: 200px;
}

.rating-bars {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.rating-bar-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.rating-bar-label {
  width: 40px;
  text-align: right;
  color: var(--color-text-secondary);
  font-size: var(--font-size-body);
}

.rating-bar-value {
  width: 100px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.text-answers {
  margin-top: var(--spacing-md);
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-lg);
}
</style>
