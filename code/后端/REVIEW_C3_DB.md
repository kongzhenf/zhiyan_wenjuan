# 数据库审查报告 (REVIEW_C3_DB)

**审查范围**: 设计文档第3章 vs init.sql + Entity类  
**审查日期**: 2026-05-09  

---

## 1. t_admin（管理员表）

| 表名 | 字段名 | 设计文档 | 代码/SQL | 是否一致 | 差异描述 |
|------|--------|----------|----------|----------|----------|
| t_admin | id | BIGINT, PK, AUTO_INCREMENT | SQL: BIGINT AUTO_INCREMENT PRIMARY KEY; Entity: Long @Id @GeneratedValue(IDENTITY) | ✅ 一致 | — |
| t_admin | username | VARCHAR(50), NOT NULL, UNIQUE | SQL: VARCHAR(50) NOT NULL, UNIQUE KEY uk_username; Entity: @Column(nullable=false, unique=true, length=50) | ✅ 一致 | — |
| t_admin | password | VARCHAR(255), NOT NULL | SQL: VARCHAR(255) NOT NULL; Entity: @Column(nullable=false, length=255) | ✅ 一致 | — |
| t_admin | locked | TINYINT(1), NOT NULL, DEFAULT 0 | SQL: TINYINT(1) NOT NULL DEFAULT 0; Entity: Boolean locked = false, @Column(nullable=false) | ✅ 一致 | — |
| t_admin | fail_count | INT, NOT NULL, DEFAULT 0 | SQL: INT NOT NULL DEFAULT 0; Entity: Integer failCount = 0, @Column(nullable=false) | ✅ 一致 | — |
| t_admin | lock_until | DATETIME, NULL | SQL: DATETIME NULL; Entity: LocalDateTime lockUntil | ✅ 一致 | — |
| t_admin | created_at | DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP | SQL: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP; Entity: @PrePersist设置当前时间 | ✅ 一致 | — |
| t_admin | updated_at | DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE | SQL: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP; Entity: @PreUpdate设置当前时间 | ✅ 一致 | — |

**索引检查:**

| 索引名 | 设计文档 | SQL | 是否一致 |
|--------|----------|-----|----------|
| PRIMARY | id | id | ✅ 一致 |
| uk_username | username, UNIQUE | UNIQUE KEY uk_username (username) | ✅ 一致 |

---

## 2. t_questionnaire（问卷表）

| 表名 | 字段名 | 设计文档 | 代码/SQL | 是否一致 | 差异描述 |
|------|--------|----------|----------|----------|----------|
| t_questionnaire | id | BIGINT, PK, AUTO_INCREMENT | SQL: BIGINT AUTO_INCREMENT PRIMARY KEY; Entity: Long @Id @GeneratedValue(IDENTITY) | ✅ 一致 | — |
| t_questionnaire | title | VARCHAR(100), NOT NULL | SQL: VARCHAR(100) NOT NULL; Entity: @Column(nullable=false, length=100) | ✅ 一致 | — |
| t_questionnaire | description | TEXT, NULL | SQL: TEXT NULL; Entity: @Column(columnDefinition="TEXT") | ✅ 一致 | — |
| t_questionnaire | status | VARCHAR(10), NOT NULL, DEFAULT 'draft' | SQL: VARCHAR(10) NOT NULL DEFAULT 'draft'; Entity: String status = "draft", @Column(nullable=false, length=10) | ✅ 一致 | — |
| t_questionnaire | deadline | DATETIME, NULL | SQL: DATETIME NULL; Entity: LocalDateTime deadline | ✅ 一致 | — |
| t_questionnaire | max_responses | INT, NULL | SQL: INT NULL; Entity: Integer maxResponses | ✅ 一致 | — |
| t_questionnaire | restrict_device | TINYINT(1), NOT NULL, DEFAULT 0 | SQL: TINYINT(1) NOT NULL DEFAULT 0; Entity: Boolean restrictDevice = false, @Column(nullable=false) | ✅ 一致 | — |
| t_questionnaire | access_code | VARCHAR(32), NOT NULL, UNIQUE | SQL: VARCHAR(32) NOT NULL, UNIQUE KEY uk_access_code; Entity: @Column(nullable=false, unique=true, length=32) | ✅ 一致 | — |
| t_questionnaire | created_at | DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP | SQL: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP; Entity: @PrePersist | ✅ 一致 | — |
| t_questionnaire | updated_at | DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE | SQL: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP; Entity: @PreUpdate | ✅ 一致 | — |
| t_questionnaire | deleted | （设计文档未定义） | SQL: TINYINT(1) NOT NULL DEFAULT 0; Entity: Boolean deleted = false | ✅ 合理新增 | 软删除辅助字段，业务逻辑所需，不算差异 |

**索引检查:**

| 索引名 | 设计文档 | SQL | 是否一致 |
|--------|----------|-----|----------|
| PRIMARY | id | id | ✅ 一致 |
| uk_access_code | access_code, UNIQUE | UNIQUE KEY uk_access_code (access_code) | ✅ 一致 |
| idx_status_created | status, created_at | KEY idx_status_created (status, created_at) | ✅ 一致 |

---

## 3. t_question（题目表）

| 表名 | 字段名 | 设计文档 | 代码/SQL | 是否一致 | 差异描述 |
|------|--------|----------|----------|----------|----------|
| t_question | id | BIGINT, PK, AUTO_INCREMENT | SQL: BIGINT AUTO_INCREMENT PRIMARY KEY; Entity: Long @Id @GeneratedValue(IDENTITY) | ✅ 一致 | — |
| t_question | questionnaire_id | BIGINT, NOT NULL, FK→t_questionnaire(id) | SQL: BIGINT NOT NULL, FK fk_question_questionnaire; Entity: @ManyToOne @JoinColumn(nullable=false) | ✅ 一致 | — |
| t_question | type | VARCHAR(20), NOT NULL | SQL: VARCHAR(20) NOT NULL; Entity: @Column(nullable=false, length=20) | ✅ 一致 | — |
| t_question | content | TEXT, NOT NULL | SQL: TEXT NOT NULL; Entity: @Column(nullable=false, columnDefinition="TEXT") | ✅ 一致 | — |
| t_question | sort_order | INT, NOT NULL, DEFAULT 0 | SQL: INT NOT NULL DEFAULT 0; Entity: Integer sortOrder = 0, @Column(nullable=false) | ✅ 一致 | — |
| t_question | required | TINYINT(1), NOT NULL, DEFAULT 1 | SQL: TINYINT(1) NOT NULL DEFAULT 1; Entity: Boolean required = true, @Column(nullable=false) | ✅ 一致 | — |
| t_question | config | JSON, NULL | SQL: JSON NULL; Entity: @Column(columnDefinition="JSON") | ✅ 一致 | — |
| t_question | created_at | DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP | SQL: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP; Entity: @PrePersist | ✅ 一致 | — |

**索引检查:**

| 索引名 | 设计文档 | SQL | 是否一致 |
|--------|----------|-----|----------|
| PRIMARY | id | id | ✅ 一致 |
| idx_questionnaire_sort | questionnaire_id, sort_order | KEY idx_questionnaire_sort (questionnaire_id, sort_order) | ✅ 一致 |

---

## 4. t_question_option（选项表）

| 表名 | 字段名 | 设计文档 | 代码/SQL | 是否一致 | 差异描述 |
|------|--------|----------|----------|----------|----------|
| t_question_option | id | BIGINT, PK, AUTO_INCREMENT | SQL: BIGINT AUTO_INCREMENT PRIMARY KEY; Entity: Long @Id @GeneratedValue(IDENTITY) | ✅ 一致 | — |
| t_question_option | question_id | BIGINT, NOT NULL, FK→t_question(id) | SQL: BIGINT NOT NULL, FK fk_option_question; Entity: @ManyToOne @JoinColumn(nullable=false) | ✅ 一致 | — |
| t_question_option | content | VARCHAR(200), NOT NULL | SQL: VARCHAR(200) NOT NULL; Entity: @Column(nullable=false, length=200) | ✅ 一致 | — |
| t_question_option | sort_order | INT, NOT NULL, DEFAULT 0 | SQL: INT NOT NULL DEFAULT 0; Entity: Integer sortOrder = 0, @Column(nullable=false) | ✅ 一致 | — |

**索引检查:**

| 索引名 | 设计文档 | SQL | 是否一致 |
|--------|----------|-----|----------|
| PRIMARY | id | id | ✅ 一致 |
| idx_question_sort | question_id, sort_order | KEY idx_question_sort (question_id, sort_order) | ✅ 一致 |

---

## 5. t_response（答卷表）

| 表名 | 字段名 | 设计文档 | 代码/SQL | 是否一致 | 差异描述 |
|------|--------|----------|----------|----------|----------|
| t_response | id | BIGINT, PK, AUTO_INCREMENT | SQL: BIGINT AUTO_INCREMENT PRIMARY KEY; Entity: Long @Id @GeneratedValue(IDENTITY) | ✅ 一致 | — |
| t_response | questionnaire_id | BIGINT, NOT NULL, FK→t_questionnaire(id) | SQL: BIGINT NOT NULL, FK fk_response_questionnaire; Entity: @Column(nullable=false) Long questionnaireId | ✅ 一致 | — |
| t_response | device_fingerprint | VARCHAR(64), NULL | SQL: VARCHAR(64) NULL; Entity: @Column(length=64) String deviceFingerprint | ✅ 一致 | — |
| t_response | ip_address | VARCHAR(45), NULL | SQL: VARCHAR(45) NULL; Entity: @Column(length=45) String ipAddress | ✅ 一致 | — |
| t_response | submitted_at | DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP | SQL: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP; Entity: @Column(nullable=false) + @PrePersist | ✅ 一致 | — |

**索引检查:**

| 索引名 | 设计文档 | SQL | 是否一致 |
|--------|----------|-----|----------|
| PRIMARY | id | id | ✅ 一致 |
| idx_questionnaire_time | questionnaire_id, submitted_at | KEY idx_questionnaire_time (questionnaire_id, submitted_at) | ✅ 一致 |
| idx_device_check | questionnaire_id, device_fingerprint | KEY idx_device_check (questionnaire_id, device_fingerprint) | ✅ 一致 |

---

## 6. t_answer（答案表）

| 表名 | 字段名 | 设计文档 | 代码/SQL | 是否一致 | 差异描述 |
|------|--------|----------|----------|----------|----------|
| t_answer | id | BIGINT, PK, AUTO_INCREMENT | SQL: BIGINT AUTO_INCREMENT PRIMARY KEY; Entity: Long @Id @GeneratedValue(IDENTITY) | ✅ 一致 | — |
| t_answer | response_id | BIGINT, NOT NULL, FK→t_response(id) | SQL: BIGINT NOT NULL, FK fk_answer_response; Entity: @Column(nullable=false) Long responseId | ✅ 一致 | — |
| t_answer | question_id | BIGINT, NOT NULL, FK→t_question(id) | SQL: BIGINT NOT NULL, FK fk_answer_question; Entity: @Column(nullable=false) Long questionId | ✅ 一致 | — |
| t_answer | answer_content | TEXT, NULL | SQL: TEXT NULL; Entity: @Column(columnDefinition="TEXT") String answerContent | ✅ 一致 | — |

**索引检查:**

| 索引名 | 设计文档 | SQL | 是否一致 |
|--------|----------|-----|----------|
| PRIMARY | id | id | ✅ 一致 |
| idx_response_id | response_id | KEY idx_response_id (response_id) | ✅ 一致 |
| idx_question_id | question_id | KEY idx_question_id (question_id) | ✅ 一致 |

---

## 7. t_export_task（导出任务表）

此表未在设计文档第3.2章表结构中定义，但在SQL和Entity中存在。根据审查规则，该表属于设计文档所述异步导出业务逻辑（NFR-006）所需的辅助表，**不算差异**。

---

## 审查总结

### 统计

| 检查项 | 结果 |
|--------|------|
| 设计文档定义表数 | 6 (t_admin, t_questionnaire, t_question, t_question_option, t_response, t_answer) |
| SQL实际建表数 | 7 (多出t_export_task，合理新增) |
| Entity类数 | 7 (与SQL一致) |
| 设计文档定义字段总数 | 38 |
| 字段一致性 | 38/38 全部一致 |
| 索引一致性 | 13/13 全部一致 |
| 约束一致性 | 全部一致 |
| 代码合理新增字段 | t_questionnaire.deleted (软删除) |
| 代码合理新增表 | t_export_task (异步导出任务) |

### 发现的差异

**无不一致差异。** 设计文档中明确定义的所有表、字段、类型、约束和索引均在SQL和Entity代码中被正确实现。

---

## 结论：PASS ✅

设计文档第3章数据库表结构定义与代码实现完全一致。代码中额外新增的`deleted`字段和`t_export_task`表均为业务逻辑合理扩展，不构成偏离。
