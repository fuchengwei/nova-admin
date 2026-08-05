import { ApiOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';

import { hasPermission } from '@/utils/layout';
import { useUserStore } from '@/stores/userStore';

import ApiPermissionTable from './components/ApiPermissionTable';

export default function ApiPermissionPage() {
  const { t } = useTranslation();
  const permissions = useUserStore((state) => state.permissions);
  const roles = useUserStore((state) => state.roles);
  const canEdit = roles.includes('super_admin') || hasPermission('system:menu:edit', permissions);

  return (
    <PageContainer
      title={
        <span className="flex items-center gap-2">
          <ApiOutlined className="text-blue-600" />
          {t('menu.apiPermissionTitle')}
        </span>
      }
      className="page-fill"
    >
      <ApiPermissionTable canEdit={canEdit} />
    </PageContainer>
  );
}
