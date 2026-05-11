package com.questionnaire.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "t_answer")
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "response_id", nullable = false)
    private Long responseId;

    @Column(name = "question_id", nullable = false)
    private Long questionId;

    @Column(name = "answer_content", columnDefinition = "TEXT")
    private String answerContent;
}
