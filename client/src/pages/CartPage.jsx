import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ShoppingBag } from 'lucide-react';

export default function CartPage() {
  const { cartItems, removeFromCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const total = cartItems.reduce((sum, item) => sum + (item.price ? Number(item.price) : 0), 0);

  const handleProceedToCheckout = () => {
    if (!isAuthenticated || !user) {
      navigate('/signin');
      return;
    }
    if (cartItems.length === 0) return;
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="max-w-3xl mx-auto py-24 px-4 flex-1 w-full">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Shopping Cart</h1>
        {cartItems.length === 0 ? (
          <div className="text-center py-32 text-gray-500">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p>Your cart is empty</p>
            <Link to="/marketplace" className="text-black font-medium mt-2 inline-block hover:underline">
              Continue shopping
            </Link>
          </div>
        ) : (
          <div>
            <div className="divide-y divide-gray-200 mb-8">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-4">
                  <Link to={`/artwork/${item.id}`} className="flex items-center gap-4">
                    <img src={item.image} alt={item.title} className="w-20 h-20 object-cover bg-gray-100 rounded-lg" />
                    <div>
                      <div className="font-semibold text-base text-gray-900">{item.title}</div>
                      <div className="text-sm text-gray-600">{item.price} SAR</div>
                    </div>
                  </Link>
                  <button
                    type="button"
                    className="ml-4 border text-red-600 border-red-200 px-3 py-1 rounded hover:bg-red-50 text-sm"
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

            <button
              type="button"
              onClick={handleProceedToCheckout}
              className="w-full bg-black text-white py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors"
            >
            Checkout
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
