package com.group2.backend.queue;

import jakarta.persistence.*;

@Entity
@Table(
    name = "queue_services",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_queue_service_code",
        columnNames = "code"
    )
)
public class QueueServiceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 255)
    private String description;

    @Column(nullable = false, length = 60)
    private String category;

    @Column(nullable = false, length = 20)
    private String status = "OPEN";

    @Column(
        name = "average_wait_minutes",
        nullable = false
    )
    private Integer averageWaitMinutes = 5;

    public QueueServiceEntity() {
    }

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getAverageWaitMinutes() {
        return averageWaitMinutes;
    }

    public void setAverageWaitMinutes(
        Integer averageWaitMinutes
    ) {
        this.averageWaitMinutes = averageWaitMinutes;
    }
}