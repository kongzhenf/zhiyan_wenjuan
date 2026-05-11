package com.questionnaire.scheduler;

import com.questionnaire.entity.ExportTask;
import com.questionnaire.entity.Questionnaire;
import com.questionnaire.repository.ExportTaskRepository;
import com.questionnaire.repository.QuestionnaireRepository;
import com.questionnaire.repository.ResponseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class QuestionnaireScheduler {

    private final QuestionnaireRepository questionnaireRepository;
    private final ResponseRepository responseRepository;
    private final ExportTaskRepository exportTaskRepository;

    @Value("${app.export-path}")
    private String exportPath;

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void autoCloseExpiredQuestionnaires() {
        List<Questionnaire> expired = questionnaireRepository.findExpiredActiveQuestionnaires();
        for (Questionnaire q : expired) {
            q.setStatus("closed");
            questionnaireRepository.save(q);
            log.info("Auto-closed expired questionnaire: id={}, title={}", q.getId(), q.getTitle());
        }
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void autoCloseFullQuestionnaires() {
        List<Questionnaire> withMax = questionnaireRepository.findActiveWithMaxResponses();
        for (Questionnaire q : withMax) {
            long responseCount = responseRepository.countByQuestionnaireId(q.getId());
            if (responseCount >= q.getMaxResponses()) {
                q.setStatus("closed");
                questionnaireRepository.save(q);
                log.info("Auto-closed full questionnaire: id={}, title={}, responses={}/{}",
                        q.getId(), q.getTitle(), responseCount, q.getMaxResponses());
            }
        }
    }

    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void cleanExpiredExportFiles() {
        int pageNum = 0;
        int pageSize = 100;
        Page<ExportTask> page;

        do {
            page = exportTaskRepository.findByFilters("completed", null, PageRequest.of(pageNum, pageSize));
            for (ExportTask task : page.getContent()) {
                if (task.getExpiresAt() != null && LocalDateTime.now().isAfter(task.getExpiresAt())) {
                    if (task.getFilePath() != null) {
                        File file = new File(task.getFilePath());
                        if (file.exists()) {
                            boolean deleted = file.delete();
                            if (deleted) {
                                log.info("Deleted expired export file: {}", task.getFilePath());
                            }
                        }
                    }
                    task.setStatus("expired");
                    exportTaskRepository.save(task);
                }
            }
            pageNum++;
        } while (page.hasNext());
    }
}
