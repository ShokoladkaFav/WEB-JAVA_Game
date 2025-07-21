package com.example.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

@GetMapping("/")
public String hello() {
    System.out.println("⚙️ Запит отримано!");
    return "✅ Сервер працює! Все OK.";
    }
}
