CREATE DATABASE IF NOT EXISTS questionnaire_db
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE questionnaire_db;

CREATE TABLE t_admin (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    locked TINYINT(1) NOT NULL DEFAULT 0,
    fail_count INT NOT NULL DEFAULT 0,
    lock_until DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

CREATE TABLE t_questionnaire (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL COMMENT '问卷标题',
    description TEXT NULL COMMENT '问卷描述',
    status VARCHAR(10) NOT NULL DEFAULT 'draft' COMMENT '状态: draft/active/closed',
    deadline DATETIME NULL COMMENT '截止时间',
    max_responses INT NULL COMMENT '最大回收数',
    restrict_device TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否限制设备重复提交',
    access_code VARCHAR(32) NOT NULL COMMENT '访问链接标识',
    deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '逻辑删除标识',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_access_code (access_code),
    KEY idx_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='问卷表';

CREATE TABLE t_question (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    questionnaire_id BIGINT NOT NULL COMMENT '所属问卷ID',
    type VARCHAR(20) NOT NULL COMMENT '题型: radio/checkbox/input/rating/dropdown',
    content TEXT NOT NULL COMMENT '题干文字',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序号',
    required TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否必填',
    config JSON NULL COMMENT '题目配置JSON',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_questionnaire_sort (questionnaire_id, sort_order),
    CONSTRAINT fk_question_questionnaire FOREIGN KEY (questionnaire_id) REFERENCES t_questionnaire(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='题目表';

CREATE TABLE t_question_option (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    question_id BIGINT NOT NULL COMMENT '所属题目ID',
    content VARCHAR(200) NOT NULL COMMENT '选项文字',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序号',
    KEY idx_question_sort (question_id, sort_order),
    CONSTRAINT fk_option_question FOREIGN KEY (question_id) REFERENCES t_question(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='题目选项表';

CREATE TABLE t_response (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    questionnaire_id BIGINT NOT NULL COMMENT '所属问卷ID',
    device_fingerprint VARCHAR(64) NULL COMMENT '设备指纹',
    ip_address VARCHAR(45) NULL COMMENT '提交者IP',
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
    KEY idx_questionnaire_time (questionnaire_id, submitted_at),
    KEY idx_device_check (questionnaire_id, device_fingerprint),
    CONSTRAINT fk_response_questionnaire FOREIGN KEY (questionnaire_id) REFERENCES t_questionnaire(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='答卷表';

CREATE TABLE t_answer (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    response_id BIGINT NOT NULL COMMENT '所属答卷ID',
    question_id BIGINT NOT NULL COMMENT '对应题目ID',
    answer_content TEXT NULL COMMENT '答案内容',
    KEY idx_response_id (response_id),
    KEY idx_question_id (question_id),
    CONSTRAINT fk_answer_response FOREIGN KEY (response_id) REFERENCES t_response(id) ON DELETE CASCADE,
    CONSTRAINT fk_answer_question FOREIGN KEY (question_id) REFERENCES t_question(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='答案表';

CREATE TABLE t_export_task (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    questionnaire_id BIGINT NOT NULL COMMENT '关联问卷ID',
    format VARCHAR(10) NOT NULL DEFAULT 'xlsx' COMMENT '导出格式: xlsx/csv',
    status VARCHAR(20) NOT NULL DEFAULT 'processing' COMMENT '任务状态: processing/completed/failed',
    file_path VARCHAR(500) NULL COMMENT '生成文件路径',
    file_name VARCHAR(200) NULL COMMENT '文件名',
    file_size BIGINT NULL COMMENT '文件大小(字节)',
    total_records INT NOT NULL DEFAULT 0 COMMENT '导出记录数',
    start_date DATE NULL COMMENT '导出数据起始日期',
    end_date DATE NULL COMMENT '导出数据结束日期',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL COMMENT '完成时间',
    expires_at DATETIME NULL COMMENT '文件过期时间',
    KEY idx_questionnaire (questionnaire_id),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='导出任务表';

INSERT INTO t_admin (username, password, locked, fail_count, created_at, updated_at)
VALUES (
    'admin',
    '$2a$10$ouxXvG.IFt6c66Vv7tC8hevbQiU0tf4uEbCsQ3DBjYwC2KF3oNFzy',
    0,
    0,
    NOW(),
    NOW()
);
