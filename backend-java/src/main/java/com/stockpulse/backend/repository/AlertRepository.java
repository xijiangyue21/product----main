package com.stockpulse.backend.repository;

import com.stockpulse.backend.entity.AlertEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlertRepository extends JpaRepository<AlertEntity, String> {
    List<AlertEntity> findByUserIdOrderByCreatedAtDesc(String userId);
    List<AlertEntity> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, String status);
    List<AlertEntity> findByStatus(String status);
    Optional<AlertEntity> findByIdAndUserId(String id, String userId);
    boolean existsByIdAndUserId(String id, String userId);
    void deleteByIdAndUserId(String id, String userId);
}
