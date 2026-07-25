package com.masaakis.security;

import com.masaakis.menu.application.MenuNotFoundException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(MenuNotFoundException.class)
    ResponseEntity<ApiError> notFound(MenuNotFoundException exception) {
        return response(HttpStatus.NOT_FOUND, "MENU_NOT_FOUND", exception.getMessage());
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ApiError> invalid(ConstraintViolationException ignored) {
        return response(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "İstek doğrulanamadı.");
    }

    private ResponseEntity<ApiError> response(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status)
                .body(new ApiError(Instant.now(), status.value(), code, message));
    }
}

