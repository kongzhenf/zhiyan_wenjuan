package com.questionnaire.config;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class RateLimiter {

    private final StringRedisTemplate redisTemplate;

    private static final String RATE_LIMIT_PREFIX = "ratelimit:";

    public boolean isAllowed(String key, int maxRequests, int windowSeconds) {
        String redisKey = RATE_LIMIT_PREFIX + key;
        Long count = redisTemplate.opsForValue().increment(redisKey);
        if (count != null && count == 1) {
            redisTemplate.expire(redisKey, windowSeconds, TimeUnit.SECONDS);
        }
        return count != null && count <= maxRequests;
    }
}
