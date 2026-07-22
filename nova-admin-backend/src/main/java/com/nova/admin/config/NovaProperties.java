package com.nova.admin.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

/**
 * Nova Admin 自定义配置项
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "nova")
public class NovaProperties {

    private Security security = new Security();
    private Cors cors = new Cors();
    private File file = new File();

    @Data
    public static class Security {
        private Jwt jwt = new Jwt();
        private Captcha captcha = new Captcha();
        private Login login = new Login();
    }

    @Data
    public static class Jwt {
        private String secret;
        private long accessTokenExpireMinutes = 120;
        private long refreshTokenExpireMinutes = 10080;
        private String header = "Authorization";
        private String prefix = "Bearer ";
    }

    @Data
    public static class Captcha {
        private boolean enabled = true;
        private int expireMinutes = 5;
    }

    @Data
    public static class Login {
        private int maxRetryCount = 5;
        private int lockMinutes = 10;
    }

    @Data
    public static class Cors {
        private List<String> allowedOrigins = new ArrayList<>();
        private String allowedMethods = "*";
        private String allowedHeaders = "*";
        private boolean allowCredentials = true;
        private long maxAge = 3600;
    }

    @Data
    public static class File {
        private String storageType = "local";
        private Local local = new Local();
        private Minio minio = new Minio();
    }

    @Data
    public static class Local {
        private String basePath;
        private String urlPrefix;
    }

    @Data
    public static class Minio {
        private String endpoint;
        private String accessKey;
        private String secretKey;
        private String bucket;
    }
}
