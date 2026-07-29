package com.nova.admin.modules.system.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class UploadSettingsDTOTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void validate_whenStorageTypeIsSupported_hasNoViolation() {
        UploadSettingsDTO settings = new UploadSettingsDTO();
        settings.setStorageType("minio");

        assertThat(validator.validate(settings)).isEmpty();
    }

    @Test
    void validate_whenStorageTypeIsUnsupported_hasViolation() {
        UploadSettingsDTO settings = new UploadSettingsDTO();
        settings.setStorageType("s3");

        assertThat(validator.validate(settings)).hasSize(1);
    }
}
