import { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  Typography,
  message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../services/api';
import { Category } from '../types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form] = Form.useForm();

  const fetchCategories = useCallback((p = page, s = search) => {
    setLoading(true);
    api
      .get('/categories', { params: { page: p, limit: 20, search: s } })
      .then((res) => {
        setCategories(res.data.categories);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openModal = (cat?: Category) => {
    setEditing(cat || null);
    form.setFieldsValue(cat || { name: '', description: '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await api.put(`/categories/${editing._id}`, values);
        message.success('Category updated');
      } else {
        await api.post('/categories', values);
        message.success('Category created');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error saving category');
    }
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/categories/${id}`);
    message.success('Deleted');
    fetchCategories();
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Category) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openModal(record)} />
          <Popconfirm
            title="Delete this category?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Categories
        </Typography.Title>
        <Space>
          <Input.Search
            placeholder="Search by name or description..."
            onSearch={(val) => { setSearch(val); setPage(1); fetchCategories(1, val); }}
            onChange={(e) => { if (!e.target.value) { setSearch(''); setPage(1); fetchCategories(1, ''); } }}
            allowClear
            style={{ width: 260 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            Add Category
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={categories}
        rowKey="_id"
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: (p) => { setPage(p); fetchCategories(p); },
        }}
      />

      <Modal
        title={<span style={{ color: '#fff' }}>{editing ? 'Edit Category' : 'Add Category'}</span>}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="Save"
        closeIcon={<span style={{ color: '#fff', fontSize: 16 }}>✕</span>}
        styles={{
          header: {
            background: '#5b8dee',
            margin: '-20px -24px 16px',
            padding: '14px 24px',
            borderRadius: '8px 8px 0 0',
          },
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ max: 100, message: 'Description cannot exceed 100 characters' }]}
          >
            <Input.TextArea rows={2} maxLength={100} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
