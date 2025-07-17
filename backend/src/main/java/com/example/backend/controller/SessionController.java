package com.example.backend.controller;

import com.example.backend.model.GameSession;
import com.example.backend.repository.GameSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    @Autowired
    private GameSessionRepository gameSessionRepository;

    @PostMapping
    public ResponseEntity<GameSession> createSession(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String sessionId = UUID.randomUUID().toString();

        GameSession session = new GameSession(sessionId, username);
        gameSessionRepository.save(session);

        return ResponseEntity.ok(session);
    }

    @GetMapping("/{username}")
    public ResponseEntity<List<GameSession>> getSessionsByUsername(@PathVariable String username) {
        List<GameSession> sessions = gameSessionRepository.findByUsername(username);
        return ResponseEntity.ok(sessions);
    }
}
