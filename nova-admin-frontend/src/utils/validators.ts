import type { Rule } from 'antd/es/form';

/**
 * 手机号正则：1 开头、第二位 3-9、共 11 位。
 * 与后端 Constants.PHONE_PATTERN 的匹配部分保持一致（仅保留必填场景的核心规则）。
 */
export const PHONE_PATTERN = /^1[3-9]\d{9}$/;

/**
 * 邮箱正则：标准邮箱格式（local@domain.tld）。
 * 与后端 Constants.EMAIL_PATTERN 的匹配部分保持一致。
 */
export const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/** 支持的校验类型 */
export type ValidationType = 'phone' | 'email';

/** 各校验类型对应的正则，集中维护为单一事实来源 */
const PATTERN_MAP: Record<ValidationType, RegExp> = {
  phone: PHONE_PATTERN,
  email: EMAIL_PATTERN,
};

/**
 * 按正则校验字符串（空值视为不通过）。
 * @param value 待校验值
 * @param pattern 正则表达式
 * @returns 匹配且非空返回 true，否则 false
 */
export const matchesPattern = (
  value: string | undefined | null,
  pattern: RegExp,
): boolean => !!value && pattern.test(value);

/**
 * 校验手机号是否合法。
 * @param value 待校验值
 * @returns 合法返回 true
 */
export const isValidPhone = (value: string | undefined | null): boolean =>
  matchesPattern(value, PATTERN_MAP.phone);

/**
 * 校验邮箱是否合法。
 * @param value 待校验值
 * @returns 合法返回 true
 */
export const isValidEmail = (value: string | undefined | null): boolean =>
  matchesPattern(value, PATTERN_MAP.email);

/**
 * 生成 antd 表单校验规则：值非空时按正则校验，不通过则抛出 message 错误，
 * 空值放行（必填由表单的 required 规则另行控制）。
 * @param pattern 正则表达式
 * @param message 校验失败提示文案
 * @returns antd Rule
 */
export const patternRule = (pattern: RegExp, message: string): Rule => ({
  validator: (_, value) =>
    !value || pattern.test(String(value))
      ? Promise.resolve()
      : Promise.reject(new Error(message)),
});

/**
 * 生成手机号 antd 表单校验规则。
 * @param message 校验失败提示文案
 * @returns antd Rule
 */
export const phoneRule = (message: string): Rule => patternRule(PHONE_PATTERN, message);

/**
 * 生成邮箱 antd 表单校验规则。
 * @param message 校验失败提示文案
 * @returns antd Rule
 */
export const emailRule = (message: string): Rule => patternRule(EMAIL_PATTERN, message);
