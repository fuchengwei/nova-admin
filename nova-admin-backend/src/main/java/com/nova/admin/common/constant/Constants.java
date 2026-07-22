package com.nova.admin.common.constant;

/**
 * 系统常量
 */
public final class Constants {

    private Constants() {}

    /** 全局通用常量 */
    public static final String TRUE = "true";
    public static final String FALSE = "false";
    public static final Long SUPER_ADMIN_ID = 1L;
    public static final String SUPER_ADMIN_ROLE = "super_admin";

    /** Redis Key */
    public static final String REDIS_KEY_AUTH = "nova:auth:";
    public static final String REDIS_KEY_CAPTCHA = "nova:captcha:";
    public static final String REDIS_KEY_LOGIN_FAIL = "nova:login:fail:";
    public static final String REDIS_KEY_USER = "nova:user:";
    public static final String REDIS_KEY_DICT = "nova:dict:";
    public static final String REDIS_KEY_TOKEN_BLACKLIST = "nova:token:blacklist:";

    /** Header */
    public static final String HEADER_AUTHORIZATION = "Authorization";
    public static final String HEADER_USER_AGENT = "User-Agent";

    /** 数据权限范围 */
    public static final int DATA_SCOPE_ALL = 1;
    public static final int DATA_SCOPE_DEPT_AND_CHILD = 2;
    public static final int DATA_SCOPE_DEPT = 3;
    public static final int DATA_SCOPE_SELF_AND_CHILD = 4;
    public static final int DATA_SCOPE_SELF = 5;

    /** 菜单类型 */
    public static final char MENU_TYPE_DIR = 'M';
    public static final char MENU_TYPE_MENU = 'C';
    public static final char MENU_TYPE_BUTTON = 'F';
}
