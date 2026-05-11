package com.questionnaire.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "t_export_task")
public class ExportTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "questionnaire_id", nullable = false)
    private Long questionnaireId;

    @Column(nullable = false, length = 10)
    private String format = "xlsx";

    @Column(nullable = false, length = 20)
    private String status = "processing";

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "file_name", length = 200)
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "total_records", nullable = false)
    private Integer totalRecords = 0;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
