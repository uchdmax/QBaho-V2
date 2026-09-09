import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Star,
  Clock,
  Bike,
  ShoppingBag,
  ChevronRight,
  Sparkles,
  MapPin,
  Flame,
  Sandwich,
  UtensilsCrossed,
  Pizza,
  Soup,
  Drumstick,
} from 'lucide-react';
import { vendors } from '../mocks';
import { t, formatPrice } from '../i18n';
import './VendorListPage.css';

const VENDOR_FALLBACK_IMAGES = {
  1: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700&auto=format&fit=crop&q=80', // King Burger
  2: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=700&auto=format&fit=crop&q=80', // Lavash Ustasi
  3: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=700&auto=format&fit=crop&q=80', // Pizza House
  4: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=700&auto=format&fit=crop&q=80', // Milliy Taomlar
  5: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=700&auto=format&fit=crop&q=80', // Chicken House
};

const DEFAULT_VENDOR_IMAGE = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700&auto=format&fit=crop&q=80';

const FILTER_TAGS = [
  { id: 'all', name: 'Barchasi', icon: Flame },
  { id: 'fastfood', name: 'Fast Food', icon: Sandwich },
  { id: 'lavash', name: 'Lavash', icon: UtensilsCrossed },
  { id: 'pizza', name: 'Pitsa', icon: Pizza },
  { id: 'milliy', name: 'Milliy', icon: Soup },
  { id: 'chicken', name: 'Tovuq', icon: Drumstick },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.38,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

export default function VendorListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCardClick = (id) => {
    navigate(`/vendors/${id}`);
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', categoryId);
    }
    setSearchParams(searchParams);
  };

  const formatAmount = (amount) => {
    if (typeof formatPrice === 'function') {
      return formatPrice(amount);
    }
    return `${Number(amount).toLocaleString('uz-UZ')} so'm`;
  };

  const getTitle = () => {
    if (typeof t === 'function') {
      return t('vendors.title') || 'Oshxonalar va Restoranlar';
    }
    return 'Oshxonalar va Restoranlar';
  };

  const filteredVendors = useMemo(() => {
    if (!vendors) return [];
    return vendors.filter((vendor) => {
      const matchesSearch =
        !searchQuery ||
        vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.address?.toLowerCase().includes(searchQuery.toLowerCase());

      if (selectedCategory === 'all') return matchesSearch;

      const vendorType = (vendor.type || '').toLowerCase();
      const vendorName = (vendor.name || '').toLowerCase();

      if (selectedCategory === 'pizza') {
        return matchesSearch && (vendorName.includes('pizza') || vendorName.includes('pitsa'));
      }
      if (selectedCategory === 'lavash') {
        return matchesSearch && vendorName.includes('lavash');
      }
      if (selectedCategory === 'milliy') {
        return matchesSearch && (vendorName.includes('milliy') || vendorType.includes('national'));
      }
      if (selectedCategory === 'chicken') {
        return matchesSearch && (vendorName.includes('chicken') || vendorName.includes('tovuq'));
      }
      if (selectedCategory === 'fastfood') {
        return matchesSearch && (vendorType === 'fastfood' || vendorName.includes('burger'));
      }

      return matchesSearch;
    });
  }, [vendors, selectedCategory, searchQuery]);

  return (
    <motion.div
      className="vendor-list-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 1. Sticky Glass Header */}
      <header className="vendor-list-header">
        <motion.button
          type="button"
          className="vendor-back-btn"
          onClick={() => navigate(-1)}
          aria-label="Orqaga"
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
        >
          <ArrowLeft size={20} />
        </motion.button>

        <div className="vendor-header-center">
          <h1 className="vendor-list-title">{getTitle()}</h1>
          <span className="vendor-header-count">{vendors?.length || 0} ta maskan</span>
        </div>

        <div className="vendor-header-spacer" />
      </header>

      {/* 2. Search & Filter Bar */}
      <div className="vendor-search-bar-wrap">
        <div className="vendor-search-pill">
          <Search size={16} className="vendor-search-icon" />
          <input
            type="text"
            className="vendor-search-input"
            placeholder="Restoran yoki oshxona nomi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 3. Category Filter Chips (Horizontal Scroll) */}
      <div className="vendor-filter-scroll">
        {FILTER_TAGS.map((tag) => {
          const TagIcon = tag.icon;
          const isSelected = selectedCategory === tag.id;
          return (
            <motion.button
              key={tag.id}
              type="button"
              className={`vendor-filter-chip ${isSelected ? 'active' : ''}`}
              onClick={() => handleCategorySelect(tag.id)}
              whileTap={{ scale: 0.92 }}
            >
              <TagIcon size={14} className="vendor-filter-icon" />
              <span>{tag.name}</span>
            </motion.button>
          );
        })}
      </div>

      {/* 4. Vendors Stagger List */}
      <main className="vendor-list-content">
        <motion.div
          className="vendor-cards-list"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {filteredVendors && filteredVendors.length > 0 ? (
              filteredVendors.map((vendor) => {
                const avgRating = vendor.avgRating ?? vendor.rating ?? '5.0';
                const totalReviews = vendor.totalReviews ?? vendor.reviewsCount ?? 0;
                const deliveryFee = vendor.deliveryFee ?? 0;
                const minOrderAmount = vendor.minOrderAmount ?? vendor.minOrder ?? 0;
                const coverImage =
                  vendor.imageUrl ||
                  VENDOR_FALLBACK_IMAGES[vendor.id] ||
                  DEFAULT_VENDOR_IMAGE;

                return (
                  <motion.article
                    key={vendor.id}
                    className="vendor-card"
                    variants={cardVariants}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCardClick(vendor.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardClick(vendor.id);
                      }
                    }}
                  >
                    {/* Top Cover Image with floating badges */}
                    <div className="vendor-cover-container">
                      <img
                        src={coverImage}
                        alt={vendor.name}
                        className="vendor-cover-image"
                        loading="lazy"
                      />
                      <div className="vendor-cover-gradient" />

                      {/* Floating Badges */}
                      <div className="vendor-floating-badges top-badges">
                        {/* Rating Badge */}
                        <div className="vendor-badge-glass vendor-badge-rating">
                          <Star size={13} className="vendor-star-icon" />
                          <span className="vendor-rating-val">{avgRating}</span>
                          <span className="vendor-reviews-count">({totalReviews})</span>
                        </div>

                        {/* Delivery Time Badge */}
                        <div className="vendor-badge-glass vendor-badge-time">
                          <Clock size={13} />
                          <span>20-30 daq</span>
                        </div>
                      </div>

                      {/* Bottom Image Badge (Free Delivery if applicable) */}
                      {deliveryFee === 0 && (
                        <div className="vendor-floating-badges bottom-badges">
                          <div className="vendor-badge-free">
                            <Sparkles size={12} />
                            <span>Bepul yetkazish</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Glass Panel (Vendor Info) */}
                    <div className="vendor-card-body">
                      <div className="vendor-card-header-row">
                        <div>
                          <h2 className="vendor-card-name">{vendor.name}</h2>
                          <div className="vendor-card-address-row">
                            <MapPin size={12} className="vendor-address-pin" />
                            <span>{vendor.address || 'Toshkent shahri'}</span>
                          </div>
                        </div>
                        <div className="vendor-card-arrow-circle">
                          <ChevronRight size={16} />
                        </div>
                      </div>

                      {/* Badges and Price Row */}
                      <div className="vendor-card-footer-row">
                        <div className="vendor-fee-pill">
                          <Bike size={13} className="vendor-footer-icon" />
                          <span>
                            {deliveryFee === 0
                              ? 'Bepul'
                              : formatAmount(deliveryFee)}
                          </span>
                        </div>

                        {minOrderAmount > 0 && (
                          <div className="vendor-min-pill">
                            <ShoppingBag size={13} className="vendor-footer-icon" />
                            <span>Min: {formatAmount(minOrderAmount)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.article>
                );
              })
            ) : (
              <motion.div
                className="vendor-empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <UtensilsCrossed size={42} className="vendor-empty-icon" />
                <h3 className="vendor-empty-title">Oshxonalar topilmadi</h3>
                <p className="vendor-empty-desc">
                  Qidiruv so'zini yoki tanlangan kategoriyani o'zgartirib ko'ring
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </motion.div>
  );
}
