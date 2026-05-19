package com.proyecto.cursos.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

    @Value("${google.clientId}")
    private String googleClientId;

    @Value("${github.clientId}")
    private String githubClientId;

    @Value("${culqi.publicKey}")
    private String culqiPublicKey;

    @GetMapping
    public ResponseEntity<?> getConfig() {
        return ResponseEntity.ok(Map.of(
            "googleClientId", googleClientId,
            "githubClientId", githubClientId,
            "culqiPublicKey", culqiPublicKey
        ));
    }
}
