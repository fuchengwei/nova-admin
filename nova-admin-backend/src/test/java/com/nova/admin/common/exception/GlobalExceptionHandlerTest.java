package com.nova.admin.common.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

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

    @Test
    void handleAsyncRequestNotUsable_returnsNoJsonBody() {
        var request = new org.springframework.mock.web.MockHttpServletRequest();
        request.setMethod("GET");
        request.setRequestURI("/api/auth/session-events");

        assertThatCode(() -> handler.handleAsyncRequestNotUsable(
                new AsyncRequestNotUsableException("Broken pipe"), request)).doesNotThrowAnyException();
    }
}
