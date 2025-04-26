"use client";
import { useState, useEffect } from "react";
import AdminLayout from '../../../../components/layouts/AdminLayout';
import { Table, Card, Typography, Button, InputNumber, Space, message, Spin, Select, Popconfirm, Modal, Form, Input, Tag } from 'antd';
import { PlusOutlined, NotificationOutlined, PercentageOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

export default function DiscountsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [discountModalVisible, setDiscountModalVisible] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [discountRate, setDiscountRate] = useState(10);
  const [notifyUsers, setNotifyUsers] = useState(true);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/products', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError(`Failed to fetch products: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const applyDiscount = async () => {
    if (selectedProducts.length === 0) {
      message.error('Please select at least one product');
      return;
    }

    try {
      const response = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          product_ids: selectedProducts,
          discount_rate: discountRate,
          notify_users: notifyUsers,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      message.success(`Discount of ${discountRate}% applied to ${selectedProducts.length} products`);
      if (notifyUsers && data.notified_users > 0) {
        message.info(`Notifications sent to ${data.notified_users} users`);
      }
      
      // Close the modal and reset form
      setDiscountModalVisible(false);
      setSelectedProducts([]);
      setDiscountRate(10);
      
      // Refresh products list to show updated prices
      fetchProducts();
    } catch (err) {
      console.error('Failed to apply discount:', err);
      message.error(`Failed to apply discount: ${err.message}`);
    }
  };

  const handleRemoveDiscount = async (productId) => {
    try {
      const response = await fetch(`/api/admin/discounts/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      message.success('Discount removed');
      
      // Refresh products list to show updated prices
      fetchProducts();
    } catch (err) {
      console.error('Failed to remove discount:', err);
      message.error(`Failed to remove discount: ${err.message}`);
    }
  };

  const showDiscountModal = () => {
    setDiscountModalVisible(true);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Product',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => category ? category.name : 'N/A',
    },
    {
      title: 'Brand',
      dataIndex: 'brand',
      key: 'brand',
      render: (brand) => brand ? brand.name : 'N/A',
    },
    {
      title: 'Original Price',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost) => `$${cost ? cost.toFixed(2) : '0.00'}`,
    },
    {
      title: 'Current Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `$${price ? price.toFixed(2) : '0.00'}`,
    },
    {
      title: 'Discount',
      key: 'discount',
      render: (_, record) => {
        if (!record.cost || !record.price) return 'N/A';
        
        const originalPrice = record.cost * 2; // Assuming cost is 50% of original price
        if (record.price < originalPrice) {
          const discountPercent = Math.round((1 - record.price / originalPrice) * 100);
          return (
            <Tag color="green">
              {discountPercent}% OFF
            </Tag>
          );
        }
        return 'None';
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => {
        if (!record.cost || !record.price) return null;
        
        const originalPrice = record.cost * 2; // Assuming cost is 50% of original price
        if (record.price < originalPrice) {
          return (
            <Popconfirm
              title="Remove this discount?"
              onConfirm={() => handleRemoveDiscount(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button danger>Remove Discount</Button>
            </Popconfirm>
          );
        }
        return null;
      },
    },
  ];

  const productOptions = products.map(product => (
    <Option key={product.id} value={product.id}>
      {product.title} (${product.price ? product.price.toFixed(2) : '0.00'})
    </Option>
  ));

  return (
    <AdminLayout>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={3}>Manage Discounts</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={showDiscountModal}
          >
            Apply New Discount
          </Button>
        </div>
        
        <p className="mb-4">
          Apply discounts to products and notify users with these products in their wishlist.
        </p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-6">
            <Spin size="large" />
          </div>
        ) : (
          <Table 
            dataSource={products} 
            columns={columns} 
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      {/* Discount Modal */}
      <Modal
        title="Apply Discount to Products"
        visible={discountModalVisible}
        open={discountModalVisible}
        onCancel={() => setDiscountModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDiscountModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="apply" type="primary" onClick={applyDiscount}>
            Apply Discount
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            label="Select Products"
            required
            rules={[{ required: true, message: 'Please select at least one product' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select products to discount"
              style={{ width: '100%' }}
              value={selectedProducts}
              onChange={setSelectedProducts}
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {productOptions}
            </Select>
          </Form.Item>

          <Form.Item
            label="Discount Rate (%)"
            required
            rules={[{ required: true, message: 'Please enter a discount rate' }]}
          >
            <InputNumber
              min={1}
              max={99}
              value={discountRate}
              onChange={setDiscountRate}
              style={{ width: '100%' }}
              formatter={value => `${value}%`}
              parser={value => value.replace('%', '')}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <PercentageOutlined />
              <span>The discount will be applied to the current price of the product.</span>
            </Space>
          </Form.Item>

          <Form.Item>
            <div className="flex items-center">
              <Input 
                type="checkbox" 
                checked={notifyUsers} 
                onChange={(e) => setNotifyUsers(e.target.checked)} 
                style={{ marginRight: 8 }}
              />
              <Space>
                <NotificationOutlined />
                <span>Notify users who have these products in their wishlists</span>
              </Space>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </AdminLayout>
  );
}
