import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const body = await request.json();
        console.log('Received direct order request:', body);

        // Get all cookies - using await for cookies() APIs
        const cookieStore = cookies();
        const allCookies = await Promise.all(
            // Get individual cookies that we know are set during login
            ['csrftoken', 'userSession', 'isAuthenticated', 'user'].map(async name => {
                const value = cookieStore.get(name)?.value;
                return value ? `${name}=${value}` : null;
            })
        ).then(cookies => cookies.filter(Boolean));
        
        const cookieStr = allCookies.join('; ');
        
        console.log('Sending cookies for authentication');
        
        // Get the user data from the request body
        const { userId, orderData } = body;
        
        if (!userId || !orderData) {
            return NextResponse.json(
                { error: 'User ID and order data are required' },
                { status: 400 }
            );
        }
        
        // Make direct call to the backend API - avoid using custom headers that might cause CORS issues
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieStr,
                // Removed the X-User-Id header that was causing CORS issues
            },
            credentials: 'include', // This is crucial for sending cookies
            body: JSON.stringify(orderData)
        });
        
        // Log the response status
        console.log('Backend API response status:', response.status);
        
        // Get the response data
        const data = await response.json();
        console.log('Response data:', data);
        
        // Return the data with the original status code
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Error creating order through direct API:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
} 