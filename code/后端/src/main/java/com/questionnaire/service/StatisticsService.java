package com.questionnaire.service;

import com.questionnaire.dto.ExportRequest;

import java.time.LocalDateTime;
import java.util.Map;

public interface StatisticsService {

    Map<String, Object> getOverview(Long questionnaireId, LocalDateTime startTime, LocalDateTime endTime);

    Map<String, Object> getQuestionStatistics(Long questionnaireId, LocalDateTime startTime, LocalDateTime endTime);

    Map<String, Object> getTextAnswers(Long questionnaireId, Long questionId,
                                       Integer page, Integer pageSize,
                                       String keyword,
                                       LocalDateTime startTime, LocalDateTime endTime);

    Map<String, Object> triggerExport(Long questionnaireId, ExportRequest request);

    Map<String, Object> getExportList(Integer page, Integer pageSize,
                                      String status, Long questionnaireId);

    Map<String, Object> getExportFileInfo(Long exportId);
}
