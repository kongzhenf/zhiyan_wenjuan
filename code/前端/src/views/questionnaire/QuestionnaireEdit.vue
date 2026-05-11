<template>
  <div class="questionnaire-edit">
    <!-- 面包屑导航 -->
    <el-breadcrumb separator="/" class="breadcrumb">
      <el-breadcrumb-item :to="{ path: '/questionnaire/list' }">问卷管理</el-breadcrumb-item>
      <el-breadcrumb-item>{{ isEditMode ? '编辑问卷' : '创建问卷' }}</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <span v-if="autoSaveTime" class="auto-save-tip">已自动保存 {{ autoSaveTime }}</span>
      </div>
      <div class="toolbar-right">
        <el-button @click="handlePreview">预览</el-button>
        <el-button @click="handleSaveDraft" :loading="saveDraftLoading">保存草稿</el-button>
        <el-button type="primary" @click="handlePublish">发布</el-button>
      </div>
    </div>

    <!-- 三栏布局 -->
    <div class="editor-layout" v-loading="pageLoading">
      <!-- 左侧：题型选择面板 -->
      <div class="panel-left">
        <h3 class="panel-title">题型选择</h3>
        <div class="question-types">
          <div
            v-for="qt in questionTypes"
            :key="qt.type"
            class="type-btn"
            @click="handleAddQuestion(qt.type)"
          >
            <el-icon :size="20"><component :is="qt.icon" /></el-icon>
            <span>{{ qt.label }}</span>
          </div>
        </div>
      </div>

      <!-- 中间：编辑区 -->
      <div class="panel-center">
        <div class="questionnaire-meta">
          <input
            v-model="questionnaire.title"
            class="title-input"
            placeholder="请输入问卷标题"
            @blur="handleMetaChange"
          />
          <textarea
            v-model="questionnaire.description"
            class="desc-input"
            placeholder="请输入问卷描述（选填）"
            rows="2"
            @blur="handleMetaChange"
          />
        </div>

        <div class="questions-area">
          <draggable
            v-model="questionnaire.questions"
            item-key="id"
            handle=".drag-handle"
            ghost-class="drag-ghost"
            @end="handleDragEnd"
          >
            <template #item="{ element, index }">
              <div
                class="question-card"
                :class="{ active: selectedQuestionId === element.id }"
                @click="selectQuestion(element)"
              >
                <div class="question-header">
                  <span class="drag-handle">⠿</span>
                  <span class="question-index">{{ index + 1 }}.</span>
                  <el-tag size="small" type="info">{{ typeLabel(element.type) }}</el-tag>
                  <span class="question-title-text">{{ element.title || '未填写题干' }}</span>
                </div>
                <div class="question-actions">
                  <el-button link size="small" @click.stop="handleCopyQuestion(element)">复制</el-button>
                  <el-button link type="danger" size="small" @click.stop="handleDeleteQuestion(element)">删除</el-button>
                </div>
              </div>
            </template>
          </draggable>

          <div v-if="questionnaire.questions.length === 0" class="empty-questions">
            <p>暂无题目，请从左侧添加题型</p>
          </div>
        </div>
      </div>

      <!-- 右侧：属性配置面板 -->
      <div class="panel-right">
        <template v-if="selectedQuestion">
          <h3 class="panel-title">属性配置</h3>
          <div class="property-form">
            <div class="form-item">
              <label class="form-label">题干</label>
              <el-input
                v-model="selectedQuestion.title"
                type="textarea"
                :rows="3"
                placeholder="请输入题干"
                @blur="handleQuestionUpdate"
              />
            </div>

            <div class="form-item">
              <label class="form-label">是否必填</label>
              <el-switch
                v-model="selectedQuestion.required"
                @change="handleQuestionUpdate"
              />
            </div>

            <!-- 选项列表（选择类题目） -->
            <template v-if="hasOptions(selectedQuestion.type)">
              <div class="form-item">
                <label class="form-label">选项列表</label>
                <div class="options-list">
                  <div
                    v-for="(opt, idx) in selectedQuestion.options"
                    :key="idx"
                    class="option-row"
                  >
                    <el-input
                      v-model="opt.text"
                      :placeholder="`选项${idx + 1}`"
                      size="small"
                      @blur="handleQuestionUpdate"
                    />
                    <el-button
                      link
                      type="danger"
                      size="small"
                      :disabled="selectedQuestion.options.length <= 2"
                      @click="removeOption(idx)"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
                <el-button
                  link
                  type="primary"
                  size="small"
                  class="add-option-btn"
                  @click="addOption"
                >
                  + 添加选项
                </el-button>
              </div>
            </template>

            <!-- 评分题配置 -->
            <template v-if="selectedQuestion.type === 'rating'">
              <div class="form-item">
                <label class="form-label">最大评分值</label>
                <el-input-number
                  v-model="selectedQuestion.config.maxRating"
                  :min="3"
                  :max="10"
                  controls-position="right"
                  @change="handleQuestionUpdate"
                />
              </div>
            </template>

            <!-- 填空题配置 -->
            <template v-if="selectedQuestion.type === 'input'">
              <div class="form-item">
                <label class="form-label">文本长度限制</label>
                <el-input-number
                  v-model="selectedQuestion.config.maxLength"
                  :min="10"
                  :max="2000"
                  :step="50"
                  controls-position="right"
                  @change="handleQuestionUpdate"
                />
              </div>
            </template>
          </div>
        </template>
        <template v-else>
          <div class="no-selection">
            <p>点击题目进行属性配置</p>
          </div>
        </template>
      </div>
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

    <!-- 预览弹窗 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="问卷预览"
      width="420px"
      :close-on-click-modal="true"
      class="preview-dialog"
    >
      <div class="preview-phone-frame">
        <iframe
          v-if="previewUrl"
          :src="previewUrl"
          class="preview-iframe"
          frameborder="0"
        />
        <div v-else class="preview-loading">加载中...</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  CircleCheck,
  Grid,
  Edit,
  ChatLineSquare,
  Star,
  ArrowDown
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import draggable from 'vuedraggable'
import {
  createQuestionnaireApi,
  getQuestionnaireDetailApi,
  addQuestionApi,
  updateQuestionApi,
  deleteQuestionApi,
  sortQuestionsApi,
  saveDraftApi,
  publishQuestionnaireApi,
  previewQuestionnaireApi
} from '@/api/questionnaire'
import type { Question, QuestionOption, QuestionConfig } from '@/api/questionnaire'

const route = useRoute()
const router = useRouter()

const isEditMode = computed(() => !!route.params.id)
const questionnaireId = ref('')
const pageLoading = ref(false)
const saveDraftLoading = ref(false)
const autoSaveTime = ref('')
let autoSaveTimer: ReturnType<typeof setInterval> | null = null

interface EditableQuestion {
  id: string
  type: 'radio' | 'checkbox' | 'input' | 'rating' | 'dropdown'
  title: string
  required: boolean
  sortOrder: number
  options: Array<{ text: string; id?: string; sortOrder?: number }>
  config: QuestionConfig
}

const questionnaire = reactive({
  title: '',
  description: '',
  status: 'draft' as string,
  questions: [] as EditableQuestion[]
})

const selectedQuestionId = ref('')
const selectedQuestion = computed(() => {
  return questionnaire.questions.find(q => q.id === selectedQuestionId.value) || null
})

const questionTypes = [
  { type: 'radio', label: '单选题', icon: CircleCheck },
  { type: 'checkbox', label: '多选题', icon: Grid },
  { type: 'input', label: '单行填空', icon: Edit },
  { type: 'textarea', label: '多行填空', icon: ChatLineSquare },
  { type: 'rating', label: '评分题', icon: Star },
  { type: 'dropdown', label: '下拉选择', icon: ArrowDown }
]

// 发布配置
const publishDialogVisible = ref(false)
const publishLoading = ref(false)
const publishForm = reactive({
  deadline: null as Date | null,
  maxResponses: undefined as number | undefined,
  restrictDevice: false
})

// 预览
const previewDialogVisible = ref(false)
const previewUrl = ref('')

function typeLabel(type: string) {
  const map: Record<string, string> = {
    radio: '单选题',
    checkbox: '多选题',
    input: '填空题',
    rating: '评分题',
    dropdown: '下拉选择'
  }
  return map[type] || type
}

function hasOptions(type: string) {
  return ['radio', 'checkbox', 'dropdown'].includes(type)
}

async function initPage() {
  pageLoading.value = true
  try {
    if (isEditMode.value) {
      const id = route.params.id as string
      questionnaireId.value = id
      const res = await getQuestionnaireDetailApi(id)
      questionnaire.title = res.result.title
      questionnaire.description = res.result.description
      questionnaire.status = res.result.status
      questionnaire.questions = res.result.questions.map(q => ({
        id: q.id,
        type: q.type,
        title: q.title,
        required: q.required,
        sortOrder: q.sortOrder,
        options: q.options.map(o => ({ text: o.text, id: o.id, sortOrder: o.sortOrder })),
        config: q.config || {}
      }))
    } else {
      const res = await createQuestionnaireApi({
        title: '未命名问卷',
        description: ''
      })
      questionnaireId.value = res.result.id
      questionnaire.title = res.result.title || '未命名问卷'
      questionnaire.status = 'draft'
    }
    startAutoSave()
  } catch (err: any) {
    ElMessage.error(err.message || '初始化失败')
  } finally {
    pageLoading.value = false
  }
}

function startAutoSave() {
  if (autoSaveTimer) clearInterval(autoSaveTimer)
  autoSaveTimer = setInterval(() => {
    if (questionnaire.status === 'draft') {
      doAutoSave()
    }
  }, 30000)
}

async function doAutoSave() {
  try {
    await saveDraftApi(questionnaireId.value, {
      title: questionnaire.title,
      description: questionnaire.description,
      questions: questionnaire.questions.map((q, idx) => ({
        id: q.id,
        type: q.type === 'textarea' ? 'input' : q.type,
        title: q.title,
        required: q.required,
        sortOrder: idx + 1,
        options: q.options.map(o => ({ text: o.text })),
        config: q.type === 'textarea'
          ? { ...q.config, inputType: 'textarea' }
          : q.config
      }))
    })
    autoSaveTime.value = dayjs().format('HH:mm:ss')
  } catch {
    // 自动保存静默失败
  }
}

async function handleSaveDraft() {
  saveDraftLoading.value = true
  try {
    await saveDraftApi(questionnaireId.value, {
      title: questionnaire.title,
      description: questionnaire.description,
      questions: questionnaire.questions.map((q, idx) => ({
        id: q.id,
        type: q.type === 'textarea' ? 'input' : q.type,
        title: q.title,
        required: q.required,
        sortOrder: idx + 1,
        options: q.options.map(o => ({ text: o.text })),
        config: q.type === 'textarea'
          ? { ...q.config, inputType: 'textarea' }
          : q.config
      }))
    })
    autoSaveTime.value = dayjs().format('HH:mm:ss')
    ElMessage.success('保存成功')
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    saveDraftLoading.value = false
  }
}

function handleMetaChange() {
  // meta changes will be synced during auto-save or manual save
}

async function handleAddQuestion(type: string) {
  const actualType = type === 'textarea' ? 'input' : type
  const config: QuestionConfig = {}
  const options: Array<{ text: string }> = []

  if (type === 'textarea') {
    config.inputType = 'textarea'
    config.maxLength = 500
  } else if (type === 'input') {
    config.inputType = 'text'
    config.maxLength = 200
  } else if (type === 'rating') {
    config.maxRating = 5
  } else if (hasOptions(type)) {
    options.push({ text: '选项1' }, { text: '选项2' })
  }

  try {
    const res = await addQuestionApi(questionnaireId.value, {
      type: actualType,
      title: '',
      required: false,
      options: hasOptions(type) ? options : undefined,
      config: Object.keys(config).length > 0 ? config : undefined
    })

    const newQuestion: EditableQuestion = {
      id: res.result.id,
      type: type as EditableQuestion['type'],
      title: res.result.title,
      required: res.result.required,
      sortOrder: res.result.sortOrder,
      options: res.result.options.map(o => ({ text: o.text, id: o.id, sortOrder: o.sortOrder })),
      config: res.result.config || config
    }
    questionnaire.questions.push(newQuestion)
    selectedQuestionId.value = newQuestion.id
  } catch (err: any) {
    ElMessage.error(err.message || '添加题目失败')
  }
}

function selectQuestion(question: EditableQuestion) {
  selectedQuestionId.value = question.id
}

async function handleQuestionUpdate() {
  if (!selectedQuestion.value) return
  const q = selectedQuestion.value
  try {
    await updateQuestionApi(questionnaireId.value, q.id, {
      title: q.title,
      required: q.required,
      options: hasOptions(q.type) ? q.options.map(o => ({ text: o.text })) : undefined,
      config: q.config
    })
  } catch (err: any) {
    ElMessage.error(err.message || '更新题目失败')
  }
}

async function handleDeleteQuestion(question: EditableQuestion) {
  try {
    await deleteQuestionApi(questionnaireId.value, question.id)
    const idx = questionnaire.questions.findIndex(q => q.id === question.id)
    if (idx > -1) questionnaire.questions.splice(idx, 1)
    if (selectedQuestionId.value === question.id) {
      selectedQuestionId.value = ''
    }
  } catch (err: any) {
    ElMessage.error(err.message || '删除题目失败')
  }
}

async function handleCopyQuestion(question: EditableQuestion) {
  try {
    const res = await addQuestionApi(questionnaireId.value, {
      type: question.type === 'textarea' ? 'input' : question.type,
      title: question.title,
      required: question.required,
      options: hasOptions(question.type) ? question.options.map(o => ({ text: o.text })) : undefined,
      config: question.config
    })
    const newQuestion: EditableQuestion = {
      id: res.result.id,
      type: question.type,
      title: res.result.title,
      required: res.result.required,
      sortOrder: res.result.sortOrder,
      options: res.result.options.map(o => ({ text: o.text, id: o.id, sortOrder: o.sortOrder })),
      config: res.result.config || question.config
    }
    questionnaire.questions.push(newQuestion)
    ElMessage.success('复制成功')
  } catch (err: any) {
    ElMessage.error(err.message || '复制题目失败')
  }
}

async function handleDragEnd() {
  const questionIds = questionnaire.questions.map(q => q.id)
  try {
    await sortQuestionsApi(questionnaireId.value, questionIds)
  } catch (err: any) {
    ElMessage.error(err.message || '排序失败')
  }
}

function addOption() {
  if (!selectedQuestion.value) return
  selectedQuestion.value.options.push({ text: `选项${selectedQuestion.value.options.length + 1}` })
  handleQuestionUpdate()
}

function removeOption(idx: number) {
  if (!selectedQuestion.value) return
  selectedQuestion.value.options.splice(idx, 1)
  handleQuestionUpdate()
}

function handlePublish() {
  publishForm.deadline = null
  publishForm.maxResponses = undefined
  publishForm.restrictDevice = false
  publishDialogVisible.value = true
}

async function confirmPublish() {
  publishLoading.value = true
  try {
    await publishQuestionnaireApi(questionnaireId.value, {
      deadline: publishForm.deadline ? dayjs(publishForm.deadline).toISOString() : undefined,
      maxResponses: publishForm.maxResponses || undefined,
      allowDuplicateDevice: !publishForm.restrictDevice
    })
    ElMessage.success('发布成功')
    publishDialogVisible.value = false
    questionnaire.status = 'active'
    router.push('/questionnaire/list')
  } catch (err: any) {
    ElMessage.error(err.message || '发布失败')
  } finally {
    publishLoading.value = false
  }
}

async function handlePreview() {
  previewDialogVisible.value = true
  previewUrl.value = ''
  try {
    const res = await previewQuestionnaireApi(questionnaireId.value)
    previewUrl.value = res.result.previewUrl || ''
  } catch (err: any) {
    ElMessage.error(err.message || '获取预览数据失败')
  }
}

onMounted(() => {
  initPage()
})

onBeforeUnmount(() => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
})
</script>

<style scoped lang="scss">
.questionnaire-edit {
  padding: var(--content-padding);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.breadcrumb {
  margin-bottom: var(--spacing-lg);
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.auto-save-tip {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.toolbar-right {
  display: flex;
  gap: var(--spacing-sm);
}

.editor-layout {
  display: grid;
  grid-template-columns: 200px 1fr 280px;
  gap: var(--spacing-lg);
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.panel-left {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  overflow-y: auto;
}

.panel-title {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-lg) 0;
}

.question-types {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.type-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);

  &:hover {
    background: var(--color-primary-light);
    color: var(--color-primary);
    border-color: var(--color-primary);
  }
}

.panel-center {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  overflow-y: auto;
}

.questionnaire-meta {
  margin-bottom: var(--spacing-xl);
  border-bottom: 1px solid var(--color-border-light);
  padding-bottom: var(--spacing-xl);
}

.title-input {
  width: 100%;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  border: none;
  outline: none;
  padding: var(--spacing-sm) 0;
  color: var(--color-text-primary);
  background: transparent;

  &::placeholder {
    color: var(--color-text-tertiary);
  }
}

.desc-input {
  width: 100%;
  font-size: var(--font-size-body);
  border: none;
  outline: none;
  resize: vertical;
  padding: var(--spacing-sm) 0;
  color: var(--color-text-secondary);
  background: transparent;
  font-family: inherit;

  &::placeholder {
    color: var(--color-text-tertiary);
  }
}

.questions-area {
  min-height: 200px;
}

.question-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-sm);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    border-color: var(--color-primary);
    background: var(--color-bg-hover);
  }

  &.active {
    border-color: var(--color-primary);
    background: var(--color-primary-50);
  }
}

.question-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
  min-width: 0;
}

.drag-handle {
  cursor: grab;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-lg);
  user-select: none;

  &:active {
    cursor: grabbing;
  }
}

.question-index {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.question-title-text {
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.question-actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.drag-ghost {
  opacity: 0.5;
  background: var(--color-primary-light);
}

.empty-questions {
  text-align: center;
  padding: var(--spacing-3xl) 0;

  p {
    color: var(--color-text-tertiary);
    font-size: var(--font-size-body);
  }
}

.panel-right {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  overflow-y: auto;
}

.property-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.option-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.add-option-btn {
  margin-top: var(--spacing-xs);
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;

  p {
    color: var(--color-text-tertiary);
    font-size: var(--font-size-body);
  }
}

.preview-dialog {
  :deep(.el-dialog__body) {
    display: flex;
    justify-content: center;
    padding: var(--spacing-lg);
  }
}

.preview-phone-frame {
  width: 375px;
  height: 667px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--color-bg-page);
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.preview-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-tertiary);
}
</style>
