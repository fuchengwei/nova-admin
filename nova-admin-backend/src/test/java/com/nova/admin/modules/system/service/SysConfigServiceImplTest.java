package com.nova.admin.modules.system.service;

import com.nova.admin.modules.system.dto.ActiveNoticeDTO;
import com.nova.admin.modules.system.dto.NoticeSettingsDTO;
import com.nova.admin.modules.system.dto.SecuritySettingsDTO;
import com.nova.admin.modules.system.service.impl.SysConfigServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doReturn;

@ExtendWith(MockitoExtension.class)
class SysConfigServiceImplTest {

    @Spy
    @InjectMocks
    private SysConfigServiceImpl sysConfigService;

    @Test
    void getActiveNotice_whenNoticeIsDisabled_returnsNull() {
        NoticeSettingsDTO settings = noticeSettings(false, "系统维护", "今晚 22:00 开始维护", "warning");
        doReturn(settings).when(sysConfigService).getNoticeSettings();

        assertThat(sysConfigService.getActiveNotice()).isNull();
    }

    @Test
    void getActiveNotice_whenNoticeHasNoDisplayContent_returnsNull() {
        NoticeSettingsDTO settings = noticeSettings(true, " ", "", "info");
        doReturn(settings).when(sysConfigService).getNoticeSettings();

        assertThat(sysConfigService.getActiveNotice()).isNull();
    }

    @Test
    void getActiveNotice_whenNoticeIsEnabled_returnsOnlyDisplayFields() {
        NoticeSettingsDTO settings = noticeSettings(true, "系统维护", "今晚 22:00 开始维护", "warning");
        settings.setEmailHost("smtp.internal");
        doReturn(settings).when(sysConfigService).getNoticeSettings();

        ActiveNoticeDTO notice = sysConfigService.getActiveNotice();

        assertThat(notice)
                .extracting(ActiveNoticeDTO::getTitle, ActiveNoticeDTO::getContent)
                .containsExactly("系统维护", "今晚 22:00 开始维护");
    }

    @Test
    void isPasswordExpired_respectsConfiguredExpirationDays() {
        SecuritySettingsDTO settings = new SecuritySettingsDTO();
        settings.setPasswordExpireDays(30);
        doReturn(settings).when(sysConfigService).getSecuritySettings();

        assertThat(sysConfigService.isPasswordExpired(LocalDateTime.now().minusDays(30))).isTrue();
        assertThat(sysConfigService.isPasswordExpired(LocalDateTime.now().minusDays(29))).isFalse();
    }

    private NoticeSettingsDTO noticeSettings(boolean enabled, String title, String content, String level) {
        NoticeSettingsDTO settings = new NoticeSettingsDTO();
        settings.setEnabled(enabled);
        settings.setTitle(title);
        settings.setContent(content);
        settings.setLevel(level);
        return settings;
    }
}
