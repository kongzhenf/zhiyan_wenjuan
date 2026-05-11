package com.questionnaire.service;

import com.questionnaire.dto.LoginRequest;
import com.questionnaire.dto.LoginResponse;
import com.questionnaire.dto.RefreshRequest;
import com.questionnaire.dto.RefreshResponse;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    RefreshResponse refresh(RefreshRequest request);

    void logout(String accessToken, String username);
}
