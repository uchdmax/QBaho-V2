import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ShoppingBag, Heart, Clock, User } from 'lucide-react';
import { t } from '../i18n';
import './TabBar.css';

const TABS = [
  {
    id: 'home',
    path: '/',
    labelKey: 'tabs.home',
    defaultLabel: 'Asosiy',
    Icon: Home,
  },
  {
    id: 'vendors',
    path: '/vendors',
    labelKey: 'tabs.food',
    defaultLabel: 'Taomlar',
    Icon: ShoppingBag,
  },
  {
    id: 'favorites',
    path: '/favorites',
    labelKey: 'tabs.favorites',
    defaultLabel: 'Sevimlilar',
    Icon: Heart,
  },
  {
    id: 'history',
    path: '/history',
    labelKey: 'tabs.orders',
    defaultLabel: 'Buyurtmalar',
    Icon: Clock,
  },
  {
    id: 'profile',
    path: '/profile',
    labelKey: 'tabs.profile',
    defaultLabel: 'Profil',
    Icon: User,
  },
];

export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab ID based on path
  const getActiveTabId = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/vendor')) return 'vendors';
    if (path.startsWith('/favorites')) return 'favorites';
    if (path.startsWith('/history') || path.startsWith('/order')) return 'history';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/qsavdo')) return 'home';
    return 'home';
  };

  const activeTabId = getActiveTabId();

  const handleTabClick = (tab) => {
    // Haptic feedback for Telegram WebApp
    if (window?.Telegram?.WebApp?.HapticFeedback?.selectionChanged) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
    navigate(tab.path);
  };

  const getLabel = (tab) => {
    if (typeof t === 'function') {
      const translated = t(tab.labelKey);
      if (translated && translated !== tab.labelKey) {
        return translated;
      }
    }
    return tab.defaultLabel;
  };

  return (
    <nav className="tab-bar-wrapper" aria-label="Asosiy navigatsiya">
      <div className="tab-bar-container">
        {TABS.map((tab) => {
          const isActive = activeTabId === tab.id;
          const { Icon } = tab;

          return (
            <button
              key={tab.id}
              type="button"
              className={`tab-item-btn ${isActive ? 'is-active' : ''}`}
              onClick={() => handleTabClick(tab)}
              aria-label={getLabel(tab)}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="tab-active-indicator"
                  transition={{
                    type: 'spring',
                    stiffness: 450,
                    damping: 32,
                  }}
                />
              )}

              <div className="tab-icon-wrapper">
                <Icon size={20} strokeWidth={isActive ? 2.3 : 1.8} />
              </div>

              <span className="tab-label">{getLabel(tab)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
