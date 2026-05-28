import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, Alert, Button } from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  ShoppingOutlined,
  WarningOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { DashboardData } from '../types';

const { Title, Text } = Typography;

const statCards = [
  {
    key: 'totalRevenue',
    label: 'Total Revenue',
    icon: <DollarOutlined />,
    color: '#5b8dee',
    prefix: '₱',
    precision: 2,
  },
  {
    key: 'totalProfit',
    label: 'Total Profit',
    icon: <RiseOutlined />,
    color: '#10b981',
    prefix: '₱',
    precision: 2,
  },
  {
    key: 'monthlySalesCount',
    label: 'Sales This Month',
    icon: <ShoppingOutlined />,
    color: '#f59e0b',
    prefix: '',
    precision: 0,
  },
  {
    key: 'lowStockProducts',
    label: 'Low Stock Items',
    icon: <WarningOutlined />,
    color: '#ef4444',
    prefix: '',
    precision: 0,
  },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;
  if (error) return <Alert type="error" message={error} />;
  if (!data) return null;

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          Welcome back, {user?.name}
        </Title>
        <Text type="secondary">Here's your store overview</Text>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {statCards.map(({ key, label, icon, color, prefix, precision }) => (
          <Col xs={24} sm={12} lg={6} key={key}>
            <Card
              hoverable
              style={{ borderTop: `3px solid ${color}`, borderRadius: 8, cursor: key === 'lowStockProducts' ? 'pointer' : 'default' }}
              onClick={key === 'lowStockProducts' ? () => navigate('/products?lowStock=true') : undefined}
            >
              <Statistic
                title={label}
                value={data[key as keyof DashboardData] as number}
                prefix={
                  prefix
                    ? prefix
                    : React.cloneElement(icon as React.ReactElement, { style: { color } })
                }
                valueStyle={{ color }}
                precision={precision}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Monthly summary + quick actions */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12}>
          <Card title="This Month">
            <Statistic
              title="Revenue"
              value={data.monthlyRevenue}
              prefix="₱"
              precision={2}
              valueStyle={{ color: '#5b8dee' }}
            />
            <Statistic
              title="Profit"
              value={data.monthlyProfit}
              prefix="₱"
              precision={2}
              valueStyle={{ color: '#10b981', marginTop: 12 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card title="Quick Actions">
            <Button
              type="primary"
              block
              size="large"
              icon={<ShoppingOutlined />}
              onClick={() => navigate('/sales')}
              style={{ marginBottom: 12 }}
            >
              Record a Sale
            </Button>
            <Button
              block
              size="large"
              icon={<BarChartOutlined />}
              onClick={() => navigate('/products')}
            >
              Manage Products
            </Button>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Revenue & Profit — Last 30 Days">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip formatter={(v) => `₱${Number(v).toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#5b8dee" name="Revenue" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="profit" stroke="#10b981" name="Profit" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Top 5 Products by Units Sold">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="_id" type="category" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="totalQty" name="Units Sold" fill="#5b8dee" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

import React from 'react';
