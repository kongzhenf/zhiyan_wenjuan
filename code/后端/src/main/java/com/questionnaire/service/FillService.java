package com.questionnaire.service;

import com.questionnaire.dto.SubmitRequest;

import java.util.Map;

public interface FillService {

    Map<String, Object> getQuestionnaire(String linkId);

    Map<String, Object> submitResponse(String linkId, SubmitRequest request, String ipAddress);

    Map<String, Object> checkStatus(String linkId, String deviceId);
}
