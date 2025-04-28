import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        console.log('Received request body:', body);
        
        const { delivery_address, items, total, userId } = body;

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

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
            user: userId,
            delivery_address,
            order_items,
            total_price: total
        };
        console.log('Sending to backend:', orderData);

        // Make the direct request to the backend API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
        });

        // Handle API response
        if (!response.ok) {
            let errorMessage = 'Failed to create order';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.detail || errorMessage;
            } catch (parseError) {
                console.error('Error parsing error response:', parseError);
            }
            
            return NextResponse.json({ error: errorMessage }, { status: response.status });
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