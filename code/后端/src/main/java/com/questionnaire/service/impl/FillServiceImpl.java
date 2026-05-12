package com.questionnaire.service.impl;

import com.questionnaire.common.BizException;
import com.questionnaire.common.ErrorCode;
import com.questionnaire.config.RateLimiter;
import com.questionnaire.dto.SubmitAnswerItem;
import com.questionnaire.dto.SubmitRequest;
import com.questionnaire.entity.*;
import com.questionnaire.repository.*;
import com.questionnaire.service.FillService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FillServiceImpl implements FillService {

    private final QuestionnaireRepository questionnaireRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final ResponseRepository responseRepository;
    private final AnswerRepository answerRepository;
    private final RateLimiter rateLimiter;

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getQuestionnaire(String linkId) {
        Questionnaire questionnaire = findQuestionnaireByLinkId(linkId);

        String status = questionnaire.getStatus();
        if ("closed".equals(status)) {
            throw new BizException(ErrorCode.H5_QUESTIONNAIRE_CLOSED);
        }
        if ("draft".equals(status)) {
            throw new BizException(ErrorCode.H5_QUESTIONNAIRE_NOT_PUBLISHED);
        }

        List<Question> questions = questionRepository.findByQuestionnaireIdOrderBySortOrderAsc(questionnaire.getId());

        List<Map<String, Object>> questionList = new ArrayList<>();
        for (Question question : questions) {
            Map<String, Object> questionMap = new LinkedHashMap<>();
            questionMap.put("questionId", question.getId());
            questionMap.put("type", question.getType());
            questionMap.put("title", question.getContent());
            questionMap.put("required", question.getRequired());
            questionMap.put("sortOrder", question.getSortOrder());

            if (question.getConfig() != null) {
                questionMap.put("config", question.getConfig());
            }

            List<QuestionOption> options = questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(question.getId());
            List<Map<String, Object>> optionList = new ArrayList<>();
            for (QuestionOption option : options) {
                Map<String, Object> optionMap = new LinkedHashMap<>();
                optionMap.put("optionId", option.getId());
                optionMap.put("content", option.getContent());
                optionMap.put("sortOrder", option.getSortOrder());
                optionList.add(optionMap);
            }
            questionMap.put("options", optionList);
            questionList.add(questionMap);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("questionnaireId", questionnaire.getId());
        result.put("title", questionnaire.getTitle());
        result.put("description", questionnaire.getDescription());
        result.put("status", questionnaire.getStatus());
        result.put("questions", questionList);

        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> submitResponse(String linkId, SubmitRequest request, String ipAddress) {
        if (!rateLimiter.isAllowed("fill:ip:" + ipAddress, 10, 60)) {
            throw new BizException(ErrorCode.H5_RATE_LIMIT);
        }

        Questionnaire questionnaire = findQuestionnaireByLinkId(linkId);

        if (!"active".equals(questionnaire.getStatus())) {
            if ("closed".equals(questionnaire.getStatus())) {
                throw new BizException(ErrorCode.H5_QUESTIONNAIRE_CLOSED);
            }
            throw new BizException(ErrorCode.H5_QUESTIONNAIRE_NOT_PUBLISHED);
        }

        if (questionnaire.getMaxResponses() != null) {
            long currentCount = responseRepository.countByQuestionnaireId(questionnaire.getId());
            if (currentCount >= questionnaire.getMaxResponses()) {
                throw new BizException(ErrorCode.H5_MAX_RESPONSES);
            }
        }

        if (Boolean.TRUE.equals(questionnaire.getRestrictDevice())) {
            String deviceId = request.getDeviceId();
            if (deviceId != null && !deviceId.isBlank()) {
                boolean exists = responseRepository.existsByQuestionnaireIdAndDeviceFingerprint(
                        questionnaire.getId(), deviceId);
                if (exists) {
                    throw new BizException(ErrorCode.H5_DUPLICATE_SUBMIT);
                }
            }
        }

        List<Question> questions = questionRepository.findByQuestionnaireIdOrderBySortOrderAsc(questionnaire.getId());
        Map<Long, Question> questionMap = questions.stream()
                .collect(Collectors.toMap(Question::getId, q -> q));

        Map<Long, List<QuestionOption>> optionsMap = new HashMap<>();
        for (Question question : questions) {
            List<QuestionOption> options = questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(question.getId());
            optionsMap.put(question.getId(), options);
        }

        Map<Long, SubmitAnswerItem> answerItemMap = new HashMap<>();
        if (request.getAnswers() != null) {
            for (SubmitAnswerItem item : request.getAnswers()) {
                if (item.getQuestionId() != null) {
                    answerItemMap.put(item.getQuestionId(), item);
                }
            }
        }

        for (Question question : questions) {
            if (Boolean.TRUE.equals(question.getRequired())) {
                SubmitAnswerItem answerItem = answerItemMap.get(question.getId());
                if (answerItem == null || answerItem.getValue() == null || answerItem.getValue().toString().isBlank()) {
                    throw new BizException(ErrorCode.H5_VALIDATION_FAILED, "必填题目未作答: " + question.getContent());
                }
            }
        }

        Map<Long, String> processedAnswers = new HashMap<>();
        for (SubmitAnswerItem item : request.getAnswers()) {
            if (item.getQuestionId() == null || item.getValue() == null || item.getValue().toString().isBlank()) {
                continue;
            }

            Question question = questionMap.get(item.getQuestionId());
            if (question == null) {
                throw new BizException(ErrorCode.H5_VALIDATION_FAILED, "题目不存在: " + item.getQuestionId());
            }

            String type = question.getType();
            String answerContent;

            switch (type) {
                case "radio":
                case "dropdown": {
                    String valueStr = item.getValue().toString();
                    Long optionId = parseOptionId(valueStr);
                    validateOptionBelongsToQuestion(optionId, optionsMap.get(question.getId()));
                    answerContent = String.valueOf(optionId);
                    break;
                }
                case "checkbox": {
                    String valueStr;
                    if (item.getValue() instanceof List<?> valueList) {
                        valueStr = valueList.stream()
                                .map(Object::toString)
                                .collect(Collectors.joining(","));
                    } else {
                        valueStr = item.getValue().toString();
                    }
                    String[] parts = valueStr.split(",");
                    List<Long> optionIds = new ArrayList<>();
                    for (String part : parts) {
                        Long optionId = parseOptionId(part.trim());
                        validateOptionBelongsToQuestion(optionId, optionsMap.get(question.getId()));
                        optionIds.add(optionId);
                    }
                    answerContent = optionIds.stream()
                            .map(String::valueOf)
                            .collect(Collectors.joining(","));
                    break;
                }
                case "input": {
                    answerContent = item.getValue().toString();
                    break;
                }
                case "rating": {
                    answerContent = item.getValue().toString();
                    break;
                }
                default:
                    answerContent = item.getValue().toString();
                    break;
            }

            processedAnswers.put(item.getQuestionId(), answerContent);
        }

        Response response = new Response();
        response.setQuestionnaireId(questionnaire.getId());
        response.setIpAddress(ipAddress);
        if (request.getDeviceId() != null && !request.getDeviceId().isBlank()) {
            response.setDeviceFingerprint(request.getDeviceId());
        }
        response = responseRepository.save(response);

        for (Map.Entry<Long, String> entry : processedAnswers.entrySet()) {
            Answer answer = new Answer();
            answer.setResponseId(response.getId());
            answer.setQuestionId(entry.getKey());
            answer.setAnswerContent(entry.getValue());
            answerRepository.save(answer);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("responseId", response.getId());
        result.put("completionMessage", "感谢您的参与！");
        result.put("submittedAt", response.getSubmittedAt());

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> checkStatus(String linkId, String deviceId) {
        Questionnaire questionnaire = findQuestionnaireByLinkId(linkId);

        String status = questionnaire.getStatus();
        boolean fillable = "active".equals(status);
        boolean submitted = false;
        String statusMessage = "";

        if ("closed".equals(status)) {
            statusMessage = "本问卷已结束，感谢关注";
            fillable = false;
        } else if ("draft".equals(status)) {
            statusMessage = "问卷未发布";
            fillable = false;
        }

        if (fillable && questionnaire.getMaxResponses() != null) {
            long currentCount = responseRepository.countByQuestionnaireId(questionnaire.getId());
            if (currentCount >= questionnaire.getMaxResponses()) {
                fillable = false;
                statusMessage = "问卷已达回收上限";
            }
        }

        if (fillable && Boolean.TRUE.equals(questionnaire.getRestrictDevice())
                && deviceId != null && !deviceId.isBlank()) {
            boolean exists = responseRepository.existsByQuestionnaireIdAndDeviceFingerprint(
                    questionnaire.getId(), deviceId);
            if (exists) {
                submitted = true;
                fillable = false;
                statusMessage = "您已填写过本问卷";
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("fillable", fillable);
        result.put("submitted", submitted);
        result.put("status", status);
        result.put("statusMessage", statusMessage);

        return result;
    }

    private Long parseOptionId(String value) {
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException e) {
            throw new BizException(ErrorCode.H5_VALIDATION_FAILED, "选项ID格式无效: " + value);
        }
    }

    private void validateOptionBelongsToQuestion(Long optionId, List<QuestionOption> validOptions) {
        boolean valid = validOptions.stream().anyMatch(opt -> opt.getId().equals(optionId));
        if (!valid) {
            throw new BizException(ErrorCode.H5_VALIDATION_FAILED, "选项不属于该题目: " + optionId);
        }
    }

    private Questionnaire findQuestionnaireByLinkId(String linkId) {
        try {
            Long id = Long.parseLong(linkId.trim());
            return questionnaireRepository.findById(id)
                    .filter(q -> !Boolean.TRUE.equals(q.getDeleted()))
                    .orElseThrow(() -> new BizException(ErrorCode.H5_QUESTIONNAIRE_NOT_FOUND));
        } catch (NumberFormatException e) {
            throw new BizException(ErrorCode.H5_QUESTIONNAIRE_NOT_FOUND);
        }
    }
}
