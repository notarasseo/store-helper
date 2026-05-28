import { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const { Title, Text } = Typography;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', values);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #5b8dee 0%, #4a7de0 55%, #3a6dd4 100%)',
        overflowY: 'auto',
      }}
    >
      {/* Decorative circles */}
      <div style={{
        position: 'fixed', top: -80, left: -80,
        width: 320, height: 320, borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: -100, right: -60,
        width: 420, height: 420, borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
      }} />

      <div
        style={{
          width: 420,
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 20,
          padding: '48px 40px 36px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Title level={2} style={{ margin: 0, color: '#1a1a1a', fontWeight: 700 }}>
            StoreHelper
          </Title>
          <Text style={{ color: '#888', fontSize: 14 }}>Sign in to your account</Text>
        </div>

        <Form form={form} onFinish={onFinish} layout="vertical" size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Invalid email' },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#5b8dee' }} />}
              placeholder="Email address"
              style={{ borderRadius: 10, height: 48 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#5b8dee' }} />}
              placeholder="Password"
              style={{ borderRadius: 10, height: 48 }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 8 }}>
            <Button
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 50,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #5b8dee, #3a6dd4)',
                border: 'none',
                color: '#fff',
                fontSize: 16,
                fontWeight: 600,
                boxShadow: '0 6px 20px rgba(58,109,212,0.35)',
              }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Text style={{ color: '#888' }}>Don't have an account? </Text>
          <Link to="/register" style={{ color: '#5b8dee', fontWeight: 600 }}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
