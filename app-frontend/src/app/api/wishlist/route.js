import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';

export async function GET() {
  try {
    const data = await api.wishlist.get();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { product_id } = await request.json();
    
    if (!product_id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const data = await api.wishlist.add(product_id);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json({ error: error.message || 'Failed to add to wishlist' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { product_id } = await request.json();
    
    if (!product_id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const data = await api.wishlist.remove(product_id);
    return NextResponse.json({ message: 'Item removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove from wishlist' }, { status: 500 });
  }
} 