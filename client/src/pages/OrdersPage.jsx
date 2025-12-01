import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Package, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function OrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setActiveTab(location.pathname === '/sales' ? 'sales' : 'orders');
  }, [location.pathname]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/signin');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        setOrders([]);
        setSales([]);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && user) {
      fetchOrders();
    }
  }, [user, isAuthenticated]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/${tab}`, { replace: true });
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date instanceof Date ? date.toLocaleDateString() : new Date(date).toLocaleDateString();
  };

  const getOrderId = (order) => order.id || order._id || '';
  const getOrderNumber = (order) => order.orderNumber || order.id || '';

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="max-w-6xl mx-auto py-24 px-4 flex-1 w-full">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">My Orders</h1>

        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => handleTabChange('orders')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'orders'
                    ? 'text-black border-b-2 border-black'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Package className="w-5 h-5" />
                My Orders
              </button>
              <button
                onClick={() => handleTabChange('sales')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'sales'
                    ? 'text-black border-b-2 border-black'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Palette className="w-5 h-5" />
                My Sales
              </button>
            </div>
          </div>

          {activeTab === 'orders' && (
            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Loading orders...</p>
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={getOrderId(order)}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Order #{getOrderNumber(order)}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(order.date || order.createdAt)}
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            Status: <span className="font-medium">{order.status || 'Pending'}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {order.total || 0} SAR
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No orders yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Loading sales...</p>
                </div>
              ) : sales.length > 0 ? (
                <div className="space-y-4">
                  {sales.map((order) => (
                    <div
                      key={getOrderId(order)}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        {order.artwork?.image && (
                          <img
                            src={order.artwork.image}
                            alt={order.artwork.title || 'Artwork'}
                            className="w-24 h-24 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/Profileimages/User.jpg';
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {order.artwork?.title || 'Artwork'}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Order #{getOrderNumber(order)}
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            Status: <span className="font-medium">{order.status || 'Pending'}</span>
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(order.date || order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {order.total || order.artwork?.price || 0} SAR
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Palette className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No sales yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}