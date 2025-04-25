import { NextResponse } from 'next/server';

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
        const backendData = {
            delivery_address,
            order_items,
            total_price: total
        };
        console.log('Sending to backend:', backendData);

        const response = await fetch('http://localhost:8000/api/orders/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(backendData),
        });

        console.log('Backend response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Backend error response:', errorData);
            return NextResponse.json(
                { error: errorData.error || 'Failed to create order' },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('Order created successfully:', data);
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 