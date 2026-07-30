package com.nova.admin.config;

import com.nova.admin.common.api.R;
import com.nova.admin.security.JwtAuthFilter;
import com.nova.admin.security.PasswordLifecycleFilter;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringJUnitConfig
@WebAppConfiguration
@ContextConfiguration(classes = SecurityConfigTest.TestConfiguration.class)
class SecurityConfigTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @MockitoBean
    private JwtAuthFilter jwtAuthFilter;

    @MockitoBean
    private PasswordLifecycleFilter passwordLifecycleFilter;

    @Test
    void protectedEndpoint_whenUnauthenticated_returnsHttp401WithRBody() throws Exception {
        passThroughJwtFilter();

        mockMvc().perform(get("/test/security/protected"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    @WithMockUser
    void authorityEndpoint_whenAuthorityIsMissing_returnsHttp403WithRBody() throws Exception {
        passThroughJwtFilter();

        mockMvc().perform(get("/test/security/authority"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403))
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    private void passThroughJwtFilter() throws Exception {
        doAnswer(invocation -> {
            FilterChain chain = invocation.getArgument(2);
            chain.doFilter(invocation.getArgument(0), invocation.getArgument(1));
            return null;
        }).when(jwtAuthFilter).doFilter(any(), any(), any());
        doAnswer(invocation -> {
            FilterChain chain = invocation.getArgument(2);
            chain.doFilter(invocation.getArgument(0), invocation.getArgument(1));
            return null;
        }).when(passwordLifecycleFilter).doFilter(any(), any(), any());
    }

    private MockMvc mockMvc() {
        return MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();
    }

    @Configuration(proxyBeanMethods = false)
    @EnableWebMvc
    @EnableWebSecurity
    @Import({SecurityConfig.class, NovaProperties.class})
    static class TestConfiguration {

        @Bean
        SecurityTestController securityTestController() {
            return new SecurityTestController();
        }
    }

    @RestController
    @RequestMapping(value = "/test/security", produces = MediaType.APPLICATION_JSON_VALUE)
    static class SecurityTestController {

        @GetMapping("/protected")
        R<Void> protectedEndpoint() {
            return R.ok();
        }

        @PreAuthorize("hasAuthority('test:read')")
        @GetMapping("/authority")
        R<Void> authorityEndpoint() {
            return R.ok();
        }
    }
}
