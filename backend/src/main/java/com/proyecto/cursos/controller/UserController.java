package com.proyecto.cursos.controller;

import com.proyecto.cursos.model.User;
import com.proyecto.cursos.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.findByUsername(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> data) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User updated = userService.updateProfile(
            username, 
            data.get("fullName"), 
            data.get("avatarUrl"),
            data.get("bio"),
            data.get("specialty")
        );
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/instructors")
    public ResponseEntity<?> getFeaturedInstructors() {
        return ResponseEntity.ok(userService.getFeaturedInstructors());
    }

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PutMapping("/{id}/role")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> data) {
        String roleStr = data.get("role");
        com.proyecto.cursos.model.ERole roleEnum = com.proyecto.cursos.model.ERole.valueOf(roleStr);
        userService.updateUserRole(id, roleEnum);
        return ResponseEntity.ok().body(Map.of("message", "Rol de usuario actualizado con éxito"));
    }

    @PutMapping("/{id}/featured")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> toggleFeatured(@PathVariable Long id, @RequestBody Map<String, Boolean> data) {
        userService.toggleFeatured(id, data.get("featured"));
        return ResponseEntity.ok().body(Map.of("message", "Estado de instructor actualizado"));
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> data) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            userService.changePassword(username, data.get("oldPassword"), data.get("newPassword"));
            return ResponseEntity.ok().body(Map.of("message", "Contraseña actualizada con éxito"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok().body(Map.of("message", "Usuario eliminado permanentemente"));
    }
}
