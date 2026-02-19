import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Package, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../config.js';

export default function OrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab based on URL
  useEffect(() => {
    setActiveTab(location.pathname === '/sales' ? 'sales' : 'orders');
  }, [location.pathname]);

  // Redirect if not signed in
  useEffect(() => {
    if (!isAuthenticated || !user) navigate('/signin');
  }, [isAuthenticated, user, navigate]);

  // Fetch orders & sales
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.token) return;
      setIsLoading(true);
      try {
        // Orders (as buyer)
        const resOrders = await fetch(`${getApiBaseUrl()}/orders`, {
          headers: { Authorization: `Bearer ${user.token}` },
          credentials: 'include',
        });
        const dataOrders = await resOrders.json();
        setOrders(dataOrders.orders || []);

        // Sales (as artist)
        const resSales = await fetch(`${getApiBaseUrl()}/orders/sales`, {
          headers: { Authorization: `Bearer ${user.token}` },
          credentials: 'include',
        });
        const dataSales = await resSales.json();
        setSales(dataSales.sales || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && user) fetchOrders();
  }, [user, isAuthenticated]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/${tab}`, { replace: true });
  };

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString() : '';

  const getOrderId = (order) => order._id || order.id || '';
  const getOrderNumber = (order) => order.orderNumber || order._id || '';

  if (!isAuthenticated || !user) return null;

  const renderItems = (items) =>
    items.map((item, idx) => (
      <div key={idx} className="flex items-center gap-4 border-b border-gray-100 pb-2 mb-2">
        {item.artwork?.image && (
          <img
            src={item.artwork.image}
            alt={item.artwork.title}
            className="w-20 h-20 object-cover rounded-lg"
          />
        )}
        <div>
          <p className="font-medium">{item.artwork?.title || 'Artwork'}</p>
          <p className="text-sm text-gray-500">Price: {item.price} SAR</p>
          <p className="text-sm text-gray-500">Artist: {item.artist?.name || 'Unknown'}</p>
        </div>
      </div>
    ));
//order details card
  const renderOrderCard = (order) => (
    <div key={getOrderId(order)} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-gray-900 mb-2">Order #{getOrderNumber(order)}</h3>
      <p className="text-sm text-gray-500 mb-2">Date: {formatDate(order.createdAt)}</p>
      <p className="text-sm text-gray-600 mb-4">Status: {order.status}</p>
      <div className="space-y-2">{renderItems(order.items)}</div>
      <p className="text-lg font-bold mt-4">Total: {order.totalAmount} SAR</p>
      <p className="text-sm text-gray-500">Payment: {order.paymentMethod}</p>
    </div>
  );

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
                <p className="text-center text-gray-600 py-12">Loading orders...</p>
              ) : orders.length > 0 ? (
                <div className="space-y-4">{orders.map(renderOrderCard)}</div>
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
                <p className="text-center text-gray-600 py-12">Loading sales...</p>
              ) : sales.length > 0 ? (
                <div className="space-y-4">{sales.map(renderOrderCard)}</div>
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
