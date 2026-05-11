package com.questionnaire.controller;

import com.questionnaire.common.Result;
import com.questionnaire.dto.ExportRequest;
import com.questionnaire.service.StatisticsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.FileInputStream;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Map;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/{questionnaireId}/overview")
    public Result<Map<String, Object>> getOverview(@PathVariable Long questionnaireId,
                                                   @RequestParam(required = false) LocalDate startDate,
                                                   @RequestParam(required = false) LocalDate endDate,
                                                   HttpServletRequest request) {
        request.getAttribute("currentUser");
        LocalDateTime startTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endTime = endDate != null ? endDate.atTime(LocalTime.MAX) : null;
        Map<String, Object> data = statisticsService.getOverview(questionnaireId, startTime, endTime);
        return Result.ok(data);
    }

    @GetMapping("/{questionnaireId}/questions")
    public Result<Map<String, Object>> getQuestionStatistics(@PathVariable Long questionnaireId,
                                                             @RequestParam(required = false) LocalDate startDate,
                                                             @RequestParam(required = false) LocalDate endDate,
                                                             HttpServletRequest request) {
        request.getAttribute("currentUser");
        LocalDateTime startTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endTime = endDate != null ? endDate.atTime(LocalTime.MAX) : null;
        Map<String, Object> data = statisticsService.getQuestionStatistics(questionnaireId, startTime, endTime);
        return Result.ok(data);
    }

    @GetMapping("/{questionnaireId}/questions/{qid}/texts")
    public Result<Map<String, Object>> getTextAnswers(@PathVariable Long questionnaireId,
                                                      @PathVariable Long qid,
                                                      @RequestParam(defaultValue = "1") Integer page,
                                                      @RequestParam(defaultValue = "20") Integer pageSize,
                                                      @RequestParam(required = false) String keyword,
                                                      @RequestParam(required = false) LocalDate startDate,
                                                      @RequestParam(required = false) LocalDate endDate,
                                                      HttpServletRequest request) {
        request.getAttribute("currentUser");
        LocalDateTime startTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endTime = endDate != null ? endDate.atTime(LocalTime.MAX) : null;
        Map<String, Object> data = statisticsService.getTextAnswers(
                questionnaireId, qid, page, pageSize, keyword, startTime, endTime);
        return Result.ok(data);
    }

    @PostMapping("/{questionnaireId}/export")
    public Result<Map<String, Object>> triggerExport(@PathVariable Long questionnaireId,
                                                     @RequestBody ExportRequest exportRequest,
                                                     HttpServletRequest request) {
        request.getAttribute("currentUser");
        Map<String, Object> data = statisticsService.triggerExport(questionnaireId, exportRequest);
        return Result.ok(data);
    }

    @GetMapping("/exports/{exportId}/download")
    public void downloadExport(@PathVariable Long exportId,
                               HttpServletRequest request,
                               HttpServletResponse response) throws Exception {
        request.getAttribute("currentUser");
        Map<String, Object> fileInfo = statisticsService.getExportFileInfo(exportId);

        String filePath = (String) fileInfo.get("filePath");
        String fileName = (String) fileInfo.get("fileName");

        File file = new File(filePath);
        if (!file.exists()) {
            response.setStatus(404);
            return;
        }

        response.setContentType("application/octet-stream");
        response.setHeader("Content-Disposition",
                "attachment; filename=" + URLEncoder.encode(fileName, StandardCharsets.UTF_8));
        response.setContentLengthLong(file.length());

        try (FileInputStream fis = new FileInputStream(file);
             OutputStream os = response.getOutputStream()) {
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = fis.read(buffer)) != -1) {
                os.write(buffer, 0, bytesRead);
            }
            os.flush();
        }
    }

    @GetMapping("/exports")
    public Result<Map<String, Object>> getExportList(@RequestParam(defaultValue = "1") Integer page,
                                                     @RequestParam(defaultValue = "10") Integer pageSize,
                                                     @RequestParam(required = false) String status,
                                                     @RequestParam(required = false) Long questionnaireId,
                                                     HttpServletRequest request) {
        request.getAttribute("currentUser");
        Map<String, Object> data = statisticsService.getExportList(page, pageSize, status, questionnaireId);
        return Result.ok(data);
    }
}
