package com.example.backend.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PlayerController {

    @GetMapping("/api/player")
    public Player getPlayer() {
        return new Player("Tolik", 7);
    }

    public static class Player {
        public String name;
        public int level;

        public Player(String name, int level) {
            this.name = name;
            this.level = level;
        }
    }
}
