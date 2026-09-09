import React from 'react';
import { useNavigate } from 'react-router-dom';
import { products } from '../mocks';
import { t, formatPrice } from '../i18n';
import useUserStore from '../stores/userStore';
import useCartStore from '../stores/cartStore';
import './FavoritesPage.css';

const CATEGORY_EMOJIS = {
  1: '🍔', // Burgers
  2: '🌯', // Lavash
  3: '🍕', // Pizza
  4: '🥤', // Drinks
  5: '🍲', // Milliy
  6: '🍗', // Chicken
  7: '🍟', // Fries
};

export default function FavoritesPage() {
  const navigate = useNavigate();
  const favorites = useUserStore((state) => state.favorites) || [];
  const toggleFavorite = useUserStore((state) => state.toggleFavorite);
  const addItem = useCartStore((state) => state.addItem);

  // Filter products by favorites
  const favoriteProducts = products.filter((product) =>
    favorites.includes(product.id)
  );

  const handleToggleHeart = (productId, e) => {
    e.stopPropagation();
    toggleFavorite(productId);
  };

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    addItem(product, 1, []);
  };

  return (
    <div className="favorites-page">
      {/* Header */}
      <header className="favorites-header">
        <button
          type="button"
          className="favorites-back-btn"
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
        <h1 className="favorites-title">{t('favorites.title')}</h1>
        <div className="favorites-header-spacer" />
      </header>

      {/* Main Content */}
      <main className="favorites-content">
        {favoriteProducts.length > 0 ? (
          <div className="favorites-grid">
            {favoriteProducts.map((product) => {
              const emoji = CATEGORY_EMOJIS[product.categoryId] || '🍽️';

              return (
                <div
                  key={product.id}
                  className="favorite-card glass-card"
                  onClick={() => navigate(`/vendors/${product.vendorId}`)}
                  role="button"
                  tabIndex={0}
                >
                  {/* Card Visual / Emoji Container */}
                  <div className="favorite-card-visual">
                    <span className="favorite-food-emoji">{emoji}</span>
                    <button
                      type="button"
                      className="favorite-heart-btn active"
                      onClick={(e) => handleToggleHeart(product.id, e)}
                      aria-label="Sevimlilardan o'chirish"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  </div>

                  {/* Card Info */}
                  <div className="favorite-card-info">
                    <span className="favorite-vendor-name">
                      {product.vendorName || 'Oshxona'}
                    </span>
                    <h3 className="favorite-product-name">{product.name}</h3>

                    <div className="favorite-card-bottom">
                      <span className="favorite-product-price">
                        {formatPrice(product.price)}
                      </span>
                      <button
                        type="button"
                        className="favorite-add-btn"
                        onClick={(e) => handleAddToCart(product, e)}
                        aria-label={t('menu.add')}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="favorites-empty-state glass-card">
            <span className="favorites-empty-icon">❤️</span>
            <h3 className="favorites-empty-title">{t('favorites.empty')}</h3>
            <button
              type="button"
              className="favorites-empty-btn"
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
