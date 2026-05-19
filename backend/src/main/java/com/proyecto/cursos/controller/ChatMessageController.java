package com.proyecto.cursos.controller;

import com.proyecto.cursos.model.ChatMessage;
import com.proyecto.cursos.model.User;
import com.proyecto.cursos.service.ChatMessageService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class ChatMessageController {

    private final ChatMessageService messageService;

    @PostMapping
    public ResponseEntity<?> sendMessage(@RequestBody MessageRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(messageService.sendMessage(
                username, 
                request.getRecipientId(), 
                request.getContent(), 
                request.getCourseId()
        ));
    }

    @GetMapping("/history/{otherUserId}")
    public ResponseEntity<List<ChatMessage>> getHistory(@PathVariable Long otherUserId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(messageService.getConversation(username, otherUserId));
    }

    @GetMapping("/contacts")
    public ResponseEntity<List<User>> getContacts() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(messageService.getActiveContacts(username));
    }

    @PutMapping("/read/{senderId}")
    public ResponseEntity<?> markAsRead(@PathVariable Long senderId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        messageService.markAsRead(username, senderId);
        return ResponseEntity.ok().build();
    }

    @Data
    public static class MessageRequest {
        private Long recipientId;
        private String content;
        private Long courseId;
    }
}
