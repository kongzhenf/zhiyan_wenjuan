package com.questionnaire.controller;

import com.questionnaire.common.PageResult;
import com.questionnaire.common.Result;
import com.questionnaire.service.QuestionnaireService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/questionnaires")
public class QuestionnaireController {

    private final QuestionnaireService questionnaireService;

    public QuestionnaireController(QuestionnaireService questionnaireService) {
        this.questionnaireService = questionnaireService;
    }

    @GetMapping
    public Result<PageResult<Map<String, Object>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder,
            HttpServletRequest request) {
        return Result.ok(questionnaireService.list(page, pageSize, status, keyword, sortBy, sortOrder));
    }

    @PostMapping
    public Result<Map<String, Object>> create(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        String title = (String) body.get("title");
        String description = (String) body.get("description");
        return Result.ok("创建成功", questionnaireService.create(title, description));
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> getDetail(@PathVariable Long id, HttpServletRequest request) {
        return Result.ok(questionnaireService.getDetail(id));
    }

    @PutMapping("/{id}")
    public Result<Map<String, Object>> update(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpServletRequest request) {
        String title = (String) body.get("title");
        String description = (String) body.get("description");
        return Result.ok("更新成功", questionnaireService.update(id, title, description));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id,
                               @RequestParam(defaultValue = "false") boolean confirm,
                               HttpServletRequest request) {
        questionnaireService.delete(id, confirm);
        return Result.ok("删除成功", null);
    }

    @PostMapping("/{id}/questions")
    @SuppressWarnings("unchecked")
    public Result<Map<String, Object>> addQuestion(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpServletRequest request) {
        String type = (String) body.get("type");
        String title = (String) body.get("title");
        Boolean required = (Boolean) body.get("required");
        List<Map<String, Object>> options = (List<Map<String, Object>>) body.get("options");
        Map<String, Object> config = (Map<String, Object>) body.get("config");
        return Result.ok("添加成功", questionnaireService.addQuestion(id, type, title, required, options, config));
    }

    @PutMapping("/{id}/questions/{qid}")
    @SuppressWarnings("unchecked")
    public Result<Map<String, Object>> updateQuestion(@PathVariable Long id, @PathVariable Long qid, @RequestBody Map<String, Object> body, HttpServletRequest request) {
        String title = (String) body.get("title");
        Boolean required = (Boolean) body.get("required");
        List<Map<String, Object>> options = (List<Map<String, Object>>) body.get("options");
        Map<String, Object> config = (Map<String, Object>) body.get("config");
        return Result.ok("更新成功", questionnaireService.updateQuestion(id, qid, title, required, options, config));
    }

    @DeleteMapping("/{id}/questions/{qid}")
    public Result<Void> deleteQuestion(@PathVariable Long id, @PathVariable Long qid, HttpServletRequest request) {
        questionnaireService.deleteQuestion(id, qid);
        return Result.ok("删除成功", null);
    }

    @PutMapping("/{id}/questions/sort")
    @SuppressWarnings("unchecked")
    public Result<Void> sortQuestions(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpServletRequest request) {
        List<Number> rawIds = (List<Number>) body.get("questionIds");
        List<Long> questionIds = rawIds.stream().map(Number::longValue).toList();
        questionnaireService.sortQuestions(id, questionIds);
        return Result.ok("排序成功", null);
    }

    @PostMapping("/{id}/publish")
    public Result<Map<String, Object>> publish(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body, HttpServletRequest request) {
        if (body == null) body = Map.of();
        String deadline = (String) body.get("deadline");
        Integer maxResponses = body.get("maxResponses") != null ? ((Number) body.get("maxResponses")).intValue() : null;
        Boolean allowDuplicateDevice = (Boolean) body.get("allowDuplicateDevice");
        return Result.ok("发布成功", questionnaireService.publish(id, deadline, maxResponses, allowDuplicateDevice));
    }

    @PutMapping("/{id}/close")
    public Result<Map<String, Object>> close(@PathVariable Long id, HttpServletRequest request) {
        return Result.ok("问卷已关闭", questionnaireService.close(id));
    }

    @PostMapping("/{id}/copy")
    public Result<Map<String, Object>> copy(@PathVariable Long id, HttpServletRequest request) {
        return Result.ok("复制成功", questionnaireService.copy(id));
    }

    @PutMapping("/{id}/draft")
    @SuppressWarnings("unchecked")
    public Result<Map<String, Object>> saveDraft(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpServletRequest request) {
        String title = (String) body.get("title");
        String description = (String) body.get("description");
        List<Map<String, Object>> questions = (List<Map<String, Object>>) body.get("questions");
        return Result.ok("保存成功", questionnaireService.saveDraft(id, title, description, questions));
    }

    @GetMapping("/{id}/preview")
    public Result<Map<String, Object>> preview(@PathVariable Long id, HttpServletRequest request) {
        return Result.ok(questionnaireService.preview(id));
    }

    @GetMapping(value = "/{id}/qrcode", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getQrcode(@PathVariable Long id,
                                            @RequestParam(required = false) Integer size,
                                            @RequestParam(defaultValue = "png") String format,
                                            HttpServletRequest request) {
        byte[] image = questionnaireService.getQrcode(id, size);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(image);
    }

    @GetMapping("/{id}/link")
    public Result<Map<String, Object>> getLink(@PathVariable Long id, HttpServletRequest request) {
        return Result.ok(questionnaireService.getLink(id));
    }
}
