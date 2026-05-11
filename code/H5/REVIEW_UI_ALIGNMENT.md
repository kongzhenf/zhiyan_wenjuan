# UI 原型对齐检查报告

> 检查日期：2026-05-09
> 原型文件：`/prototype/移动端/index.html` + `design-system.css`
> 前端代码：`/code/H5/src/`

---

### 1. 页面完整性

| 原型页面 | 原型 section id | 代码实现 | 是否存在 |
|---------|----------------|---------|---------|
| 加载骨架屏 | `page-loading` | `SkeletonLoading.vue`（`store.pageState === 'loading'` 时渲染） | ✅ 存在 |
| 问卷填写页 | `page-survey-form` | `SurveyPage.vue`（`store.pageState === 'form'` 时渲染） | ✅ 存在 |
| 提交成功页 | `page-submit-success` | `StatusPage.vue`（`type='success'`） | ✅ 存在 |
| 问卷已结束页 | `page-survey-closed` | `StatusPage.vue`（`type='closed'`） | ✅ 存在 |
| 问卷不存在页 | `page-not-found` | `StatusPage.vue`（`type='not-found'`） | ✅ 存在 |
| 重复提交页 | `page-already-submitted` | `StatusPage.vue`（`type='submitted'`） | ✅ 存在 |

**额外说明**：代码中额外实现了 `limit-reached`（已达上限）状态页，原型中未定义此页面，属于功能增强，不影响对齐。

---

### 2. 设计变量对齐

对比原型 `design-system.css` `:root` 与前端 `src/styles/variables.css` `:root`：

**全部一致。**

共计 58 个 CSS 变量（含色板、字号、字重、行高、间距、圆角、阴影、布局、动画），变量名和变量值完全一致。`@media screen and (max-width: 360px)` 中的响应式覆盖也完全一致。

---

### 3. 页面元素比对

#### 3.1 题型组件完整性

| 题型 | 原型定义 | 代码组件 | 是否存在 |
|-----|---------|---------|---------|
| 单选 (radio) | `.form-option`（圆形 indicator） | `RadioQuestion.vue` | ✅ 存在 |
| 多选 (checkbox) | `.form-option--checkbox`（方形 indicator） | `CheckboxQuestion.vue` | ✅ 存在 |
| 填空 (textarea) | `.form-textarea` + `.form-char-count` | `InputQuestion.vue` | ✅ 存在 |
| 评分 (rating) | `.form-rating` + `.form-rating__star` | `RatingQuestion.vue` | ✅ 存在 |
| 下拉 (dropdown) | `.form-select` + `.form-select__dropdown` | `DropdownQuestion.vue` | ✅ 存在 |

#### 3.2 题型 UI 元素详细比对

| 元素 | 原型定义 | 代码实现 | 是否一致 |
|-----|---------|---------|---------|
| **题号样式** | 纯文本 `1.`，颜色 `--color-primary`，无背景 | 数字徽章（`background: --color-primary`，白色文字，`border-radius: --radius-sm`），无 `.` 后缀 | ❌ 不一致 |
| **单选 indicator 尺寸** | 22×22px | 20×20px | ❌ 不一致 |
| **单选选中效果** | indicator 填充 `--color-primary`，内部白色圆点 8px | indicator 仅边框变色，内部主色圆点 10px | ❌ 不一致 |
| **多选 indicator 尺寸** | 22×22px | 20×20px | ❌ 不一致 |
| **多选选中效果** | CSS 伪元素绘制勾号（border-left + border-bottom） | SVG 绘制勾号（`<path>` 元素） | ⚠️ 视觉效果近似，实现方式不同 |
| **多选选中 indicator 背景** | `background: --color-primary` | `background: --color-primary` | ✅ 一致 |
| **填空 placeholder** | `请输入您的建议...` | `请输入您的回答...` | ❌ 不一致 |
| **字符计数** | `42/500`，位于 textarea 下方独立行 | `charCount/maxLen`，绝对定位在 textarea 内右下角 | ❌ 位置不一致 |
| **评分星星尺寸** | SVG 28×28px | SVG 32×32px | ❌ 不一致 |
| **评分星星未选中填色** | `fill: --color-border`（通过 CSS 设置） | `fill: none`，`stroke: --color-border`（仅描边） | ❌ 不一致 |
| **评分值文字** | `3/5` | `modelValue/maxStars` | ✅ 格式一致 |
| **下拉选择器** | 内联下拉菜单（`.form-select__dropdown`） | 底部弹出式面板（`van-action-sheet`） | ❌ 交互方式不一致 |
| **下拉箭头** | CSS 绘制（border-right + border-bottom 旋转） | SVG 绘制（`<path>` 元素） | ⚠️ 视觉近似，实现不同 |
| **选项 gap** | `margin-bottom: --spacing-sm` (8px) | `gap: --spacing-md` (12px) | ❌ 间距不一致 |

#### 3.3 按钮文字

| 元素 | 原型定义 | 代码实现 | 是否一致 |
|-----|---------|---------|---------|
| 提交按钮文字 | `提交问卷` | `提交问卷` | ✅ 一致 |
| 提交中文字 | 未明确定义（仅定义 CSS `.btn--loading`） | `提交中...` | ✅ 合理 |

#### 3.4 状态页文字比对

| 状态页 | 元素 | 原型文字 | 代码实际文字 | 是否一致 |
|-------|-----|---------|------------|---------|
| 提交成功 | 标题 | 提交成功 | 提交成功 | ✅ |
| 提交成功 | 描述 | 感谢您的参与！您的反馈对我们非常重要。 | 感谢您的参与，您的回答已成功提交！ | ❌ |
| 问卷已结束 | 标题 | 问卷已结束 | 问卷已关闭 | ❌ |
| 问卷已结束 | 描述 | 本问卷已停止收集，感谢您的关注。 | 本问卷已结束，感谢关注 | ❌ |
| 问卷不存在 | 标题 | 问卷不存在 | 问卷不存在 | ✅ |
| 问卷不存在 | 描述 | 请检查访问链接是否正确，或联系问卷发布者获取最新链接。 | 您访问的问卷不存在或链接已失效 | ❌ |
| 重复提交 | 标题 | 您已填写过本问卷 | 已经填写过 | ❌ |
| 重复提交 | 描述 | 每台设备仅可提交一次，感谢您的参与。 | 您已填写过本问卷，无需重复提交 | ❌ |

#### 3.5 状态页图标

| 元素 | 原型定义 | 代码实现 | 是否一致 |
|-----|---------|---------|---------|
| 图标容器尺寸 | 120×120px | 80×80px | ❌ 不一致 |
| 图标风格 | 实心填色圆形（有半透明外圈 + 实色内圈） | 线性描边图标 + 浅色背景圆形 | ❌ 风格不一致 |

#### 3.6 布局细节

| 元素 | 原型定义 | 代码实现 | 是否一致 |
|-----|---------|---------|---------|
| Header 标题对齐 | `text-align: center`（居中） | 无居中设置（左对齐） | ❌ 不一致 |
| Header `backdrop-filter` | `backdrop-filter: blur(12px)` | 无 `backdrop-filter` | ❌ 不一致 |
| Footer `box-shadow` | `0 -4px 12px rgba(26,33,56,0.06)` | 无 `box-shadow` | ❌ 不一致 |
| 进度条高度 | 4px | 6px | ❌ 不一致 |
| 进度条渐变 | `--color-primary → --color-secondary` | `--color-primary → --color-primary-light` | ❌ 不一致 |
| 进度条百分比文字 | 无 | 有（右侧显示百分比） | ❌ 不一致（代码多了元素） |
| 进度条背景色 | `--color-border` | `--color-bg-input` | ❌ 不一致 |
| 问卷描述字号 | `--font-size-sm` (13px) | `--font-size-body` (15px) | ❌ 不一致 |
| 问卷描述背景色 | `rgba(61,90,254,0.03)` | `rgba(61,90,254,0.04)` | ⚠️ 微差 |
| 问卷描述内边距 | `--spacing-lg` (16px) | `--spacing-md --spacing-lg` (12px 16px) | ❌ 不一致 |

---

### 4. 交互行为验证

| 交互行为 | 是否实现 | 说明 |
|---------|---------|------|
| 提交按钮 loading 状态 | ✅ 已实现 | `survey-submit-btn--loading` 类 + spinner 动画 + "提交中..." 文字 |
| 进度条 | ✅ 已实现 | 基于已答题数/总题数计算百分比，实时更新 |
| 骨架屏 | ✅ 已实现 | `SkeletonLoading.vue`，含 header/progress/question card 骨架，shimmer 动画 |
| Toast 提示 | ⚠️ 部分一致 | 使用 vant `showToast` 实现，非原型中定义的自定义 Toast 组件（原型定义了 `.toast` / `.toast--visible` / `.toast--success` / `.toast--error` / `.toast--info` 样式） |
| 选项点击动画 (scale) | ✅ 已实现 | `:active { transform: scale(0.98) }` |
| 错误状态 shake 动画 | ✅ 已实现 | `question-card--shake` + `@keyframes shake` |
| 滚动到首个错误题目 | ✅ 已实现 | `scrollToFirstError()` 方法 |
| 页面切换 fadeIn 动画 | ⚠️ 未明确实现 | 原型定义了 `@keyframes fadeIn`，代码中状态页使用 bounce 动画，问卷页无 fade 动画 |

---

### 总体结论

**FAIL**

#### 不一致项汇总（共 25 项）

**严重不一致（影响视觉还原度）**：
1. 题号样式：纯文本 vs 徽章
2. 状态页图标风格：实心填色 120px vs 线性描边 80px
3. 状态页文字：4 处标题/描述与原型不同
4. 下拉选择器：内联下拉 vs 底部弹出面板
5. Header 标题对齐：居中 vs 左对齐
6. 进度条渐变色：primary→secondary vs primary→primary-light

**中等不一致（影响细节还原度）**：
7. 单选/多选 indicator 尺寸：22px vs 20px
8. 单选选中效果差异
9. 评分星星尺寸：28px vs 32px
10. 评分星星未选中填色差异
11. 字符计数位置差异
12. 进度条高度/背景色差异
13. 问卷描述字号差异
14. Header 缺少 backdrop-filter
15. Footer 缺少 box-shadow
16. Toast 实现方式差异

**轻微不一致**：
17. 选项间距差异
18. placeholder 文案差异
19. 进度条多了百分比文字
20. 页面切换动画差异

**设计变量对齐度**：100%（全部一致）
**页面完整性**：100%（全部覆盖）
**元素还原度**：约 60%（核心结构在，细节差异较多）
**交互行为覆盖率**：90%（核心交互均已实现）
