import { NextResponse } from 'next/server';

// Helper function to forward cookies and headers
const forwardRequest = async (request, url) => {
  try {
    // Get headers from original request
    const headers = new Headers();
    for (const [key, value] of request.headers.entries()) {
      // Skip some headers that cause issues when forwarded
      if (!['host', 'connection'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    }
    // Ensure content-type is set
    if (!headers.has('content-type') && request.method !== 'GET') {
      headers.set('content-type', 'application/json');
    }

    // Create fetch options
    const options = {
      method: request.method,
      headers,
      credentials: 'include',
    };

    // Add body for non-GET requests
    if (request.method !== 'GET') {
      const contentType = headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        options.body = JSON.stringify(await request.json());
      } else {
        options.body = await request.text();
      }
    }

    // Forward the request to the backend
    const response = await fetch(url, options);
    
    // Read response body
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    
    // Create response
    const res = NextResponse.json(data, { status: response.status });
    
    // Forward cookies from the backend response
    if (response.headers.get('set-cookie')) {
      res.headers.set('set-cookie', response.headers.get('set-cookie'));
    }
    
    return res;
  } catch (error) {
    console.error('Error forwarding request:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
};

export async function GET(request) {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/categories/`;
  console.log('Forwarding GET request to:', apiUrl);
  return forwardRequest(request, apiUrl);
}

export async function POST(request) {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/categories/`;
  console.log('Forwarding POST request to:', apiUrl);
  return forwardRequest(request, apiUrl);
}

export async function PUT(request) {
  // Extract category ID from the URL
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/categories/${id}/`;
  console.log('Forwarding PUT request to:', apiUrl);
  return forwardRequest(request, apiUrl);
}

export async function DELETE(request) {
  // Extract category ID from the URL
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/categories/${id}/`;
  console.log('Forwarding DELETE request to:', apiUrl);
  return forwardRequest(request, apiUrl);
} 