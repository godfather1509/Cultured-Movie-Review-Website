package com.fullStack.Movie.login;

import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class LoginController {

    @Autowired
    private LoginService loginService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, Object> payload) {
        String name = (String) payload.getOrDefault("name", "User");
        String email = (String) payload.get("email");
        String password = (String) payload.get("password");
        String role = (String) payload.getOrDefault("role", "USER");
        String theaterName = (String) payload.get("theaterName");
        String location = (String) payload.get("location");
        Integer screenCount = payload.containsKey("screenCount") ? Integer.parseInt(payload.get("screenCount").toString()) : 2;

        Map<String, Object> result = loginService.registerUser(name, email, password, role, theaterName, location, screenCount);
        if (result.containsKey("error")) {
            return new ResponseEntity<>(result, HttpStatus.BAD_REQUEST);
        }
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, Object> payload) {
        String email = (String) payload.get("email");
        String password = (String) payload.get("password");

        Map<String, Object> result = loginService.authenticate(email, password);
        if (result.containsKey("error")) {
            return new ResponseEntity<>(result, HttpStatus.UNAUTHORIZED);
        }
        return new ResponseEntity<>(result, HttpStatus.OK);
    }
}

