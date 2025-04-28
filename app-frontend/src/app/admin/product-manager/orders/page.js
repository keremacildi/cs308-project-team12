"use client";
import { useState, useEffect } from "react";
import AdminLayout from '../../../../components/layouts/AdminLayout';
import { Table, Card, Typography, Button, Tag, Select, message, Spin } from 'antd';

const { Title } = Typography;
const { Option } = Select;

export default function OrderStatusPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/orders', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setOrders(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError(`Failed to fetch orders: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      message.success(`Order status updated to ${newStatus}`);
      
      // Update the order in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      console.error('Failed to update order status:', err);
      message.error(`Failed to update order status: ${err.message}`);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'processing': 'blue',
      'shipped': 'cyan',
      'in_transit': 'orange',
      'delivered': 'green',
      'cancelled': 'red',
      'refunded': 'volcano',
    };
    return statusColors[status] || 'default';
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Customer',
      dataIndex: 'user',
      key: 'user',
      render: (user) => `${user.first_name} ${user.last_name}`,
    },
    {
      title: 'Total',
      dataIndex: 'total_price',
      key: 'total_price',
      render: (price) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Select
          defaultValue={record.status}
          style={{ width: 120 }}
          onChange={(value) => handleStatusChange(record.id, value)}
        >
          <Option value="processing">Processing</Option>
          <Option value="shipped">Shipped</Option>
          <Option value="in_transit">In Transit</Option>
          <Option value="delivered">Delivered</Option>
          <Option value="cancelled">Cancelled</Option>
          <Option value="refunded">Refunded</Option>
        </Select>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Card>
        <Title level={3}>Order Status Management</Title>
        <p className="mb-4">Update the status of customer orders and track deliveries.</p>
        
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
            dataSource={orders} 
            columns={columns} 
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>
    </AdminLayout>
  );
} 