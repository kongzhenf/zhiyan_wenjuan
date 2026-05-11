package com.questionnaire.dto;

import lombok.Data;

@Data
public class SubmitAnswerItem {

    private Long questionId;

    private String type;

    private Object value;
}
