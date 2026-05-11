package com.questionnaire.dto;

import lombok.Data;

import java.util.List;

@Data
public class SubmitRequest {

    private String deviceId;

    private List<SubmitAnswerItem> answers;

    private String submitTime;

    private Integer duration;
}
