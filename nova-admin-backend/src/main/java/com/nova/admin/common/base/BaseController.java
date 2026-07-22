package com.nova.admin.common.base;

import com.nova.admin.common.api.R;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;

import java.util.Locale;

/**
 * Controller 基类：提供 i18n 能力与统一响应快捷方法
 */
public abstract class BaseController {

    @Autowired
    protected MessageSource messageSource;

    protected String i18n(String code, Object... args) {
        Locale locale = LocaleContextHolder.getLocale();
        return messageSource.getMessage(code, args, locale);
    }

    protected <T> R<T> ok() {
        return R.ok();
    }

    protected <T> R<T> ok(T data) {
        return R.ok(data);
    }

    protected <T> R<T> fail(int code, String msg) {
        return R.fail(code, msg);
    }
}
