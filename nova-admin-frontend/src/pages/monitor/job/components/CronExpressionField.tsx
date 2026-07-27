import { Button, Dropdown, Form, Tooltip } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { ProFormText } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import { CRON_PRESETS } from '../cron';

export default function CronExpressionField() {
  const { t } = useTranslation();
  const form = Form.useFormInstance();

  return (
    <ProFormText
      name="cronExpression"
      label={t('job.cronExpression')}
      tooltip={t('job.cronHelp')}
      rules={[{ required: true, message: t('job.cronRequired') }]}
      fieldProps={{
        suffix: (
          <Dropdown
            menu={{
              items: CRON_PRESETS.map((preset) => ({
                key: preset.expression,
                label: t(preset.labelKey),
                onClick: () => form.setFieldValue('cronExpression', preset.expression),
              })),
            }}
          >
            <Tooltip title={t('job.cronGenerate')}>
              <Button
                type="text"
                size="small"
                aria-label={t('job.cronGenerate')}
                icon={<DownOutlined />}
              />
            </Tooltip>
          </Dropdown>
        ),
      }}
    />
  );
}
