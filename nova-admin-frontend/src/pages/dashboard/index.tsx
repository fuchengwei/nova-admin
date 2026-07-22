import { Card, Col, Row, Statistic, Tag, Typography } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  RocketOutlined,
} from '@ant-design/icons';
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
    <div className="space-y-4">
      <Card>
        <Title level={3} className="!mb-2">
          {t('menu.dashboard')}
        </Title>
        <Paragraph type="secondary" className="!mb-0">
          Nova Admin 初始化完成。后续 Phase 将逐步完善用户/角色/菜单/数据权限等模块。
        </Paragraph>
      </Card>

      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="用户" value={0} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="角色" value={0} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="菜单" value={3} prefix={<SafetyCertificateOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="当前 Phase" value={'Phase 0'} prefix={<RocketOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card title="后端连通性" loading={isLoading}>
        {data && data.code === 0 ? (
          <div>
            <Tag color="success">ONLINE</Tag> {data.data.app} v{data.data.version}
            <div className="mt-2 text-xs text-gray-500">心跳: {data.data.ts}</div>
          </div>
        ) : (
          <Tag color="warning">OFFLINE</Tag>
        )}
      </Card>
    </div>
  );
}
