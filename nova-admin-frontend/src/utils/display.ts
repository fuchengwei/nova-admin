/** 判断值是否应以空占位符展示。 */
export function isEmptyDisplayValue(value: unknown): value is null | undefined | '' {
  return value === null || value === undefined || value === '';
}

/** 统一展示文本空值，保留 0、false 等有效值。 */
export function displayText<T>(value: T, fallback = '-'): T | string {
  return isEmptyDisplayValue(value) ? fallback : value;
}
