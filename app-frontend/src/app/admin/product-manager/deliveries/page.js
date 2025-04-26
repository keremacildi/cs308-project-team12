"use client";
import { useState, useEffect } from "react";
import AdminLayout from '../../../../components/layouts/AdminLayout';
import { Table, Card, Typography, Button, Tag, Select, message, Spin, Badge, Drawer, Descriptions, Space, Divider } from 'antd';

const { Title } = Typography;
const { Option } = Select;

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/deliveries', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setDeliveries(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch deliveries:', err);
      setError(`Failed to fetch deliveries: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (deliveryId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/deliveries/${deliveryId}/status`, {
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

      message.success(`Delivery status updated to ${newStatus}`);
      
      // Update the delivery in the local state
      setDeliveries(prevDeliveries => 
        prevDeliveries.map(delivery => 
          delivery.id === deliveryId ? { ...delivery, status: newStatus } : delivery
        )
      );
    } catch (err) {
      console.error('Failed to update delivery status:', err);
      message.error(`Failed to update delivery status: ${err.message}`);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'processing': 'blue',
      'in_transit': 'orange',
      'delivered': 'green',
      'cancelled': 'red',
    };
    return statusColors[status] || 'default';
  };

  const showDeliveryDetails = (delivery) => {
    setSelectedDelivery(delivery);
    setDrawerVisible(true);
  };

  const columns = [
    {
      title: 'Delivery ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Order ID',
      dataIndex: 'order',
      key: 'order_id',
      render: (order) => order.id,
    },
    {
      title: 'Customer',
      dataIndex: 'order',
      key: 'customer',
      render: (order) => `${order.user.first_name} ${order.user.last_name}`,
    },
    {
      title: 'Address',
      dataIndex: 'delivery_address',
      key: 'address',
      ellipsis: true,
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
      title: 'Shipped Date',
      dataIndex: 'shipped_at',
      key: 'shipped_at',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'Not shipped',
    },
    {
      title: 'Delivered Date',
      dataIndex: 'delivered_at',
      key: 'delivered_at',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'Not delivered',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Select
            defaultValue={record.status}
            style={{ width: 120 }}
            onChange={(value) => handleStatusChange(record.id, value)}
          >
            <Option value="processing">Processing</Option>
            <Option value="in_transit">In Transit</Option>
            <Option value="delivered">Delivered</Option>
            <Option value="cancelled">Cancelled</Option>
          </Select>
          <Button type="link" onClick={() => showDeliveryDetails(record)}>
            Details
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Card>
        <Title level={3}>Delivery Management</Title>
        <p className="mb-4">Manage customer deliveries and update delivery statuses.</p>
        
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
            dataSource={deliveries} 
            columns={columns} 
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      {/* Delivery Details Drawer */}
      <Drawer
        title="Delivery Details"
        placement="right"
        width={600}
        onClose={() => setDrawerVisible(false)}
        visible={drawerVisible}
        open={drawerVisible}
      >
        {selectedDelivery && (
          <>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Delivery ID">{selectedDelivery.id}</Descriptions.Item>
              <Descriptions.Item label="Order ID">{selectedDelivery.order.id}</Descriptions.Item>
              <Descriptions.Item label="Customer">
                {`${selectedDelivery.order.user.first_name} ${selectedDelivery.order.user.last_name}`}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedDelivery.status)}>
                  {selectedDelivery.status.replace('_', ' ').toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Delivery Address">
                {selectedDelivery.delivery_address}
              </Descriptions.Item>
              <Descriptions.Item label="Shipped Date">
                {selectedDelivery.shipped_at ? new Date(selectedDelivery.shipped_at).toLocaleDateString() : 'Not shipped'}
              </Descriptions.Item>
              <Descriptions.Item label="Delivered Date">
                {selectedDelivery.delivered_at ? new Date(selectedDelivery.delivered_at).toLocaleDateString() : 'Not delivered'}
              </Descriptions.Item>
            </Descriptions>

            <Divider>Order Items</Divider>
            
            <Table
              dataSource={selectedDelivery.order.items}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: 'Product',
                  dataIndex: 'product',
                  key: 'product',
                  render: (product) => product.title,
                },
                {
                  title: 'Quantity',
                  dataIndex: 'quantity',
                  key: 'quantity',
                },
                {
                  title: 'Price',
                  dataIndex: 'price_at_purchase',
                  key: 'price',
                  render: (price) => `$${price.toFixed(2)}`,
                },
                {
                  title: 'Total',
                  key: 'total',
                  render: (_, record) => `$${(record.price_at_purchase * record.quantity).toFixed(2)}`,
                }
              ]}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell colSpan={3} style={{ textAlign: 'right' }}>
                    <strong>Total:</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell>
                    <strong>${selectedDelivery.order.total_price.toFixed(2)}</strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </>
        )}
      </Drawer>
    </AdminLayout>
  );
}
