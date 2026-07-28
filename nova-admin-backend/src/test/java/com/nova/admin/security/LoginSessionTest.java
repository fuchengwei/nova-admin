package com.nova.admin.security;

import com.nova.admin.modules.auth.service.AuthSessionService;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class LoginSessionTest {

    @Test
    void copyWithJti_preservesUserDetailsWithoutMutatingOriginal() {
        LoginUser original = LoginUser.builder()
                .userId(1L)
                .account("admin")
                .loginIp("127.0.0.1")
                .jti("original-jti")
                .build();

        LoginUser copy = original.copyWithJti("request-jti");

        assertThat(copy.getJti()).isEqualTo("request-jti");
        assertThat(copy.getAccount()).isEqualTo("admin");
        assertThat(original.getJti()).isEqualTo("original-jti");
    }

    @Test
    void of_mapsLoginUserToSessionWithoutAuthorizationDetails() {
        LoginUser user = LoginUser.builder()
                .userId(1L)
                .account("admin")
                .nickname("Admin")
                .deptId(10L)
                .loginIp("127.0.0.1")
                .loginTime(1000L)
                .roles(Set.of("super_admin"))
                .permissions(Set.of("system:user:list"))
                .build();

        LoginSession session = AuthSessionService.of(user, "access-jti", "refresh-jti", "Mozilla/5.0");

        assertThat(session)
                .extracting(LoginSession::getAccessJti, LoginSession::getRefreshJti,
                        LoginSession::getUserId, LoginSession::getAccount, LoginSession::getLoginIp,
                        LoginSession::getUserAgent)
                .containsExactly("access-jti", "refresh-jti", 1L, "admin", "127.0.0.1", "Mozilla/5.0");
    }
}
