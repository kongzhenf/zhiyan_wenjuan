package com.questionnaire.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ExportRequest {

    private String format = "xlsx";

    private LocalDate startDate;

    private LocalDate endDate;
}
