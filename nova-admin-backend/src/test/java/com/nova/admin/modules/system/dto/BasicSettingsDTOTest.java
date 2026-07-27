package com.nova.admin.modules.system.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class BasicSettingsDTOTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void validate_whenThemeColorAndLanguageAreSupported_hasNoViolations() {
        BasicSettingsDTO settings = new BasicSettingsDTO();
        settings.setThemeColor("#1677ff");
        settings.setDefaultLanguage("zh_CN");

        assertThat(validator.validate(settings)).isEmpty();
    }

    @Test
    void validate_whenThemeColorOrLanguageIsUnsupported_hasViolations() {
        BasicSettingsDTO settings = new BasicSettingsDTO();
        settings.setThemeColor("blue");
        settings.setDefaultLanguage("zh-CN");

        assertThat(validator.validate(settings)).hasSize(2);
    }
}
