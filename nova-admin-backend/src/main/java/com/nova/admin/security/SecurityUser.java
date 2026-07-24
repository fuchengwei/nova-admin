package com.nova.admin.security;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Spring Security UserDetails 适配
 */
@Getter
@RequiredArgsConstructor
@SuppressWarnings("NullableProblems")
public class SecurityUser implements UserDetails {

    private final LoginUser loginUser;
    private final String password;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Stream.concat(
                loginUser.getRoles() == null ? Stream.empty()
                        : loginUser.getRoles().stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r)),
                loginUser.getPermissions() == null ? Stream.empty()
                        : loginUser.getPermissions().stream().map(SimpleGrantedAuthority::new)
        ).collect(Collectors.toSet());
    }

    @Override public String getPassword() { return password; }
    @Override public String getUsername() { return loginUser.getAccount(); }
}
