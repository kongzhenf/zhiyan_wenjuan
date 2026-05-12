package com.questionnaire.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.questionnaire.common.BizException;
import com.questionnaire.common.ErrorCode;
import com.questionnaire.common.PageResult;
import com.questionnaire.entity.Question;
import com.questionnaire.entity.QuestionOption;
import com.questionnaire.entity.Questionnaire;
import com.questionnaire.repository.QuestionOptionRepository;
import com.questionnaire.repository.QuestionRepository;
import com.questionnaire.repository.QuestionnaireRepository;
import com.questionnaire.repository.ResponseRepository;
import com.questionnaire.service.QuestionnaireService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class QuestionnaireServiceImpl implements QuestionnaireService {

    private final QuestionnaireRepository questionnaireRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final ResponseRepository responseRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.h5-base-url}")
    private String h5BaseUrl;

    public QuestionnaireServiceImpl(QuestionnaireRepository questionnaireRepository,
                                     QuestionRepository questionRepository,
                                     QuestionOptionRepository questionOptionRepository,
                                     ResponseRepository responseRepository,
                                     ObjectMapper objectMapper) {
        this.questionnaireRepository = questionnaireRepository;
        this.questionRepository = questionRepository;
        this.questionOptionRepository = questionOptionRepository;
        this.responseRepository = responseRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult<Map<String, Object>> list(int page, int pageSize, String status, String keyword, String sortBy, String sortOrder) {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        String sortField = "updatedAt".equals(sortBy) ? "updatedAt" : "createdAt";
        Sort sort = "asc".equalsIgnoreCase(sortOrder) ? Sort.by(sortField).ascending() : Sort.by(sortField).descending();
        Pageable pageable = PageRequest.of(page - 1, pageSize, sort);

        String statusParam = (status != null && !status.isBlank()) ? status : null;
        String keywordParam = (keyword != null && !keyword.isBlank()) ? keyword : null;

        Page<Questionnaire> pageData = questionnaireRepository.findByFilters(statusParam, keywordParam, pageable);

        List<Map<String, Object>> list = pageData.getContent().stream().map(q -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", q.getId());
            map.put("questionnaireId", String.format("%03d", q.getId()));
            map.put("title", q.getTitle());
            map.put("status", q.getStatus());
            map.put("responseCount", responseRepository.countByQuestionnaireId(q.getId()));
            map.put("createdAt", q.getCreatedAt());
            map.put("updatedAt", q.getUpdatedAt());
            return map;
        }).collect(Collectors.toList());

        return PageResult.of(page, pageSize, pageData.getTotalElements(), list);
    }

    @Override
    @Transactional
    public Map<String, Object> create(String title, String description) {
        if (title == null || title.isBlank()) {
            throw new BizException(ErrorCode.PARAM_INVALID, "请输入问卷标题");
        }
        if (title.length() > 100) {
            throw new BizException(ErrorCode.PARAM_INVALID, "问卷标题不能超过100字符");
        }
        if (description != null && description.length() > 500) {
            throw new BizException(ErrorCode.PARAM_INVALID, "问卷描述不能超过500字符");
        }

        Questionnaire questionnaire = new Questionnaire();
        questionnaire.setTitle(title);
        questionnaire.setDescription(description);
        questionnaire.setStatus("draft");
        questionnaire.setAccessCode(generateAccessCode());
        questionnaire.setDeleted(false);
        questionnaire.setRestrictDevice(false);

        questionnaire = questionnaireRepository.save(questionnaire);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", questionnaire.getId());
        result.put("title", questionnaire.getTitle());
        result.put("description", questionnaire.getDescription());
        result.put("status", questionnaire.getStatus());
        result.put("createdAt", questionnaire.getCreatedAt());
        result.put("updatedAt", questionnaire.getUpdatedAt());
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getDetail(Long id) {
        Questionnaire questionnaire = findQuestionnaireOrThrow(id);

        List<Question> questions = questionRepository.findByQuestionnaireIdOrderBySortOrderAsc(id);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", questionnaire.getId());
        result.put("title", questionnaire.getTitle());
        result.put("description", questionnaire.getDescription());
        result.put("status", questionnaire.getStatus());
        result.put("responseCount", responseRepository.countByQuestionnaireId(id));

        Map<String, Object> config = new LinkedHashMap<>();
        config.put("deadline", questionnaire.getDeadline());
        config.put("maxResponses", questionnaire.getMaxResponses());
        config.put("allowDuplicateDevice", !questionnaire.getRestrictDevice());
        result.put("config", config);

        List<Map<String, Object>> questionList = questions.stream().map(this::buildQuestionMap).collect(Collectors.toList());
        result.put("questions", questionList);
        result.put("createdAt", questionnaire.getCreatedAt());
        result.put("updatedAt", questionnaire.getUpdatedAt());
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> update(Long id, String title, String description) {
        Questionnaire questionnaire = findQuestionnaireOrThrow(id);

        if (title != null) {
            if (title.isBlank()) {
                throw new BizException(ErrorCode.PARAM_INVALID, "问卷标题不能为空");
            }
            if (title.length() > 100) {
                throw new BizException(ErrorCode.PARAM_INVALID, "问卷标题不能超过100字符");
            }
            questionnaire.setTitle(title);
        }
        if (description != null) {
            if (description.length() > 500) {
                throw new BizException(ErrorCode.PARAM_INVALID, "问卷描述不能超过500字符");
            }
            questionnaire.setDescription(description);
        }

        questionnaire = questionnaireRepository.save(questionnaire);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", questionnaire.getId());
        result.put("title", questionnaire.getTitle());
        result.put("description", questionnaire.getDescription());
        result.put("status", questionnaire.getStatus());
        result.put("updatedAt", questionnaire.getUpdatedAt());
        return result;
    }

    @Override
    @Transactional
    public void delete(Long id, boolean confirm) {
        Questionnaire questionnaire = findQuestionnaireOrThrow(id);
        long responseCount = responseRepository.countByQuestionnaireId(id);

        if (responseCount > 0 && !confirm) {
            throw new BizException(ErrorCode.DELETE_NEED_CONFIRM,
                    "该问卷已有" + responseCount + "条回收数据，删除后不可恢复，请传confirm=true确认删除");
        }

        questionnaire.setDeleted(true);
        questionnaireRepository.save(questionnaire);
    }

    @Override
    @Transactional
    public Map<String, Object> addQuestion(Long questionnaireId, String type, String title, Boolean required, List<Map<String, Object>> options, Map<String, Object> config) {
        Questionnaire questionnaire = findQuestionnaireOrThrow(questionnaireId);

        int currentCount = questionRepository.countByQuestionnaireId(questionnaireId);
        if (currentCount >= 50) {
            throw new BizException(ErrorCode.QUESTION_LIMIT_EXCEEDED);
        }

        if (type == null || type.isBlank()) {
            throw new BizException(ErrorCode.PARAM_INVALID, "题目类型不能为空");
        }
        if (title != null && title.length() > 500) {
            throw new BizException(ErrorCode.PARAM_INVALID, "题干文字不能超过500字符");
        }

        validateOptionsForType(type, options);

        Question question = new Question();
        question.setQuestionnaire(questionnaire);
        question.setType(type);
        question.setContent(title);
        question.setRequired(required != null ? required : false);
        question.setSortOrder(currentCount + 1);
        question.setConfig(serializeConfig(config));

        question = questionRepository.save(question);

        if (options != null && !options.isEmpty()) {
            saveOptions(question, options);
        }

        List<QuestionOption> savedOptions = questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(question.getId());
        question.getOptions().clear();
        question.getOptions().addAll(savedOptions);

        return buildQuestionMap(question);
    }

    @Override
    @Transactional
    public Map<String, Object> updateQuestion(Long questionnaireId, Long questionId, String title, Boolean required, List<Map<String, Object>> options, Map<String, Object> config) {
        findQuestionnaireOrThrow(questionnaireId);
        Question question = questionRepository.findByIdAndQuestionnaireId(questionId, questionnaireId)
                .orElseThrow(() -> new BizException(ErrorCode.QUESTION_NOT_FOUND));

        if (title != null) {
            if (title.isBlank()) {
                throw new BizException(ErrorCode.PARAM_INVALID, "题干文字不能为空");
            }
            if (title.length() > 500) {
                throw new BizException(ErrorCode.PARAM_INVALID, "题干文字不能超过500字符");
            }
        question.setContent(title != null ? title : "");
        }
        if (required != null) {
            question.setRequired(required);
        }
        if (config != null) {
            question.setConfig(serializeConfig(config));
        }

        if (options != null) {
            validateOptionsForType(question.getType(), options);
            questionOptionRepository.deleteByQuestionId(questionId);
            questionOptionRepository.flush();
            saveOptions(question, options);
        }

        question = questionRepository.save(question);

        List<QuestionOption> savedOptions = questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(question.getId());
        question.getOptions().clear();
        question.getOptions().addAll(savedOptions);

        return buildQuestionMap(question);
    }

    @Override
    @Transactional
    public void deleteQuestion(Long questionnaireId, Long questionId) {
        findQuestionnaireOrThrow(questionnaireId);
        Question question = questionRepository.findByIdAndQuestionnaireId(questionId, questionnaireId)
                .orElseThrow(() -> new BizException(ErrorCode.QUESTION_NOT_FOUND));

        int deletedOrder = question.getSortOrder();
        questionRepository.delete(question);

        List<Question> remainingQuestions = questionRepository.findByQuestionnaireIdOrderBySortOrderAsc(questionnaireId);
        int order = 1;
        for (Question q : remainingQuestions) {
            if (!q.getSortOrder().equals(order)) {
                q.setSortOrder(order);
                questionRepository.save(q);
            }
            order++;
        }
    }

    @Override
    @Transactional
    public void sortQuestions(Long questionnaireId, List<Long> questionIds) {
        findQuestionnaireOrThrow(questionnaireId);
        List<Question> questions = questionRepository.findByQuestionnaireIdOrderBySortOrderAsc(questionnaireId);

        if (questionIds.size() != questions.size()) {
            throw new BizException(ErrorCode.SORT_IDS_MISMATCH);
        }

        Set<Long> existingIds = questions.stream().map(Question::getId).collect(Collectors.toSet());
        Set<Long> inputIds = new HashSet<>(questionIds);
        if (!existingIds.equals(inputIds)) {
            throw new BizException(ErrorCode.SORT_IDS_MISMATCH);
        }

        Map<Long, Question> questionMap = questions.stream().collect(Collectors.toMap(Question::getId, q -> q));
        for (int i = 0; i < questionIds.size(); i++) {
            Question q = questionMap.get(questionIds.get(i));
            q.setSortOrder(i + 1);
            questionRepository.save(q);
        }
    }

    @Override
    @Transactional
    public Map<String, Object> publish(Long id, String deadline, Integer maxResponses, Boolean allowDuplicateDevice) {
        Questionnaire questionnaire = findQuestionnaireOrThrow(id);

        if (!"draft".equals(questionnaire.getStatus())) {
            throw new BizException(ErrorCode.STATUS_NOT_ALLOW_PUBLISH);
        }

        List<Question> questions = questionRepository.findByQuestionnaireIdOrderBySortOrderAsc(id);
        if (questions.isEmpty()) {
            throw new BizException(ErrorCode.NO_QUESTIONS);
        }

        for (int i = 0; i < questions.size(); i++) {
            Question q = questions.get(i);
            if (q.getContent() == null || q.getContent().isBlank()) {
                throw new BizException(ErrorCode.QUESTION_CONFIG_INCOMPLETE,
                        "第" + (i + 1) + "题题干文字不能为空，请检查后重试");
            }
            if (isChoiceType(q.getType())) {
                List<QuestionOption> opts = questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(q.getId());
                if (opts.size() < 2) {
                    throw new BizException(ErrorCode.QUESTION_CONFIG_INCOMPLETE,
                            "第" + (i + 1) + "题选项配置不完整，请检查后重试");
                }
            }
        }

        questionnaire.setStatus("active");
        if (deadline != null && !deadline.isBlank()) {
            questionnaire.setDeadline(LocalDateTime.parse(deadline, DateTimeFormatter.ISO_DATE_TIME));
        }
        if (maxResponses != null) {
            questionnaire.setMaxResponses(maxResponses);
        }
        if (allowDuplicateDevice != null) {
            questionnaire.setRestrictDevice(!allowDuplicateDevice);
        }

        questionnaire = questionnaireRepository.save(questionnaire);

        String link = h5BaseUrl + "/" + String.format("%03d", questionnaire.getId());

        Map<String, Object> configMap = new LinkedHashMap<>();
        configMap.put("deadline", questionnaire.getDeadline());
        configMap.put("maxResponses", questionnaire.getMaxResponses());
        configMap.put("allowDuplicateDevice", !questionnaire.getRestrictDevice());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", questionnaire.getId());
        result.put("status", questionnaire.getStatus());
        result.put("publishedAt", questionnaire.getUpdatedAt());
        result.put("config", configMap);
        result.put("link", link);
        result.put("qrcodeUrl", "/api/questionnaires/" + questionnaire.getId() + "/qrcode");
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> close(Long id) {
        Questionnaire questionnaire = findQuestionnaireOrThrow(id);

        if (!"active".equals(questionnaire.getStatus())) {
            throw new BizException(ErrorCode.STATUS_NOT_ALLOW_CLOSE, "当前状态不允许关闭（仅进行中的问卷可关闭）");
        }

        questionnaire.setStatus("closed");
        questionnaire = questionnaireRepository.save(questionnaire);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", questionnaire.getId());
        result.put("status", questionnaire.getStatus());
        result.put("closedAt", questionnaire.getUpdatedAt());
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> copy(Long id) {
        Questionnaire source = findQuestionnaireOrThrow(id);

        Questionnaire copy = new Questionnaire();
        copy.setTitle(source.getTitle() + "（副本）");
        copy.setDescription(source.getDescription());
        copy.setStatus("draft");
        copy.setAccessCode(generateAccessCode());
        copy.setDeleted(false);
        copy.setRestrictDevice(false);

        copy = questionnaireRepository.save(copy);

        List<Question> sourceQuestions = questionRepository.findByQuestionnaireIdOrderBySortOrderAsc(id);
        for (Question sq : sourceQuestions) {
            Question newQ = new Question();
            newQ.setQuestionnaire(copy);
            newQ.setType(sq.getType());
            newQ.setContent(sq.getContent());
            newQ.setSortOrder(sq.getSortOrder());
            newQ.setRequired(sq.getRequired());
            newQ.setConfig(sq.getConfig());
            newQ = questionRepository.save(newQ);

            List<QuestionOption> sourceOpts = questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(sq.getId());
            for (QuestionOption so : sourceOpts) {
                QuestionOption newOpt = new QuestionOption();
                newOpt.setQuestion(newQ);
                newOpt.setContent(so.getContent());
                newOpt.setSortOrder(so.getSortOrder());
                questionOptionRepository.save(newOpt);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", copy.getId());
        result.put("title", copy.getTitle());
        result.put("status", copy.getStatus());
        result.put("questionCount", sourceQuestions.size());
        result.put("createdAt", copy.getCreatedAt());
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> saveDraft(Long id, String title, String description, List<Map<String, Object>> questions) {
        Questionnaire questionnaire = findQuestionnaireOrThrow(id);

        if (!"draft".equals(questionnaire.getStatus())) {
            throw new BizException(ErrorCode.STATUS_NOT_ALLOW_DRAFT, "已发布的问卷不支持草稿保存");
        }

        if (title != null) {
            questionnaire.setTitle(title);
        }
        if (description != null) {
            questionnaire.setDescription(description);
        }

        if (questions != null) {
            List<Question> existingQuestions = questionRepository.findByQuestionnaireIdOrderBySortOrderAsc(id);
            for (Question eq : existingQuestions) {
                questionOptionRepository.deleteByQuestionId(eq.getId());
            }
            questionRepository.deleteByQuestionnaireId(id);
            questionRepository.flush();

            for (Map<String, Object> qMap : questions) {
                Question question = new Question();
                question.setQuestionnaire(questionnaire);
                question.setType((String) qMap.get("type"));
                question.setContent((String) qMap.get("title"));
                question.setRequired(qMap.get("required") != null ? (Boolean) qMap.get("required") : false);

                Object sortOrderObj = qMap.get("sortOrder");
                int sortOrder = sortOrderObj instanceof Number ? ((Number) sortOrderObj).intValue() : 0;
                question.setSortOrder(sortOrder);

                if (qMap.get("config") != null) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> configMap = (Map<String, Object>) qMap.get("config");
                    question.setConfig(serializeConfig(configMap));
                }

                question = questionRepository.save(question);

                @SuppressWarnings("unchecked")
                List<Map<String, Object>> opts = (List<Map<String, Object>>) qMap.get("options");
                if (opts != null && !opts.isEmpty()) {
                    saveOptions(question, opts);
                }
            }
        }

        questionnaire = questionnaireRepository.save(questionnaire);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", questionnaire.getId());
        result.put("savedAt", questionnaire.getUpdatedAt());
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> preview(Long id) {
        Questionnaire questionnaire = findQuestionnaireOrThrow(id);

        List<Question> questions = questionRepository.findByQuestionnaireIdOrderBySortOrderAsc(id);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", questionnaire.getId());
        result.put("title", questionnaire.getTitle());
        result.put("description", questionnaire.getDescription());

        List<Map<String, Object>> questionList = questions.stream().map(this::buildQuestionMap).collect(Collectors.toList());
        result.put("questions", questionList);
        return result;
    }

    @Override
    public byte[] getQrcode(Long id, Integer size) {
        Questionnaire questionnaire = findQuestionnaireOrThrow(id);

        if ("draft".equals(questionnaire.getStatus())) {
            throw new BizException(ErrorCode.NOT_PUBLISHED, "问卷尚未发布，无法生成二维码");
        }

        if (size == null || size < 100) size = 300;
        if (size > 1000) size = 1000;

        String link = h5BaseUrl + "/" + String.format("%03d", questionnaire.getId());

        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.MARGIN, 1);

            BitMatrix bitMatrix = qrCodeWriter.encode(link, BarcodeFormat.QR_CODE, size, size, hints);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            return outputStream.toByteArray();
        } catch (WriterException | IOException e) {
            throw new RuntimeException("二维码生成失败", e);
        }
    }

    @Override
    public Map<String, Object> getLink(Long id) {
        Questionnaire questionnaire = findQuestionnaireOrThrow(id);

        if ("draft".equals(questionnaire.getStatus())) {
            throw new BizException(ErrorCode.NOT_PUBLISHED, "问卷尚未发布，无法获取访问链接");
        }

        String link = h5BaseUrl + "/" + String.format("%03d", questionnaire.getId());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("link", link);
        result.put("shortLink", link);
        result.put("qrcodeUrl", "/api/questionnaires/" + questionnaire.getId() + "/qrcode");
        return result;
    }

    private Questionnaire findQuestionnaireOrThrow(Long id) {
        return questionnaireRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new BizException(ErrorCode.QUESTIONNAIRE_NOT_FOUND));
    }

    private String generateAccessCode() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }

    private boolean isChoiceType(String type) {
        return "radio".equals(type) || "checkbox".equals(type) || "dropdown".equals(type);
    }

    private void validateOptionsForType(String type, List<Map<String, Object>> options) {
        if (isChoiceType(type)) {
            if (options == null || options.size() < 2) {
                throw new BizException(ErrorCode.OPTION_COUNT_INVALID, "选择题选项至少需要2项");
            }
            if (options.size() > 20) {
                throw new BizException(ErrorCode.OPTION_COUNT_INVALID, "选择题选项最多20项");
            }
            for (Map<String, Object> opt : options) {
                String text = (String) opt.get("text");
                if (text == null || text.isBlank()) {
                    throw new BizException(ErrorCode.PARAM_INVALID, "选项文字不能为空");
                }
                if (text.length() > 200) {
                    throw new BizException(ErrorCode.PARAM_INVALID, "选项文字不能超过200字符");
                }
            }
        }
    }

    private void saveOptions(Question question, List<Map<String, Object>> options) {
        for (int i = 0; i < options.size(); i++) {
            Map<String, Object> optMap = options.get(i);
            QuestionOption option = new QuestionOption();
            option.setQuestion(question);
            option.setContent((String) optMap.get("text"));
            option.setSortOrder(i + 1);
            questionOptionRepository.save(option);
        }
    }

    private String serializeConfig(Map<String, Object> config) {
        if (config == null || config.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(config);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("配置序列化失败", e);
        }
    }

    private Map<String, Object> deserializeConfig(String configJson) {
        if (configJson == null || configJson.isBlank()) {
            return new LinkedHashMap<>();
        }
        try {
            return objectMapper.readValue(configJson, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            return new LinkedHashMap<>();
        }
    }

    private Map<String, Object> buildQuestionMap(Question question) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", question.getId());
        map.put("type", question.getType());
        map.put("title", question.getContent());
        map.put("required", question.getRequired());
        map.put("sortOrder", question.getSortOrder());

        Map<String, Object> config = deserializeConfig(question.getConfig());
        if (!config.isEmpty()) {
            map.put("config", config);
        }

        List<QuestionOption> options;
        try {
            options = question.getOptions();
            if (options == null || options.isEmpty()) {
                options = questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(question.getId());
            }
        } catch (Exception e) {
            options = questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(question.getId());
        }

        List<Map<String, Object>> optionList = options.stream().map(opt -> {
            Map<String, Object> optMap = new LinkedHashMap<>();
            optMap.put("id", opt.getId());
            optMap.put("text", opt.getContent());
            optMap.put("sortOrder", opt.getSortOrder());
            return optMap;
        }).collect(Collectors.toList());
        map.put("options", optionList);

        return map;
    }
}
