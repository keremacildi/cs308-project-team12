"use client";
import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import AdminLayout from '../../../../components/layouts/AdminLayout';
import { Card, Typography, Button, Modal, Form, Input, message, Spin, Space, Table, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function CategoryManagerPage() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [currentCategory, setCurrentCategory] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin before fetching categories
    if (typeof window !== 'undefined') {
      try {
        const adminData = localStorage.getItem('admin');
        const adminRole = localStorage.getItem('adminRole');
        
        // Debug admin data
        const debugData = {
          adminData: adminData ? 'present' : 'missing',
          adminRole,
          localStorage: Object.keys(localStorage).join(', ')
        };
        setDebugInfo(debugData);
        
        if (!adminData || !adminRole) {
          setError("You must be logged in as an admin to access this page");
          setLoading(false);
          // Redirect to admin login after a delay
          setTimeout(() => router.push('/admin/login'), 2000);
          return;
        }
        
        setIsAdmin(true);
        fetchCategories();
      } catch (err) {
        setError(`Error loading admin data: ${err.message}`);
        setLoading(false);
      }
    }
  }, [router]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      console.log('Fetching categories from Next.js API route');
      const response = await fetch('/api/admin/categories', {
        credentials: 'include',
      });
      
      console.log('Categories API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setCategories(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError(`Failed to fetch categories: ${err.message}`);
      message.error(`Failed to fetch categories: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // For test purposes - create a direct API call button 
  const testApiConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, try to get the non-admin categories endpoint to check basic connectivity
      const testUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/categories/`;
      console.log("Testing connection with:", testUrl);
      
      const response = await fetch(testUrl);
      const data = await response.json();
      
      console.log("Test connection successful:", data);
      
      // Now try the actual admin categories endpoint
      const adminUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/categories/`;
      console.log("Testing admin endpoint:", adminUrl);
      
      const adminResponse = await fetch(adminUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log("Admin response status:", adminResponse.status);
      
      if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        console.log("Admin data received:", adminData);
        setCategories(adminData);
        setError("Connection test successful");
      } else {
        throw new Error(`Admin API error: ${adminResponse.status}`);
      }
    } catch (err) {
      console.error("Connection test failed:", err);
      setError(`Connection test failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newCategory.trim()) return;
    
    try {
      setAddingCategory(true);
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: newCategory }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }
      
      message.success('Category added successfully');
      setIsAddModalOpen(false);
      form.resetFields();
      fetchCategories();
    } catch (err) {
      console.error('Failed to add category:', err);
      message.error(`Failed to add category: ${err.message}`);
    } finally {
      setAddingCategory(false);
    }
  };

  const startEdit = (category) => {
    setEditingCategory(category.id);
    setEditName(category.name);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditName("");
  };

  const handleEdit = async (values) => {
    if (!editName.trim()) return;
    
    try {
      const response = await fetch(`/api/admin/categories/${currentCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: values.name }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }
      
      message.success('Category updated successfully');
      setIsEditModalOpen(false);
      editForm.resetFields();
      fetchCategories();
    } catch (err) {
      console.error('Failed to update category:', err);
      message.error(`Failed to update category: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this category? Any products in this category will need to be reassigned.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }
      
      message.success('Category deleted successfully');
      fetchCategories();
    } catch (err) {
      console.error('Failed to delete category:', err);
      message.error(`Failed to delete category: ${err.message}`);
    }
  };

  const showEditModal = (category) => {
    setCurrentCategory(category);
    editForm.setFieldsValue({ name: category.name });
    setIsEditModalOpen(true);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this category?"
            description="Are you sure you want to delete this category? Products in this category will not be deleted."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!isAdmin && !loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || "You must be logged in as an admin to access this page"}
        </div>
        <p className="text-center">Redirecting to login page...</p>
        
        {debugInfo && (
          <div className="mt-8 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold">Debug Info:</h3>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <AdminLayout>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={3}>Manage Categories</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Category
          </Button>
        </div>

        {error && (
          <div style={{ marginBottom: 16, color: 'red' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table 
            dataSource={categories} 
            columns={columns} 
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}

        {/* Add Category Modal */}
        <Modal
          title="Add New Category"
          open={isAddModalOpen}
          onCancel={() => setIsAddModalOpen(false)}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAdd}
          >
            <Form.Item
              name="name"
              label="Category Name"
              rules={[{ required: true, message: 'Please enter a category name' }]}
            >
              <Input placeholder="Enter category name" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Add Category
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Edit Category Modal */}
        <Modal
          title="Edit Category"
          open={isEditModalOpen}
          onCancel={() => setIsEditModalOpen(false)}
          footer={null}
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleEdit}
          >
            <Form.Item
              name="name"
              label="Category Name"
              rules={[{ required: true, message: 'Please enter a category name' }]}
            >
              <Input placeholder="Enter category name" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Update Category
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </AdminLayout>
  );
}
