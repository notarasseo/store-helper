import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  Space,
  Typography,
  Tag,
  message,
  DatePicker,
  Divider,
  Popconfirm,
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';
import { Sale, Product } from '../types';

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'add' | 'edit'>('add');
  const [editing, setEditing] = useState<Sale | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [form] = Form.useForm();
  const [saleItems, setSaleItems] = useState([{ product: '', quantity: 1 }]);

  const fetchSales = (p = page, range = dateRange) => {
    setLoading(true);
    const params: Record<string, unknown> = { page: p, limit: 20 };
    if (range) { params.from = range[0]; params.to = range[1]; }
    api
      .get('/sales', { params })
      .then((res) => { setSales(res.data.sales); setTotal(res.data.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSales();
    api.get('/products', { params: { limit: 200 } }).then((res) => setProducts(res.data.products));
  }, []);

  const openAdd = () => {
    setMode('add');
    setEditing(null);
    setSaleItems([{ product: '', quantity: 1 }]);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (sale: Sale) => {
    setMode('edit');
    setEditing(sale);
    form.setFieldsValue({ note: sale.note });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const handleSave = async () => {
    try {
      await form.validateFields();
      if (mode === 'edit' && editing) {
        await api.patch(`/sales/${editing._id}/note`, { note: form.getFieldValue('note') });
        message.success('Note updated');
      } else {
        const valid = saleItems.filter((i) => i.product && i.quantity > 0);
        if (!valid.length) return message.error('Add at least one product');
        await api.post('/sales', { items: valid, note: form.getFieldValue('note') });
        message.success('Sale recorded');
        api.get('/products', { params: { limit: 200 } }).then((res) => setProducts(res.data.products));
      }
      closeModal();
      fetchSales(1);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error saving sale');
    }
  };

  const handleToggleStatus = async (sale: Sale) => {
    const newStatus = sale.status === 'Void' ? 'Valid' : 'Void';
    try {
      await api.patch(`/sales/${sale._id}/status`, { status: newStatus });
      message.success(`Sale marked as ${newStatus}`);
      fetchSales();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error updating status');
    }
  };

  const updateItem = (index: number, field: string, value: unknown) => {
    setSaleItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const expandedRowRender = (record: Sale) => (
    <Table
      dataSource={record.items}
      rowKey="productName"
      pagination={false}
      size="small"
      columns={[
        { title: 'Product', dataIndex: 'productName' },
        { title: 'Qty', dataIndex: 'quantity' },
        { title: 'Unit Price', dataIndex: 'unitPrice', render: (v: number) => `₱${v.toFixed(2)}` },
        {
          title: 'Subtotal',
          render: (_: unknown, r: any) => `₱${(r.unitPrice * r.quantity).toFixed(2)}`,
        },
      ]}
    />
  );

  const columns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      render: (v: string) => dayjs(v).format('MMM D, YYYY h:mm A'),
    },
    { title: 'Items', key: 'items', render: (_: unknown, r: Sale) => r.items.length },
    {
      title: 'Revenue',
      dataIndex: 'totalAmount',
      render: (v: number) => <Typography.Text strong>₱{v.toFixed(2)}</Typography.Text>,
    },
    {
      title: 'Profit',
      dataIndex: 'profit',
      render: (v: number) => (
        <Tag color={v >= 0 ? 'green' : 'red'}>₱{v.toFixed(2)}</Tag>
      ),
    },
    { title: 'Note', dataIndex: 'note' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Void' ? 'red' : 'green'}>{status ?? 'Valid'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Sale) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
          <Popconfirm
            title={record.status === 'Void' ? 'Mark this sale as Valid?' : 'Void this sale?'}
            onConfirm={() => handleToggleStatus(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              size="small"
              danger={record.status !== 'Void'}
              icon={record.status === 'Void' ? <CheckCircleOutlined /> : <StopOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Sales
        </Typography.Title>
        <Space>
          <DatePicker.RangePicker
            onChange={(dates, strings) => {
              if (!dates || !dates[0] || !dates[1]) {
                setDateRange(null);
                setPage(1);
                fetchSales(1, null);
                return;
              }
              const range = strings as [string, string];
              setDateRange(range);
              setPage(1);
              fetchSales(1, range);
            }}
            disabledDate={(current, { from }) => {
              if (from) return current.isBefore(from, 'day');
              return false;
            }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            Record Sale
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={sales}
        rowKey="_id"
        loading={loading}
        expandable={{ expandedRowRender }}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: (p) => { setPage(p); fetchSales(p); },
        }}
      />

      <Modal
        title={<span style={{ color: '#fff' }}>{mode === 'edit' ? 'Edit Sale' : 'Record Sale'}</span>}
        open={modalOpen}
        onOk={handleSave}
        onCancel={closeModal}
        okText={mode === 'edit' ? 'Save' : 'Record Sale'}
        width={580}
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
          {mode === 'edit' && editing ? (
            <>
              <Table
                dataSource={editing.items}
                rowKey="productName"
                pagination={false}
                size="small"
                style={{ marginBottom: 16 }}
                columns={[
                  { title: 'Product', dataIndex: 'productName' },
                  { title: 'Qty', dataIndex: 'quantity' },
                  { title: 'Unit Price', dataIndex: 'unitPrice', render: (v: number) => `₱${v.toFixed(2)}` },
                  { title: 'Subtotal', render: (_: unknown, r: any) => `₱${(r.unitPrice * r.quantity).toFixed(2)}` },
                ]}
              />
              <Divider />
            </>
          ) : (
            <>
              {saleItems.map((item, index) => (
                <Space key={index} align="start" style={{ width: '100%', marginBottom: 8 }}>
                  <Select
                    placeholder="Select product"
                    style={{ width: 280 }}
                    value={item.product || undefined}
                    onChange={(val) => updateItem(index, 'product', val)}
                    options={products.map((p) => ({
                      value: p._id,
                      label: `${p.name} (Stock: ${p.stock})`,
                      disabled: p.stock === 0 || saleItems.some((s, si) => si !== index && s.product === p._id),
                    }))}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label as string).toLowerCase().includes(input.toLowerCase())
                    }
                  />
                  <InputNumber
                    min={1}
                    value={item.quantity}
                    onChange={(val) => updateItem(index, 'quantity', val ?? 1)}
                    style={{ width: 80 }}
                    placeholder="Qty"
                  />
                  {saleItems.length > 1 && (
                    <Button
                      icon={<DeleteOutlined />}
                      danger
                      type="text"
                      onClick={() => setSaleItems((prev) => prev.filter((_, i) => i !== index))}
                    />
                  )}
                </Space>
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => setSaleItems((prev) => [...prev, { product: '', quantity: 1 }])}
                style={{ marginBottom: 16 }}
              >
                Add Another Product
              </Button>
              <Divider />
            </>
          )}

          <Form.Item name="note" label="Note (optional)" rules={[{ max: 100, message: 'Note cannot exceed 100 characters' }]}>
            <Input placeholder="e.g. Walk-in customer" maxLength={100} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
