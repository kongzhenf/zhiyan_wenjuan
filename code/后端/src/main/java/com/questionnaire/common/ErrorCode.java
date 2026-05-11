package com.questionnaire.common;

import lombok.Getter;

@Getter
public enum ErrorCode {

    SUCCESS(200, "操作成功"),

    PARAM_INVALID(400001, "请求参数校验失败"),
    OPTION_COUNT_INVALID(400002, "选项数量不符合要求"),
    QUESTION_LIMIT_EXCEEDED(400003, "题目数量已达上限"),
    SORT_IDS_MISMATCH(400004, "题目ID列表与实际题目不匹配"),
    NO_QUESTIONS(400005, "请至少添加一道题目后再发布"),
    QUESTION_CONFIG_INCOMPLETE(400006, "题目配置不完整"),
    STATUS_NOT_ALLOW_PUBLISH(400007, "当前状态不允许发布"),
    STATUS_NOT_ALLOW_CLOSE(400008, "当前状态不允许关闭"),
    STATUS_NOT_ALLOW_DRAFT(400009, "当前状态不支持草稿保存"),
    DELETE_NEED_CONFIRM(400010, "删除需二次确认"),
    NOT_PUBLISHED(400011, "问卷尚未发布"),

    TOKEN_INVALID(401000, "Token无效或已过期"),
    LOGIN_FAILED(401001, "用户名或密码错误"),
    ACCOUNT_LOCKED(401002, "账号已锁定，请10分钟后再试"),
    REFRESH_TOKEN_INVALID(401003, "refreshToken已过期或无效，请重新登录"),

    QUESTIONNAIRE_NOT_FOUND(404001, "问卷不存在"),
    QUESTION_NOT_FOUND(404002, "题目不存在"),

    // H5端错误码
    H5_VALIDATION_FAILED(4001, "提交校验失败"),
    H5_QUESTION_TYPE_MISMATCH(4002, "该题目不是填空题，无法查看原文列表"),
    H5_NO_DATA_EXPORT(4003, "暂无数据可导出"),
    H5_EXPORT_PROCESSING(4004, "导出文件正在生成中，请稍后再试"),
    H5_EXPORT_EXPIRED(4005, "导出文件已过期，请重新导出"),
    H5_UNAUTHORIZED(4010, "未登录或Token已过期，请重新登录"),
    H5_QUESTIONNAIRE_CLOSED(4031, "本问卷已结束，感谢关注"),
    H5_QUESTIONNAIRE_NOT_PUBLISHED(4032, "问卷未发布"),
    H5_QUESTIONNAIRE_NOT_FOUND(4040, "问卷不存在"),
    H5_QUESTION_NOT_FOUND(4041, "题目不存在"),
    H5_DUPLICATE_SUBMIT(4091, "您已填写过本问卷"),
    H5_RATE_LIMIT(4290, "提交频率超限，请稍后再试"),
    H5_MAX_RESPONSES(4032, "问卷已达回收上限");

    private final int code;
    private final String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }
}
