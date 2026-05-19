package com.proyecto.cursos.controller;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.proyecto.cursos.model.ERole;
import com.proyecto.cursos.model.Role;
import com.proyecto.cursos.model.User;
import com.proyecto.cursos.payload.request.TokenRequest;
import com.proyecto.cursos.payload.response.JwtResponse;
import com.proyecto.cursos.repository.RoleRepository;
import com.proyecto.cursos.repository.UserRepository;
import com.proyecto.cursos.security.jwt.JwtUtils;
import com.proyecto.cursos.security.services.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth/google")
public class GoogleAuthController {

    @Value("${google.clientId}")
    private String googleClientId;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping
    public ResponseEntity<?> google(@RequestBody TokenRequest tokenRequest) throws Exception {
        NetHttpTransport transport = new NetHttpTransport();
        GsonFactory factory = GsonFactory.getDefaultInstance();
        
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(transport, factory)
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        GoogleIdToken idToken = verifier.verify(tokenRequest.getToken());
        
        if (idToken == null) {
            return ResponseEntity.badRequest().body("Token de Google inválido");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        String email = payload.getEmail();
        
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            // Crear nuevo usuario si no existe
            String username = (String) payload.get("name");
            if (username == null) username = email.split("@")[0];
            
            // Asegurar username único
            String baseUsername = username.replaceAll("\\s+", "").toLowerCase();
            username = baseUsername;
            int counter = 1;
            while (userRepository.existsByUsername(username)) {
                username = baseUsername + counter++;
            }

            user = User.builder()
                    .username(username)
                    .email(email)
                    .password(encoder.encode("google-auth-pwd-" + Math.random()))
                    .fullName(payload.get("name").toString())
                    .avatarUrl(payload.get("picture").toString())
                    .authProvider("GOOGLE")
                    .build();

            Set<Role> roles = new HashSet<>();
            Role studentRole = roleRepository.findByName(ERole.ROLE_STUDENT)
                    .orElseThrow(() -> new RuntimeException("Error: Role no encontrado."));
            roles.add(studentRole);
            user.setRoles(roles);
        } else {
            // Asegurar que el proveedor esté marcado si ya existía de forma local o incompleta
            user.setAuthProvider("GOOGLE");
        }
        
        userRepository.save(user);

        // 3. Autenticar y generar JWT
        UserDetailsImpl userDetails = UserDetailsImpl.build(user);
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        return ResponseEntity.ok(new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                roles,
                userDetails.getXp(),
                userDetails.getLevel(),
                userDetails.getAuthProvider()));
    }
}
