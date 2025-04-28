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
    console.log(`Fetching order debug data for user ${userId}`);
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
      
      return NextResponse.json({ error: errorMessage, status: response.status }, { status: response.status });
    }

    // Get the raw response data
    const data = await response.json();
    
    // Add debug information
    const debugInfo = {
      originalData: data,
      metadata: {
        dataType: typeof data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 'N/A',
        keys: typeof data === 'object' && data !== null ? Object.keys(data) : 'N/A'
      }
    };
    
    // If there's an order, add structure information
    if (Array.isArray(data) && data.length > 0) {
      const firstOrder = data[0];
      debugInfo.firstOrderStructure = {
        keys: Object.keys(firstOrder),
        hasItems: 'items' in firstOrder,
        itemsType: firstOrder.items ? typeof firstOrder.items : 'N/A',
        itemsIsArray: firstOrder.items ? Array.isArray(firstOrder.items) : 'N/A',
        itemsLength: firstOrder.items && Array.isArray(firstOrder.items) ? firstOrder.items.length : 'N/A',
        hasDeliveryAddress: 'delivery_address' in firstOrder,
        hasDelivery: 'delivery' in firstOrder,
        total_price: firstOrder.total_price
      };
      
      // If there are items, add item structure
      if (firstOrder.items && Array.isArray(firstOrder.items) && firstOrder.items.length > 0) {
        const firstItem = firstOrder.items[0];
        debugInfo.firstItemStructure = {
          keys: Object.keys(firstItem),
          hasProduct: 'product' in firstItem,
          productType: firstItem.product ? typeof firstItem.product : 'N/A',
          productIsObject: firstItem.product ? typeof firstItem.product === 'object' : 'N/A',
          productKeys: firstItem.product && typeof firstItem.product === 'object' ? Object.keys(firstItem.product) : 'N/A',
          quantity: firstItem.quantity,
          price: firstItem.price_at_purchase
        };
      }
    }
    
    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('Order debug error:', error.message);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
} 