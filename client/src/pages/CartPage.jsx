import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext.jsx';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext.jsx'; 
import { getApiBaseUrl } from '../config.js';

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const { user } = useAuth(); // for auth token
  const [paymentMethod, setPaymentMethod] = useState('PAYPAL');

  const total = cartItems.reduce((sum, item) => sum + (item.price ? Number(item.price) : 0), 0);

  // Load PayPal buttons
  useEffect(() => {
    if (paymentMethod !== 'PAYPAL' || cartItems.length === 0) return;

    const container = document.getElementById('paypal-button-container');
    if (container) 
      container.innerHTML = '';

    function renderPayPal() {
      if (!window.paypal) return;
      window.paypal.Buttons({
        createOrder: async () => {
          const res = await fetch(`${getApiBaseUrl()}/payment/paypal/create`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${user.token}` },
            credentials: 'include',
          });
          const data = await res.json();
          return data.id;
        },
        onApprove: async (data) => {
          await fetch(`${getApiBaseUrl()}/payment/paypal/capture`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user.token}`,
            },
            credentials: 'include',
            body: JSON.stringify({ orderID: data.orderID }),
          });
          clearCart();
          toast.success('Payment successful!');
        },
      }).render('#paypal-button-container');
    }

    if (!window.paypal) {
      const script = document.createElement('script');
      script.src = 'https://www.paypal.com/sdk/js?client-id=AcQkwsfa0-vpAqfcu8n-BSClA28pkb4tPWWL59qnwazkMlcSeCJQS_klST0U61wGefCq0x2g_5IgS4YS';
      script.onload = renderPayPal;
      document.body.appendChild(script);
    } else {
      renderPayPal();
    }
  }, [paymentMethod, cartItems, user, clearCart]);

  // Handle COD order
  const handleCOD = async () => {
    if (!user?.token) {
      toast.error('Please sign in to place an order.');
      return;
    }
    try {
      const res = await fetch(`${getApiBaseUrl()}/payment/cod`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        credentials: 'include',
      });
      if (res.ok) {
        clearCart();
        toast.success('Order placed successfully (COD)');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to place COD order');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to place COD order');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="max-w-3xl mx-auto py-24 px-4 flex-1 w-full">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Cart</h1>
        {cartItems.length === 0 ? (
          <div className="text-center py-32 text-gray-500">Your cart is empty</div>
        ) : (
          <div>
            <div className="divide-y divide-gray-200 mb-8">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-4">
                  <Link to={`/artwork/${item.id}`} className="flex items-center gap-4">
                    <img src={item.image} alt={item.title} className="w-20 h-20 object-cover bg-gray-100" />
                    <div>
                      <div className="font-semibold text-base">{item.title}</div>
                      <div className="text-sm text-gray-600">{item.price} SAR</div>
                    </div>
                  </Link>
                  <button
                    className="ml-4 border text-red-600 border-red-200 px-3 py-1 rounded hover:bg-red-50"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-8">
              <span className="font-medium text-lg">Total:</span>
              <span className="text-xl font-bold">{total} SAR</span>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-4 flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="PAYPAL"
                  checked={paymentMethod === 'PAYPAL'}
                  onChange={() => setPaymentMethod('PAYPAL')}
                />
                PayPal
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                />
                Cash on Delivery
              </label>
            </div>

            {paymentMethod === 'COD' ? (
              <button
                className="w-full bg-black text-white py-4 rounded font-medium text-lg hover:bg-gray-900"
                onClick={handleCOD}
              >
                Place Order
              </button>
            ) : (
              <div id="paypal-button-container"></div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
