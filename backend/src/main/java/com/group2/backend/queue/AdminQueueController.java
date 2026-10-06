package com.group2.backend.queue;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminQueueController {

    private final QueueOperations operations;

    public AdminQueueController(
        QueueOperations operations
    ) {
        this.operations = operations;
    }

    @GetMapping("/stats")
    public QueueOperations.StatsView stats() { return operations.stats(); }

    @GetMapping("/services")
    public List<QueueOperations.ServiceView>
        services() {

        return operations.listAdminServices();
    }

    @GetMapping("/queues")
    public List<
        QueueOperations.AdminQueueView
    > queue() {

        return operations.adminQueue();
    }

    @PostMapping("/services")
    public QueueOperations.ServiceView
        createService(
            @Valid
            @RequestBody
            CreateServiceRequest request
        ) {

        return operations.createService(
            request.code(),
            request.name(),
            request.description(),
            request.category(),
            request.averageWaitMinutes()
        );
    }

    @PostMapping(
        "/services/{id}/toggle"
    )
    public QueueOperations.ServiceView
        toggleService(
            @PathVariable Long id
        ) {

        return operations.toggleService(id);
    }

    @PostMapping("/queues/call-next")
    public ResponseEntity<
        QueueOperations.AdminQueueView
    > callNext() {

        return operations
            .callNext()
            .map(ResponseEntity::ok)
            .orElseGet(() ->
                ResponseEntity
                    .noContent()
                    .build()
            );
    }

    @PostMapping(
        "/queues/{id}/complete"
    )
    public QueueOperations.AdminQueueView
        complete(
            @PathVariable Long id
        ) {

        return operations
            .completeQueueEntry(id);
    }

    public record CreateServiceRequest(

        @NotBlank
        @Size(max = 10)
        @Pattern(regexp = "[A-Za-z0-9]+")
        String code,

        @NotBlank
        @Size(max = 120)
        String name,

        @NotBlank
        @Size(max = 255)
        String description,

        @NotBlank
        @Size(max = 60)
        String category,

        @NotNull
        @Min(1)
        @Max(120)
        Integer averageWaitMinutes
    ) {
    }
}