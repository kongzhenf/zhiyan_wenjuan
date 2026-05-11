package com.questionnaire.repository;

import com.questionnaire.entity.Questionnaire;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface QuestionnaireRepository extends JpaRepository<Questionnaire, Long> {

    Optional<Questionnaire> findByAccessCodeAndDeletedFalse(String accessCode);

    Optional<Questionnaire> findByIdAndDeletedFalse(Long id);

    @Query("SELECT q FROM Questionnaire q WHERE q.deleted = false " +
            "AND (:status IS NULL OR q.status = :status) " +
            "AND (:keyword IS NULL OR q.title LIKE CONCAT('%', :keyword, '%'))")
    Page<Questionnaire> findByFilters(
            @Param("status") String status,
            @Param("keyword") String keyword,
            Pageable pageable);

    @Query("SELECT q FROM Questionnaire q WHERE q.status = 'active' AND q.deadline IS NOT NULL AND q.deadline <= CURRENT_TIMESTAMP")
    List<Questionnaire> findExpiredActiveQuestionnaires();

    @Query("SELECT q FROM Questionnaire q WHERE q.status = 'active' AND q.maxResponses IS NOT NULL")
    List<Questionnaire> findActiveWithMaxResponses();
}
