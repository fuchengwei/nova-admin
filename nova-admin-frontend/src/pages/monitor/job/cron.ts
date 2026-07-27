type Translate = (key: string, options?: Record<string, string | number>) => string;

export interface CronPreset {
  expression: string;
  labelKey: string;
}

export const CRON_PRESETS: CronPreset[] = [
  { expression: '0 * * * * ?', labelKey: 'job.cronPresetEveryMinute' },
  { expression: '0 0/5 * * * ?', labelKey: 'job.cronPresetEveryFiveMinutes' },
  { expression: '0 0 * * * ?', labelKey: 'job.cronPresetEveryHour' },
  { expression: '0 0 0 * * ?', labelKey: 'job.cronPresetEveryDay' },
  { expression: '0 0 0 ? * MON-FRI', labelKey: 'job.cronPresetWeekdays' },
];

export function describeCron(expression: unknown, t: Translate): string {
  if (typeof expression !== 'string' || expression.trim() === '') {
    return t('job.cronDescriptionEmpty');
  }

  const normalized = expression.trim();
  const preset = CRON_PRESETS.find((item) => item.expression === normalized);
  if (preset) return t(preset.labelKey);

  const fields = normalized.split(/\s+/);
  if (fields.length !== 6) return t('job.cronDescriptionCustom', { expression: normalized });

  const [second, minute, hour, dayOfMonth, month, dayOfWeek] = fields;
  if (second === '0' && (minute === '*' || minute === '0/1') && hour === '*') {
    return t('job.cronPresetEveryMinute');
  }
  if (second === '0' && minute.startsWith('0/')) {
    return t('job.cronEveryMinutes', { interval: minute.slice(2) });
  }
  if (second === '0' && minute === '0' && hour.startsWith('0/')) {
    return t('job.cronEveryHours', { interval: hour.slice(2) });
  }
  if (second === '0' && minute !== '*' && hour !== '*' && dayOfMonth === '*' && month === '*') {
    return t('job.cronAtTime', { hour, minute });
  }
  if (second === '0' && minute === '0' && hour === '0' && dayOfMonth === '*' && month === '*') {
    return t('job.cronPresetEveryDay');
  }
  if (second === '0' && minute === '0' && hour === '0' && dayOfMonth === '?' && month === '*') {
    return t('job.cronAtWeekday', { weekday: dayOfWeek });
  }

  return t('job.cronDescriptionCustom', { expression: normalized });
}
