package com.questionnaire.service.impl;

import com.questionnaire.common.BizException;
import com.questionnaire.common.ErrorCode;
import com.questionnaire.dto.LoginRequest;
import com.questionnaire.dto.LoginResponse;
import com.questionnaire.dto.RefreshRequest;
import com.questionnaire.dto.RefreshResponse;
import com.questionnaire.entity.Admin;
import com.questionnaire.repository.AdminRepository;
import com.questionnaire.service.AuthService;
import com.questionnaire.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AdminRepository adminRepository;
    private final JwtUtil jwtUtil;
    private final StringRedisTemplate stringRedisTemplate;

    private static final BCryptPasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder();
    private static final int MAX_FAIL_COUNT = 5;
    private static final int LOCK_MINUTES = 10;
    private static final String TOKEN_BLACKLIST_PREFIX = "token:blacklist:";
    private static final String REFRESH_TOKEN_PREFIX = "token:refresh:";

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        Admin admin = adminRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BizException(ErrorCode.LOGIN_FAILED));

        if (admin.getLocked() && admin.getLockUntil() != null) {
            if (LocalDateTime.now().isBefore(admin.getLockUntil())) {
                throw new BizException(ErrorCode.ACCOUNT_LOCKED);
            }
            admin.setLocked(false);
            admin.setFailCount(0);
            admin.setLockUntil(null);
            adminRepository.save(admin);
        }

        if (!PASSWORD_ENCODER.matches(request.getPassword(), admin.getPassword())) {
            int failCount = admin.getFailCount() + 1;
            admin.setFailCount(failCount);

            if (failCount >= MAX_FAIL_COUNT) {
                admin.setLocked(true);
                admin.setLockUntil(LocalDateTime.now().plusMinutes(LOCK_MINUTES));
            }
            adminRepository.save(admin);
            throw new BizException(ErrorCode.LOGIN_FAILED);
        }

        admin.setFailCount(0);
        admin.setLocked(false);
        admin.setLockUntil(null);
        adminRepository.save(admin);

        String accessToken = jwtUtil.generateAccessToken(admin.getUsername());
        String refreshToken = jwtUtil.generateRefreshToken(admin.getUsername());

        String refreshTokenId = jwtUtil.getTokenId(refreshToken);
        long refreshRemainingMillis = jwtUtil.getRemainingMillis(refreshToken);
        stringRedisTemplate.opsForValue().set(
                REFRESH_TOKEN_PREFIX + refreshTokenId,
                admin.getUsername(),
                refreshRemainingMillis,
                TimeUnit.MILLISECONDS
        );

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtUtil.getAccessExpirationSeconds())
                .tokenType("Bearer")
                .username(admin.getUsername())
                .build();
    }

    @Override
    public RefreshResponse refresh(RefreshRequest request) {
        String refreshToken = request.getRefreshToken();

        if (!jwtUtil.validateToken(refreshToken)) {
            throw new BizException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        String tokenType = jwtUtil.getTokenType(refreshToken);
        if (!"refresh".equals(tokenType)) {
            throw new BizException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        String refreshTokenId = jwtUtil.getTokenId(refreshToken);
        String storedUsername = stringRedisTemplate.opsForValue().get(REFRESH_TOKEN_PREFIX + refreshTokenId);
        if (storedUsername == null) {
            throw new BizException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        stringRedisTemplate.delete(REFRESH_TOKEN_PREFIX + refreshTokenId);

        String username = jwtUtil.getUsernameFromToken(refreshToken);
        String newAccessToken = jwtUtil.generateAccessToken(username);
        String newRefreshToken = jwtUtil.generateRefreshToken(username);

        String newRefreshTokenId = jwtUtil.getTokenId(newRefreshToken);
        long newRefreshRemainingMillis = jwtUtil.getRemainingMillis(newRefreshToken);
        stringRedisTemplate.opsForValue().set(
                REFRESH_TOKEN_PREFIX + newRefreshTokenId,
                username,
                newRefreshRemainingMillis,
                TimeUnit.MILLISECONDS
        );

        return RefreshResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .expiresIn(jwtUtil.getAccessExpirationSeconds())
                .tokenType("Bearer")
                .build();
    }

    @Override
    public void logout(String accessToken, String username) {
        String tokenId = jwtUtil.getTokenId(accessToken);
        long remainingMillis = jwtUtil.getRemainingMillis(accessToken);

        if (remainingMillis > 0) {
            stringRedisTemplate.opsForValue().set(
                    TOKEN_BLACKLIST_PREFIX + tokenId,
                    username,
                    remainingMillis,
                    TimeUnit.MILLISECONDS
            );
        }
    }
}
