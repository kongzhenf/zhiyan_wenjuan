package com.questionnaire.repository;

import com.questionnaire.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByQuestionnaireIdOrderBySortOrderAsc(Long questionnaireId);

    int countByQuestionnaireId(Long questionnaireId);

    Optional<Question> findByIdAndQuestionnaireId(Long id, Long questionnaireId);

    void deleteByQuestionnaireId(Long questionnaireId);
}
