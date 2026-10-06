package com.group2.backend.queue;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice(assignableTypes = {QueueController.class, AdminQueueController.class})
public class QueueErrors {
 @ExceptionHandler(ResponseStatusException.class)
 ResponseEntity<Map<String, String>> queueConflict(ResponseStatusException failure) {
  return ResponseEntity.status(failure.getStatusCode())
   .body(Map.of("message", failure.getReason() == null ? "Unable to update the queue." : failure.getReason()));
 }
}