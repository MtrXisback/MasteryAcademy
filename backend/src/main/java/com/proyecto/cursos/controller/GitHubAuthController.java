package com.proyecto.cursos.controller;

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
import org.springframework.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth/github")
public class GitHubAuthController {

    @Value("${github.clientId}")
    private String githubClientId;

    @Value("${github.clientSecret}")
    private String githubClientSecret;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping
    public ResponseEntity<?> github(@RequestBody TokenRequest tokenRequest) {
        String code = tokenRequest.getToken();

        // 1. Intercambiar código por Access Token
        String tokenUrl = "https://github.com/login/oauth/access_token" +
                "?client_id=" + githubClientId +
                "&client_secret=" + githubClientSecret +
                "&code=" + code;

        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, entity, Map.class);
        String accessToken = (String) response.getBody().get("access_token");

        if (accessToken == null) {
            return ResponseEntity.badRequest().body("Error al obtener el Access Token de GitHub");
        }

        // 2. Obtener datos del usuario
        headers.setBearerAuth(accessToken);
        HttpEntity<String> userEntity = new HttpEntity<>(headers);
        ResponseEntity<Map> userResponse = restTemplate.exchange("https://api.github.com/user", HttpMethod.GET, userEntity, Map.class);
        Map<String, Object> githubUser = userResponse.getBody();

        String email = (String) githubUser.get("email");
        
        // GitHub a veces no devuelve el email si es privado, lo buscamos en el endpoint de emails
        if (email == null) {
            ResponseEntity<List> emailsResponse = restTemplate.exchange("https://api.github.com/user/emails", HttpMethod.GET, userEntity, List.class);
            List<Map<String, Object>> emails = emailsResponse.getBody();
            email = emails.stream()
                    .filter(e -> (Boolean) e.get("primary"))
                    .map(e -> (String) e.get("email"))
                    .findFirst()
                    .orElse((String) githubUser.get("login") + "@github.com");
        }

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            String username = (String) githubUser.get("login");
            
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
                    .password(encoder.encode("github-auth-pwd-" + Math.random()))
                    .fullName((String) githubUser.get("name"))
                    .avatarUrl((String) githubUser.get("avatar_url"))
                    .authProvider("GITHUB")
                    .build();

            Set<Role> roles = new HashSet<>();
            Role studentRole = roleRepository.findByName(ERole.ROLE_STUDENT)
                    .orElseThrow(() -> new RuntimeException("Error: Role no encontrado."));
            roles.add(studentRole);
            user.setRoles(roles);
        } else {
            // Asegurar que el proveedor esté marcado si ya existía
            user.setAuthProvider("GITHUB");
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
