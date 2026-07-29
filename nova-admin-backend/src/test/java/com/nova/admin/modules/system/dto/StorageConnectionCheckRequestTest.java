package com.nova.admin.modules.system.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class StorageConnectionCheckRequestTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void validate_whenStorageTypeIsSupported_hasNoViolation() {
        StorageConnectionCheckRequest request = new StorageConnectionCheckRequest();
        request.setStorageType("local");

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void validate_whenStorageTypeIsUnsupported_hasViolation() {
        StorageConnectionCheckRequest request = new StorageConnectionCheckRequest();
        request.setStorageType("s3");

        assertThat(validator.validate(request)).hasSize(1);
    }
}
