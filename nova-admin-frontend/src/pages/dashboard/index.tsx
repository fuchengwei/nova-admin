import { Tag, Typography } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { ProCard, StatisticCard } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ping } from '@/api/auth';

const { Title, Paragraph } = Typography;

export default function DashboardPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['ping'],
    queryFn: ping,
    refetchInterval: 30_000,
  });

  return (
    <div className="h-full space-y-4 overflow-auto p-6">
      <ProCard>
        <Title level={3} className="!mb-2">
          {t('menu.dashboard')}
        </Title>
        <Paragraph type="secondary" className="!mb-0">
          Nova Admin 初始化完成。后续 Phase 将逐步完善用户/角色/菜单/数据权限等模块。
        </Paragraph>
      </ProCard>

      <ProCard gutter={16} wrap>
        <StatisticCard
          colSpan={6}
          title="用户"
          statistic={{ value: 0, prefix: <UserOutlined /> }}
        />
        <StatisticCard
          colSpan={6}
          title="角色"
          statistic={{ value: 0, prefix: <TeamOutlined /> }}
        />
        <StatisticCard
          colSpan={6}
          title="菜单"
          statistic={{ value: 3, prefix: <SafetyCertificateOutlined /> }}
        />
        <StatisticCard
          colSpan={6}
          title="当前 Phase"
          statistic={{ value: 'Phase 0', prefix: <RocketOutlined /> }}
        />
      </ProCard>

      <ProCard title="后端连通性" loading={isLoading}>
        {data && data.code === 0 ? (
          <div>
            <Tag color="success">ONLINE</Tag> {data.data.app} v{data.data.version}
            <div className="mt-2 text-xs text-gray-500">心跳: {data.data.ts}</div>
          </div>
        ) : (
          <Tag color="warning">OFFLINE</Tag>
        )}
      </ProCard>
    </div>
  );
}
