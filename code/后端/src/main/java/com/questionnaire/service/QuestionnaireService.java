package com.questionnaire.service;

import com.questionnaire.common.PageResult;

import java.util.List;
import java.util.Map;

public interface QuestionnaireService {

    PageResult<Map<String, Object>> list(int page, int pageSize, String status, String keyword, String sortBy, String sortOrder);

    Map<String, Object> create(String title, String description);

    Map<String, Object> getDetail(Long id);

    Map<String, Object> update(Long id, String title, String description);

    void delete(Long id, boolean confirm);

    Map<String, Object> addQuestion(Long questionnaireId, String type, String title, Boolean required, List<Map<String, Object>> options, Map<String, Object> config);

    Map<String, Object> updateQuestion(Long questionnaireId, Long questionId, String title, Boolean required, List<Map<String, Object>> options, Map<String, Object> config);

    void deleteQuestion(Long questionnaireId, Long questionId);

    void sortQuestions(Long questionnaireId, List<Long> questionIds);

    Map<String, Object> publish(Long id, String deadline, Integer maxResponses, Boolean allowDuplicateDevice);

    Map<String, Object> close(Long id);

    Map<String, Object> copy(Long id);

    Map<String, Object> saveDraft(Long id, String title, String description, List<Map<String, Object>> questions);

    Map<String, Object> preview(Long id);

    byte[] getQrcode(Long id, Integer size);

    Map<String, Object> getLink(Long id);
}
