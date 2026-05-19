package com.proyecto.cursos.repository;

import com.proyecto.cursos.model.ChatMessage;
import com.proyecto.cursos.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(m.sender = :user1 AND m.recipient = :user2) OR " +
           "(m.sender = :user2 AND m.recipient = :user1) " +
           "ORDER BY m.timestamp ASC")
    List<ChatMessage> findConversation(@Param("user1") User user1, @Param("user2") User user2);

    @Query("SELECT m FROM ChatMessage m WHERE m.recipient = :user AND m.isRead = false")
    List<ChatMessage> findUnreadMessages(@Param("user") User user);

    @Query("SELECT DISTINCT m.sender FROM ChatMessage m WHERE m.recipient = :user " +
           "UNION " +
           "SELECT DISTINCT m.recipient FROM ChatMessage m WHERE m.sender = :user")
    List<User> findActiveContacts(@Param("user") User user);
}
