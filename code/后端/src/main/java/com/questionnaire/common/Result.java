package com.questionnaire.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Result<T> {

    private boolean success;
    private int code;
    private String message;
    private T result;

    private Result() {}

    public static <T> Result<T> ok(T data) {
        Result<T> r = new Result<>();
        r.setSuccess(true);
        r.setCode(200);
        r.setMessage("操作成功");
        r.setResult(data);
        return r;
    }

    public static <T> Result<T> ok(String message, T data) {
        Result<T> r = new Result<>();
        r.setSuccess(true);
        r.setCode(200);
        r.setMessage(message);
        r.setResult(data);
        return r;
    }

    public static <T> Result<T> ok() {
        return ok(null);
    }

    public static <T> Result<T> fail(int code, String message) {
        Result<T> r = new Result<>();
        r.setSuccess(false);
        r.setCode(code);
        r.setMessage(message);
        r.setResult(null);
        return r;
    }

    public static <T> Result<T> fail(int code, String message, T data) {
        Result<T> r = new Result<>();
        r.setSuccess(false);
        r.setCode(code);
        r.setMessage(message);
        r.setResult(data);
        return r;
    }
}
