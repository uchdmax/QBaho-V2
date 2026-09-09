import React from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../i18n';
import useUserStore from '../stores/userStore';
import './ProfilePage.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const favorites = useUserStore((state) => state.favorites) || [];

  const firstName = user?.first_name || user?.firstName || 'Mehmon';
  const lastName = user?.last_name || user?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const username = user?.username ? `@${user.username}` : user?.phone || 'Telegram foydalanuvchi';
  const avatarLetter = firstName.charAt(0).toUpperCase();

  return (
    <div className="profile-page">
      {/* Header */}
      <header className="profile-header">
        <button
          type="button"
          className="profile-back-btn"
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
        <h1 className="profile-title">{t('profile.title')}</h1>
        <div className="profile-header-spacer" />
      </header>

      {/* Main Content */}
      <main className="profile-content">
        {/* User Card */}
        <section className="profile-user-card glass-card">
          <div className="profile-avatar-circle">
            <span className="profile-avatar-letter">{avatarLetter}</span>
          </div>

          <div className="profile-user-info">
            <h2 className="profile-user-name">{fullName}</h2>
            <p className="profile-user-handle">{username}</p>
          </div>

          <div className="profile-user-badge">
            <span className="profile-badge-dot" />
            <span>Faol</span>
          </div>
        </section>

        {/* Quick Links */}
        <section className="profile-quick-grid">
          <div
            className="profile-quick-card glass-card"
            onClick={() => navigate('/history')}
            role="button"
            tabIndex={0}
          >
            <span className="profile-quick-icon">📋</span>
            <div className="profile-quick-text">
              <span className="profile-quick-label">{t('history.title')}</span>
              <span className="profile-quick-sub">Barcha buyurtmalar</span>
            </div>
            <span className="profile-quick-arrow">→</span>
          </div>

          <div
            className="profile-quick-card glass-card"
            onClick={() => navigate('/favorites')}
            role="button"
            tabIndex={0}
          >
            <span className="profile-quick-icon">❤️</span>
            <div className="profile-quick-text">
              <span className="profile-quick-label">{t('favorites.title')}</span>
              <span className="profile-quick-sub">{favorites.length} ta taom</span>
            </div>
            <span className="profile-quick-arrow">→</span>
          </div>
        </section>

        {/* Settings List */}
        <section className="profile-section">
          <h3 className="profile-section-title">Sozlamalar</h3>
          <div className="profile-settings-list glass-card">
            {/* Language */}
            <div className="profile-list-item">
              <div className="profile-item-left">
                <span className="profile-item-icon">🌐</span>
                <span className="profile-item-label">{t('profile.language')}</span>
              </div>
              <div className="profile-item-right">
                <span className="profile-item-val">O'zbekcha 🇺🇿</span>
              </div>
            </div>

            <div className="profile-item-divider" />

            {/* App Version */}
            <div className="profile-list-item">
              <div className="profile-item-left">
                <span className="profile-item-icon">📱</span>
                <span className="profile-item-label">{t('profile.version')}</span>
              </div>
              <div className="profile-item-right">
                <span className="profile-item-val">1.0.0</span>
              </div>
            </div>

            <div className="profile-item-divider" />

            {/* Notifications info */}
            <div className="profile-list-item">
              <div className="profile-item-left">
                <span className="profile-item-icon">🔔</span>
                <span className="profile-item-label">Xabarnomalar</span>
              </div>
              <div className="profile-item-right">
                <span className="profile-item-badge">Yoqilgan</span>
              </div>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="profile-section">
          <h3 className="profile-section-title">Qo'llab-quvvatlash</h3>
          <div className="profile-settings-list glass-card">
            <div
              className="profile-list-item clickable"
              onClick={() => window.open('https://t.me/qapp_support', '_blank')}
            >
              <div className="profile-item-left">
                <span className="profile-item-icon">💬</span>
                <span className="profile-item-label">Telegram yordam</span>
              </div>
              <div className="profile-item-right">
                <span className="profile-item-val">@qapp_support</span>
                <span className="profile-item-chevron">›</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
