import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Form, Input, Button, Typography, message, theme as antdTheme } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  SafetyOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCaptcha, login } from '@/api/auth';
import { getToken } from '@/utils/request';
import type { R } from '@/types/api';

const { Title, Text } = Typography;

interface LoginForm {
  username: string;
  password: string;
  captchaCode: string;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [captchaKey, setCaptchaKey] = useState('');
  const [captchaImg, setCaptchaImg] = useState('');
  const [form] = Form.useForm<LoginForm>();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { t } = useTranslation();
  const { token } = antdTheme.useToken();
  const loadingRef = useRef(false);

  // 已登录直接跳转
  useEffect(() => {
    if (getToken()) {
      navigate(params.get('redirect') || '/dashboard', { replace: true });
    }
  }, [navigate, params]);

  // 加载验证码
  const loadCaptcha = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const res = (await getCaptcha()) as unknown as R<{
        captchaKey: string;
        captchaImage: string;
      }>;
      if (res.code === 0 && res.data) {
        setCaptchaKey(res.data.captchaKey);
        setCaptchaImg(res.data.captchaImage);
        form.setFieldValue('captchaCode', '');
      } else {
        message.error(res.msg || '验证码加载失败');
      }
    } catch (e) {
      message.error('验证码加载失败，请检查后端服务');
    } finally {
      loadingRef.current = false;
    }
  }, [form]);

  useEffect(() => {
    loadCaptcha();
  }, [loadCaptcha]);

  const onSubmit = async (values: LoginForm) => {
    if (!captchaKey) {
      message.error('验证码未就绪');
      return;
    }
    setLoading(true);
    try {
      const res = await login({
        username: values.username,
        password: values.password,
        captchaKey,
        captchaCode: values.captchaCode,
      });
      if (res.code === 0) {
        message.success(t('login.welcome'));
        navigate(params.get('redirect') || '/dashboard', { replace: true });
      } else {
        message.error(res.msg || t('common.fail'));
        loadCaptcha();
      }
    } catch {
      message.error('登录失败，请检查后端服务');
      loadCaptcha();
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
            <Input prefix={<UserOutlined />} size="large" placeholder="admin" autoComplete="username" />
          </Form.Item>
          <Form.Item
            name="password"
            label={t('login.password')}
            rules={[{ required: true, message: `${t('login.password')} 不能为空` }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              size="large"
              placeholder="admin123"
              autoComplete="current-password"
            />
          </Form.Item>
          <Form.Item
            name="captchaCode"
            label={t('login.captcha')}
            rules={[
              { required: true, message: `${t('login.captcha')} 不能为空` },
              { len: 4, message: '请输入 4 位验证码' },
            ]}
          >
            <Input
              prefix={<SafetyOutlined />}
              size="large"
              placeholder="请输入验证码"
              maxLength={4}
              autoComplete="off"
              suffix={
                <div
                  className="cursor-pointer flex items-center"
                  onClick={loadCaptcha}
                  title="点击刷新"
                >
                  {captchaImg ? (
                    <img
                      src={captchaImg}
                      alt="captcha"
                      className="h-9 rounded border border-gray-200"
                      style={{ minWidth: 120 }}
                    />
                  ) : (
                    <ReloadOutlined className="text-lg" />
                  )}
                </div>
              }
            />
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
