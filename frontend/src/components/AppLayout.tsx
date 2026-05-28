import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Button, Tooltip } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShopOutlined,
  MailOutlined,
  LinkedinOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const PRIMARY = '#5b8dee';

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/products', icon: <ShoppingOutlined />, label: 'Products' },
  { key: '/categories', icon: <AppstoreOutlined />, label: 'Categories' },
  { key: '/sales', icon: <ShoppingCartOutlined />, label: 'Sales' },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Logout',
        danger: true,
        onClick: () => { logout(); navigate('/login'); },
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}
      >
        {/* Logo */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
            padding: '0 16px',
            gap: 10,
          }}
        >
          <ShopOutlined style={{ fontSize: 20, color: PRIMARY }} />
          {!collapsed && (
            <Text strong style={{ fontSize: 17, color: PRIMARY }}>
              StoreHelper
            </Text>
          )}
        </div>

        {/* Nav */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ border: 'none', marginTop: 8 }}
        />

        {/* About */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            borderTop: '1px solid #f0f0f0',
            padding: collapsed ? '12px 0' : '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: collapsed ? 'center' : 'flex-start',
            gap: 6,
          }}
        >
          {!collapsed && (
            <Text style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>
              Developer
            </Text>
          )}
          {!collapsed && (
            <Text strong style={{ fontSize: 13, color: '#333' }}>Renz Joshua Dela Rosa</Text>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Tooltip title="delarosaernz@gmail.com">
              <a href="mailto:delarosaernz@gmail.com" style={{ color: PRIMARY, fontSize: 16 }}>
                <MailOutlined />
              </a>
            </Tooltip>
            <Tooltip title="LinkedIn">
              <a href="https://www.linkedin.com/in/renz-joshua-dela-rosa-459680190" target="_blank" rel="noreferrer" style={{ color: PRIMARY, fontSize: 16 }}>
                <LinkedinOutlined />
              </a>
            </Tooltip>
          </div>
        </div>
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16 }}
          />
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ background: PRIMARY }} />
              <Text>{user?.name}</Text>
            </div>
          </Dropdown>
        </Header>

        <Content style={{ margin: 24, minHeight: 'calc(100vh - 112px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
