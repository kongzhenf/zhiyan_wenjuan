package com.questionnaire.service.impl;

import com.alibaba.excel.EasyExcel;
import com.questionnaire.common.BizException;
import com.questionnaire.common.ErrorCode;
import com.questionnaire.dto.ExportRequest;
import com.questionnaire.entity.*;
import com.questionnaire.repository.*;
import com.questionnaire.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StatisticsServiceImpl implements StatisticsService {

    private final QuestionnaireRepository questionnaireRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final ResponseRepository responseRepository;
    private final AnswerRepository answerRepository;
    private final ExportTaskRepository exportTaskRepository;

    @Value("${app.export-path}")
    private String exportPath;

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getOverview(Long questionnaireId, LocalDateTime startTime, LocalDateTime endTime) {
        Questionnaire questionnaire = questionnaireRepository.findByIdAndDeletedFalse(questionnaireId)
                .orElseThrow(() -> new BizException(ErrorCode.QUESTIONNAIRE_NOT_FOUND));

        long totalResponses = responseRepository.countByQuestionnaireId(questionnaireId);

        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = LocalDate.now().atTime(LocalTime.MAX);
        long todayResponses = responseRepository.countByQuestionnaireIdAndSubmittedAtBetween(
                questionnaireId, todayStart, todayEnd);

        long totalVisits = totalResponses;

        double responseRate = totalVisits > 0
                ? BigDecimal.valueOf((double) totalResponses / totalVisits * 100)
                    .setScale(1, RoundingMode.HALF_UP).doubleValue()
                : 0.0;

        LocalDateTime trendStart = startTime != null ? startTime : LocalDate.now().minusDays(29).atStartOfDay();
        LocalDateTime trendEnd = endTime != null ? endTime : LocalDate.now().atTime(LocalTime.MAX);
        List<Object[]> dailyCounts = responseRepository.countDailyResponses(
                questionnaireId, trendStart, trendEnd);

        Map<String, Long> dailyMap = new LinkedHashMap<>();
        for (Object[] row : dailyCounts) {
            String date = row[0].toString();
            Long count = ((Number) row[1]).longValue();
            dailyMap.put(date, count);
        }

        List<Map<String, Object>> trend = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDate rangeStart = trendStart.toLocalDate();
        LocalDate rangeEnd = trendEnd.toLocalDate();
        for (LocalDate date = rangeStart; !date.isAfter(rangeEnd); date = date.plusDays(1)) {
            String dateStr = date.format(formatter);
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", dateStr);
            point.put("count", dailyMap.getOrDefault(dateStr, 0L));
            trend.add(point);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalResponses", totalResponses);
        result.put("todayResponses", todayResponses);
        result.put("totalVisits", totalVisits);
        result.put("responseRate", responseRate);
        result.put("trend", trend);
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getQuestionStatistics(Long questionnaireId, LocalDateTime startTime, LocalDateTime endTime) {
        Questionnaire questionnaire = questionnaireRepository.findByIdAndDeletedFalse(questionnaireId)
                .orElseThrow(() -> new BizException(ErrorCode.QUESTIONNAIRE_NOT_FOUND));

        List<Question> questions = questionRepository.findByQuestionnaireIdOrderBySortOrderAsc(questionnaireId);

        List<Map<String, Object>> questionStats = new ArrayList<>();
        for (Question question : questions) {
            Map<String, Object> qStat = new LinkedHashMap<>();
            qStat.put("questionId", question.getId());
            qStat.put("title", question.getContent());
            qStat.put("type", question.getType());

            long totalAnswered = answerRepository.countDistinctResponsesByQuestionId(question.getId());
            qStat.put("totalAnswered", totalAnswered);

            String type = question.getType();
            if ("input".equals(type) || "textarea".equals(type)) {
                qStat.put("statistics", null);
            } else if ("rating".equals(type)) {
                List<Object[]> answerCounts = answerRepository.countByQuestionIdGroupByContent(question.getId());
                double totalScore = 0;
                long totalCount = 0;
                for (Object[] row : answerCounts) {
                    String content = (String) row[0];
                    Long count = ((Number) row[1]).longValue();
                    try {
                        double score = Double.parseDouble(content);
                        totalScore += score * count;
                        totalCount += count;
                    } catch (NumberFormatException ignored) {
                    }
                }
                double averageRating = totalCount > 0
                        ? BigDecimal.valueOf(totalScore / totalCount)
                            .setScale(1, RoundingMode.HALF_UP).doubleValue()
                        : 0.0;
                qStat.put("averageRating", averageRating);
                qStat.put("statistics", buildRatingStatistics(answerCounts, totalCount));
            } else {
                List<Object[]> answerCounts = answerRepository.countByQuestionIdGroupByContent(question.getId());
                List<QuestionOption> options = question.getOptions();

                long baseCount = "checkbox".equals(type) ? totalAnswered : sumCounts(answerCounts);
                List<Map<String, Object>> statistics = buildOptionStatistics(options, answerCounts, baseCount);
                qStat.put("statistics", statistics);
            }

            questionStats.add(qStat);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("questions", questionStats);
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getTextAnswers(Long questionnaireId, Long questionId,
                                              Integer page, Integer pageSize,
                                              String keyword,
                                              LocalDateTime startTime, LocalDateTime endTime) {
        Questionnaire questionnaire = questionnaireRepository.findByIdAndDeletedFalse(questionnaireId)
                .orElseThrow(() -> new BizException(ErrorCode.QUESTIONNAIRE_NOT_FOUND));

        Question question = questionRepository.findByIdAndQuestionnaireId(questionId, questionnaireId)
                .orElseThrow(() -> new BizException(ErrorCode.QUESTION_NOT_FOUND));

        String type = question.getType();
        if (!"input".equals(type) && !"textarea".equals(type)) {
            throw new BizException(ErrorCode.H5_QUESTION_TYPE_MISMATCH);
        }

        Page<Answer> answerPage = answerRepository.findTextAnswersByQuestionId(
                questionId, keyword, startTime, endTime,
                PageRequest.of(page - 1, pageSize));

        List<Map<String, Object>> items = answerPage.getContent().stream().map(answer -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("answerId", answer.getId());
            item.put("content", answer.getAnswerContent());
            item.put("submittedAt", getSubmittedAt(answer.getResponseId()));
            return item;
        }).collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", answerPage.getTotalElements());
        result.put("page", page);
        result.put("pageSize", pageSize);
        result.put("totalPages", answerPage.getTotalPages());
        result.put("items", items);
        return result;
    }

    @Override
    public Map<String, Object> triggerExport(Long questionnaireId, ExportRequest request) {
        Questionnaire questionnaire = questionnaireRepository.findByIdAndDeletedFalse(questionnaireId)
                .orElseThrow(() -> new BizException(ErrorCode.QUESTIONNAIRE_NOT_FOUND));

        long totalResponses = responseRepository.countByQuestionnaireId(questionnaireId);
        if (totalResponses == 0) {
            throw new BizException(ErrorCode.H5_NO_DATA_EXPORT);
        }

        String format = request.getFormat() != null ? request.getFormat() : "xlsx";
        String fileName = questionnaire.getTitle() + "_" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "." + format;

        ExportTask task = new ExportTask();
        task.setQuestionnaireId(questionnaireId);
        task.setFormat(format);
        task.setStatus("processing");
        task.setFileName(fileName);
        task.setTotalRecords((int) totalResponses);
        task.setStartDate(request.getStartDate());
        task.setEndDate(request.getEndDate());
        task = exportTaskRepository.save(task);

        String filePath = exportPath + File.separator + task.getId() + "." + format;
        task.setFilePath(filePath);
        exportTaskRepository.save(task);

        boolean isSync = totalResponses <= 50000;
        String mode = isSync ? "sync" : "async";

        if (isSync) {
            generateExportFile(task, questionnaire, request);
        } else {
            final ExportTask asyncTask = task;
            generateExportFileAsync(asyncTask, questionnaire, request);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("exportId", task.getId());
        result.put("mode", mode);
        result.put("status", isSync ? "completed" : "processing");
        result.put("downloadUrl", "/api/statistics/exports/" + task.getId() + "/download");
        result.put("fileName", fileName);
        result.put("fileSize", task.getFileSize());
        result.put("totalRecords", (int) totalResponses);
        result.put("estimatedTime", isSync ? 0 : estimateTime(totalResponses));
        return result;
    }

    @Override
    public Map<String, Object> getExportList(Integer page, Integer pageSize,
                                             String status, Long questionnaireId) {
        Page<ExportTask> taskPage = exportTaskRepository.findByFilters(
                status, questionnaireId, PageRequest.of(page - 1, pageSize));

        List<Map<String, Object>> items = taskPage.getContent().stream().map(task -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("exportId", task.getId());
            item.put("questionnaireId", task.getQuestionnaireId());
            item.put("format", task.getFormat());
            item.put("status", task.getStatus());
            item.put("fileName", task.getFileName());
            item.put("fileSize", task.getFileSize());
            item.put("totalRecords", task.getTotalRecords());
            item.put("createdAt", task.getCreatedAt());
            item.put("completedAt", task.getCompletedAt());
            item.put("expiresAt", task.getExpiresAt());
            item.put("downloadUrl", "completed".equals(task.getStatus())
                    ? "/api/statistics/exports/" + task.getId() + "/download" : null);
            return item;
        }).collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", taskPage.getTotalElements());
        result.put("page", page);
        result.put("pageSize", pageSize);
        result.put("totalPages", taskPage.getTotalPages());
        result.put("items", items);
        return result;
    }

    @Override
    public Map<String, Object> getExportFileInfo(Long exportId) {
        ExportTask task = exportTaskRepository.findById(exportId)
                .orElseThrow(() -> new BizException(ErrorCode.QUESTIONNAIRE_NOT_FOUND));

        if ("processing".equals(task.getStatus())) {
            throw new BizException(ErrorCode.H5_EXPORT_PROCESSING);
        }

        if (task.getExpiresAt() != null && LocalDateTime.now().isAfter(task.getExpiresAt())) {
            throw new BizException(ErrorCode.H5_EXPORT_EXPIRED);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("filePath", task.getFilePath());
        result.put("fileName", task.getFileName());
        result.put("fileSize", task.getFileSize());
        return result;
    }

    private void generateExportFile(ExportTask task, Questionnaire questionnaire, ExportRequest request) {
        try {
            Path dirPath = Paths.get(exportPath);
            if (!Files.exists(dirPath)) {
                Files.createDirectories(dirPath);
            }

            List<Question> questions = questionRepository.findByQuestionnaireIdOrderBySortOrderAsc(questionnaire.getId());

            LocalDateTime start = request.getStartDate() != null
                    ? request.getStartDate().atStartOfDay() : null;
            LocalDateTime end = request.getEndDate() != null
                    ? request.getEndDate().atTime(LocalTime.MAX) : null;

            List<Answer> allAnswers = answerRepository.findAllByQuestionnaireIdAndDateRange(
                    questionnaire.getId(), start, end);

            Map<Long, List<Answer>> answersByResponse = allAnswers.stream()
                    .collect(Collectors.groupingBy(Answer::getResponseId));

            List<List<String>> rows = new ArrayList<>();
            List<String> headers = new ArrayList<>();
            headers.add("序号");
            headers.add("提交时间");
            for (Question q : questions) {
                headers.add(q.getContent());
            }

            int index = 1;
            List<Long> responseIds = responseRepository.findIdsByQuestionnaireIdAndDateRange(
                    questionnaire.getId(), start, end);

            for (Long responseId : responseIds) {
                List<Answer> answers = answersByResponse.getOrDefault(responseId, Collections.emptyList());
                Map<Long, String> answerMap = answers.stream()
                        .collect(Collectors.toMap(Answer::getQuestionId, Answer::getAnswerContent,
                                (a, b) -> a + "," + b));

                List<String> row = new ArrayList<>();
                row.add(String.valueOf(index++));
                row.add(getSubmittedAtStr(responseId));
                for (Question q : questions) {
                    row.add(answerMap.getOrDefault(q.getId(), ""));
                }
                rows.add(row);
            }

            String filePath = task.getFilePath();
            if ("xlsx".equals(task.getFormat())) {
                List<List<Object>> excelData = rows.stream()
                        .map(r -> new ArrayList<Object>(r))
                        .collect(Collectors.toList());
                List<List<String>> head = headers.stream()
                        .map(Collections::singletonList)
                        .collect(Collectors.toList());
                EasyExcel.write(filePath).head(head).sheet("数据").doWrite(excelData);
            } else {
                try (FileWriter writer = new FileWriter(filePath)) {
                    writer.write(String.join(",", headers) + "\n");
                    for (List<String> row : rows) {
                        List<String> escaped = row.stream()
                                .map(cell -> "\"" + cell.replace("\"", "\"\"") + "\"")
                                .collect(Collectors.toList());
                        writer.write(String.join(",", escaped) + "\n");
                    }
                }
            }

            File file = new File(filePath);
            task.setFileSize(file.length());
            task.setStatus("completed");
            task.setCompletedAt(LocalDateTime.now());
            task.setExpiresAt(LocalDateTime.now().plusHours(24));
            exportTaskRepository.save(task);

        } catch (IOException e) {
            log.error("Export file generation failed for task {}", task.getId(), e);
            task.setStatus("failed");
            exportTaskRepository.save(task);
        }
    }

    @Async
    protected void generateExportFileAsync(ExportTask task, Questionnaire questionnaire, ExportRequest request) {
        generateExportFile(task, questionnaire, request);
    }

    private LocalDateTime getSubmittedAt(Long responseId) {
        return responseRepository.findById(responseId)
                .map(Response::getSubmittedAt)
                .orElse(null);
    }

    private String getSubmittedAtStr(Long responseId) {
        LocalDateTime submittedAt = getSubmittedAt(responseId);
        return submittedAt != null
                ? submittedAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                : "";
    }

    private List<Map<String, Object>> buildOptionStatistics(List<QuestionOption> options,
                                                            List<Object[]> answerCounts,
                                                            long baseCount) {
        Map<String, Long> countMap = new HashMap<>();
        for (Object[] row : answerCounts) {
            String content = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            if (content != null) {
                String[] parts = content.split(",");
                for (String part : parts) {
                    countMap.merge(part.trim(), count, Long::sum);
                }
            }
        }

        List<Map<String, Object>> statistics = new ArrayList<>();
        for (QuestionOption option : options) {
            Map<String, Object> stat = new LinkedHashMap<>();
            stat.put("optionId", option.getId());
            stat.put("content", option.getContent());
            long count = countMap.getOrDefault(String.valueOf(option.getId()), 0L);
            stat.put("count", count);
            double percentage = baseCount > 0
                    ? BigDecimal.valueOf((double) count / baseCount * 100)
                        .setScale(1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;
            stat.put("percentage", percentage);
            statistics.add(stat);
        }
        return statistics;
    }

    private List<Map<String, Object>> buildRatingStatistics(List<Object[]> answerCounts, long totalCount) {
        List<Map<String, Object>> statistics = new ArrayList<>();
        for (Object[] row : answerCounts) {
            String content = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            Map<String, Object> stat = new LinkedHashMap<>();
            stat.put("optionId", null);
            stat.put("content", content);
            stat.put("count", count);
            double percentage = totalCount > 0
                    ? BigDecimal.valueOf((double) count / totalCount * 100)
                        .setScale(1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;
            stat.put("percentage", percentage);
            statistics.add(stat);
        }
        return statistics;
    }

    private long sumCounts(List<Object[]> answerCounts) {
        long sum = 0;
        for (Object[] row : answerCounts) {
            sum += ((Number) row[1]).longValue();
        }
        return sum;
    }

    private int estimateTime(long totalRecords) {
        return (int) Math.max(5, totalRecords / 10000);
    }
}
