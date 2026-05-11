package com.questionnaire.repository;

import com.questionnaire.entity.Answer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AnswerRepository extends JpaRepository<Answer, Long> {

    List<Answer> findByResponseId(Long responseId);

    @Query("SELECT a.answerContent, COUNT(a) FROM Answer a WHERE a.questionId = :qid GROUP BY a.answerContent")
    List<Object[]> countByQuestionIdGroupByContent(@Param("qid") Long questionId);

    @Query("SELECT a.answerContent, COUNT(a) FROM Answer a " +
            "JOIN Response r ON a.responseId = r.id " +
            "WHERE a.questionId = :qid AND r.submittedAt >= :start AND r.submittedAt <= :end " +
            "GROUP BY a.answerContent")
    List<Object[]> countByQuestionIdAndDateRangeGroupByContent(
            @Param("qid") Long questionId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT a FROM Answer a JOIN Response r ON a.responseId = r.id " +
            "WHERE a.questionId = :qid " +
            "AND (:keyword IS NULL OR a.answerContent LIKE CONCAT('%', :keyword, '%')) " +
            "AND (:start IS NULL OR r.submittedAt >= :start) " +
            "AND (:end IS NULL OR r.submittedAt <= :end) " +
            "ORDER BY r.submittedAt DESC")
    Page<Answer> findTextAnswersByQuestionId(
            @Param("qid") Long questionId,
            @Param("keyword") String keyword,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable);

    @Query("SELECT COUNT(DISTINCT a.responseId) FROM Answer a WHERE a.questionId = :qid")
    long countDistinctResponsesByQuestionId(@Param("qid") Long questionId);

    @Query("SELECT a FROM Answer a JOIN Response r ON a.responseId = r.id " +
            "WHERE r.questionnaireId = :qid " +
            "AND (:start IS NULL OR r.submittedAt >= :start) " +
            "AND (:end IS NULL OR r.submittedAt <= :end) " +
            "ORDER BY r.submittedAt ASC")
    List<Answer> findAllByQuestionnaireIdAndDateRange(
            @Param("qid") Long questionnaireId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
