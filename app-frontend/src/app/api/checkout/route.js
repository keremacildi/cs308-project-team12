import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        console.log('Server-side checkout request:', body);
        
        const { userId, email, address, items, total } = body;
        
        if (!userId || !address || !items || !total) {
            return NextResponse.json(
                { error: 'User ID, address, items and total are required' },
                { status: 400 }
            );
        }

        // Format the order data for the backend
        const orderData = {
            delivery_address: address,
            order_items: items.map(item => ({
                product: item.id,
                quantity: item.quantity,
                price_at_purchase: item.price
            })),
            total_price: total
        };
        
        console.log('Preparing server-side checkout with user ID:', userId);
        
        // Use the simplest possible authentication - basic HTTP auth with email as username
        // This avoids cookie/CORS issues
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const basicAuth = Buffer.from(`${email}:${userId}`).toString('base64');
        
        // Make direct call to the backend API
        const response = await fetch(`${API_URL}/api/orders/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${basicAuth}`
            },
            body: JSON.stringify(orderData),
        });
        
        console.log('Server-side checkout API status:', response.status);
        
        // Get response data
        const data = await response.json();
        
        // Return data with appropriate status
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Server-side checkout error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
} 