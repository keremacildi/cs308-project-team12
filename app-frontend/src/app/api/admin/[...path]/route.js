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
    console.log(`Forwarding ${request.method} request to: ${url}`);
    const response = await fetch(url, options);
    
    // Read response body
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } else {
      data = await response.text();
    }
    
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
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
};

// Generic handler for all HTTP methods
export async function GET(request, { params }) {
  const path = params.path || [];
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/${path.join('/')}/`;
  return forwardRequest(request, apiUrl);
}

export async function POST(request, { params }) {
  const path = params.path || [];
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/${path.join('/')}/`;
  return forwardRequest(request, apiUrl);
}

export async function PUT(request, { params }) {
  const path = params.path || [];
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/${path.join('/')}/`;
  return forwardRequest(request, apiUrl);
}

export async function DELETE(request, { params }) {
  const path = params.path || [];
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/${path.join('/')}/`;
  return forwardRequest(request, apiUrl);
}

export async function PATCH(request, { params }) {
  const path = params.path || [];
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/${path.join('/')}/`;
  return forwardRequest(request, apiUrl);
} 