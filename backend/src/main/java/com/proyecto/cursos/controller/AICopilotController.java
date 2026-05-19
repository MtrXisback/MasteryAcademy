package com.proyecto.cursos.controller;

import com.proyecto.cursos.service.AICopilotService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AICopilotController {

    private final AICopilotService aiCopilotService;

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody AIChatRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        String responseText = aiCopilotService.generateResponse(
                username, 
                request.getMessage(), 
                request.getBalance(), 
                request.getPositions(), 
                request.getCourseId()
        );
        return ResponseEntity.ok(Map.of("response", responseText));
    }

    @Data
    public static class AIChatRequest {
        private String message;
        private Double balance;
        private List<Map<String, Object>> positions;
        private Long courseId;
    }
}
