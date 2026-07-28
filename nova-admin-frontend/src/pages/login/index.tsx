import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Typography, theme as antdTheme, Form } from 'antd';
import { message } from '@/utils/message';
import { UserOutlined, LockOutlined, SafetyOutlined, ReloadOutlined } from '@ant-design/icons';
import { ProForm, ProFormText } from '@ant-design/pro-components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCaptcha, login } from '@/api/auth';
import { getToken } from '@/utils/request';

const { Title, Text } = Typography;

interface LoginForm {
  account: string;
  password: string;
  captchaCode?: string;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [captchaKey, setCaptchaKey] = useState('');
  const [captchaImg, setCaptchaImg] = useState('');
  const [captchaEnabled, setCaptchaEnabled] = useState(true);
  const [form] = Form.useForm<LoginForm>();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { t } = useTranslation();
  const { token } = antdTheme.useToken();
  const loadingRef = useRef(false);

  useEffect(() => {
    if (getToken()) {
      navigate(params.get('redirect') || '/dashboard', { replace: true });
    }
  }, [navigate, params]);

  const loadCaptcha = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const res = await getCaptcha();
      if (res.code === 0 && res.data) {
        const enabled = res.data.enabled !== false;
        setCaptchaEnabled(enabled);
        setCaptchaKey(enabled ? (res.data.captchaKey ?? '') : '');
        setCaptchaImg(enabled ? (res.data.captchaImage ?? '') : '');
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
    if (captchaEnabled && !captchaKey) {
      message.error('验证码未就绪');
      return;
    }
    setLoading(true);
    try {
      const res = await login({
        account: values.account,
        password: values.password,
        ...(captchaEnabled ? { captchaKey, captchaCode: values.captchaCode } : {}),
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
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${token.colorPrimary} 0%, #69b1ff 100%)`,
      }}
    >
      <Card className="!w-full !max-w-md !shadow-2xl" styles={{ body: { padding: 32 } }}>
        <div className="mb-6 text-center">
          <Title level={2} style={{ marginBottom: 4, color: token.colorPrimary }}>
            {t('login.title')}
          </Title>
          <Text type="secondary">{t('login.subtitle')}</Text>
        </div>
        <ProForm<LoginForm>
          form={form}
          layout="vertical"
          initialValues={{ account: 'superAdmin', password: '123456' }}
          onFinish={onSubmit}
          submitter={{
            render: () => (
              <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                {t('login.submit')}
              </Button>
            ),
          }}
        >
          <ProFormText
            name="account"
            label={t('login.account')}
            rules={[{ required: true, message: `${t('login.account')} 不能为空` }]}
            fieldProps={{
              prefix: <UserOutlined />,
              size: 'large',
              placeholder: 'superAdmin / admin',
              autoComplete: 'username',
            }}
          />
          <ProFormText.Password
            name="password"
            label={t('login.password')}
            rules={[{ required: true, message: `${t('login.password')} 不能为空` }]}
            fieldProps={{
              prefix: <LockOutlined />,
              size: 'large',
              placeholder: 'admin123',
              autoComplete: 'current-password',
            }}
          />
          {captchaEnabled && (
            <ProFormText
              name="captchaCode"
              label={t('login.captcha')}
              rules={[
                { required: true, message: `${t('login.captcha')} 不能为空` },
                { len: 4, message: '请输入 4 位验证码' },
              ]}
              fieldProps={{
                prefix: <SafetyOutlined />,
                size: 'large',
                maxLength: 4,
                autoComplete: 'off',
                suffix: (
                  <div
                    className="flex cursor-pointer items-center"
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
                ),
              }}
            />
          )}
        </ProForm>
        <div className="mt-4 text-center text-xs text-gray-400">
          Default: superAdmin or admin / 123456
        </div>
      </Card>
    </div>
  );
}
