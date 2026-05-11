<template>
  <div class="data-export-page">
    <!-- 面包屑 -->
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>数据统计</el-breadcrumb-item>
      <el-breadcrumb-item>数据导出</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">数据导出</h1>
      <p class="page-subtitle">选择问卷并配置导出参数，生成数据文件</p>
    </div>

    <!-- 导出配置卡片 -->
    <div class="config-card">
      <div class="card-header">
        <h3 class="card-title">导出配置</h3>
      </div>

      <div class="form-group">
        <label class="form-label">选择问卷</label>
        <el-select
          v-model="selectedQuestionnaireId"
          placeholder="请选择问卷"
          style="max-width: 400px; width: 100%"
        >
          <el-option
            v-for="item in questionnaireList"
            :key="item.id"
            :label="item.title"
            :value="item.id"
          />
        </el-select>
      </div>

      <div class="form-group">
        <label class="form-label">导出格式</label>
        <div class="format-options">
          <label
            class="format-card"
            :class="{ active: exportFormat === 'xlsx' }"
            @click="exportFormat = 'xlsx'"
          >
            <input type="radio" v-model="exportFormat" value="xlsx" class="format-radio" />
            <div class="format-info">
              <div class="format-name">Excel (.xlsx)</div>
              <div class="format-desc">适合数据分析和图表制作</div>
            </div>
          </label>
          <label
            class="format-card"
            :class="{ active: exportFormat === 'csv' }"
            @click="exportFormat = 'csv'"
          >
            <input type="radio" v-model="exportFormat" value="csv" class="format-radio" />
            <div class="format-info">
              <div class="format-name">CSV (.csv)</div>
              <div class="format-desc">通用格式，兼容性好</div>
            </div>
          </label>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">时间范围（可选，留空导出全部）</label>
        <div class="date-range">
          <el-date-picker
            v-model="exportStartDate"
            type="date"
            placeholder="开始日期"
            value-format="YYYY-MM-DD"
            style="width: 180px"
          />
          <span class="date-separator">~</span>
          <el-date-picker
            v-model="exportEndDate"
            type="date"
            placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 180px"
          />
        </div>
        <div class="form-hint">留空将导出该问卷全部时间段的数据</div>
      </div>

      <div class="config-footer">
        <span class="export-estimate">
          预计导出 <strong>{{ estimatedCount.toLocaleString() }}</strong> 条数据
        </span>
        <el-button
          type="primary"
          size="large"
          :loading="exporting"
          :disabled="!selectedQuestionnaireId"
          @click="handleExport"
        >开始导出</el-button>
      </div>
    </div>

    <!-- 导出历史表格 -->
    <div class="history-card">
      <div class="card-header">
        <h3 class="card-title">导出历史</h3>
      </div>
      <el-table :data="exportList" stripe v-loading="historyLoading">
        <el-table-column prop="fileName" label="文件名" min-width="200">
          <template #default="{ row }">
            {{ row.fileName || `导出_${row.exportId}` }}
          </template>
        </el-table-column>
        <el-table-column prop="questionnaireTitle" label="问卷标题" min-width="180" />
        <el-table-column label="格式" width="100">
          <template #default="{ row }">
            <el-tag :type="row.format === 'xlsx' ? '' : 'info'" size="small">
              {{ row.format === 'xlsx' ? 'Excel' : 'CSV' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数据量" width="100">
          <template #default="{ row }">
            {{ row.totalRecords.toLocaleString() }}条
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'completed'"
              type="primary"
              link
              size="small"
              @click="handleDownload(row.exportId)"
            >下载</el-button>
            <el-button
              v-if="row.status === 'failed'"
              type="warning"
              link
              size="small"
              @click="handleRetry(row.questionnaireId)"
            >重试</el-button>
            <el-button
              v-if="row.status === 'processing'"
              type="info"
              link
              size="small"
              disabled
            >下载</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import {
  exportDataApi,
  getExportListApi,
  getExportDownloadUrl,
  type ExportListItem
} from '@/api/statistics'
import { getQuestionnairesApi, type QuestionnaireListItem } from '@/api/questionnaire'

const questionnaireList = ref<QuestionnaireListItem[]>([])
const selectedQuestionnaireId = ref('')
const exportFormat = ref<'xlsx' | 'csv'>('xlsx')
const exportStartDate = ref('')
const exportEndDate = ref('')
const exporting = ref(false)

const exportList = ref<ExportListItem[]>([])
const historyLoading = ref(false)

const estimatedCount = computed(() => {
  const item = questionnaireList.value.find(q => q.id === selectedQuestionnaireId.value)
  return item?.responseCount || 0
})

function formatDate(dateStr: string): string {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

function getStatusTagType(status: string): '' | 'success' | 'warning' | 'danger' {
  const map: Record<string, '' | 'success' | 'warning' | 'danger'> = {
    completed: 'success',
    processing: 'warning',
    failed: 'danger'
  }
  return map[status] || ''
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    completed: '已完成',
    processing: '生成中',
    failed: '失败'
  }
  return map[status] || status
}

function handleDownload(exportId: string) {
  const url = getExportDownloadUrl(exportId)
  window.open(url)
}

function handleRetry(questionnaireId: string) {
  selectedQuestionnaireId.value = questionnaireId
  handleExport()
}

async function fetchQuestionnaireList() {
  try {
    const res = await getQuestionnairesApi({ pageSize: 100 })
    questionnaireList.value = res.result.list
  } catch (err: any) {
    ElMessage.error(err.message || '获取问卷列表失败')
  }
}

async function fetchExportList() {
  historyLoading.value = true
  try {
    const res = await getExportListApi()
    exportList.value = res.result.items
  } catch (err: any) {
    ElMessage.error(err.message || '获取导出历史失败')
  } finally {
    historyLoading.value = false
  }
}

async function handleExport() {
  if (!selectedQuestionnaireId.value) {
    ElMessage.warning('请选择问卷')
    return
  }
  exporting.value = true
  try {
    const data: { format: 'xlsx' | 'csv'; startDate?: string; endDate?: string } = {
      format: exportFormat.value
    }
    if (exportStartDate.value) data.startDate = exportStartDate.value
    if (exportEndDate.value) data.endDate = exportEndDate.value
    await exportDataApi(selectedQuestionnaireId.value, data)
    ElMessage.success('导出任务已创建')
    fetchExportList()
  } catch (err: any) {
    ElMessage.error(err.message || '导出失败')
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  fetchQuestionnaireList()
  fetchExportList()
})
</script>

<style scoped lang="scss">
.data-export-page {
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

.config-card,
.history-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-2xl);
}

.card-header {
  margin-bottom: var(--spacing-xl);
}

.card-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.form-group {
  margin-bottom: var(--spacing-xl);
}

.form-label {
  display: block;
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.format-options {
  display: flex;
  gap: var(--spacing-lg);
}

.format-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg) var(--spacing-xl);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    border-color: var(--color-primary);
  }

  &.active {
    border-color: var(--color-primary);
    background: var(--color-primary-50);
  }
}

.format-radio {
  accent-color: var(--color-primary);
}

.format-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.format-name {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-size: var(--font-size-body);
}

.format-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.date-range {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.date-separator {
  color: var(--color-text-tertiary);
}

.form-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  margin-top: var(--spacing-sm);
}

.config-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.export-estimate {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);

  strong {
    color: var(--color-text-primary);
  }
}
</style>
