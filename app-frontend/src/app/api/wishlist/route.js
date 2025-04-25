import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const response = await fetch('http://localhost:8000/api/wishlist/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies().toString(),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.detail || 'Failed to fetch wishlist' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { product_id } = await request.json();
    
    if (!product_id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const response = await fetch(`http://localhost:8000/api/wishlist/add/${product_id}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies().toString(),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.detail || 'Failed to add to wishlist' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { product_id } = await request.json();
    
    if (!product_id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const response = await fetch(`http://localhost:8000/api/wishlist/remove/${product_id}/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies().toString(),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.detail || 'Failed to remove from wishlist' }, { status: response.status });
    }

    return NextResponse.json({ message: 'Item removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 });
  }
} 