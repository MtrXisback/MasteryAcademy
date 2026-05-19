package com.proyecto.cursos.service;

import com.proyecto.cursos.model.User;
import com.proyecto.cursos.model.Role;
import com.proyecto.cursos.model.ERole;
import com.proyecto.cursos.repository.UserRepository;
import com.proyecto.cursos.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public User updateProfile(String username, String fullName, String avatarUrl, String bio, String specialty) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        if (fullName != null) user.setFullName(fullName);
        if (avatarUrl != null) user.setAvatarUrl(avatarUrl);
        if (bio != null) user.setBio(bio);
        if (specialty != null) user.setSpecialty(specialty);
        
        return userRepository.save(user);
    }

    public List<User> getFeaturedInstructors() {
        return userRepository.findFeaturedInstructors(ERole.ROLE_INSTRUCTOR);
    }

    @Transactional
    public void toggleFeatured(Long userId, boolean featured) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        user.setFeatured(featured);
        userRepository.save(user);
    }

    @Transactional
    public void updateUserRole(Long userId, ERole roleEnum) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        Role role = roleRepository.findByName(roleEnum)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado: " + roleEnum));
        
        user.getRoles().clear();
        user.getRoles().add(role);
        userRepository.save(user);
    }

    @Transactional
    public void changePassword(String username, String oldPassword, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("La contraseña actual es incorrecta");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("Usuario no encontrado con id: " + userId);
        }
        userRepository.deleteById(userId);
    }
}
