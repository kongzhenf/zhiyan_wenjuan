package com.questionnaire.controller;

import com.questionnaire.common.Result;
import com.questionnaire.dto.LoginRequest;
import com.questionnaire.dto.LoginResponse;
import com.questionnaire.dto.RefreshRequest;
import com.questionnaire.dto.RefreshResponse;
import com.questionnaire.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return Result.ok(response);
    }

    @PostMapping("/refresh")
    public Result<RefreshResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        RefreshResponse response = authService.refresh(request);
        return Result.ok(response);
    }

    @PostMapping("/logout")
    public Result<Void> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        String accessToken = authHeader.substring(7);
        String currentUser = (String) request.getAttribute("currentUser");
        authService.logout(accessToken, currentUser);
        return Result.ok("退出成功", null);
    }
}
