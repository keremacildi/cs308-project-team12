import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Get user ID from request query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Call the backend to get user profile
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile/?user=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch user profile');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('User profile error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { userId, ...userData } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Include userId in the request body for the backend
    const updatedData = { ...userData, user: userId };

    // Call the backend to update user profile
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update user profile');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('User profile update error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 