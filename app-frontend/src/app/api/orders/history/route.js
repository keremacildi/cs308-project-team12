import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Get user ID from request query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Call the backend with user ID in the query params
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/history/?user=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch order history';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.detail || errorMessage;
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const data = await response.json();
    console.log('Order history data:', data);
    
    // Check if the response is what we expect
    if (!data) {
      return NextResponse.json({ orders: [] });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Order history error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 