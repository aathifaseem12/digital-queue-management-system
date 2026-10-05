package com.group2.backend.auth;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
@RestControllerAdvice
public class AuthErrors {
 @ExceptionHandler(AuthenticationException.class)
 ResponseEntity<Map<String,String>> credentials() {
  return ResponseEntity.status(401).body(Map.of("message","Invalid email or password."));
 }
 @ExceptionHandler(MethodArgumentNotValidException.class)
 ResponseEntity<Map<String,String>> validation() {
  return ResponseEntity.badRequest().body(Map.of("message","Check the required fields and their lengths."));
 }
}
