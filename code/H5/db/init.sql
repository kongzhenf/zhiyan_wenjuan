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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE t_questionnaire (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'draft',
    deadline DATETIME NULL,
    max_responses INT NULL,
    restrict_device TINYINT(1) NOT NULL DEFAULT 0,
    access_code VARCHAR(32) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_access_code (access_code),
    KEY idx_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE t_question (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    questionnaire_id BIGINT NOT NULL,
    type VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    required TINYINT(1) NOT NULL DEFAULT 1,
    config JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_questionnaire_sort (questionnaire_id, sort_order),
    CONSTRAINT fk_question_questionnaire FOREIGN KEY (questionnaire_id) REFERENCES t_questionnaire(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE t_question_option (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    question_id BIGINT NOT NULL,
    content VARCHAR(200) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    KEY idx_question_sort (question_id, sort_order),
    CONSTRAINT fk_option_question FOREIGN KEY (question_id) REFERENCES t_question(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE t_response (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    questionnaire_id BIGINT NOT NULL,
    device_fingerprint VARCHAR(64) NULL,
    ip_address VARCHAR(45) NULL,
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_questionnaire_time (questionnaire_id, submitted_at),
    KEY idx_device_check (questionnaire_id, device_fingerprint),
    CONSTRAINT fk_response_questionnaire FOREIGN KEY (questionnaire_id) REFERENCES t_questionnaire(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE t_answer (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    response_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    answer_content TEXT NULL,
    KEY idx_response_id (response_id),
    KEY idx_question_id (question_id),
    CONSTRAINT fk_answer_response FOREIGN KEY (response_id) REFERENCES t_response(id) ON DELETE CASCADE,
    CONSTRAINT fk_answer_question FOREIGN KEY (question_id) REFERENCES t_question(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO t_admin (username, password, locked, fail_count, created_at, updated_at)
VALUES (
    'admin',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    0,
    0,
    NOW(),
    NOW()
);
