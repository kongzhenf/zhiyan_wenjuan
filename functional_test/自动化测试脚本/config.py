# -*- coding: utf-8 -*-
"""
测试配置文件
从远程部署文档中获取的实际部署信息
"""

# ============ 服务地址配置 ============
BASE_URL = "http://10.32.129.153:8082"
API_BASE = f"{BASE_URL}/api"

# ============ 数据库配置 ============
DB_HOST = "10.32.129.153"
DB_PORT = 3307
DB_NAME = "questionnaire_db"
DB_USER = "root"
DB_PASSWORD = "questionnaire123"

# ============ Redis配置 ============
REDIS_HOST = "10.32.129.153"
REDIS_PORT = 6381
REDIS_PASSWORD = ""

# ============ 管理员账号 ============
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

# ============ 接口路径 ============
class Endpoints:
    # 认证管理
    AUTH_LOGIN = f"{API_BASE}/auth/login"
    AUTH_REFRESH = f"{API_BASE}/auth/refresh"
    AUTH_LOGOUT = f"{API_BASE}/auth/logout"

    # 问卷管理
    QUESTIONNAIRES = f"{API_BASE}/questionnaires"

    @staticmethod
    def questionnaire_detail(qid):
        return f"{API_BASE}/questionnaires/{qid}"

    @staticmethod
    def questionnaire_questions(qid):
        return f"{API_BASE}/questionnaires/{qid}/questions"

    @staticmethod
    def questionnaire_question_detail(qid, question_id):
        return f"{API_BASE}/questionnaires/{qid}/questions/{question_id}"

    @staticmethod
    def questionnaire_questions_sort(qid):
        return f"{API_BASE}/questionnaires/{qid}/questions/sort"

    @staticmethod
    def questionnaire_publish(qid):
        return f"{API_BASE}/questionnaires/{qid}/publish"

    @staticmethod
    def questionnaire_close(qid):
        return f"{API_BASE}/questionnaires/{qid}/close"

    @staticmethod
    def questionnaire_copy(qid):
        return f"{API_BASE}/questionnaires/{qid}/copy"

    @staticmethod
    def questionnaire_draft(qid):
        return f"{API_BASE}/questionnaires/{qid}/draft"

    @staticmethod
    def questionnaire_preview(qid):
        return f"{API_BASE}/questionnaires/{qid}/preview"

    @staticmethod
    def questionnaire_link(qid):
        return f"{API_BASE}/questionnaires/{qid}/link"

    @staticmethod
    def questionnaire_qrcode(qid):
        return f"{API_BASE}/questionnaires/{qid}/qrcode"

    # H5端填写
    @staticmethod
    def fill_get(link_id):
        return f"{API_BASE}/fill/{link_id}"

    @staticmethod
    def fill_submit(link_id):
        return f"{API_BASE}/fill/{link_id}/submit"

    @staticmethod
    def fill_status(link_id):
        return f"{API_BASE}/fill/{link_id}/status"

    # 数据统计
    @staticmethod
    def statistics_overview(qid):
        return f"{API_BASE}/statistics/{qid}/overview"

    @staticmethod
    def statistics_questions(qid):
        return f"{API_BASE}/statistics/{qid}/questions"

    @staticmethod
    def statistics_question_texts(qid, question_id):
        return f"{API_BASE}/statistics/{qid}/questions/{question_id}/texts"

    @staticmethod
    def statistics_export(qid):
        return f"{API_BASE}/statistics/{qid}/export"

    @staticmethod
    def statistics_export_download(export_id):
        return f"{API_BASE}/statistics/exports/{export_id}/download"

    STATISTICS_EXPORTS = f"{API_BASE}/statistics/exports"


# ============ 测试超时配置 ============
REQUEST_TIMEOUT = 30  # 秒
RATE_LIMIT_WAIT = 65  # 限流窗口等待时间（秒）
ACCOUNT_LOCK_WAIT = 610  # 账号锁定等待时间（秒）
