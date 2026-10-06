package com.group2.backend.queue;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
public interface QueueServiceRepository extends JpaRepository<QueueServiceEntity, Long> {
 List<QueueServiceEntity> findAllByOrderByIdAsc();
 Optional<QueueServiceEntity> findByCodeIgnoreCase(String code);
 // A consistent lock order serializes mutations across services and users.
 @Lock(LockModeType.PESSIMISTIC_WRITE)
 @Query("select s from QueueServiceEntity s order by s.id")
 List<QueueServiceEntity> lockServices();
}
