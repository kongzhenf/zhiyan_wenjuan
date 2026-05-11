package com.questionnaire.repository;

import com.questionnaire.entity.Response;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ResponseRepository extends JpaRepository<Response, Long> {

    long countByQuestionnaireId(Long questionnaireId);

    @Query("SELECT COUNT(r) FROM Response r WHERE r.questionnaireId = :qid AND r.submittedAt >= :start AND r.submittedAt < :end")
    long countByQuestionnaireIdAndSubmittedAtBetween(
            @Param("qid") Long questionnaireId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    boolean existsByQuestionnaireIdAndDeviceFingerprint(Long questionnaireId, String deviceFingerprint);

    @Query("SELECT FUNCTION('DATE', r.submittedAt) as date, COUNT(r) as cnt FROM Response r " +
            "WHERE r.questionnaireId = :qid AND r.submittedAt >= :start AND r.submittedAt <= :end " +
            "GROUP BY FUNCTION('DATE', r.submittedAt) ORDER BY FUNCTION('DATE', r.submittedAt)")
    List<Object[]> countDailyResponses(
            @Param("qid") Long questionnaireId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT r.id FROM Response r WHERE r.questionnaireId = :qid " +
            "AND (:start IS NULL OR r.submittedAt >= :start) " +
            "AND (:end IS NULL OR r.submittedAt <= :end)")
    List<Long> findIdsByQuestionnaireIdAndDateRange(
            @Param("qid") Long questionnaireId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
