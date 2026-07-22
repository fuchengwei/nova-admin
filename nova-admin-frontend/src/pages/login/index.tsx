import { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, theme as antdTheme } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login } from '@/api/auth';
import { setToken, getToken } from '@/utils/request';

const { Title, Text } = Typography;

interface LoginForm {
  username: string;
  password: string;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<LoginForm>();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { t } = useTranslation();
  const { token } = antdTheme.useToken();

  if (getToken()) {
    navigate(params.get('redirect') || '/dashboard', { replace: true });
  }

  const onSubmit = async (values: LoginForm) => {
    setLoading(true);
    try {
      // Phase 0: 直接 setToken 占位，方便看到布局
      // Phase 1: 接通 /auth/login + 验证码
      const res = await login({ username: values.username, password: values.password });
      if (res.code === 0) {
        message.success(t('login.welcome'));
        navigate(params.get('redirect') || '/dashboard', { replace: true });
      } else {
        message.error(res.msg || t('common.fail'));
      }
    } catch (e) {
      // Phase 0 占位：后端未启动时也能进首页（开发体验）
      setToken('dev-placeholder-token', 'dev-placeholder-refresh');
      message.warning('当前为 Phase 0 演示模式，后端未联通');
      navigate(params.get('redirect') || '/dashboard', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${token.colorPrimary} 0%, #69b1ff 100%)`,
      }}
    >
      <Card className="!w-full !max-w-md !shadow-2xl" styles={{ body: { padding: 32 } }}>
        <div className="text-center mb-6">
          <Title level={2} style={{ marginBottom: 4, color: token.colorPrimary }}>
            {t('login.title')}
          </Title>
          <Text type="secondary">{t('login.subtitle')}</Text>
        </div>
        <Form<LoginForm>
          form={form}
          layout="vertical"
          initialValues={{ username: 'admin', password: 'admin123' }}
          onFinish={onSubmit}
        >
          <Form.Item
            name="username"
            label={t('login.username')}
            rules={[{ required: true, message: `${t('login.username')} 不能为空` }]}
          >
            <Input prefix={<UserOutlined />} size="large" placeholder="admin" />
          </Form.Item>
          <Form.Item
            name="password"
            label={t('login.password')}
            rules={[{ required: true, message: `${t('login.password')} 不能为空` }]}
          >
            <Input.Password prefix={<LockOutlined />} size="large" placeholder="admin123" />
          </Form.Item>
          <Form.Item label={t('login.captcha')}>
            <Input prefix={<SafetyOutlined />} size="large" placeholder="Phase 1 启用" disabled />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={loading}>
            {t('login.submit')}
          </Button>
        </Form>
        <div className="mt-4 text-center text-xs text-gray-400">
          Default: admin / admin123
        </div>
      </Card>
    </div>
  );
}
