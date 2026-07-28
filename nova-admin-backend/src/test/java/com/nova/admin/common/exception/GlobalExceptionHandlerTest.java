package com.nova.admin.common.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleAuthentication_returnsHttp401WithRBody() {
        var response = handler.handleAuthentication(new BadCredentialsException("invalid"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).extracting("code", "msg").containsExactly(401, "invalid");
    }

    @Test
    void handleAccessDenied_returnsHttp403WithRBody() {
        var response = handler.handleAccessDenied(new AccessDeniedException("denied"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).extracting("code", "msg").containsExactly(403, "denied");
    }
}
