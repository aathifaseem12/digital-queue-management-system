package com.group2.backend.queue;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QueueEntryRepository
    extends JpaRepository<QueueEntry, Long> {

    List<QueueEntry>
        findAllByOrderByJoinedAtAsc();

    List<QueueEntry>
        findByStatusOrderByJoinedAtAsc(
            String status
        );

    Optional<QueueEntry>
        findFirstByStatusOrderByJoinedAtAsc(
            String status
        );

    List<QueueEntry>
        findByUserEmailAndStatusInOrderByJoinedAtDesc(
            String userEmail,
            Collection<String> statuses
        );

    @Query("""
        select count(q)
        from QueueEntry q
        where q.service.id = :serviceId
          and q.status in :statuses
    """)
    long countActiveForService(
        @Param("serviceId")
        Long serviceId,

        @Param("statuses")
        Collection<String> statuses
    );

    @Query("""
        select count(q)
        from QueueEntry q
        where q.service.id = :serviceId
          and q.status in :statuses
          and q.id < :entryId
    """)
    long countPeopleAhead(
        @Param("serviceId")
        Long serviceId,

        @Param("statuses")
        Collection<String> statuses,

        @Param("entryId")
        Long entryId
    );

    @Query("""
        select count(q)
        from QueueEntry q
        where q.service.id = :serviceId
          and q.status = 'COMPLETED'
    """)
    long countCompletedForService(
        @Param("serviceId")
        Long serviceId
    );
    long countByStatusAndCompletedAtGreaterThanEqual(String status, java.time.Instant start);
    long countByServiceIdAndStatusAndCompletedAtGreaterThanEqual(Long serviceId, String status, java.time.Instant start);
}