import { NotificationOutlined } from '@ant-design/icons';
import {
  PageContainer,
  ProCard,
  ProForm,
  ProFormDependency,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  getNotificationRecipientOptions,
  publishNotification,
  type NotificationPublishRequest,
  type NotificationRecipientOption,
  type NotificationRecipientType,
} from '@/api/notification';
import { message } from '@/utils/message';

const recipientTypeOptions: NotificationRecipientType[] = ['ALL', 'ROLE', 'USER'];

const toSelectOptions = (options: NotificationRecipientOption[]) =>
  options.map(({ id, label }) => ({ label, value: id }));

export default function NotificationPage() {
  const { t } = useTranslation();
  const { data: recipientOptions = { users: [], roles: [] }, isLoading: recipientOptionsLoading } =
    useQuery({
      queryKey: ['notification', 'recipient-options'],
      queryFn: async () => {
        const result = await getNotificationRecipientOptions();
        return result.code === 0 ? result.data : { users: [], roles: [] };
      },
    });
  const publishMutation = useMutation({ mutationFn: publishNotification });

  const recipientTypeLabels: Record<NotificationRecipientType, string> = {
    ALL: t('notification.recipientAll'),
    ROLE: t('notification.recipientRole'),
    USER: t('notification.recipientUser'),
  };

  return (
    <PageContainer
      className="page-fill"
      title={
        <span className="flex items-center gap-2">
          <NotificationOutlined className="text-blue-600" />
          {t('notification.publishTitle')}
        </span>
      }
    >
      <ProCard className="max-w-4xl">
        <ProForm<NotificationPublishRequest>
          initialValues={{ recipientType: 'ALL' }}
          layout="vertical"
          submitter={{ searchConfig: { submitText: t('notification.publish') } }}
          onFinish={async (values) => {
            const result = await publishMutation.mutateAsync(values);
            if (result.code !== 0) {
              message.error(result.msg || t('notification.publishFailed'));
              return false;
            }
            message.success(t('notification.publishSuccess', { count: result.data }));
            return true;
          }}
        >
          <ProFormText
            name="title"
            label={t('notification.messageTitle')}
            fieldProps={{ maxLength: 200, showCount: true }}
            rules={[{ required: true, message: t('notification.messageTitleRequired') }]}
          />
          <ProFormTextArea
            name="content"
            label={t('notification.messageContent')}
            fieldProps={{ autoSize: { minRows: 6, maxRows: 12 }, maxLength: 5000, showCount: true }}
            rules={[{ required: true, message: t('notification.messageContentRequired') }]}
          />
          <ProFormText
            name="link"
            label={t('notification.messageLink')}
            fieldProps={{ maxLength: 500 }}
            tooltip={t('notification.messageLinkHint')}
          />
          <ProFormRadio.Group
            name="recipientType"
            label={t('notification.recipientType')}
            options={recipientTypeOptions.map((value) => ({
              label: recipientTypeLabels[value],
              value,
            }))}
            rules={[{ required: true }]}
          />
          <ProFormDependency name={['recipientType']}>
            {({ recipientType }) => {
              if (recipientType === 'ROLE') {
                return (
                  <ProFormSelect
                    name="recipientIds"
                    label={t('notification.recipientRoles')}
                    preserve={false}
                    fieldProps={{
                      loading: recipientOptionsLoading,
                      mode: 'multiple',
                      options: toSelectOptions(recipientOptions.roles),
                    }}
                    rules={[{ required: true, message: t('notification.recipientRequired') }]}
                  />
                );
              }
              if (recipientType === 'USER') {
                return (
                  <ProFormSelect
                    name="recipientIds"
                    label={t('notification.recipientUsers')}
                    preserve={false}
                    fieldProps={{
                      loading: recipientOptionsLoading,
                      mode: 'multiple',
                      options: toSelectOptions(recipientOptions.users),
                      showSearch: true,
                    }}
                    rules={[{ required: true, message: t('notification.recipientRequired') }]}
                  />
                );
              }
              return null;
            }}
          </ProFormDependency>
        </ProForm>
      </ProCard>
    </PageContainer>
  );
}
