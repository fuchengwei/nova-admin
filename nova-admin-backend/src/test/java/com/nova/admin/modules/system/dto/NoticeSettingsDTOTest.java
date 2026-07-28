package com.nova.admin.modules.system.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class NoticeSettingsDTOTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void validate_whenRichTextContentIsWithinLimit_hasNoViolations() {
        NoticeSettingsDTO settings = new NoticeSettingsDTO();
        settings.setContent("<h2>系统维护</h2><p>今晚 <strong>22:00</strong> 开始维护。</p>");

        assertThat(validator.validate(settings)).isEmpty();
    }

    @Test
    void validate_whenRichTextContentExceedsLimit_hasViolation() {
        NoticeSettingsDTO settings = new NoticeSettingsDTO();
        settings.setContent("x".repeat(10_001));

        assertThat(validator.validate(settings)).hasSize(1);
    }
}
