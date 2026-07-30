package com.nova.admin.modules.system.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.nova.admin.modules.system.dto.ActiveNoticeDTO;
import com.nova.admin.modules.system.dto.BasicSettingsDTO;
import com.nova.admin.modules.system.dto.NoticeSettingsDTO;
import com.nova.admin.modules.system.dto.SecuritySettingsDTO;
import com.nova.admin.modules.system.dto.UploadSettingsDTO;
import com.nova.admin.modules.system.entity.SysConfig;
import org.springframework.web.multipart.MultipartFile;

public interface SysConfigService extends IService<SysConfig> {

    BasicSettingsDTO getBasicSettings();

    SecuritySettingsDTO getSecuritySettings();

    UploadSettingsDTO getUploadSettings();

    NoticeSettingsDTO getNoticeSettings();

    ActiveNoticeDTO getActiveNotice();

    void updateBasicSettings(BasicSettingsDTO settings);

    void updateSecuritySettings(SecuritySettingsDTO settings);

    void updateUploadSettings(UploadSettingsDTO settings);

    void updateNoticeSettings(NoticeSettingsDTO settings);

    void validatePassword(String rawPassword);

    /** 当前策略下，指定密码更新时间是否已过期。 */
    boolean isPasswordExpired(java.time.LocalDateTime passwordChangedAt);

    String getUserImportInitialPassword();

    void validateUpload(MultipartFile file, boolean avatar);
}
