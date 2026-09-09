import React from 'react';
import { useNavigate } from 'react-router-dom';
import { orders as mockOrders } from '../mocks';
import { t, formatPrice } from '../i18n';
import useCartStore from '../stores/cartStore';
import './OrderHistoryPage.css';

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);

  // Status badge config
  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'DELIVERED':
      case 'COMPLETED':
        return {
          label: t('order.status.completed') || 'Yetkazildi',
          className: 'order-status-delivered',
          icon: '✓',
        };
      case 'PICKED_UP':
        return {
          label: t('order.status.picked_up') || 'Olib ketildi',
          className: 'order-status-pickedup',
          icon: '📦',
        };
      case 'PREPARING':
        return {
          label: t('order.status.preparing') || 'Tayyorlanmoqda',
          className: 'order-status-preparing',
          icon: '🍳',
        };
      case 'DELIVERING':
      case 'ON_THE_WAY':
        return {
          label: t('order.status.delivering') || "Yo'lda",
          className: 'order-status-delivering',
          icon: '🛵',
        };
      case 'CANCELLED':
      case 'REJECTED':
        return {
          label: t('order.status.cancelled') || 'Bekor qilindi',
          className: 'order-status-cancelled',
          icon: '✕',
        };
      default:
        return {
          label: t(`order.status.${status?.toLowerCase()}`) || status,
          className: 'order-status-default',
          icon: '•',
        };
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('uz-UZ', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const handleReorder = (order, e) => {
    e.stopPropagation();
    if (!order.items || order.items.length === 0) return;

    // Add items from this order into cart
    order.items.forEach((item) => {
      addItem(
        {
          id: item.productId || item.id,
          vendorId: order.vendorId,
          vendorName: order.vendorName,
          name: item.name,
          price: item.price,
        },
        item.quantity || 1,
        item.modifiers || []
      );
    });

    navigate('/cart');
  };

  return (
    <div className="order-history-page">
      {/* Header */}
      <header className="order-history-header">
        <button
          type="button"
          className="order-back-btn"
          onClick={() => navigate(-1)}
          aria-label={t('common.back')}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="order-history-title">{t('history.title')}</h1>
        <div className="order-header-spacer" />
      </header>

      {/* Content */}
      <main className="order-history-content">
        {mockOrders && mockOrders.length > 0 ? (
          <div className="order-cards-list">
            {mockOrders.map((order) => {
              const statusInfo = getStatusBadge(order.status);
              const itemsSummary = (order.items || [])
                .map((item) => `${item.quantity}x ${item.name}`)
                .join(', ');

              return (
                <div
                  key={order.id}
                  className="order-card glass-card"
                  onClick={() => navigate(`/order/${order.id}`)}
                  role="button"
                  tabIndex={0}
                >
                  {/* Card Header: Vendor & Status */}
                  <div className="order-card-header">
                    <div className="order-vendor-info">
                      <h2 className="order-vendor-name">{order.vendorName}</h2>
                      <span className="order-date">{formatDate(order.createdAt)}</span>
                    </div>
                    <div className={`order-status-badge ${statusInfo.className}`}>
                      <span className="order-status-icon">{statusInfo.icon}</span>
                      <span className="order-status-text">{statusInfo.label}</span>
                    </div>
                  </div>

                  {/* Items Summary */}
                  <div className="order-items-summary">
                    <p className="order-items-text">{itemsSummary}</p>
                  </div>

                  {/* Rating if exists */}
                  {order.rating && (
                    <div className="order-rating-box">
                      <span className="order-rating-star">⭐</span>
                      <span className="order-rating-val">{order.rating} / 5</span>
                      <span className="order-rating-tag">{t('history.rated')}</span>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="order-card-divider" />

                  {/* Card Footer: Total Price & Reorder Button */}
                  <div className="order-card-footer">
                    <div className="order-price-box">
                      <span className="order-price-label">{t('cart.total')}</span>
                      <span className="order-total-price">
                        {formatPrice(order.totalAmount ?? order.itemsTotal ?? 0)}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="order-reorder-btn"
                      onClick={(e) => handleReorder(order, e)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                      </svg>
                      <span>{t('history.reorder')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="order-empty-state glass-card">
            <span className="order-empty-icon">📦</span>
            <h3 className="order-empty-title">{t('history.empty')}</h3>
            <button
              type="button"
              className="order-empty-btn"
              onClick={() => navigate('/vendors')}
            >
              {t('tabs.food')}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
