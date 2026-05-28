import { useEffect, useState, useCallback, KeyboardEvent } from 'react';

const allowDecimal = (e: KeyboardEvent<HTMLInputElement>) => {
  if (!/[\d.]/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key))
    e.preventDefault();
};

const allowInteger = (e: KeyboardEvent<HTMLInputElement>) => {
  if (!/\d/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key))
    e.preventDefault();
};
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Popconfirm,
  Typography,
  Tag,
  message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';
import api from '../services/api';
import { Product, Category } from '../types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'add' | 'edit' | 'view'>('add');
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [form] = Form.useForm();

  const fetchProducts = useCallback(
    (p: number, s: string, cat: string | undefined) => {
      setLoading(true);
      const params: Record<string, unknown> = { page: p, limit: 20, search: s };
      if (cat) params.category = cat;
      api
        .get('/products', { params })
        .then((res) => {
          setProducts(res.data.products);
          setTotal(res.data.total);
        })
        .finally(() => setLoading(false));
    },
    []
  );

  useEffect(() => {
    fetchProducts(1, search, categoryFilter);
    api.get('/categories', { params: { limit: 200 } }).then((res) => setCategories(res.data.categories));
  }, [fetchProducts]);

  const openModal = (product?: Product, view = false) => {
    setEditing(product || null);
    setMode(view ? 'view' : product ? 'edit' : 'add');
    form.setFieldsValue(
      product
        ? { ...product, category: product.category._id }
        : { name: '', sku: '', price: 0, costPrice: 0, stock: 0, lowStockThreshold: 10 }
    );
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await api.put(`/products/${editing._id}`, values);
        message.success('Product updated');
      } else {
        await api.post('/products', values);
        message.success('Product created');
      }
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      fetchProducts(page, search, categoryFilter);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error saving product');
    }
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/products/${id}`);
    message.success('Deleted');
    fetchProducts(page, search, categoryFilter);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Product) => (
        <Space>
          {name}
          {record.isLowStock && <Tag color="red" icon={<WarningOutlined />}>Low Stock</Tag>}
        </Space>
      ),
    },
    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
    {
      title: 'Category',
      key: 'category',
      render: (_: unknown, r: Product) => r.category?.name,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (v: number) => `₱${v.toFixed(2)}`,
    },
    {
      title: 'Cost',
      dataIndex: 'costPrice',
      key: 'costPrice',
      render: (v: number) => `₱${v.toFixed(2)}`,
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      render: (v: number, r: Product) => (
        <Typography.Text type={r.isLowStock ? 'danger' : undefined}>{v}</Typography.Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Product) => (
        <Space>
          <Button icon={<InfoCircleOutlined />} size="small" onClick={() => openModal(record, true)} />
          <Button icon={<EditOutlined />} size="small" onClick={() => openModal(record)} />
          <Popconfirm
            title="Delete this product?"
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Products
        </Typography.Title>
        <Space>
          <Input.Search
            placeholder="Search by name or SKU..."
            onSearch={(val) => { setSearch(val); setPage(1); fetchProducts(1, val, categoryFilter); }}
            allowClear
            style={{ width: 220 }}
          />
          <Select
            placeholder="All Categories"
            allowClear
            style={{ width: 180 }}
            value={categoryFilter}
            onChange={(val) => {
              const cat = val ?? undefined;
              setCategoryFilter(cat);
              setPage(1);
              fetchProducts(1, search, cat);
            }}
            options={categories.map((c) => ({ value: c._id, label: c.name }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            Add Product
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={products}
        rowKey="_id"
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: (p) => { setPage(p); fetchProducts(p, search, categoryFilter); },
        }}
      />

      <Modal
        title={<span style={{ color: '#fff' }}>{mode === 'view' ? 'Product Details' : mode === 'edit' ? 'Edit Product' : 'Add Product'}</span>}
        open={modalOpen}
        onOk={mode === 'view' ? undefined : handleSave}
        onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}
        okText="Save"
        footer={mode === 'view' ? null : undefined}
        width={540}
        styles={{
          header: {
            background: '#5b8dee',
            margin: '-20px -24px 16px',
            padding: '14px 24px',
            borderRadius: '8px 8px 0 0',
          },
        }}
        closeIcon={<span style={{ color: '#fff', fontSize: 16 }}>✕</span>}
      >
        <Form form={form} layout="vertical" style={{ marginTop: mode === 'view' ? 8 : 0 }}>
          <Form.Item name="name" label="Product Name" rules={mode !== 'view' ? [{ required: true }] : []}>
            <Input disabled={mode === 'view'} />
          </Form.Item>
          <Form.Item name="sku" label="SKU" rules={mode !== 'view' ? [{ required: true }] : []}>
            <Input disabled={mode === 'view'} />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={mode !== 'view' ? [{ required: true }] : []}>
            <Select disabled={mode === 'view'} options={categories.map((c) => ({ value: c._id, label: c.name }))} />
          </Form.Item>
          <Space style={{ width: '100%' }} align="start">
            <Form.Item name="price" label="Selling Price (₱)" rules={mode !== 'view' ? [{ required: true }] : []}>
              <InputNumber
                min={0}
                precision={2}
                style={{ width: 160 }}
                disabled={mode === 'view'}
                parser={(v) => v ? parseFloat(v.replace(/[^\d.]/g, '')) as any : ''}
                onKeyDown={allowDecimal}
              />
            </Form.Item>
            <Form.Item name="costPrice" label="Cost Price (₱)" rules={mode !== 'view' ? [{ required: true }] : []}>
              <InputNumber
                min={0}
                precision={2}
                style={{ width: 160 }}
                disabled={mode === 'view'}
                parser={(v) => v ? parseFloat(v.replace(/[^\d.]/g, '')) as any : ''}
                onKeyDown={allowDecimal}
              />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} align="start">
            <Form.Item name="stock" label="Stock Quantity" rules={mode !== 'view' ? [{ required: true }, { type: 'number', max: 999999, message: 'Stock cannot exceed 999,999' }] : []}>
              <InputNumber
                min={0}
                max={999999}
                precision={0}
                style={{ width: 160 }}
                disabled={mode === 'view'}
                parser={(v) => v ? parseInt(v.replace(/[^\d]/g, ''), 10) as any : ''}
                onKeyDown={allowInteger}
              />
            </Form.Item>
            <Form.Item name="lowStockThreshold" label="Low Stock Alert At">
              <InputNumber
                min={0}
                precision={0}
                style={{ width: 160 }}
                disabled={mode === 'view'}
                parser={(v) => v ? parseInt(v.replace(/[^\d]/g, ''), 10) as any : ''}
                onKeyDown={allowInteger}
              />
            </Form.Item>
          </Space>
          <Form.Item
            name="description"
            label="Description"
            rules={mode !== 'view' ? [{ max: 100, message: 'Description cannot exceed 100 characters' }] : []}
          >
            <Input.TextArea rows={2} maxLength={100} showCount={mode !== 'view'} disabled={mode === 'view'} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
