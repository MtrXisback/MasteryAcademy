package com.proyecto.cursos.service;

import com.proyecto.cursos.model.User;
import com.proyecto.cursos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GamificationService {

    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public void addXp(String username, int amount) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        int currentXp = user.getXp() != null ? user.getXp() : 0;
        user.setXp(currentXp + amount);
        
        // Notificación de XP si es relevante (ej: más de 100)
        if (amount >= 100) {
            notificationService.createNotification(
                user,
                "¡Prestigio Ganado! ⚡",
                "Has obtenido " + amount + " puntos de XP. ¡Tu rango está subiendo!",
                com.proyecto.cursos.model.Notification.ENotificationType.ACHIEVEMENT,
                "ROLE_STUDENT"
            );
        }

        checkLevelUp(user);
        userRepository.save(user);
    }

    private void checkLevelUp(User user) {
        int currentXp = user.getXp() != null ? user.getXp() : 0;
        int currentLevel = user.getLevel() != null ? user.getLevel() : 1;
        
        int newLevel = (currentXp / 1000) + 1;
        if (newLevel > currentLevel) {
            user.setLevel(newLevel);
            notificationService.createNotification(
                user,
                "¡NUEVO RANGO ALCANZADO! 🏆",
                "¡Felicidades! Has subido al nivel " + newLevel + ". Tu estatus en la academia es ahora más alto.",
                com.proyecto.cursos.model.Notification.ENotificationType.ACHIEVEMENT,
                "ROLE_STUDENT"
            );
        }
    }

    public int getXpForLesson() { return 50; }
    public int getXpForQuiz() { return 200; }
}
