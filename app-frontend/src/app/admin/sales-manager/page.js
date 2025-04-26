"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import AdminLayout from '../../../components/layouts/AdminLayout';
import { Card, Row, Col, Statistic, Button, Typography, Spin } from 'antd';
import { DollarOutlined, TagOutlined, FileTextOutlined, BarChartOutlined, PieChartOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function SalesManagerHomePage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    unsetPrices: 0,
    totalDiscounts: 0,
    invoices30Days: 0,
    monthlyRevenue: 0,
    profitMargin: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/sales-manager', {
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const cards = [
    {
      title: 'Products Needing Prices',
      icon: <DollarOutlined style={{ fontSize: '32px', color: '#1890ff' }} />,
      value: stats.unsetPrices,
      action: () => router.push('/admin/sales-manager/prices'),
      color: '#e6f7ff'
    },
    {
      title: 'Active Discounts',
      icon: <TagOutlined style={{ fontSize: '32px', color: '#52c41a' }} />,
      value: stats.totalDiscounts,
      action: () => router.push('/admin/sales-manager/discounts'),
      color: '#f6ffed'
    },
    {
      title: 'Invoices (Last 30 Days)',
      icon: <FileTextOutlined style={{ fontSize: '32px', color: '#faad14' }} />,
      value: stats.invoices30Days,
      action: () => router.push('/admin/sales-manager/invoices'),
      color: '#fffbe6'
    },
    {
      title: 'Monthly Revenue',
      icon: <BarChartOutlined style={{ fontSize: '32px', color: '#722ed1' }} />,
      value: formatCurrency(stats.monthlyRevenue || 0),
      action: () => router.push('/admin/sales-manager/profit'),
      color: '#f9f0ff',
      valueStyle: { fontSize: '1.2rem' }
    },
    {
      title: 'Profit Margin',
      icon: <PieChartOutlined style={{ fontSize: '32px', color: '#eb2f96' }} />,
      value: stats.profitMargin ? `${stats.profitMargin}%` : '0%',
      action: () => router.push('/admin/sales-manager/profit'),
      color: '#fff0f6'
    }
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <Title level={2}>Sales Manager Dashboard</Title>
        <p className="mb-8">Set prices, manage discounts, view invoices, and analyze revenue and profit.</p>
        
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
                      <Statistic 
                        value={card.value} 
                        valueStyle={card.valueStyle}
                      />
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
