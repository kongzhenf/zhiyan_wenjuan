package com.questionnaire.config;

import com.questionnaire.common.BizException;
import com.questionnaire.common.ErrorCode;
import com.questionnaire.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final StringRedisTemplate redisTemplate;

    private static final String TOKEN_BLACKLIST_PREFIX = "token:blacklist:";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        if (isPublicPath(path)) {
            chain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            sendUnauthorized(response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            if (!jwtUtil.validateToken(token)) {
                sendUnauthorized(response);
                return;
            }

            String tokenType = jwtUtil.getTokenType(token);
            if (!"access".equals(tokenType)) {
                sendUnauthorized(response);
                return;
            }

            String tokenId = jwtUtil.getTokenId(token);
            Boolean isBlacklisted = redisTemplate.hasKey(TOKEN_BLACKLIST_PREFIX + tokenId);
            if (Boolean.TRUE.equals(isBlacklisted)) {
                sendUnauthorized(response);
                return;
            }

            String username = jwtUtil.getUsernameFromToken(token);
            request.setAttribute("currentUser", username);
            chain.doFilter(request, response);

        } catch (Exception e) {
            sendUnauthorized(response);
        }
    }

    private boolean isPublicPath(String path) {
        return path.startsWith("/api/auth/login")
                || path.startsWith("/api/auth/refresh")
                || path.startsWith("/api/fill/");
    }

    private void sendUnauthorized(HttpServletResponse response) throws IOException {
        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.getWriter().write(
                "{\"success\":false,\"code\":401000,\"message\":\"Token无效或已过期\",\"result\":null}");
    }
}
