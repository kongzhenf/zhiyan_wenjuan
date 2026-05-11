package com.questionnaire.repository;

import com.questionnaire.entity.QuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuestionOptionRepository extends JpaRepository<QuestionOption, Long> {

    List<QuestionOption> findByQuestionIdOrderBySortOrderAsc(Long questionId);

    void deleteByQuestionId(Long questionId);
}
