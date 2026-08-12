package com.factory.monitoring.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * SecurityConfig — Minimal security configuration.
 *
 * For this phase we:
 *   - Disable CSRF (stateless REST API with JWT)
 *   - Permit all /api/** endpoints (frontend uses its own token-check via ProtectedRoute)
 *   - Disable Spring Security's default login form (we use our own /api/auth/login)
 *   - Use stateless sessions (no server-side session)
 *
 * NOTE: Full JWT filter-based authorization is the next hardening step.
 * BCryptPasswordEncoder is used for all password hashing (see AuthService).
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll()
            )
            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable);

        return http.build();
    }
}
