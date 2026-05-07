package com.stockpulse.backend.repository;

import com.stockpulse.backend.entity.AiAdviceRecordEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiAdviceRecordRepository extends JpaRepository<AiAdviceRecordEntity, String> {
    List<AiAdviceRecordEntity> findTop20ByUserIdOrderByCreatedAtDesc(String userId);
}
