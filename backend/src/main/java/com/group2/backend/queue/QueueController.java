package com.group2.backend.queue;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RequestMapping("/api")
@RestController
public class QueueController {

    private final QueueOperations operations;

    public QueueController(
        QueueOperations operations
    ) {
        this.operations = operations;
    }

    @GetMapping("/services")
    public List<QueueOperations.ServiceView>
        services() {

        return operations.listUserServices();
    }

    @GetMapping("/queues/me")
    public ResponseEntity<
        QueueOperations.QueueView
    > currentQueue(
        Authentication authentication
    ) {
        return operations
            .currentQueue(
                authentication.getName()
            )
            .map(ResponseEntity::ok)
            .orElseGet(() ->
                ResponseEntity
                    .noContent()
                    .build()
            );
    }

    @PostMapping("/queues/join")
    public QueueOperations.QueueView
        joinQueue(
            Authentication authentication,
            @Valid
            @RequestBody
            JoinQueueRequest request
        ) {

        return operations.joinQueue(
            authentication.getName(),
            request.serviceId()
        );
    }

    @PostMapping("/queues/leave")
    public QueueOperations.QueueView
        leaveQueue(
            Authentication authentication
        ) {

        return operations.leaveQueue(
            authentication.getName()
        );
    }

    public record JoinQueueRequest(
        @NotNull
        Long serviceId
    ) {
    }
}