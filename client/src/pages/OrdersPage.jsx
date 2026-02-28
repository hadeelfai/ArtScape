import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Package, Palette, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../config.js';

const STATUS_DISPLAY = [
  { value: 'PENDING', label: 'Pending', emoji: '🟡' },
  { value: 'PAID', label: 'Pending', emoji: '🟡' },
  { value: 'ACCEPTED', label: 'Order Accepted', emoji: '✓' },
  { value: 'SHIPPED', label: 'Shipped', emoji: '🚚' },
  { value: 'DELIVERED', label: 'Delivered', emoji: '✅' },
  { value: 'PAYMENT_RECEIVED', label: 'Payment Received', emoji: '💰' },
];

const SELLER_ACTIONS = [
  { status: 'ACCEPTED', label: 'Accept Order' },
  { status: 'SHIPPED', label: 'Mark as Shipped' },
  { status: 'DELIVERED', label: 'Mark as Delivered' },
  { status: 'PAYMENT_RECEIVED', label: 'Mark Payment Received' },
];

function formatOrderDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatShippingAddress(shippingOrAddressDetails) {
  if (!shippingOrAddressDetails) return { line1: '', line2: '', line3: '' };
  const s = shippingOrAddressDetails;
  const parts = (key) => {
    const v = (s[key] || '').trim();
    return v ? [v] : [];
  };
  const line1Parts = [...parts('streetName'), ...parts('additionalDetails')].filter(Boolean);
  const line2Parts = [...parts('district'), ...parts('city'), ...parts('zipCode')].filter(Boolean);
  const line3Parts = [...parts('state'), ...parts('country')].filter(Boolean);
  return {
    line1: line1Parts.join(', ') || '',
    line2: line2Parts.join(', ') || '',
    line3: line3Parts.join(', ') || '',
  };
}

/** Get recipient, phone, and address lines from order (uses recipientName/phone/addressDetails first, then shipping). */
function getOrderShippingDisplay(order) {
  const recipientName = order.recipientName ?? order.shipping?.recipientName ?? '';
  const phone = order.phone ?? order.shipping?.phone ?? '';
  const addressSource = order.addressDetails || order.shipping;
  const addr = formatShippingAddress(addressSource);
  const hasAny = recipientName || phone || addr.line1 || addr.line2 || addr.line3;
  return { recipientName, phone, addr, hasAny };
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
  const [expandedOrderIds, setExpandedOrderIds] = useState(() => new Set());

  const toggleExpanded = (orderId) => {
    const id = String(orderId);
    setExpandedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
  const getOrderDisplayNumber = (order) => {
    const id = getOrderNumber(order);
    if (!id) return '—';
    const str = String(id);
    return str.length > 8 ? str.slice(-8).toUpperCase() : str.toUpperCase();
  };

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
    items?.map((item, idx) => (
      <div key={item._id || item.artwork?._id || idx} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-b-0">
        {item.artwork?.image ? (
          <img
            src={item.artwork.image}
            alt={item.artwork.title}
            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg shrink-0 bg-gray-100"
          />
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 truncate">{item.artwork?.title || 'Artwork'}</p>
          <p className="text-sm text-gray-500">Artist: {item.artist?.name || 'Unknown'}</p>
          <p className="text-sm font-medium text-gray-700">{item.price} SAR</p>
        </div>
      </div>
    ));

  const renderOrderCard = (order) => {
    const orderId = getOrderId(order);
    const isExpanded = expandedOrderIds.has(String(orderId));
    const { recipientName, phone, addr, hasAny: hasShipping } = getOrderShippingDisplay(order);
    const displayNum = getOrderDisplayNumber(order);
    return (
      <div key={orderId} className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1">
            <p className="font-semibold text-gray-900">Order #{displayNum}</p>
            <p className="text-sm text-gray-500">Date: {formatOrderDate(order.createdAt)}</p>
            <span className="inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {statusDisplay(order.status)}
            </span>
            <p className="text-sm text-gray-500 mt-2">Payment: {order.paymentMethod}</p>
          </div>
          <button
            type="button"
            onClick={() => toggleExpanded(orderId)}
            className="self-start sm:self-center flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-black transition-colors py-1"
          >
            {isExpanded ? 'Hide details' : 'View details'}
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        <div className="mt-5 pt-4 border-t border-gray-100">{renderItems(order.items)}</div>
        <p className="text-lg font-bold mt-4 pt-4 border-t border-gray-100 text-gray-900">Total: {order.totalAmount} SAR</p>

        {isExpanded && (
          <div className="mt-5 pt-5 border-t border-gray-200 space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">Shipping Information</h4>
            {hasShipping ? (
              <div className="text-sm text-gray-600 space-y-2">
                {recipientName && <p><span className="font-medium text-gray-700">Recipient:</span> {recipientName}</p>}
                {phone && <p><span className="font-medium text-gray-700">Contact:</span> {phone}</p>}
                {(addr.line1 || addr.line2 || addr.line3) && (
                  <div className="mt-3">
                    <span className="font-medium text-gray-700 block mb-1">Address</span>
                    <div className="text-gray-600 space-y-0.5">
                      {addr.line1 && <p>{addr.line1}</p>}
                      {addr.line2 && <p>{addr.line2}</p>}
                      {addr.line3 && <p>{addr.line3}</p>}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No shipping details saved for this order. It may have been placed before we started saving delivery information.</p>
            )}
            {order.giftMessage && (
              <div className="pt-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Gift Message</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">{order.giftMessage}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSalesCard = (order) => {
    const buyer = order.user;
    const buyerId = buyer?._id || buyer?.id;
    const rawName = buyer?.username || buyer?.name || 'Buyer';
    const displayName = String(rawName).replace(/^@/, '');
    const current = (order.status || 'PENDING').toUpperCase();
    const orderId = getOrderId(order);
    const isExpanded = expandedOrderIds.has(String(orderId));
    const { recipientName, phone, addr, hasAny: hasShipping } = getOrderShippingDisplay(order);
    const displayNum = getOrderDisplayNumber(order);

    const statusOrder = ['PENDING', 'PAID', 'ACCEPTED', 'SHIPPED', 'DELIVERED', 'PAYMENT_RECEIVED'];
    const currentIdx = statusOrder.indexOf(current);
    let nextAction = null;
    if (currentIdx <= 1) nextAction = SELLER_ACTIONS[0];
    else if (currentIdx === 2) nextAction = SELLER_ACTIONS[1];
    else if (currentIdx === 3) nextAction = SELLER_ACTIONS[2];
    else if (currentIdx === 4 && (order.paymentMethod || '').toUpperCase() === 'COD') nextAction = SELLER_ACTIONS[3];

    const copyPhone = () => {
      if (!phone) {
        toast.error('No phone number');
        return;
      }
      navigator.clipboard.writeText(phone).then(() => toast.success('Phone number copied'));
    };

    return (
      <div key={orderId} className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1">
            <p className="font-semibold text-gray-900">Order #{displayNum}</p>
            <p className="text-sm text-gray-500">Date: {formatOrderDate(order.createdAt)}</p>
            <span className="inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {statusDisplay(order.status)}
            </span>
            {buyerId && (
              <p className="text-sm text-gray-600 mt-2">
                Buyer:{' '}
                <Link to={`/profile/${buyerId}`} className="text-black font-medium hover:underline">
                  @{displayName}
                </Link>
              </p>
            )}
            <p className="text-sm text-gray-500">Payment: {order.paymentMethod}</p>
          </div>
          <button
            type="button"
            onClick={() => toggleExpanded(orderId)}
            className="self-start sm:self-center flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-black transition-colors py-1"
          >
            {isExpanded ? 'Hide shipping' : 'View Shipping Details'}
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100">{renderItems(order.items)}</div>
        <p className="text-lg font-bold mt-4 pt-4 border-t border-gray-100 text-gray-900">Total: {order.totalAmount} SAR</p>

        <div className="mt-5 pt-5 border-t border-gray-200 space-y-5">
          {isExpanded && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm border border-gray-100">
              <h4 className="font-semibold text-gray-900">Recipient & Contact</h4>
              {hasShipping ? (
                <>
                  {recipientName && <p><span className="font-medium text-gray-700">Recipient:</span> {recipientName}</p>}
                  {phone && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-700">Phone:</span>
                      <span className="text-gray-800">{phone}</span>
                      <button
                        type="button"
                        onClick={copyPhone}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-xs font-medium text-gray-700 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </button>
                    </div>
                  )}
                  <div className="pt-2">
                    <span className="font-semibold text-gray-900 block mb-1">Address</span>
                    <div className="text-gray-600 space-y-0.5">
                      {addr.line1 && <p>{addr.line1}</p>}
                      {addr.line2 && <p>{addr.line2}</p>}
                      {addr.line3 && <p>{addr.line3}</p>}
                    </div>
                  </div>
                  {order.giftMessage && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="font-medium text-gray-700">Gift Message</p>
                      <p className="text-gray-600 mt-1">{order.giftMessage}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500 text-sm">No shipping details for this order. It may have been placed before we started saving delivery information.</p>
              )}
            </div>
          )}

          {nextAction ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-sm font-medium text-gray-700">Update status</p>
              <button
                type="button"
                onClick={() => updateSaleStatus(order._id || order.id, nextAction.status)}
                className="w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 transition-colors"
              >
                {nextAction.label}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Order completed.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="max-w-4xl mx-auto py-24 px-4 sm:px-6 flex-1 w-full">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-900">My Orders</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => handleTabChange('orders')}
                className={`flex-1 py-4 px-4 sm:px-6 text-center font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'orders'
                    ? 'text-black border-b-2 border-black bg-gray-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/30'
                }`}
              >
                <Package className="w-5 h-5 shrink-0" />
                <span>My Orders</span>
              </button>
              <button
                onClick={() => handleTabChange('sales')}
                className={`flex-1 py-4 px-4 sm:px-6 text-center font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'sales'
                    ? 'text-black border-b-2 border-black bg-gray-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/30'
                }`}
              >
                <Palette className="w-5 h-5 shrink-0" />
                <span>My Sales</span>
              </button>
            </div>
          </div>

          {activeTab === 'orders' && (
            <div className="p-4 sm:p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <div className="w-10 h-10 border-2 border-gray-300 border-t-black rounded-full animate-spin mb-4" />
                  <p>Loading orders...</p>
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-4">{orders.map(renderOrderCard)}</div>
              ) : (
                <div className="text-center py-16">
                  <Package className="w-14 h-14 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600 font-medium">No orders yet</p>
                  <p className="text-sm text-gray-500 mt-1">Your orders will appear here.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="p-4 sm:p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <div className="w-10 h-10 border-2 border-gray-300 border-t-black rounded-full animate-spin mb-4" />
                  <p>Loading sales...</p>
                </div>
              ) : sales.length > 0 ? (
                <div className="space-y-4">{sales.map(renderSalesCard)}</div>
              ) : (
                <div className="text-center py-16">
                  <Palette className="w-14 h-14 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600 font-medium">No sales yet</p>
                  <p className="text-sm text-gray-500 mt-1">When buyers order your art, it will show here.</p>
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
