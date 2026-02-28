import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Package, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../config.js';

const STATUS_DISPLAY = [
  { value: 'PENDING', label: 'Pending', emoji: '🟡' },
  { value: 'PAID', label: 'Pending', emoji: '🟡' },
  { value: 'ACCEPTED', label: 'Order Accepted', emoji: '✓' },
  { value: 'SHIPPED', label: 'Shipped', emoji: '🚚' },
  { value: 'DELIVERED', label: 'Delivered', emoji: '✅' },
];

const SELLER_ACTIONS = [
  { status: 'ACCEPTED', label: 'Accept Order' },
  { status: 'SHIPPED', label: 'Mark as Shipped' },
  { status: 'DELIVERED', label: 'Mark as Delivered' },
];

function formatOrderDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function statusDisplay(status) {
  const s = (status || 'PENDING').toUpperCase();
  const opt = STATUS_DISPLAY.find((o) => o.value === s) || STATUS_DISPLAY[0];
  return `${opt.emoji} ${opt.label}`;
}

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

  const formatDate = (date) => formatOrderDate(date);
  const getOrderId = (order) => order._id || order.id || '';
  const getOrderNumber = (order) => order._id || order.id || order.orderNumber || '';

  const updateSaleStatus = async (orderId, newStatus) => {
    if (!user?.token) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Failed to update status');
        return;
      }
      setSales((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
      toast.success('Status updated');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update status');
    }
  };

  if (!isAuthenticated || !user) return null;

  const renderItems = (items) =>
    items.map((item, idx) => (
      <div key={idx} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-b-0">
        {item.artwork?.image && (
          <img
            src={item.artwork.image}
            alt={item.artwork.title}
            className="w-24 h-24 object-cover rounded-lg shrink-0"
          />
        )}
        <div className="min-w-0">
          <p className="font-medium text-gray-900">{item.artwork?.title || 'Artwork'}</p>
          <p className="text-sm text-gray-500">Artist: {item.artist?.name || 'Unknown'}</p>
          <p className="text-sm text-gray-600">Price: {item.price} SAR</p>
        </div>
      </div>
    ));

  const renderOrderCard = (order) => (
    <div key={getOrderId(order)} className="border border-gray-200 rounded-lg p-5">
      <p className="font-semibold text-gray-900">Order #{getOrderNumber(order)}</p>
      <p className="text-sm text-gray-500 mt-1">Date: {formatOrderDate(order.createdAt)}</p>
      <p className="text-sm text-gray-600 mt-1">Status: {statusDisplay(order.status)}</p>
      <p className="text-sm text-gray-500 mt-3">Payment Method: {order.paymentMethod}</p>
      <div className="mt-4 space-y-2">{renderItems(order.items)}</div>
      <p className="text-lg font-bold mt-4 text-gray-900">Total: {order.totalAmount} SAR</p>
    </div>
  );

  const renderSalesCard = (order) => {
    const buyer = order.user;
    const buyerId = buyer?._id || buyer?.id;
    const rawName = buyer?.username || buyer?.name || 'Buyer';
    const displayName = String(rawName).replace(/^@/, '');
    const current = (order.status || 'PENDING').toUpperCase();
    return (
      <div key={getOrderId(order)} className="border border-gray-200 rounded-lg p-5">
        <p className="font-semibold text-gray-900">Order #{getOrderNumber(order)}</p>
        <p className="text-sm text-gray-500 mt-1">Date: {formatOrderDate(order.createdAt)}</p>
        <p className="text-sm text-gray-600 mt-1">Status: {statusDisplay(order.status)}</p>
        {buyerId && (
          <p className="text-sm text-gray-600 mt-1">
            Buyer:{' '}
            <Link to={`/profile/${buyerId}`} className="text-black font-medium hover:underline">
              @{displayName}
            </Link>
          </p>
        )}
        <p className="text-sm text-gray-500 mt-3">Payment Method: {order.paymentMethod}</p>
        <div className="mt-4 space-y-2">{renderItems(order.items)}</div>
        <p className="text-lg font-bold mt-4 text-gray-900">Total: {order.totalAmount} SAR</p>
        <div className="mt-5 pt-4 border-t border-gray-200">
          {(() => {
            const statusOrder = ['PENDING', 'PAID', 'ACCEPTED', 'SHIPPED', 'DELIVERED'];
            const currentIdx = statusOrder.indexOf(current);
            const nextActionIndex = currentIdx <= 1 ? 0 : currentIdx === 2 ? 1 : currentIdx === 3 ? 2 : -1;
            const nextAction = nextActionIndex >= 0 ? SELLER_ACTIONS[nextActionIndex] : null;
            if (!nextAction) return <p className="text-sm text-gray-500">Order completed.</p>;
            return (
              <>
                <p className="text-sm font-medium text-gray-700 mb-3">Update status</p>
                <button
                  type="button"
                  onClick={() => updateSaleStatus(order._id || order.id, nextAction.status)}
                  className="w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-medium bg-black text-white border border-black hover:bg-gray-800 transition-colors"
                >
                  {nextAction.label}
                </button>
              </>
            );
          })()}
        </div>
      </div>
    );
  };

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
                <div className="space-y-4">{sales.map(renderSalesCard)}</div>
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
