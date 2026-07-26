package com.nova.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.modules.system.dto.BasicSettingsDTO;
import com.nova.admin.modules.system.dto.NoticeSettingsDTO;
import com.nova.admin.modules.system.dto.SecuritySettingsDTO;
import com.nova.admin.modules.system.dto.UploadSettingsDTO;
import com.nova.admin.modules.system.entity.SysConfig;
import com.nova.admin.modules.system.mapper.SysConfigMapper;
import com.nova.admin.modules.system.service.SysConfigService;
import com.nova.admin.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SysConfigServiceImpl extends ServiceImpl<SysConfigMapper, SysConfig> implements SysConfigService {

    private static final String GROUP_BASIC = "basic";
    private static final String GROUP_SECURITY = "security";
    private static final String GROUP_UPLOAD = "upload";
    private static final String GROUP_NOTICE = "notice";

    private static final long MB = 1024L * 1024L;
    private static final Set<String> SPECIAL_CHARS = Set.of("!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "+", "-", "=", "[", "]", "{", "}", ";", "'", ":", "\"", "\\", "|", ",", ".", "<", ">", "/", "?", "`", "~");

    @Override
    public BasicSettingsDTO getBasicSettings() {
        Map<String, String> values = groupValues(GROUP_BASIC);
        BasicSettingsDTO dto = defaultBasicSettings();
        dto.setSystemName(getString(values, "site.name", dto.getSystemName()));
        dto.setBrowserTitle(getString(values, "site.browser-title", dto.getBrowserTitle()));
        dto.setLogoUrl(getString(values, "site.logo-url", dto.getLogoUrl()));
        dto.setDefaultLanguage(getString(values, "site.default-language", dto.getDefaultLanguage()));
        dto.setThemeColor(getString(values, "site.theme-color", dto.getThemeColor()));
        dto.setCopyrightText(getString(values, "site.copyright", dto.getCopyrightText()));
        return dto;
    }

    @Override
    public SecuritySettingsDTO getSecuritySettings() {
        Map<String, String> values = groupValues(GROUP_SECURITY);
        SecuritySettingsDTO dto = defaultSecuritySettings();
        dto.setPasswordMinLength(getInt(values, "security.password.min-length", dto.getPasswordMinLength()));
        dto.setPasswordRequireNumber(getBool(values, "security.password.require-number", dto.getPasswordRequireNumber()));
        dto.setPasswordRequireLetter(getBool(values, "security.password.require-letter", dto.getPasswordRequireLetter()));
        dto.setPasswordRequireSpecial(getBool(values, "security.password.require-special", dto.getPasswordRequireSpecial()));
        dto.setLoginLockMaxAttempts(getInt(values, "security.login.max-attempts", dto.getLoginLockMaxAttempts()));
        dto.setLoginLockMinutes(getInt(values, "security.login.lock-minutes", dto.getLoginLockMinutes()));
        dto.setCaptchaEnabled(getBool(values, "security.captcha.enabled", dto.getCaptchaEnabled()));
        dto.setAccessTokenExpireMinutes(getInt(values, "security.token.access-minutes", dto.getAccessTokenExpireMinutes()));
        dto.setRefreshTokenExpireMinutes(getInt(values, "security.token.refresh-minutes", dto.getRefreshTokenExpireMinutes()));
        return dto;
    }

    @Override
    public UploadSettingsDTO getUploadSettings() {
        Map<String, String> values = groupValues(GROUP_UPLOAD);
        UploadSettingsDTO dto = defaultUploadSettings();
        dto.setMaxSizeMb(getInt(values, "upload.max-size-mb", dto.getMaxSizeMb()));
        dto.setAllowedTypes(getString(values, "upload.allowed-types", dto.getAllowedTypes()));
        dto.setAvatarMaxSizeMb(getInt(values, "upload.avatar.max-size-mb", dto.getAvatarMaxSizeMb()));
        dto.setAvatarAllowedTypes(getString(values, "upload.avatar.allowed-types", dto.getAvatarAllowedTypes()));
        return dto;
    }

    @Override
    public NoticeSettingsDTO getNoticeSettings() {
        Map<String, String> values = groupValues(GROUP_NOTICE);
        NoticeSettingsDTO dto = defaultNoticeSettings();
        dto.setTitle(getString(values, "notice.title", dto.getTitle()));
        dto.setContent(getString(values, "notice.content", dto.getContent()));
        dto.setEnabled(getBool(values, "notice.enabled", dto.getEnabled()));
        dto.setLevel(getString(values, "notice.level", dto.getLevel()));
        dto.setEmailEnabled(getBool(values, "notice.email.enabled", dto.getEmailEnabled()));
        dto.setEmailHost(getString(values, "notice.email.host", dto.getEmailHost()));
        dto.setEmailPort(getInt(values, "notice.email.port", dto.getEmailPort()));
        dto.setEmailUsername(getString(values, "notice.email.username", dto.getEmailUsername()));
        dto.setSmsEnabled(getBool(values, "notice.sms.enabled", dto.getSmsEnabled()));
        dto.setSmsProvider(getString(values, "notice.sms.provider", dto.getSmsProvider()));
        return dto;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateBasicSettings(BasicSettingsDTO settings) {
        upsert(GROUP_BASIC, "site.name", settings.getSystemName(), "string", "系统名称");
        upsert(GROUP_BASIC, "site.browser-title", settings.getBrowserTitle(), "string", "浏览器标题");
        upsert(GROUP_BASIC, "site.logo-url", settings.getLogoUrl(), "string", "Logo URL");
        upsert(GROUP_BASIC, "site.default-language", settings.getDefaultLanguage(), "string", "默认语言");
        upsert(GROUP_BASIC, "site.theme-color", settings.getThemeColor(), "string", "主题色");
        upsert(GROUP_BASIC, "site.copyright", settings.getCopyrightText(), "string", "版权文本");
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateSecuritySettings(SecuritySettingsDTO settings) {
        upsert(GROUP_SECURITY, "security.password.min-length", settings.getPasswordMinLength(), "number", "密码最小长度");
        upsert(GROUP_SECURITY, "security.password.require-number", settings.getPasswordRequireNumber(), "boolean", "密码要求数字");
        upsert(GROUP_SECURITY, "security.password.require-letter", settings.getPasswordRequireLetter(), "boolean", "密码要求字母");
        upsert(GROUP_SECURITY, "security.password.require-special", settings.getPasswordRequireSpecial(), "boolean", "密码要求特殊字符");
        upsert(GROUP_SECURITY, "security.login.max-attempts", settings.getLoginLockMaxAttempts(), "number", "登录失败锁定次数");
        upsert(GROUP_SECURITY, "security.login.lock-minutes", settings.getLoginLockMinutes(), "number", "登录锁定分钟数");
        upsert(GROUP_SECURITY, "security.captcha.enabled", settings.getCaptchaEnabled(), "boolean", "验证码开关");
        upsert(GROUP_SECURITY, "security.token.access-minutes", settings.getAccessTokenExpireMinutes(), "number", "访问 Token 有效期");
        upsert(GROUP_SECURITY, "security.token.refresh-minutes", settings.getRefreshTokenExpireMinutes(), "number", "刷新 Token 有效期");
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateUploadSettings(UploadSettingsDTO settings) {
        upsert(GROUP_UPLOAD, "upload.max-size-mb", settings.getMaxSizeMb(), "number", "通用最大上传大小");
        upsert(GROUP_UPLOAD, "upload.allowed-types", settings.getAllowedTypes(), "string", "通用允许文件类型");
        upsert(GROUP_UPLOAD, "upload.avatar.max-size-mb", settings.getAvatarMaxSizeMb(), "number", "头像最大上传大小");
        upsert(GROUP_UPLOAD, "upload.avatar.allowed-types", settings.getAvatarAllowedTypes(), "string", "头像允许文件类型");
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateNoticeSettings(NoticeSettingsDTO settings) {
        upsert(GROUP_NOTICE, "notice.title", settings.getTitle(), "string", "公告标题");
        upsert(GROUP_NOTICE, "notice.content", settings.getContent(), "string", "公告内容");
        upsert(GROUP_NOTICE, "notice.enabled", settings.getEnabled(), "boolean", "公告启用状态");
        upsert(GROUP_NOTICE, "notice.level", settings.getLevel(), "string", "公告级别");
        upsert(GROUP_NOTICE, "notice.email.enabled", settings.getEmailEnabled(), "boolean", "邮件通知开关");
        upsert(GROUP_NOTICE, "notice.email.host", settings.getEmailHost(), "string", "邮件服务器");
        upsert(GROUP_NOTICE, "notice.email.port", settings.getEmailPort(), "number", "邮件端口");
        upsert(GROUP_NOTICE, "notice.email.username", settings.getEmailUsername(), "string", "邮件账号");
        upsert(GROUP_NOTICE, "notice.sms.enabled", settings.getSmsEnabled(), "boolean", "短信通知开关");
        upsert(GROUP_NOTICE, "notice.sms.provider", settings.getSmsProvider(), "string", "短信服务商");
    }

    @Override
    public void validatePassword(String rawPassword) {
        SecuritySettingsDTO settings = getSecuritySettings();
        if (rawPassword == null || rawPassword.length() < settings.getPasswordMinLength()) {
            throw new BizException(ResultCode.BAD_REQUEST, "密码长度不能小于" + settings.getPasswordMinLength() + "位");
        }
        if (Boolean.TRUE.equals(settings.getPasswordRequireNumber()) && rawPassword.chars().noneMatch(Character::isDigit)) {
            throw new BizException(ResultCode.BAD_REQUEST, "密码必须包含数字");
        }
        if (Boolean.TRUE.equals(settings.getPasswordRequireLetter()) && rawPassword.chars().noneMatch(Character::isLetter)) {
            throw new BizException(ResultCode.BAD_REQUEST, "密码必须包含字母");
        }
        if (Boolean.TRUE.equals(settings.getPasswordRequireSpecial()) && rawPassword.chars().mapToObj(c -> String.valueOf((char) c)).noneMatch(SPECIAL_CHARS::contains)) {
            throw new BizException(ResultCode.BAD_REQUEST, "密码必须包含特殊字符");
        }
    }

    @Override
    public void validateUpload(MultipartFile file, boolean avatar) {
        if (file == null || file.isEmpty()) {
            throw new BizException(ResultCode.BAD_REQUEST, "上传文件不能为空");
        }
        UploadSettingsDTO settings = getUploadSettings();
        int maxSizeMb = avatar ? settings.getAvatarMaxSizeMb() : settings.getMaxSizeMb();
        String allowedTypes = avatar ? settings.getAvatarAllowedTypes() : settings.getAllowedTypes();
        if (file.getSize() > maxSizeMb * MB) {
            throw new BizException(ResultCode.BAD_REQUEST, "文件大小不能超过" + maxSizeMb + "MB");
        }
        if (!matchesAllowedType(file, allowedTypes)) {
            throw new BizException(ResultCode.BAD_REQUEST, "文件类型不允许");
        }
    }

    private Map<String, String> groupValues(String group) {
        return list(new LambdaQueryWrapper<SysConfig>()
                .eq(SysConfig::getConfigGroup, group))
                .stream()
                .collect(Collectors.toMap(SysConfig::getConfigKey, SysConfig::getConfigValue, (a, b) -> b));
    }

    private void upsert(String group, String key, Object value, String valueType, String description) {
        SysConfig existing = getOne(new LambdaQueryWrapper<SysConfig>().eq(SysConfig::getConfigKey, key), false);
        String nextValue = value == null ? "" : String.valueOf(value);
        Long operatorId = SecurityUtils.getLoginUser().map(u -> u.getUserId()).orElse(null);
        if (existing == null) {
            SysConfig config = new SysConfig();
            config.setConfigGroup(group);
            config.setConfigKey(key);
            config.setConfigValue(nextValue);
            config.setValueType(valueType);
            config.setDescription(description);
            config.setBuiltin(1);
            config.setCreateBy(operatorId);
            config.setUpdateBy(operatorId);
            save(config);
            return;
        }
        existing.setConfigValue(nextValue);
        existing.setValueType(valueType);
        existing.setDescription(description);
        existing.setUpdateBy(operatorId);
        updateById(existing);
    }

    private boolean matchesAllowedType(MultipartFile file, String allowedTypes) {
        List<String> types = splitTypes(allowedTypes);
        if (types.isEmpty() || types.contains("*")) return true;
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        String originalName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        String ext = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf('.')) : "";
        return types.stream().anyMatch(type -> matchesType(type, contentType, ext));
    }

    private boolean matchesType(String type, String contentType, String ext) {
        if (type.endsWith("/*")) {
            return contentType.startsWith(type.substring(0, type.length() - 1));
        }
        if (type.startsWith(".")) {
            return Objects.equals(type, ext);
        }
        return Objects.equals(type, contentType) || Objects.equals(type, ext.replaceFirst("^\\.", ""));
    }

    private List<String> splitTypes(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        return Arrays.stream(raw.split(","))
                .map(s -> s.trim().toLowerCase(Locale.ROOT))
                .filter(s -> !s.isBlank())
                .toList();
    }

    private String getString(Map<String, String> values, String key, String defaultValue) {
        String value = values.get(key);
        return value == null ? defaultValue : value;
    }

    private Integer getInt(Map<String, String> values, String key, Integer defaultValue) {
        return getParsed(values, key, defaultValue, Integer::parseInt);
    }

    private Boolean getBool(Map<String, String> values, String key, Boolean defaultValue) {
        return getParsed(values, key, defaultValue, Boolean::parseBoolean);
    }

    private <T> T getParsed(Map<String, String> values, String key, T defaultValue, Function<String, T> parser) {
        String value = values.get(key);
        if (value == null || value.isBlank()) return defaultValue;
        try {
            return parser.apply(value);
        } catch (Exception e) {
            log.warn("系统配置解析失败，key={}，使用默认值", key, e);
            return defaultValue;
        }
    }

    private BasicSettingsDTO defaultBasicSettings() {
        BasicSettingsDTO dto = new BasicSettingsDTO();
        dto.setSystemName("Nova Admin");
        dto.setBrowserTitle("Nova Admin");
        dto.setLogoUrl("");
        dto.setDefaultLanguage("zh_CN");
        dto.setThemeColor("#1677ff");
        dto.setCopyrightText("© 2026 Nova Admin");
        return dto;
    }

    private SecuritySettingsDTO defaultSecuritySettings() {
        SecuritySettingsDTO dto = new SecuritySettingsDTO();
        dto.setPasswordMinLength(6);
        dto.setPasswordRequireNumber(false);
        dto.setPasswordRequireLetter(false);
        dto.setPasswordRequireSpecial(false);
        dto.setLoginLockMaxAttempts(5);
        dto.setLoginLockMinutes(10);
        dto.setCaptchaEnabled(true);
        dto.setAccessTokenExpireMinutes(120);
        dto.setRefreshTokenExpireMinutes(10080);
        return dto;
    }

    private UploadSettingsDTO defaultUploadSettings() {
        UploadSettingsDTO dto = new UploadSettingsDTO();
        dto.setMaxSizeMb(100);
        dto.setAllowedTypes("*");
        dto.setAvatarMaxSizeMb(5);
        dto.setAvatarAllowedTypes("image/png,image/jpeg,image/gif,image/webp,.png,.jpg,.jpeg,.gif,.webp");
        return dto;
    }

    private NoticeSettingsDTO defaultNoticeSettings() {
        NoticeSettingsDTO dto = new NoticeSettingsDTO();
        dto.setTitle("");
        dto.setContent("");
        dto.setEnabled(false);
        dto.setLevel("info");
        dto.setEmailEnabled(false);
        dto.setEmailHost("");
        dto.setEmailPort(25);
        dto.setEmailUsername("");
        dto.setSmsEnabled(false);
        dto.setSmsProvider("");
        return dto;
    }
}
