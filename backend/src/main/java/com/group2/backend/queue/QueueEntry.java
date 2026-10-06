package com.group2.backend.queue;

import java.time.Instant;

import jakarta.persistence.*;

@Entity
@Table(
    name = "queue_entries",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_queue_ticket_number",
        columnNames = "ticket_number"
    )
)
public class QueueEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(
        fetch = FetchType.LAZY,
        optional = false
    )
    @JoinColumn(
        name = "service_id",
        nullable = false
    )
    private QueueServiceEntity service;

    @Column(
        name = "user_email",
        nullable = false,
        length = 254
    )
    private String userEmail;
    @Column(name = "active_user_email", length = 254, unique = true)
    private String activeUserEmail;
    public void setActiveUserEmail(String email) { activeUserEmail = email; }

    @Column(
        name = "ticket_number",
        length = 32,
        unique = true
    )
    private String ticketNumber;

    @Column(
        nullable = false,
        length = 20
    )
    private String status = "WAITING";

    @Column(
        name = "joined_at",
        nullable = false
    )
    private Instant joinedAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    public QueueEntry() {
    }

    @PrePersist
    void prePersist() {
        if (joinedAt == null) {
            joinedAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public QueueServiceEntity getService() {
        return service;
    }

    public void setService(
        QueueServiceEntity service
    ) {
        this.service = service;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(
        String userEmail
    ) {
        this.userEmail = userEmail;
    }

    public String getTicketNumber() {
        return ticketNumber;
    }

    public void setTicketNumber(
        String ticketNumber
    ) {
        this.ticketNumber = ticketNumber;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(
        String status
    ) {
        this.status = status;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(
        Instant startedAt
    ) {
        this.startedAt = startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(
        Instant completedAt
    ) {
        this.completedAt = completedAt;
    }
}