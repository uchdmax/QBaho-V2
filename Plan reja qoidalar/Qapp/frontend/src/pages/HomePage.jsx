import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Sparkles,
  UtensilsCrossed,
  ShoppingBag,
  Flame,
  Pizza,
  Coffee,
  Soup,
  Sandwich,
  Drumstick,
  Percent,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { t } from '../i18n';
import useUserStore from '../stores/userStore';
import './HomePage.css';

const QUICK_CATEGORIES = [
  { id: 'all', name: 'Barchasi', icon: Flame },
  { id: 'fastfood', name: 'Fast Food', icon: Sandwich },
  { id: 'lavash', name: 'Lavash', icon: UtensilsCrossed },
  { id: 'pizza', name: 'Pitsa', icon: Pizza },
  { id: 'milliy', name: 'Milliy taomlar', icon: Soup },
  { id: 'drinks', name: 'Ichimliklar', icon: Coffee },
  { id: 'chicken', name: 'Tovuq', icon: Drumstick },
];

const containerVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1],
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export default function HomePage() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);

  const firstName = user?.first_name || user?.firstName || 'Mehmon';

  const handleSearchClick = () => {
    navigate('/vendors');
  };

  const handleCategoryClick = (categoryId) => {
    if (categoryId === 'all') {
      navigate('/vendors');
    } else {
      navigate(`/vendors?category=${categoryId}`);
    }
  };

  return (
    <motion.div
      className="home-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 1. Header & Greeting */}
      <motion.header className="home-header" variants={itemVariants}>
        <div className="home-greeting">
          <div className="home-greeting-badge">
            <Sparkles size={12} className="home-badge-icon" />
            <span>{t('home.welcome') || 'Xush kelibsiz!'}</span>
          </div>
          <h1 className="home-greeting-title">
            Salom, <span className="home-user-name">{firstName}</span>!
          </h1>
          <p className="home-greeting-subtitle">
            Bugun nima buyurtma qilamiz?
          </p>
        </div>
      </motion.header>

      {/* 2. Search Bar - Glass Pill */}
      <motion.div
        className="home-search-container"
        variants={itemVariants}
        onClick={handleSearchClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        role="button"
        tabIndex={0}
      >
        <div className="home-search-pill">
          <div className="home-search-icon-wrapper">
            <Search size={18} className="home-search-icon" />
          </div>
          <input
            type="text"
            className="home-search-input"
            placeholder={t('home.search_placeholder') || 'Taom yoki restoran qidirish...'}
            readOnly
          />
          <div className="home-search-action-badge">
            <Zap size={13} />
            <span>Tezkor</span>
          </div>
        </div>
      </motion.div>

      {/* 3. Service Cards (QYetkazish & QSavdo) */}
      <motion.section className="home-cards-grid" variants={itemVariants}>
        {/* QYetkazish Card */}
        <motion.div
          className="service-card qyetkazish-card"
          onClick={() => navigate('/vendors')}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.95 }}
          role="button"
          tabIndex={0}
        >
          <div
            className="service-card-bg"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80')`,
            }}
          />
          <div className="service-card-overlay qyetkazish-overlay" />
          
          <div className="service-card-top">
            <div className="service-icon-box qyetkazish-icon-box">
              <UtensilsCrossed size={20} />
            </div>
            <span className="service-badge qyetkazish-badge">Tez yetkazish</span>
          </div>

          <div className="service-card-info">
            <h2 className="service-card-title">QYetkazish</h2>
            <p className="service-card-desc">Taom va fast-food</p>
            <div className="service-card-action">
              <span>Ko'rish</span>
              <ArrowRight size={14} className="service-action-arrow" />
            </div>
          </div>
        </motion.div>

        {/* QSavdo Card */}
        <motion.div
          className="service-card qsavdo-card"
          onClick={() => navigate('/qsavdo')}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.95 }}
          role="button"
          tabIndex={0}
        >
          <div
            className="service-card-bg"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80')`,
            }}
          />
          <div className="service-card-overlay qsavdo-overlay" />

          <div className="service-card-top">
            <div className="service-icon-box qsavdo-icon-box">
              <ShoppingBag size={20} />
            </div>
            <span className="service-badge qsavdo-badge">Tez orada</span>
          </div>

          <div className="service-card-info">
            <h2 className="service-card-title">QSavdo</h2>
            <p className="service-card-desc">Do'kon mahsulotlari</p>
            <div className="service-card-action">
              <span>Batafsil</span>
              <ArrowRight size={14} className="service-action-arrow" />
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* 4. Promo Banner */}
      <motion.section className="home-promo-section" variants={itemVariants}>
        <motion.div
          className="home-promo-card"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="home-promo-glow" />
          <div className="home-promo-icon-box">
            <Percent size={22} className="home-promo-percent-icon" />
          </div>
          <div className="home-promo-content">
            <div className="home-promo-tag">
              <Sparkles size={11} />
              <span>Aksiya</span>
            </div>
            <h3 className="home-promo-title">Ilk buyurtmaga 20% chegirma!</h3>
            <p className="home-promo-code-text">
              Promokod: <span className="home-promo-code-pill">YANGI20</span>
            </p>
          </div>
        </motion.div>
      </motion.section>

      {/* 5. Quick Category Pills Row */}
      <motion.section className="home-categories-section" variants={itemVariants}>
        <div className="home-categories-header">
          <h3 className="home-categories-title">Ommabop bo'limlar</h3>
          <button
            type="button"
            className="home-categories-all-btn"
            onClick={() => navigate('/vendors')}
          >
            <span>Barchasi</span>
            <ArrowRight size={14} />
          </button>
        </div>
        <div className="home-categories-scroll">
          {QUICK_CATEGORIES.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <motion.button
                key={cat.id}
                className="home-category-chip"
                onClick={() => handleCategoryClick(cat.id)}
                whileTap={{ scale: 0.92 }}
                whileHover={{ y: -2 }}
              >
                <span className="home-category-chip-icon-box">
                  <IconComponent size={16} />
                </span>
                <span className="home-category-chip-label">{cat.name}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.section>
    </motion.div>
  );
}
