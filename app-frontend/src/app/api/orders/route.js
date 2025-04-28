import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const body = await request.json();
        console.log('Received request body:', body);
        
        const { delivery_address, items, total } = body;

        if (!delivery_address) {
            return NextResponse.json(
                { error: 'Delivery address is required' },
                { status: 400 }
            );
        }

        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: 'Order items are required' },
                { status: 400 }
            );
        }

        // Transform items to match backend format
        const order_items = items.map(item => ({
            product: item.id,
            quantity: item.quantity,
            price_at_purchase: item.price
        }));

        // Log the data being sent to backend
        const orderData = {
            delivery_address,
            order_items,
            total_price: total
        };
        console.log('Sending to backend:', orderData);

        // Get cookies
        const cookieStore = cookies();
        const allCookies = cookieStore.getAll();
        const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join('; ');

        // Make the request with cookies included
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieHeader
            },
            credentials: 'include',
            body: JSON.stringify(orderData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || errorData.detail || 'Failed to create order');
        }

        const data = await response.json();
        console.log('Order created successfully:', data);
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
} 