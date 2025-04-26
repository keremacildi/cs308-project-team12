'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is admin on component mount
    if (typeof window !== 'undefined') {
      const storedAdmin = localStorage.getItem('admin');
      const role = localStorage.getItem('adminRole');
      
      if (!storedAdmin || !role) {
        console.log('Not authenticated as admin, redirecting to login');
        router.push('/admin/login');
        return;
      }
      
      setIsAdmin(true);
      setAdminRole(role);
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin');
      localStorage.removeItem('adminRole');
      router.push('/admin/login');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Don't render anything while redirecting
  }

  const isActive = (path) => {
    return pathname.startsWith(path) ? 
      { backgroundColor: '#1a365d', color: 'white' } : 
      {};
  };

  // Check if role is product manager (handling both formats: product_manager and product-manager)
  const isProductManager = adminRole === 'product_manager' || adminRole === 'product-manager';
  
  // Check if role is sales manager (handling both formats: sales_manager and sales-manager)
  const isSalesManager = adminRole === 'sales_manager' || adminRole === 'sales-manager';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{ 
        width: '250px', 
        backgroundColor: '#f0f2f5', 
        padding: '20px', 
        boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '30px' }}>
          Admin Panel
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {isProductManager && (
            <>
              <Link href="/admin/product-manager" style={{ 
                padding: '10px', 
                borderRadius: '4px', 
                textDecoration: 'none',
                color: 'inherit',
                ...isActive('/admin/product-manager')
              }}>
                Dashboard
              </Link>
              <Link href="/admin/product-manager/products" style={{ 
                padding: '10px', 
                borderRadius: '4px', 
                textDecoration: 'none',
                color: 'inherit',
                ...isActive('/admin/product-manager/products')
              }}>
                Products
              </Link>
              <Link href="/admin/product-manager/categories" style={{ 
                padding: '10px', 
                borderRadius: '4px', 
                textDecoration: 'none',
                color: 'inherit',
                ...isActive('/admin/product-manager/categories')
              }}>
                Categories
              </Link>
              <Link href="/admin/product-manager/stocks" style={{ 
                padding: '10px', 
                borderRadius: '4px', 
                textDecoration: 'none',
                color: 'inherit',
                ...isActive('/admin/product-manager/stocks')
              }}>
                Manage Stock
              </Link>
              <Link href="/admin/product-manager/deliveries" style={{ 
                padding: '10px', 
                borderRadius: '4px', 
                textDecoration: 'none',
                color: 'inherit',
                ...isActive('/admin/product-manager/deliveries')
              }}>
                Deliveries
              </Link>
              <Link href="/admin/product-manager/orders" style={{ 
                padding: '10px', 
                borderRadius: '4px', 
                textDecoration: 'none',
                color: 'inherit',
                ...isActive('/admin/product-manager/orders')
              }}>
                Order Status
              </Link>
              <Link href="/admin/product-manager/comments" style={{ 
                padding: '10px', 
                borderRadius: '4px', 
                textDecoration: 'none',
                color: 'inherit',
                ...isActive('/admin/product-manager/comments')
              }}>
                Comments
              </Link>
            </>
          )}
          
          {isSalesManager && (
            <>
              <Link href="/admin/sales-manager" style={{ 
                padding: '10px', 
                borderRadius: '4px', 
                textDecoration: 'none',
                color: 'inherit',
                ...isActive('/admin/sales-manager')
              }}>
                Dashboard
              </Link>
              <Link href="/admin/sales-manager/prices" style={{ 
                padding: '10px', 
                borderRadius: '4px', 
                textDecoration: 'none',
                color: 'inherit',
                ...isActive('/admin/sales-manager/prices')
              }}>
                Set Prices
              </Link>
              <Link href="/admin/sales-manager/discounts" style={{ 
                padding: '10px', 
                borderRadius: '4px', 
                textDecoration: 'none',
                color: 'inherit',
                ...isActive('/admin/sales-manager/discounts')
              }}>
                Manage Discounts
              </Link>
              <Link href="/admin/sales-manager/invoices" style={{ 
                padding: '10px', 
                borderRadius: '4px', 
                textDecoration: 'none',
                color: 'inherit',
                ...isActive('/admin/sales-manager/invoices')
              }}>
                Invoices
              </Link>
              <Link href="/admin/sales-manager/profit" style={{ 
                padding: '10px', 
                borderRadius: '4px', 
                textDecoration: 'none',
                color: 'inherit',
                ...isActive('/admin/sales-manager/profit')
              }}>
                Revenue & Profit
              </Link>
            </>
          )}
          
          <button 
            onClick={handleLogout}
            style={{
              marginTop: '30px',
              padding: '10px',
              backgroundColor: '#e53e3e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </nav>
      </div>
      
      {/* Main content */}
      <div style={{ flexGrow: 1, padding: '20px' }}>
        {children}
      </div>
    </div>
  );
} 