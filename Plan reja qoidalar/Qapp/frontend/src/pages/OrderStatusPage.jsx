import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { t, formatPrice } from '../i18n';
import './OrderStatusPage.css';

const STEPS = [
  { id: 'ACCEPTED', label: 'Qabul', icon: '✓' },
  { id: 'PREPARING', label: 'Tayyorlanmoqda', icon: '👨‍🍳' },
  { id: 'DELIVERING', label: "Yo'lda", icon: '🛵' },
  { id: 'COMPLETED', label: 'Yetkazildi', icon: '🎁' }
];

export default function OrderStatusPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock order data based on requirements
  const [order] = useState({
    id: id || '1042',
    status: 'PREPARING',
    vendor: 'King Burger',
    vendorLogo: '🍔',
    estimatedMinutes: 25,
    createdAt: '19:45',
    items: [
      { name: 'Klassik Burger', qty: 1, mods: ['Pishloq'], price: 23000 },
      { name: 'Coca-Cola 0.5', qty: 2, mods: [], price: 12200 }
    ],
    total: 35200,
    deliveryType: 'DELIVERY',
    payment: 'Naqd'
  });

  const totalSeconds = (order.estimatedMinutes || 25) * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);

  // Status mapping to step index
  const getStepIndex = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return 0;
      case 'PREPARING':
        return 1;
      case 'DELIVERING':
      case 'ON_THE_WAY':
        return 2;
      case 'COMPLETED':
      case 'DELIVERED':
        return 3;
      default:
        return 1;
    }
  };

  const activeStepIndex = getStepIndex(order.status);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutesRemaining = Math.floor(timeLeft / 60);
  const secondsRemaining = timeLeft % 60;
  const strokeDashoffset = 2 * Math.PI * 52 * (1 - timeLeft / totalSeconds);

  const handleHelpClick = () => {
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink('https://t.me/qapp_support_bot');
    } else {
      window.open('https://t.me/qapp_support_bot', '_blank');
    }
  };

  return (
    <div className="order-status-page">
      {/* Header */}
      <header className="order-status-header">
        <button 
          type="button" 
          className="order-back-btn" 
          onClick={() => navigate('/')}
          aria-label={t('common.back')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="order-header-info">
          <h1 className="order-header-title">{t('order.title', { id: order.id })}</h1>
          <span className="order-live-pill">
            <span className="order-live-dot" />
            Jonli kuzatuv
          </span>
        </div>
        <div className="order-header-spacer" />
      </header>

      {/* Main Content */}
      <main className="order-status-content">
        {/* Horizontal Progress Stepper */}
        <section className="order-stepper-card">
          <div className="order-stepper-track">
            {STEPS.map((step, idx) => {
              const isPast = idx < activeStepIndex;
              const isCurrent = idx === activeStepIndex;
              const isFuture = idx > activeStepIndex;

              return (
                <div key={step.id} className="stepper-step-item">
                  {idx > 0 && (
                    <div 
                      className={`stepper-line ${isPast || isCurrent ? 'stepper-line--active' : ''}`} 
                    />
                  )}
                  <div className="stepper-node-wrapper">
                    <div 
                      className={`stepper-node ${isPast ? 'stepper-node--past' : ''} ${isCurrent ? 'stepper-node--current' : ''} ${isFuture ? 'stepper-node--future' : ''}`}
                    >
                      {isPast ? (
                        <svg className="stepper-check-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <span className="stepper-node-icon">{step.icon}</span>
                      )}
                      {isCurrent && <div className="stepper-pulse-glow" />}
                    </div>
                    <span className={`stepper-label ${isCurrent ? 'stepper-label--current' : ''} ${isPast ? 'stepper-label--past' : ''}`}>
                      {step.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Status Text & Estimated Time Countdown */}
        <section className="order-eta-card">
          <div className="status-indicator-banner">
            <div className="chef-emoji-badge">👨‍🍳</div>
            <div className="status-text-block">
              <h2 className="status-primary-text">Taom tayyorlanmoqda</h2>
              <p className="status-secondary-text">
                {order.vendor} oshxonasida buyurtmangiz tayyorlanmoqda
              </p>
            </div>
          </div>

          <div className="countdown-display-wrapper">
            <div className="countdown-circle-box">
              <svg className="countdown-svg" viewBox="0 0 120 120">
                <circle
                  className="countdown-svg-bg"
                  cx="60"
                  cy="60"
                  r="52"
                />
                <circle
                  className="countdown-svg-progress"
                  cx="60"
                  cy="60"
                  r="52"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="countdown-text-center">
                <span className="countdown-numbers">
                  {minutesRemaining}:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
                </span>
                <span className="countdown-unit-label">daqiqa</span>
              </div>
            </div>

            <div className="countdown-details-box">
              <div className="eta-badge-tag">
                <span className="eta-badge-icon">⏱️</span>
                <span>Taxminiy vaqt</span>
              </div>
              <p className="eta-minutes-highlight">
                {t('order.estimated', { minutes: order.estimatedMinutes })}
              </p>
              <div className="delivery-badge-pill">
                <span className="delivery-dot" />
                <span>{order.deliveryType === 'DELIVERY' ? t('checkout.delivery') : t('checkout.pickup')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Order Details Card */}
        <section className="order-details-card">
          <div className="details-header-row">
            <div className="vendor-badge-group">
              <span className="vendor-logo-box">{order.vendorLogo}</span>
              <div>
                <h3 className="vendor-heading">{order.vendor}</h3>
                <span className="order-time-text">Buyurtma vaqti: {order.createdAt}</span>
              </div>
            </div>
            <span className="order-id-chip">#{order.id}</span>
          </div>

          <div className="details-divider" />

          <div className="items-section">
            <h4 className="items-section-title">Buyurtma tarkibi</h4>
            <div className="items-list">
              {order.items.map((item, idx) => (
                <div key={idx} className="order-item-tile">
                  <div className="item-main-info">
                    <span className="item-qty-tag">{item.qty}x</span>
                    <div className="item-texts">
                      <span className="item-title">{item.name}</span>
                      {item.mods && item.mods.length > 0 && (
                        <div className="item-modifiers">
                          {item.mods.map((mod, mIdx) => (
                            <span key={mIdx} className="item-mod-pill">+{mod}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="item-price-tag">{formatPrice(item.price)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="details-divider" />

          {/* Payment Method & Total */}
          <div className="details-summary">
            <div className="summary-line">
              <span className="summary-label">{t('order.payment')}</span>
              <div className="payment-type-badge">
                <span className="payment-emoji">💵</span>
                <span className="payment-text">{order.payment}</span>
              </div>
            </div>
            <div className="summary-line summary-line--total">
              <span className="total-title">{t('cart.total')}</span>
              <span className="total-price-value">{formatPrice(order.total)}</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Support Action */}
      <footer className="order-status-footer">
        <button 
          type="button" 
          className="order-help-btn"
          onClick={handleHelpClick}
        >
          <span className="help-icon-emoji">💬</span>
          <span className="help-button-text">{t('order.help')}</span>
        </button>
      </footer>
    </div>
  );
}
