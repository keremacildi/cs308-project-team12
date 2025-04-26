import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Get credentials from request body
    const body = await request.json();
    const { email, password } = body;

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Forward the login request to the backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    // Get response data
    const data = await response.json();

    // If login failed, return the error
    if (!response.ok) {
      return NextResponse.json(
        { message: data.error || 'Login failed' },
        { status: response.status }
      );
    }

    // Determine user role (simplified for this example)
    // In a real app, this would come from the backend response
    let role = 'user';
    if (email === 'admin@example.com') {
      role = 'product-manager';
    }

    // Create response with the user data
    const result = NextResponse.json({
      user: data.user,
      message: 'Login successful',
      role: role
    });

    // Forward any cookies from the backend
    if (response.headers.get('set-cookie')) {
      result.headers.set('set-cookie', response.headers.get('set-cookie'));
    }

    return result;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 