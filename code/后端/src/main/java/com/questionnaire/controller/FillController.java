package com.questionnaire.controller;

import com.questionnaire.common.Result;
import com.questionnaire.dto.SubmitRequest;
import com.questionnaire.service.FillService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/fill")
@RequiredArgsConstructor
public class FillController {

    private final FillService fillService;

    @GetMapping("/{linkId}")
    public Result<Map<String, Object>> getQuestionnaire(@PathVariable String linkId) {
        Map<String, Object> data = fillService.getQuestionnaire(linkId);
        return Result.ok(data);
    }

    @PostMapping("/{linkId}/submit")
    public Result<Map<String, Object>> submit(@PathVariable String linkId,
                                              @RequestBody SubmitRequest request,
                                              HttpServletRequest httpRequest) {
        String ipAddress = getClientIp(httpRequest);
        Map<String, Object> data = fillService.submitResponse(linkId, request, ipAddress);
        return Result.ok(data);
    }

    @GetMapping("/{linkId}/status")
    public Result<Map<String, Object>> checkStatus(@PathVariable String linkId,
                                                   @RequestParam String deviceId) {
        Map<String, Object> data = fillService.checkStatus(linkId, deviceId);
        return Result.ok(data);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
