import { Tag } from 'antd';
import type { TFunction } from 'i18next';

import { JOB_LOG_STATUS, JOB_TRIGGER_TYPE } from '@/api/job';

export function getJobLogStatusEnum(t: TFunction) {
  return {
    [JOB_LOG_STATUS.SUCCESS]: { text: t('job.executionSuccess'), status: 'Success' as const },
    [JOB_LOG_STATUS.FAILED]: { text: t('job.executionFailed'), status: 'Error' as const },
    [JOB_LOG_STATUS.SKIPPED]: { text: t('job.executionSkipped'), status: 'Warning' as const },
  };
}

export function renderJobLogStatus(t: TFunction, status?: number) {
  if (status === JOB_LOG_STATUS.SUCCESS) {
    return <Tag color="green">{t('job.executionSuccess')}</Tag>;
  }
  if (status === JOB_LOG_STATUS.SKIPPED) {
    return <Tag color="gold">{t('job.executionSkipped')}</Tag>;
  }
  return <Tag color="red">{t('job.executionFailed')}</Tag>;
}

export function getJobTriggerTypeEnum(t: TFunction) {
  return {
    [JOB_TRIGGER_TYPE.CRON]: t('job.triggerCron'),
    [JOB_TRIGGER_TYPE.MANUAL]: t('job.triggerManual'),
  };
}
