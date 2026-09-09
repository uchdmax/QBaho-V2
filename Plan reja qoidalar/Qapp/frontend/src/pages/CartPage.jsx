import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Trash2,
  Ticket,
  ShoppingBag,
  ArrowRight,
  Plus,
  Minus,
  Bike,
  Store,
  Check,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  X,
} from 'lucide-react';
import { promos, vendors } from '../mocks';
import { t, formatPrice } from '../i18n';
import useCartStore from '../stores/cartStore';
import './CartPage.css';

// Fallback images for cart items
const PRODUCT_THUMB_FALLBACKS = {
  101: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80',
  102: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=200&auto=format&fit=crop&q=80',
  103: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=200&auto=format&fit=crop&q=80',
  104: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&auto=format&fit=crop&q=80',
  105: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=200&auto=format&fit=crop&q=80',
  201: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=200&auto=format&fit=crop&q=80',
  202: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=200&auto=format&fit=crop&q=80',
  301: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=200&auto=format&fit=crop&q=80',
  302: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200&auto=format&fit=crop&q=80',
  401: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&auto=format&fit=crop&q=80',
  501: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&auto=format&fit=crop&q=80',
};

const DEFAULT_ITEM_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80';

export default function CartPage() {
  const navigate = useNavigate();

  // Cart store
  const items = useCartStore((state) => state.items) || [];
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  // Local states
  const [deliveryType, setDeliveryType] = useState('DELIVERY'); // 'DELIVERY' | 'PICKUP'
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [orderComment, setOrderComment] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Helper to format currency
  const formatMoney = (amount) => {
    if (typeof formatPrice === 'function') {
      try {
        const val = formatPrice(amount);
        if (val) return val;
      } catch (_) {}
    }
    return `${Number(amount || 0).toLocaleString('uz-UZ')} so'm`;
  };

  const triggerHaptic = (type = 'light') => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(type);
    }
  };

  // Identify Vendor from items
  const activeVendor = useMemo(() => {
    if (!items || items.length === 0) return null;
    const vId = items[0]?.vendorId || items[0]?.product?.vendorId || 1;
    return vendors.find((v) => v.id === vId) || vendors[0];
  }, [items]);

  // Subtotal Calculation
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => {
      const price = item.price || item.product?.price || 0;
      const modsTotal = (item.modifiers || []).reduce(
        (mAcc, m) => mAcc + (m.price || 0),
        0
      );
      const qty = item.quantity || 1;
      return acc + (price + modsTotal) * qty;
    }, 0);
  }, [items]);

  // Delivery Fee Calculation
  const deliveryFee = useMemo(() => {
    if (deliveryType === 'PICKUP') return 0;
    return activeVendor?.deliveryFee ?? 0;
  }, [deliveryType, activeVendor]);

  // Promo Discount Calculation
  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.discountType === 'PERCENTAGE') {
      return Math.round((subtotal * appliedPromo.discountValue) / 100);
    }
    if (appliedPromo.discountType === 'FIXED') {
      return Math.min(appliedPromo.discountValue, subtotal);
    }
    return 0;
  }, [appliedPromo, subtotal]);

  // Final Total
  const finalTotal = useMemo(() => {
    return Math.max(0, subtotal + deliveryFee - discountAmount);
  }, [subtotal, deliveryFee, discountAmount]);

  // Handle Promo Apply
  const handleApplyPromo = (codeToApply) => {
    const code = (codeToApply || promoInput).trim().toUpperCase();
    if (!code) return;

    triggerHaptic();
    setPromoError('');

    const matchedPromo = promos.find(
      (p) => p.code.toUpperCase() === code && p.isActive
    );

    if (!matchedPromo) {
      setPromoError("Noto'g'ri promokod kiritildi");
      return;
    }

    if (matchedPromo.minOrderAmount && subtotal < matchedPromo.minOrderAmount) {
      setPromoError(
        `Kamida ${formatMoney(matchedPromo.minOrderAmount)} bo'lishi kerak`
      );
      return;
    }

    setAppliedPromo(matchedPromo);
    setPromoInput('');
  };

  const handleRemovePromo = () => {
    triggerHaptic();
    setAppliedPromo(null);
    setPromoError('');
  };

  // Quantity updates
  const handleIncrease = (itemId) => {
    triggerHaptic();
    const item = items.find((i) => i.id === itemId || i.product?.id === itemId);
    if (!item) return;
    updateQuantity?.(itemId, (item.quantity || 1) + 1);
  };

  const handleDecrease = (itemId) => {
    triggerHaptic();
    const item = items.find((i) => i.id === itemId || i.product?.id === itemId);
    if (!item) return;
    const currentQty = item.quantity || 1;
    if (currentQty > 1) {
      updateQuantity?.(itemId, currentQty - 1);
    } else {
      removeItem?.(itemId);
    }
  };

  const handleRemoveItem = (itemId) => {
    triggerHaptic('medium');
    removeItem?.(itemId);
  };

  const handleCheckout = () => {
    triggerHaptic('heavy');
    // Navigate to order status or checkout flow
    navigate('/order/status/1042');
  };

  return (
    <motion.div
      className="cart-page"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25 }}
    >
      {/* Top Header */}
      <header className="cart-header glass">
        <button
          type="button"
          className="cart-header-back-btn"
          onClick={() => navigate(-1)}
          aria-label="Orqaga"
        >
          <ChevronLeft size={22} />
        </button>

        <div className="cart-header-title-wrap">
          <h1 className="cart-header-title">{t('cart.title') || 'Savat'}</h1>
          {items.length > 0 && (
            <span className="cart-header-badge">
              {items.reduce((acc, i) => acc + (i.quantity || 1), 0)} ta
            </span>
          )}
        </div>

        {items.length > 0 ? (
          <button
            type="button"
            className="cart-header-clear-btn"
            onClick={() => setShowClearConfirm(true)}
            aria-label="Savatni tozalash"
          >
            <Trash2 size={19} />
          </button>
        ) : (
          <div className="cart-header-spacer" />
        )}
      </header>

      {/* Main Content */}
      {items.length > 0 ? (
        <main className="cart-content">
          {/* Active Vendor Info Bar */}
          {activeVendor && (
            <div className="cart-vendor-banner glass-card">
              <div className="cart-vendor-logo-box">
                <span>🍔</span>
              </div>
              <div className="cart-vendor-info">
                <h3 className="cart-vendor-name">{activeVendor.name}</h3>
                <p className="cart-vendor-sub">
                  Yetkazib berish vaqti: ~25-35 daqiqa
                </p>
              </div>
            </div>
          )}

          {/* Delivery / Pickup Toggle Switcher */}
          <section className="cart-delivery-switcher glass-card">
            <button
              type="button"
              className={`delivery-tab-btn ${
                deliveryType === 'DELIVERY' ? 'active' : ''
              }`}
              onClick={() => {
                triggerHaptic();
                setDeliveryType('DELIVERY');
              }}
            >
              <Bike size={16} />
              <span>Yetkazib berish</span>
            </button>
            <button
              type="button"
              className={`delivery-tab-btn ${
                deliveryType === 'PICKUP' ? 'active' : ''
              }`}
              onClick={() => {
                triggerHaptic();
                setDeliveryType('PICKUP');
              }}
            >
              <Store size={16} />
              <span>Olib ketish</span>
            </button>
          </section>

          {/* Cart Items List */}
          <section className="cart-items-section">
            <h2 className="cart-section-title">Buyurtma tarkibi</h2>
            <div className="cart-items-list">
              <AnimatePresence initial={false}>
                {items.map((item) => {
                  const itemId = item.id || item.product?.id;
                  const itemPrice = item.price || item.product?.price || 0;
                  const modsTotal = (item.modifiers || []).reduce(
                    (acc, m) => acc + (m.price || 0),
                    0
                  );
                  const lineTotal = (itemPrice + modsTotal) * (item.quantity || 1);
                  const itemImg =
                    item.imageUrl ||
                    PRODUCT_THUMB_FALLBACKS[itemId] ||
                    DEFAULT_ITEM_IMAGE;

                  return (
                    <motion.div
                      key={itemId}
                      className="cart-item-card glass-card"
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Small Thumbnail Image */}
                      <div className="cart-item-thumb-wrapper">
                        <img
                          src={itemImg}
                          alt={item.name || item.product?.name}
                          className="cart-item-thumb"
                          loading="lazy"
                        />
                      </div>

                      {/* Item Details */}
                      <div className="cart-item-body">
                        <div className="cart-item-header">
                          <h3 className="cart-item-name">
                            {item.name || item.product?.name}
                          </h3>
                          <button
                            type="button"
                            className="cart-item-trash-btn"
                            onClick={() => handleRemoveItem(itemId)}
                            aria-label="O'chirish"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Modifiers List */}
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="cart-item-modifiers">
                            {item.modifiers.map((mod, idx) => (
                              <span key={idx} className="modifier-chip">
                                +{mod.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Price & Quantity Controls */}
                        <div className="cart-item-bottom">
                          <span className="cart-item-price">
                            {formatMoney(lineTotal)}
                          </span>

                          {/* Sleek iOS-style Stepper Pill */}
                          <div className="ios-stepper-pill">
                            <motion.button
                              type="button"
                              className="ios-stepper-btn minus"
                              onClick={() => handleDecrease(itemId)}
                              whileTap={{ scale: 0.85 }}
                              aria-label="Kamaytirish"
                            >
                              <Minus size={13} strokeWidth={2.5} />
                            </motion.button>
                            <span className="ios-stepper-value">
                              {item.quantity || 1}
                            </span>
                            <motion.button
                              type="button"
                              className="ios-stepper-btn plus"
                              onClick={() => handleIncrease(itemId)}
                              whileTap={{ scale: 0.85 }}
                              aria-label="Ko'paytirish"
                            >
                              <Plus size={13} strokeWidth={2.5} />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </section>

          {/* Promo Code Card */}
          <section className="cart-promo-section glass-card">
            <div className="cart-promo-header">
              <Ticket size={18} className="promo-header-icon" />
              <span className="cart-promo-title">Promokod</span>
            </div>

            {appliedPromo ? (
              <div className="cart-applied-promo-tag">
                <div className="applied-promo-info">
                  <span className="applied-promo-code">
                    {appliedPromo.code}
                  </span>
                  <span className="applied-promo-desc">
                    -{formatMoney(discountAmount)} chegirma
                  </span>
                </div>
                <button
                  type="button"
                  className="applied-promo-remove-btn"
                  onClick={handleRemovePromo}
                  aria-label="Promokodni bekor qilish"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div>
                <div className="cart-promo-input-group">
                  <input
                    type="text"
                    className="cart-promo-input"
                    placeholder="Promokodni kiriting"
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value);
                      setPromoError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyPromo();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="cart-promo-apply-btn"
                    onClick={() => handleApplyPromo()}
                    disabled={!promoInput.trim()}
                  >
                    Qo'llash
                  </button>
                </div>

                {promoError && (
                  <p className="cart-promo-error">
                    <AlertCircle size={13} /> {promoError}
                  </p>
                )}

                {/* Quick Promo Suggestions */}
                <div className="quick-promos-row">
                  {promos
                    .filter((p) => p.isActive)
                    .map((p) => (
                      <button
                        key={p.code}
                        type="button"
                        className="quick-promo-chip"
                        onClick={() => handleApplyPromo(p.code)}
                      >
                        <Sparkles size={11} className="quick-promo-sparkle" />
                        <span>{p.code}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </section>

          {/* Order Comments / Notes */}
          <section className="cart-comment-section glass-card">
            <label htmlFor="order-note" className="cart-comment-label">
              Buyurtma uchun izoh:
            </label>
            <input
              id="order-note"
              type="text"
              className="cart-comment-input"
              placeholder="Masalan: Domofon kodi 35, sous ko'proq bo'lsin"
              value={orderComment}
              onChange={(e) => setOrderComment(e.target.value)}
            />
          </section>

          {/* Order Summary Breakdown Card */}
          <section className="cart-summary-card glass-card">
            <h3 className="cart-summary-title">To'lov tafsilotlari</h3>

            <div className="cart-summary-row">
              <span className="summary-label">Mahsulotlar</span>
              <span className="summary-val">{formatMoney(subtotal)}</span>
            </div>

            <div className="cart-summary-row">
              <span className="summary-label">Yetkazib berish</span>
              <span className="summary-val">
                {deliveryFee === 0 ? (
                  <span className="free-badge">Bepul</span>
                ) : (
                  formatMoney(deliveryFee)
                )}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="cart-summary-row discount-row">
                <span className="summary-label">Chegirma</span>
                <span className="summary-val discount-val">
                  -{formatMoney(discountAmount)}
                </span>
              </div>
            )}

            <div className="summary-divider" />

            <div className="cart-summary-row total-row">
              <span className="summary-label-total">Jami to'lov</span>
              <span className="summary-val-total">
                {formatMoney(finalTotal)}
              </span>
            </div>

            <div className="cart-guarantee-badge">
              <ShieldCheck size={14} className="guarantee-icon" />
              <span>Xavfsiz buyurtma va tezkor yetkazib berish</span>
            </div>
          </section>
        </main>
      ) : (
        /* Empty Cart State */
        <main className="cart-empty-state">
          <div className="empty-cart-visual glass-card">
            <div className="empty-cart-icon-circle">
              <ShoppingBag size={48} className="empty-bag-icon" />
            </div>
            <h2 className="empty-cart-title">Savatingiz hozircha bo'sh</h2>
            <p className="empty-cart-subtitle">
              Sevimli taomlaringizni menyudan tanlang va buyurtma bering!
            </p>
            <motion.button
              type="button"
              className="empty-cart-cta-btn"
              onClick={() => {
                triggerHaptic();
                navigate('/vendors');
              }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Restoranlarga o'tish</span>
              <ArrowRight size={18} />
            </motion.button>
          </div>
        </main>
      )}

      {/* Floating Bottom Checkout Button Bar */}
      {items.length > 0 && (
        <footer className="cart-floating-checkout-bar glass">
          <motion.button
            type="button"
            className="cart-checkout-btn"
            onClick={handleCheckout}
            whileTap={{ scale: 0.98 }}
          >
            <div className="checkout-btn-left">
              <span className="checkout-btn-text">
                Buyurtmani rasmiylashtirish
              </span>
              <span className="checkout-btn-sub">
                {items.reduce((acc, i) => acc + (i.quantity || 1), 0)} ta taom
              </span>
            </div>
            <div className="checkout-btn-right">
              <span className="checkout-btn-price">
                {formatMoney(finalTotal)}
              </span>
              <ArrowRight size={18} className="checkout-btn-arrow" />
            </div>
          </motion.button>
        </footer>
      )}

      {/* Clear Cart Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="cart-modal-backdrop">
            <motion.div
              className="cart-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearConfirm(false)}
            />
            <motion.div
              className="cart-confirm-modal glass-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="confirm-modal-icon">
                <Trash2 size={28} />
              </div>
              <h3 className="confirm-modal-title">Savatni tozalash</h3>
              <p className="confirm-modal-desc">
                Barcha tanlangan taomlar savatdan o'chiriladi. Ishonchingiz komilmi?
              </p>
              <div className="confirm-modal-actions">
                <button
                  type="button"
                  className="confirm-btn cancel"
                  onClick={() => setShowClearConfirm(false)}
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  className="confirm-btn delete"
                  onClick={() => {
                    triggerHaptic('medium');
                    clearCart?.();
                    setShowClearConfirm(false);
                  }}
                >
                  Tozalash
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
