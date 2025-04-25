import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request) {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { items, total } = body;

        // Create order in backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.accessToken}`,
            },
            body: JSON.stringify({
                items,
                total,
                user: session.user.id,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create order');
        }

        const data = await response.json();

        // Return order and invoice data
        return NextResponse.json({
            order: data.order,
            invoice: {
                orderNumber: data.order.id,
                date: new Date().toISOString(),
                items: items.map(item => ({
                    id: item.id,
                    title: item.title,
                    price: item.price,
                    quantity: item.quantity,
                })),
                total: total,
            },
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 