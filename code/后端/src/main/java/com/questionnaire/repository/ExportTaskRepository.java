package com.questionnaire.repository;

import com.questionnaire.entity.ExportTask;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ExportTaskRepository extends JpaRepository<ExportTask, Long> {

    Optional<ExportTask> findById(Long id);

    @Query("SELECT e FROM ExportTask e WHERE " +
            "(:status IS NULL OR e.status = :status) " +
            "AND (:questionnaireId IS NULL OR e.questionnaireId = :questionnaireId) " +
            "ORDER BY e.createdAt DESC")
    Page<ExportTask> findByFilters(
            @Param("status") String status,
            @Param("questionnaireId") Long questionnaireId,
            Pageable pageable);
}
