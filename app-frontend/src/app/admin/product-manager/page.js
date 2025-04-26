"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import AdminLayout from '../../../components/layouts/AdminLayout';
import { Card, Row, Col, Statistic, Button, Typography, Spin } from 'antd';
import { ShopOutlined, TagOutlined, InboxOutlined, CommentOutlined, FileTextOutlined, TruckOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function ProductManagerHomePage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    lowStockItems: 0,
    pendingComments: 0,
    pendingDeliveries: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/product-manager', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: 'Products',
      icon: <ShopOutlined style={{ fontSize: '32px', color: '#1890ff' }} />,
      value: stats.totalProducts,
      action: () => router.push('/admin/product-manager/products'),
      color: '#e6f7ff'
    },
    {
      title: 'Categories',
      icon: <TagOutlined style={{ fontSize: '32px', color: '#52c41a' }} />,
      value: stats.totalCategories,
      action: () => router.push('/admin/product-manager/categories'),
      color: '#f6ffed'
    },
    {
      title: 'Low Stock Items',
      icon: <InboxOutlined style={{ fontSize: '32px', color: '#faad14' }} />,
      value: stats.lowStockItems,
      action: () => router.push('/admin/product-manager/stocks'),
      color: '#fffbe6'
    },
    {
      title: 'Pending Comments',
      icon: <CommentOutlined style={{ fontSize: '32px', color: '#722ed1' }} />,
      value: stats.pendingComments,
      action: () => router.push('/admin/product-manager/comments'),
      color: '#f9f0ff'
    },
    {
      title: 'Pending Deliveries',
      icon: <TruckOutlined style={{ fontSize: '32px', color: '#eb2f96' }} />,
      value: stats.pendingDeliveries,
      action: () => router.push('/admin/product-manager/deliveries'),
      color: '#fff0f6'
    },
    {
      title: 'Order Status Updates',
      icon: <FileTextOutlined style={{ fontSize: '32px', color: '#13c2c2' }} />,
      value: stats.pendingOrders,
      action: () => router.push('/admin/product-manager/orders'),
      color: '#e6fffb'
    }
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <Title level={2}>Product Manager Dashboard</Title>
        <p className="mb-8">Manage products, categories, stock levels, comments, and deliveries.</p>
        
        {loading ? (
          <div className="flex justify-center p-6">
            <Spin size="large" />
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {cards.map((card, index) => (
              <Col xs={24} sm={12} lg={8} key={index}>
                <Card 
                  hoverable 
                  onClick={card.action}
                  style={{ 
                    borderRadius: '8px',
                    backgroundColor: card.color,
                    height: '100%',
                    cursor: 'pointer'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 mb-1">{card.title}</p>
                      <Statistic value={card.value} />
                    </div>
                    <div>
                      {card.icon}
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </AdminLayout>
  );
}
