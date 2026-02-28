import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiBaseUrl } from '../config.js';
import { toast } from 'sonner';
import { Wallet, Banknote } from 'lucide-react';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [profileAddress, setProfileAddress] = useState(null);
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [shipping, setShipping] = useState({
    address: '',
    address2: '',
    district: '',
    streetName: '',
    additionalDetails: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    phone: '',
    recipientName: '',
  });
  const [giftMessage, setGiftMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PAYPAL');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [placing, setPlacing] = useState(false);

  const total = cartItems.reduce((sum, item) => sum + (item.price ? Number(item.price) : 0), 0);
  const firstItem = cartItems[0];

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/signin');
      return;
    }
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/users/profile/${user.id}`, {
          credentials: 'include',
          headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          const u = data.user;
          if (u?.address || u?.city || u?.country || u?.district || u?.streetName) {
            const addr = {
              address: '',
              address2: '',
              district: u.district || '',
              streetName: u.streetName || '',
              additionalDetails: u.additionalDetails || '',
              city: u.city || '',
              state: u.state || '',
              country: u.country || '',
              zipCode: u.zipCode || '',
              phone: u.phoneNumber || '',
              recipientName: '',
            };
            setProfileAddress(addr);
            setShipping(addr);
          } else {
            setUseSavedAddress(false);
            setShipping((prev) => ({
              ...prev,
              recipientName: prev.recipientName || user?.name || '',
              phone: prev.phone || u?.phoneNumber || '',
              country: prev.country || 'Saudi Arabia',
            }));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [isAuthenticated, user, cartItems.length, navigate]);

  /* Refetch profile when page becomes visible again (e.g. return from Edit in profile). */
  useEffect(() => {
    if (!isAuthenticated || !user?.id || cartItems.length === 0) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetch(`${getApiBaseUrl()}/users/profile/${user.id}`, {
          credentials: 'include',
          headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
        })
          .then((res) => res.ok ? res.json() : null)
          .then((data) => {
            const u = data?.user;
            if (u && (u.city || u.country || u.district || u.streetName)) {
              const addr = {
                address: '',
                address2: '',
                district: u.district || '',
                streetName: u.streetName || '',
                additionalDetails: u.additionalDetails || '',
                city: u.city || '',
                state: u.state || '',
                country: u.country || '',
                zipCode: u.zipCode || '',
                phone: u.phoneNumber || '',
                recipientName: '',
              };
              setProfileAddress(addr);
              if (useSavedAddress) setShipping(addr);
            }
          })
          .catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [isAuthenticated, user, cartItems.length, useSavedAddress]);

  useEffect(() => {
    if (useSavedAddress && profileAddress) {
      setShipping(profileAddress);
    }
  }, [useSavedAddress, profileAddress]);

  const handlePlaceOrderCOD = async () => {
    if (!user?.token) {
      toast.error('Please sign in to place an order.');
      return;
    }
    setPlacing(true);
    try {
      const recipientName = useSavedAddress ? (user?.name || '') : (shipping.recipientName || '');
      const res = await fetch(`${getApiBaseUrl()}/payment/cod`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          shipping: {
            recipientName,
            phone: shipping.phone || '',
            streetName: shipping.streetName || '',
            additionalDetails: shipping.additionalDetails || '',
            district: shipping.district || '',
            city: shipping.city || '',
            state: shipping.state || '',
            zipCode: shipping.zipCode || '',
            country: shipping.country || '',
          },
          giftMessage: giftMessage || undefined,
        }),
      });
      if (res.ok) {
        clearCart();
        toast.success('Order placed successfully (Cash on Delivery)');
        navigate('/orders');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to place order');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  useEffect(() => {
    if (paymentMethod !== 'PAYPAL' || cartItems.length === 0 || !user?.token) return;
    if (total <= 0) return;
    const container = document.getElementById('checkout-paypal-container-sidebar');
    if (container) container.innerHTML = '';

    function renderPayPal() {
      if (!window.paypal) return;
      window.paypal
        .Buttons({
          createOrder: async () => {
            const res = await fetch(`${getApiBaseUrl()}/payment/paypal/create`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${user.token}` },
              credentials: 'include',
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              const msg = data.error || 'Could not create payment. Try again.';
              toast.error(msg);
              throw new Error(msg);
            }
            if (!data.id) {
              toast.error('Invalid response from payment server.');
              throw new Error('No order ID');
            }
            return data.id;
          },
          onApprove: async (data) => {
            const recipientName = useSavedAddress ? (user?.name || '') : (shipping.recipientName || '');
            await fetch(`${getApiBaseUrl()}/payment/paypal/capture`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${user.token}`,
              },
              credentials: 'include',
              body: JSON.stringify({
                orderID: data.orderID,
                shipping: {
                  recipientName,
                  phone: shipping.phone || '',
                  streetName: shipping.streetName || '',
                  additionalDetails: shipping.additionalDetails || '',
                  district: shipping.district || '',
                  city: shipping.city || '',
                  state: shipping.state || '',
                  zipCode: shipping.zipCode || '',
                  country: shipping.country || '',
                },
                giftMessage: giftMessage || undefined,
              }),
            });
            clearCart();
            toast.success('Payment successful!');
            navigate('/orders');
          },
          onError: (err) => {
            console.error('PayPal error:', err);
            toast.error(err?.message || 'Payment failed. Please try again.');
          },
        })
        .render('#checkout-paypal-container-sidebar');
    }

    if (!window.paypal) {
      const script = document.createElement('script');
      script.src =
        'https://www.paypal.com/sdk/js?client-id=AcQkwsfa0-vpAqfcu8n-BSClA28pkb4tPWWL59qnwazkMlcSeCJQS_klST0U61wGefCq0x2g_5IgS4YS';
      script.onload = renderPayPal;
      document.body.appendChild(script);
    } else {
      renderPayPal();
    }
  }, [paymentMethod, cartItems.length, user?.token, clearCart, navigate, shipping, giftMessage, useSavedAddress, total]);

  if (!isAuthenticated || !user || cartItems.length === 0) return null;

  /**
   * Collect unique non-empty address parts (no combined "address" field to avoid duplication).
   * Dedupes so the same value is not shown twice.
   */
  const getUniqueAddressParts = (addr, keys) => {
    if (!addr) return [];
    const seen = new Set();
    return keys
      .map((key) => (addr[key] || '').trim())
      .filter((val) => val && !seen.has(val) && (seen.add(val), true));
  };

  /**
   * Format address into logical lines with deduplication.
   * Line 1: Recipient, phone (·), and building (name · phone · street + building/apt)
   * Line 2: Location (district, city, zip)
   * Line 3: Region (state, country)
   * Does not use the combined "address" field to avoid repetition.
   */
  const formatAddressLines = (addr, recipientName = '', phone = '') => {
    if (!addr) return { line1: '', line2: '', line3: '' };
    const line1Parts = getUniqueAddressParts(addr, ['streetName', 'additionalDetails']);
    const line2Parts = getUniqueAddressParts(addr, ['district', 'city', 'zipCode']);
    const line3Parts = getUniqueAddressParts(addr, ['state', 'country']);
    const contactPhone = (phone || (addr && addr.phone) || '').trim();
    const line1 = [recipientName, contactPhone, ...line1Parts].filter(Boolean).join(' · ');
    const line2 = line2Parts.join(', ');
    const line3 = line3Parts.join(', ');
    return { line1, line2, line3 };
  };

  /** Single line fallback (unique parts only, no address/address2). */
  const formatAddressSingleLine = (addr) => {
    const keys = ['streetName', 'additionalDetails', 'district', 'city', 'state', 'zipCode', 'country'];
    const parts = getUniqueAddressParts(addr, keys);
    return parts.join(', ') || '';
  };

  const savedAddressLines = profileAddress ? formatAddressLines(profileAddress, user?.name || '', profileAddress.phone) : null;
  const selectedRecipientName = useSavedAddress ? (user?.name || '') : (shipping.recipientName || '');
  const selectedAddressLines = formatAddressLines(shipping, selectedRecipientName, shipping.phone);
  const savedAddressSingleLine = profileAddress ? formatAddressSingleLine(profileAddress) : '';
  const hasSelectedAddress = selectedAddressLines.line1 || selectedAddressLines.line2 || selectedAddressLines.line3;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="max-w-6xl mx-auto py-24 px-4 flex-1 w-full">
        <h1 className="text-3xl font-bold mb-10 text-gray-900">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column (col-md-8): Shipping + Payment */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stage 1: Shipping Address */}
            <section className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Shipping Address</h2>
              {loadingProfile ? (
            <p className="text-sm text-gray-500">Loading saved address...</p>
          ) : (
            <>
              {savedAddressSingleLine && (
                <label className="flex items-start gap-3 mb-6 cursor-pointer">
                  <input
                    type="radio"
                    name="addressSource"
                    checked={useSavedAddress}
                    onChange={() => setUseSavedAddress(true)}
                    className="mt-1.5"
                  />
                  <div className="min-w-0">
                    <span className="font-medium text-gray-900">Use address from profile</span>
                    <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                      {savedAddressLines.line1 && <p className="break-words">{savedAddressLines.line1}</p>}
                      {savedAddressLines.line2 && <p className="break-words">{savedAddressLines.line2}</p>}
                      {savedAddressLines.line3 && <p className="break-words">{savedAddressLines.line3}</p>}
                    </div>
                    <Link to="/edit-profile" className="text-sm text-black underline mt-2 inline-block">
                      Edit in profile
                    </Link>
                  </div>
                </label>
              )}
              <label className="flex items-start gap-3 cursor-pointer mb-6">
                <input
                  type="radio"
                  name="addressSource"
                  checked={!useSavedAddress}
                  onChange={() => {
                    setUseSavedAddress(false);
                    if (savedAddressSingleLine) {
                      setShipping({
                        address: '',
                        address2: '',
                        district: '',
                        streetName: '',
                        additionalDetails: '',
                        city: '',
                        state: '',
                        country: '',
                        zipCode: '',
                        phone: '',
                        recipientName: '',
                      });
                    } else {
                      setShipping((prev) => ({
                        ...prev,
                        recipientName: prev.recipientName || user?.name || '',
                        phone: prev.phone || profileAddress?.phone || '',
                      }));
                    }
                  }}
                  className="mt-1.5"
                />
                <span className="font-medium text-gray-900">
                  {savedAddressSingleLine ? 'Ship to someone else or send as a gift.' : 'Enter your shipping address'}
                </span>
              </label>
              {!useSavedAddress && (
                <div className="space-y-5">
                  {/* Universal section heading: works for both self-shipping and gifts */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Delivery Information</h3>
                  </div>

                  {/* 1. Recipient Information */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Full Name</label>
                      <input
                        type="text"
                        placeholder={savedAddressSingleLine ? "Who is receiving the art?" : "Pre-filled with your name"}
                        value={shipping.recipientName}
                        onChange={(e) => setShipping((s) => ({ ...s, recipientName: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                      <input
                        type="tel"
                        placeholder={savedAddressSingleLine ? "Their contact for delivery coordination" : "e.g., +966..."}
                        value={shipping.phone}
                        onChange={(e) => setShipping((s) => ({ ...s, phone: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* 2. Specific Address Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Name</label>
                      <input
                        type="text"
                        placeholder="e.g., King Sattam St"
                        value={shipping.streetName}
                        onChange={(e) => setShipping((s) => ({ ...s, streetName: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                      <input
                        type="text"
                        placeholder="e.g., Al-Waha"
                        value={shipping.district}
                        onChange={(e) => setShipping((s) => ({ ...s, district: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Building / Apartment / Suite</label>
                      <input
                        type="text"
                        placeholder="Building 5, Apt 12"
                        value={shipping.additionalDetails}
                        onChange={(e) => setShipping((s) => ({ ...s, additionalDetails: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* 3. Regional Details (3 columns + Country) */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          placeholder="e.g., Jeddah"
                          value={shipping.city}
                          onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm placeholder:text-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State / Province</label>
                        <input
                          type="text"
                          placeholder="e.g., Makkah Province"
                          value={shipping.state}
                          onChange={(e) => setShipping((s) => ({ ...s, state: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm placeholder:text-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                        <input
                          type="text"
                          placeholder="e.g., 23431"
                          value={shipping.zipCode}
                          onChange={(e) => setShipping((s) => ({ ...s, zipCode: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        placeholder="Default: Saudi Arabia"
                        value={shipping.country}
                        onChange={(e) => setShipping((s) => ({ ...s, country: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Gift Message (Optional)</label>
                    <textarea
                      placeholder="Write a special note to the recipient... (e.g., Happy Birthday!)"
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm placeholder:text-gray-400 resize-none"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </section>

            {/* Stage 2: Payment Method — icon buttons */}
            <section className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment Method</h2>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('PAYPAL')}
                  className={`flex flex-col items-center justify-center min-w-[120px] py-5 px-6 rounded-xl border-2 transition-all ${
                    paymentMethod === 'PAYPAL'
                      ? 'border-black bg-gray-50 text-black'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Wallet className="w-8 h-8 mb-2" strokeWidth={1.5} />
                  <span className="font-medium text-sm">PayPal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`flex flex-col items-center justify-center min-w-[120px] py-5 px-6 rounded-xl border-2 transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-black bg-gray-50 text-black'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Banknote className="w-8 h-8 mb-2" strokeWidth={1.5} />
                  <span className="font-medium text-sm">COD</span>
                </button>
              </div>
              {paymentMethod === 'PAYPAL' && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-2">Complete payment in the Order Summary →</p>
                </div>
              )}
            </section>
          </div>

          {/* Right column (col-md-4): Order Summary sidebar */}
          <div className="lg:col-span-1">
            <section className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">Order Summary</h2>

              {firstItem && (
                <div className="flex gap-4 mb-6 pb-5 border-b border-gray-100">
                  <img
                    src={firstItem.image}
                    alt={firstItem.title}
                    className="w-20 h-20 object-cover rounded-lg shrink-0 bg-gray-100"
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{firstItem.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in cart
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3 text-sm">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-gray-700">
                    <span className="truncate pr-2">{item.title}</span>
                    <span className="font-medium shrink-0">{item.price} SAR</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 mt-5 pt-5 space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Shipping:</span>
                  <div className="mt-1 text-gray-500 text-xs break-words min-w-0">
                    {hasSelectedAddress ? (
                      <>
                        {selectedAddressLines.line1 && <p>{selectedAddressLines.line1}</p>}
                        {selectedAddressLines.line2 && <p>{selectedAddressLines.line2}</p>}
                        {selectedAddressLines.line3 && <p>{selectedAddressLines.line3}</p>}
                      </>
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                </div>
                <p>
                  <span className="font-medium text-gray-700">Payment:</span>{' '}
                  {paymentMethod === 'COD' ? 'Cash on Delivery' : 'PayPal'}
                </p>
              </div>

              <div className="border-t border-gray-200 mt-5 pt-5 flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">{total} SAR</span>
              </div>

              <div className="mt-6">
                {paymentMethod === 'COD' ? (
                  <button
                    type="button"
                    onClick={handlePlaceOrderCOD}
                    disabled={placing || total <= 0}
                    className="w-full bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-60 transition-colors"
                  >
                    {placing ? 'Placing order...' : 'Place Order'}
                  </button>
                ) : total <= 0 ? (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                    <p className="font-medium">Total is 0 SAR</p>
                    <p className="mt-1">PayPal and card payments require an order total greater than 0. Add items to your cart or use Cash on Delivery if your total is correct.</p>
                  </div>
                ) : (
                  <div id="checkout-paypal-container-sidebar" className="min-h-[45px]" />
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
