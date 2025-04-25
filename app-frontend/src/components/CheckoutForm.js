import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutForm({ cartItems, total }) {
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const formRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Prepare order items data
      const orderItems = cartItems.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_purchase: item.product.price
      }));

      const orderData = {
        delivery_address: deliveryAddress,
        order_items: orderItems,
        total_price: total
      };

      console.log('Submitting order with data:', orderData);

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      // Redirect to order confirmation page
      router.push(`/orders/${data.order.id}`);
    } catch (err) {
      console.error('Order creation error:', err);
      setError(err.message || 'An error occurred while creating your order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form 
      ref={formRef}
      onSubmit={handleSubmit} 
      className="space-y-4"
      aria-label="Checkout form"
    >
      <div>
        <label 
          htmlFor="deliveryAddress" 
          className="block text-sm font-medium text-gray-700"
        >
          Delivery Address
        </label>
        <textarea
          id="deliveryAddress"
          value={deliveryAddress}
          onChange={(e) => setDeliveryAddress(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          rows={3}
          placeholder="Enter your complete delivery address"
          aria-required="true"
        />
      </div>

      {error && (
        <div 
          className="text-red-600 text-sm p-2 bg-red-50 rounded"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">
          Total: ${total.toFixed(2)}
        </div>
        <button
          type="submit"
          disabled={isLoading || !deliveryAddress || cartItems.length === 0}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          aria-disabled={isLoading || !deliveryAddress || cartItems.length === 0}
        >
          {isLoading ? 'Processing...' : 'Place Order'}
        </button>
      </div>
    </form>
  );
} 