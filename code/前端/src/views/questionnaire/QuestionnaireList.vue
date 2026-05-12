<template>
  <div class="questionnaire-list">
    <div class="page-header">
      <h1 class="page-title">问卷管理</h1>
      <p class="page-subtitle">管理和维护所有问卷</p>
    </div>

    <div class="toolbar">
      <div class="toolbar-left">
        <el-select
          v-model="queryParams.status"
          placeholder="全部状态"
          clearable
          class="status-select"
          @change="handleSearch"
        >
          <el-option label="全部" value="" />
          <el-option label="草稿" value="draft" />
          <el-option label="进行中" value="active" />
          <el-option label="已结束" value="closed" />
        </el-select>
        <el-input
          v-model="queryParams.keyword"
          placeholder="按标题搜索"
          clearable
          class="search-input"
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
      </div>
      <div class="toolbar-right">
        <el-button type="primary" :icon="Plus" @click="handleCreate">
          新建问卷
        </el-button>
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="tableData"
      stripe
      class="data-table"
    >
      <el-table-column prop="questionnaireId" label="问卷ID" width="100" align="center">
        <template #default="{ row }">
          <span class="questionnaire-id">ID：{{ row.questionnaireId }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="问卷标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">
            {{ statusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="responseCount" label="回收数量" width="100" align="center" />
      <el-table-column prop="createdAt" label="创建时间" width="170">
        <template #default="{ row }">
          {{ formatTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="最后修改时间" width="170">
        <template #default="{ row }">
          {{ formatTime(row.updatedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 'draft'">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" size="small" @click="handleStatistics(row)">统计</el-button>
            <el-button link type="success" size="small" @click="handlePublish(row)">发布</el-button>
            <el-button link type="primary" size="small" @click="handleCopy(row)">复制</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
          <template v-else-if="row.status === 'active'">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" size="small" @click="handleStatistics(row)">统计</el-button>
            <el-button link type="warning" size="small" @click="handleClose(row)">关闭</el-button>
          </template>
          <template v-else>
            <el-button link type="primary" size="small" @click="handleStatistics(row)">统计</el-button>
            <el-button link type="primary" size="small" @click="handleCopy(row)">复制</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </template>
      </el-table-column>

      <template #empty>
        <div class="empty-state">
          <p>暂无问卷，点击新建</p>
          <el-button type="primary" :icon="Plus" @click="handleCreate">新建问卷</el-button>
        </div>
      </template>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>

    <!-- 发布配置弹窗 -->
    <el-dialog
      v-model="publishDialogVisible"
      title="发布配置"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="publishForm" label-width="120px">
        <el-form-item label="截止时间">
          <el-date-picker
            v-model="publishForm.deadline"
            type="datetime"
            placeholder="不设置则不限截止时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="最大回收份数">
          <el-input-number
            v-model="publishForm.maxResponses"
            :min="1"
            :max="100000"
            placeholder="不设置则不限制"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="设备限制">
          <el-switch
            v-model="publishForm.restrictDevice"
            active-text="限制同一设备重复提交"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="publishDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="publishLoading" @click="confirmPublish">
          确认发布
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import {
  getQuestionnairesApi,
  deleteQuestionnaireApi,
  publishQuestionnaireApi,
  copyQuestionnaireApi,
  closeQuestionnaireApi
} from '@/api/questionnaire'
import type { QuestionnaireListItem } from '@/api/questionnaire'

const router = useRouter()

const loading = ref(false)
const tableData = ref<QuestionnaireListItem[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  pageSize: 20,
  status: '',
  keyword: ''
})

const publishDialogVisible = ref(false)
const publishLoading = ref(false)
const publishTargetId = ref('')
const publishForm = reactive({
  deadline: null as Date | null,
  maxResponses: undefined as number | undefined,
  restrictDevice: false
})

function statusTagType(status: string) {
  const map: Record<string, string> = {
    draft: 'info',
    active: 'success',
    closed: 'info'
  }
  return map[status] || 'info'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    draft: '草稿',
    active: '进行中',
    closed: '已结束'
  }
  return map[status] || status
}

function formatTime(time: string) {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getQuestionnairesApi({
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      status: queryParams.status || undefined,
      keyword: queryParams.keyword || undefined
    })
    tableData.value = res.result.list
    total.value = res.result.pagination.total
  } catch (err: any) {
    ElMessage.error(err.message || '获取问卷列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  queryParams.page = 1
  fetchList()
}

function handleCreate() {
  router.push('/questionnaire/edit')
}

function handleEdit(row: QuestionnaireListItem) {
  router.push(`/questionnaire/edit/${row.id}`)
}

function handleStatistics(row: QuestionnaireListItem) {
  router.push(`/statistics/overview/${row.id}`)
}

function handlePublish(row: QuestionnaireListItem) {
  publishTargetId.value = row.id
  publishForm.deadline = null
  publishForm.maxResponses = undefined
  publishForm.restrictDevice = false
  publishDialogVisible.value = true
}

async function confirmPublish() {
  publishLoading.value = true
  try {
    await publishQuestionnaireApi(publishTargetId.value, {
      deadline: publishForm.deadline ? dayjs(publishForm.deadline).toISOString() : undefined,
      maxResponses: publishForm.maxResponses || undefined,
      allowDuplicateDevice: !publishForm.restrictDevice
    })
    ElMessage.success('发布成功')
    publishDialogVisible.value = false
    fetchList()
  } catch (err: any) {
    ElMessage.error(err.message || '发布失败')
  } finally {
    publishLoading.value = false
  }
}

async function handleDelete(row: QuestionnaireListItem) {
  const confirmMessage = row.responseCount > 0
    ? `该问卷已有 ${row.responseCount} 条回收数据，删除后数据不可恢复，确定删除？`
    : '确定删除该问卷？'

  try {
    await ElMessageBox.confirm(confirmMessage, '删除确认', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })
    await deleteQuestionnaireApi(row.id, row.responseCount > 0 ? true : undefined)
    ElMessage.success('删除成功')
    fetchList()
  } catch (err: any) {
    if (err !== 'cancel' && err !== 'close') {
      ElMessage.error(err.message || '删除失败')
    }
  }
}

async function handleCopy(row: QuestionnaireListItem) {
  try {
    await copyQuestionnaireApi(row.id)
    ElMessage.success('复制成功')
    fetchList()
  } catch (err: any) {
    ElMessage.error(err.message || '复制失败')
  }
}

async function handleClose(row: QuestionnaireListItem) {
  try {
    await ElMessageBox.confirm('关闭后将停止接受新的答卷提交，且不可恢复。确定关闭？', '关闭确认', {
      type: 'warning',
      confirmButtonText: '确定关闭',
      cancelButtonText: '取消'
    })
    await closeQuestionnaireApi(row.id)
    ElMessage.success('问卷已关闭')
    fetchList()
  } catch (err: any) {
    if (err !== 'cancel' && err !== 'close') {
      ElMessage.error(err.message || '关闭失败')
    }
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped lang="scss">
.questionnaire-list {
  padding: var(--content-padding);
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.page-subtitle {
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  margin: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  gap: var(--spacing-md);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.status-select {
  width: 140px;
}

.search-input {
  width: 240px;
}

.data-table {
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--spacing-xl);
}

.empty-state {
  padding: var(--spacing-3xl) 0;
  text-align: center;

  p {
    color: var(--color-text-tertiary);
    margin-bottom: var(--spacing-lg);
    font-size: var(--font-size-body);
  }
}
</style>
