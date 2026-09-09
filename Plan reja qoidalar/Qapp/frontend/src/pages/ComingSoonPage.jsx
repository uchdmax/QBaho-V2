import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../i18n';
import './ComingSoonPage.css';

export default function ComingSoonPage() {
  const navigate = useNavigate();
  const [notified, setNotified] = useState(false);

  const handleNotifyClick = () => {
    setNotified(true);
  };

  return (
    <div className="coming-soon-page">
      {/* Background ambient glow circles */}
      <div className="coming-soon-glow coming-soon-glow-top" />
      <div className="coming-soon-glow coming-soon-glow-bottom" />

      {/* Header with Back button */}
      <header className="coming-soon-header">
        <button
          type="button"
          className="coming-soon-back-btn"
          onClick={() => navigate('/')}
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
      </header>

      {/* Main Content Area */}
      <main className="coming-soon-main">
        {/* Shopping bag emoji with sparkle effect */}
        <div className="coming-soon-hero-box">
          <div className="coming-soon-emoji-wrapper">
            <span className="coming-soon-emoji">🛍️</span>
            <span className="coming-soon-sparkle sparkle-1">✨</span>
            <span className="coming-soon-sparkle sparkle-2">✨</span>
            <span className="coming-soon-sparkle sparkle-3">🌟</span>
          </div>
          <div className="coming-soon-pulse-ring" />
        </div>

        {/* Titles & Description */}
        <div className="coming-soon-content glass-card">
          <div className="coming-soon-badge-row">
            <span className="coming-soon-badge">Yangi xizmat</span>
          </div>

          <h1 className="coming-soon-title">{t('coming_soon.title')}</h1>
          <h2 className="coming-soon-subtitle">{t('coming_soon.subtitle')}</h2>

          <p className="coming-soon-description">
            {t('coming_soon.description')}
          </p>

          {/* Feature Highlights */}
          <div className="coming-soon-features">
            <div className="coming-soon-feature-pill">
              <span>🏪</span>
              <span>Mahalliy do'konlar</span>
            </div>
            <div className="coming-soon-feature-pill">
              <span>⚡</span>
              <span>Tezkor yetkazish</span>
            </div>
            <div className="coming-soon-feature-pill">
              <span>💳</span>
              <span>Qulay to'lov</span>
            </div>
          </div>

          {/* Notify button */}
          <button
            type="button"
            className={`coming-soon-notify-btn ${notified ? 'notified' : ''}`}
            onClick={handleNotifyClick}
          >
            {notified ? (
              <>
                <span className="btn-icon">✓</span>
                <span>Xabarnoma yoqildi!</span>
              </>
            ) : (
              <>
                <span className="btn-icon">🔔</span>
                <span>{t('coming_soon.notify')}</span>
              </>
            )}
          </button>
        </div>

        {/* Back to Home Button */}
        <button
          type="button"
          className="coming-soon-home-btn"
          onClick={() => navigate('/')}
        >
          {t('tabs.home')} sahifasiga qaytish
        </button>
      </main>
    </div>
  );
}
