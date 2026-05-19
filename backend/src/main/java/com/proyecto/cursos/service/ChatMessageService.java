package com.proyecto.cursos.service;

import com.proyecto.cursos.model.ChatMessage;
import com.proyecto.cursos.model.Course;
import com.proyecto.cursos.model.User;
import com.proyecto.cursos.repository.ChatMessageRepository;
import com.proyecto.cursos.repository.CourseRepository;
import com.proyecto.cursos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final NotificationService notificationService;

    @Transactional
    public ChatMessage sendMessage(String senderUsername, Long recipientId, String content, Long courseId) {
        User sender = userRepository.findByUsername(senderUsername)
                .orElseThrow(() -> new RuntimeException("Remitente no encontrado"));
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Destinatario no encontrado"));

        Course course = (courseId != null) ? courseRepository.findById(courseId).orElse(null) : null;

        ChatMessage message = ChatMessage.builder()
                .sender(sender)
                .recipient(recipient)
                .content(content)
                .timestamp(LocalDateTime.now())
                .isRead(false)
                .course(course)
                .build();

        ChatMessage saved = messageRepository.save(message);

        // Notificar al destinatario
        notificationService.createNotification(
            recipient, 
            "Nuevo mensaje de " + sender.getUsername(), 
            content.length() > 50 ? content.substring(0, 47) + "..." : content,
            com.proyecto.cursos.model.Notification.ENotificationType.MESSAGE
        );

        return saved;
    }

    @Transactional(readOnly = true)
    public List<ChatMessage> getConversation(String username, Long otherUserId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new RuntimeException("Otro usuario no encontrado"));

        return messageRepository.findConversation(user, otherUser);
    }

    @Transactional
    public void markAsRead(String username, Long senderId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Remitente no encontrado"));

        List<ChatMessage> unread = messageRepository.findUnreadMessages(user);
        unread.stream()
                .filter(m -> m.getSender().getId().equals(sender.getId()))
                .forEach(m -> {
                    m.setRead(true);
                    messageRepository.save(m);
                });
    }

    @Transactional(readOnly = true)
    public List<User> getActiveContacts(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return messageRepository.findActiveContacts(user);
    }
}
