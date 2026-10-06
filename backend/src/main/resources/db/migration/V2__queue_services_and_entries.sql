CREATE TABLE queue_services (
    id BIGINT NOT NULL AUTO_INCREMENT,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(60) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    average_wait_minutes INT NOT NULL DEFAULT 5,
    PRIMARY KEY (id),
    CONSTRAINT uk_queue_service_code UNIQUE (code)
);

CREATE TABLE queue_entries (
    id BIGINT NOT NULL AUTO_INCREMENT,
    service_id BIGINT NOT NULL,
    user_email VARCHAR(254) NOT NULL,
    active_user_email VARCHAR(254),
    ticket_number VARCHAR(32),
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,

    PRIMARY KEY (id),

    CONSTRAINT uk_queue_active_user UNIQUE (active_user_email),
    CONSTRAINT uk_queue_ticket_number
        UNIQUE (ticket_number),

    CONSTRAINT fk_queue_entry_service
        FOREIGN KEY (service_id)
        REFERENCES queue_services(id)
);

CREATE INDEX idx_queue_entry_user_status
    ON queue_entries(user_email, status);

CREATE INDEX idx_queue_entry_service_status
    ON queue_entries(service_id, status);

INSERT INTO queue_services
    (code, name, description, category, status, average_wait_minutes)
VALUES
    (
        'A',
        'General Service',
        'General enquiries and customer assistance.',
        'General',
        'OPEN',
        4
    ),
    (
        'B',
        'Document Verification',
        'Submit and verify required documents.',
        'Documents',
        'OPEN',
        6
    ),
    (
        'C',
        'Payment Counter',
        'Complete service and registration payments.',
        'Payments',
        'OPEN',
        3
    ),
    (
        'D',
        'Registration Desk',
        'Registration and account-related services.',
        'Registration',
        'BUSY',
        5
    ),
    (
        'E',
        'Customer Support',
        'Get help with service-related issues.',
        'General',
        'OPEN',
        4
    ),
    (
        'P',
        'Priority Service',
        'Dedicated assistance for priority customers.',
        'Priority',
        'OPEN',
        3
    );