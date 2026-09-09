import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Star,
  Clock,
  Bike,
  Plus,
  Minus,
  ShoppingBag,
  Heart,
  Search,
  Check,
  Sparkles,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { vendors, products, categories } from '../mocks';
import { t, formatPrice } from '../i18n';
import useCartStore from '../stores/cartStore';
import useUserStore from '../stores/userStore';
import './VendorPage.css';

// Fallback high-quality culinary images
const VENDOR_COVERS = {
  1: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=900&auto=format&fit=crop&q=85', // King Burger
  2: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=900&auto=format&fit=crop&q=85', // Lavash Ustasi
  3: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&auto=format&fit=crop&q=85', // Pizza House
  4: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=900&auto=format&fit=crop&q=85', // Milliy Taomlar
  5: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=900&auto=format&fit=crop&q=85', // Chicken House
};

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&auto=format&fit=crop&q=85';

const PRODUCT_IMAGES = {
  // Burgers
  101: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80',
  102: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&auto=format&fit=crop&q=80',
  103: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&auto=format&fit=crop&q=80',
  104: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&auto=format&fit=crop&q=80',
  105: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=400&auto=format&fit=crop&q=80',
  106: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400&auto=format&fit=crop&q=80',
  107: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400&auto=format&fit=crop&q=80',
  108: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&auto=format&fit=crop&q=80',
  109: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=400&auto=format&fit=crop&q=80',
  110: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&auto=format&fit=crop&q=80',
  // Lavash
  201: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=400&auto=format&fit=crop&q=80',
  202: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&auto=format&fit=crop&q=80',
  203: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&auto=format&fit=crop&q=80',
  204: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=400&auto=format&fit=crop&q=80',
  205: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&auto=format&fit=crop&q=80',
  206: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&auto=format&fit=crop&q=80',
  207: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400&auto=format&fit=crop&q=80',
  208: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&auto=format&fit=crop&q=80',
  209: 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=400&auto=format&fit=crop&q=80',
  // Pizza
  301: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&auto=format&fit=crop&q=80',
  302: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&auto=format&fit=crop&q=80',
  303: 'https://images.unsplash.com/photo-1573821663912-569905455b1c?w=400&auto=format&fit=crop&q=80',
  304: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=400&auto=format&fit=crop&q=80',
  305: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80',
  306: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&auto=format&fit=crop&q=80',
  307: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&auto=format&fit=crop&q=80',
  308: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=400&auto=format&fit=crop&q=80',
  // Milliy
  401: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=80',
  402: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=80',
  403: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&auto=format&fit=crop&q=80',
  404: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&auto=format&fit=crop&q=80',
  405: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=400&auto=format&fit=crop&q=80',
  406: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&auto=format&fit=crop&q=80',
  407: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&auto=format&fit=crop&q=80',
  408: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80',
  409: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80',
  // Chicken
  501: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&auto=format&fit=crop&q=80',
  502: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80',
  503: 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&auto=format&fit=crop&q=80',
  504: 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&auto=format&fit=crop&q=80',
  505: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&auto=format&fit=crop&q=80',
  506: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&auto=format&fit=crop&q=80',
  507: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&auto=format&fit=crop&q=80',
  508: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400&auto=format&fit=crop&q=80',
  509: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&auto=format&fit=crop&q=80',
};

const CATEGORY_ICONS = {
  1: '🍔',
  2: '🌯',
  3: '🍕',
  4: '🥤',
  5: '🍲',
  6: '🍗',
  7: '🍟',
};

export default function VendorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const vendorId = parseInt(id, 10) || 1;

  // Selected vendor
  const vendor = useMemo(() => {
    return (
      vendors.find((v) => v.id === vendorId) ||
      vendors[0] || {
        id: vendorId,
        name: 'King Burger',
        type: 'FASTFOOD',
        rating: 4.8,
        reviewsCount: 124,
        address: 'Navoi 15',
        phone: '90-123-45-67',
        hours: '09:00-23:00',
        deliveryFee: 0,
        minOrder: 0,
        isActive: true,
      }
    );
  }, [vendorId]);

  // Vendor products
  const vendorProducts = useMemo(() => {
    return products.filter((p) => p.vendorId === vendorId);
  }, [vendorId]);

  // Categories present in this vendor's menu
  const vendorCategories = useMemo(() => {
    const catIds = [...new Set(vendorProducts.map((p) => p.categoryId))];
    return categories.filter((c) => catIds.includes(c.id));
  }, [vendorProducts]);

  // State
  const [activeCategory, setActiveCategory] = useState(
    vendorCategories[0]?.id || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);
  const [selectedModifiers, setSelectedModifiers] = useState([]);

  // Store hooks
  const favorites = useUserStore((state) => state.favorites) || [];
  const toggleFavorite = useUserStore((state) => state.toggleFavorite);

  // Cart store
  const cartItems = useCartStore((state) => state.items) || [];
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const isFavorite = favorites.includes(vendorId);

  // Calculate cart stats for current vendor
  const cartItemCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  }, [cartItems]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const itemPrice = item.price || item.product?.price || 0;
      const modsPrice = (item.modifiers || []).reduce(
        (mSum, m) => mSum + (m.price || 0),
        0
      );
      return acc + (itemPrice + modsPrice) * (item.quantity || 1);
    }, 0);
  }, [cartItems]);

  // Header scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filtered products by search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return vendorProducts;
    const q = searchQuery.toLowerCase().trim();
    return vendorProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [vendorProducts, searchQuery]);

  // Group products by category
  const productsByCategory = useMemo(() => {
    const map = {};
    filteredProducts.forEach((prod) => {
      if (!map[prod.categoryId]) {
        map[prod.categoryId] = [];
      }
      map[prod.categoryId].push(prod);
    });
    return map;
  }, [filteredProducts]);

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

  // Check product quantity in cart
  const getProductCartQty = (productId) => {
    const found = cartItems.find(
      (item) => item.id === productId || item.product?.id === productId
    );
    return found ? found.quantity || 1 : 0;
  };

  // Add product handler
  const handleAddClick = (product, e) => {
    e?.stopPropagation();
    // If product has modifiers, open modifier modal
    if (product.modifiers && product.modifiers.length > 0) {
      setSelectedProductForModal(product);
      setSelectedModifiers([]);
      return;
    }

    // Direct add
    triggerHaptic();
    const existing = cartItems.find(
      (item) => item.id === product.id || item.product?.id === product.id
    );
    if (existing) {
      if (typeof updateQuantity === 'function') {
        updateQuantity(product.id, (existing.quantity || 1) + 1);
      }
    } else {
      if (typeof addItem === 'function') {
        addItem(
          {
            ...product,
            imageUrl: PRODUCT_IMAGES[product.id] || product.imageUrl,
            vendorName: vendor.name,
            vendorId: vendor.id,
          },
          1,
          []
        );
      }
    }
  };

  // Decrement product handler
  const handleMinusClick = (product, e) => {
    e?.stopPropagation();
    triggerHaptic();
    const existing = cartItems.find(
      (item) => item.id === product.id || item.product?.id === product.id
    );
    if (!existing) return;

    const currentQty = existing.quantity || 1;
    if (currentQty > 1) {
      if (typeof updateQuantity === 'function') {
        updateQuantity(product.id, currentQty - 1);
      }
    } else {
      if (typeof removeItem === 'function') {
        removeItem(product.id);
      }
    }
  };

  // Modal modifier confirm
  const handleConfirmModifierAdd = () => {
    if (!selectedProductForModal) return;
    triggerHaptic();

    if (typeof addItem === 'function') {
      addItem(
        {
          ...selectedProductForModal,
          imageUrl:
            PRODUCT_IMAGES[selectedProductForModal.id] ||
            selectedProductForModal.imageUrl,
          vendorName: vendor.name,
          vendorId: vendor.id,
        },
        1,
        selectedModifiers
      );
    }
    setSelectedProductForModal(null);
    setSelectedModifiers([]);
  };

  const toggleModifier = (mod) => {
    setSelectedModifiers((prev) => {
      const exists = prev.some((m) => m.name === mod.name);
      if (exists) {
        return prev.filter((m) => m.name !== mod.name);
      } else {
        return [...prev, mod];
      }
    });
  };

  const triggerHaptic = () => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  const coverImage = VENDOR_COVERS[vendor.id] || DEFAULT_COVER;

  return (
    <div className="vendor-page">
      {/* Floating Top Glass Header */}
      <motion.header
        className={`vendor-floating-header ${scrolled ? 'scrolled' : ''}`}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <button
          type="button"
          className="vendor-header-btn back-btn glass"
          onClick={() => navigate(-1)}
          aria-label="Orqaga"
        >
          <ChevronLeft size={22} />
        </button>

        <div className={`vendor-header-center ${scrolled ? 'visible' : ''}`}>
          <h2 className="vendor-header-title">{vendor.name}</h2>
          <span className="vendor-header-sub">
            <Star size={12} className="star-icon" /> {vendor.rating || '4.8'}
          </span>
        </div>

        <div className="vendor-header-actions">
          <button
            type="button"
            className="vendor-header-btn search-btn glass"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            aria-label="Qidirish"
          >
            <Search size={18} />
          </button>
          <button
            type="button"
            className={`vendor-header-btn fav-btn glass ${
              isFavorite ? 'is-fav' : ''
            }`}
            onClick={() => {
              triggerHaptic();
              toggleFavorite?.(vendorId);
            }}
            aria-label="Sevimlilar"
          >
            <Heart
              size={18}
              fill={isFavorite ? '#ef4444' : 'none'}
              color={isFavorite ? '#ef4444' : 'currentColor'}
            />
          </button>
        </div>
      </motion.header>

      {/* Hero Section with cover image and gradient fade */}
      <section className="vendor-hero">
        <div className="vendor-hero-media">
          <img
            src={coverImage}
            alt={vendor.name}
            className="vendor-hero-img"
            loading="eager"
          />
          <div className="vendor-hero-gradient-overlay" />
        </div>

        {/* Floating Vendor Info Card */}
        <div className="vendor-hero-content">
          <div className="vendor-main-card glass-card">
            <div className="vendor-main-card-top">
              <div>
                <span className="vendor-badge-pill">
                  <Sparkles size={13} className="sparkle-icon" />
                  {vendor.type || 'Fast Food'}
                </span>
                <h1 className="vendor-hero-title">{vendor.name}</h1>
              </div>
              <div className="vendor-rating-box">
                <Star size={16} className="star-icon-solid" />
                <span className="rating-num">{vendor.rating || '4.8'}</span>
                <span className="reviews-num">
                  ({vendor.reviewsCount || 120}+)
                </span>
              </div>
            </div>

            <p className="vendor-address-text">
              {vendor.address || 'Toshkent shahri'} • {vendor.hours || '09:00 - 23:00'}
            </p>

            <div className="vendor-meta-row">
              <div className="vendor-meta-item">
                <Clock size={14} className="meta-icon" />
                <span>20-30 daq</span>
              </div>
              <div className="meta-dot">•</div>
              <div className="vendor-meta-item">
                <Bike size={14} className="meta-icon" />
                <span>
                  {vendor.deliveryFee === 0
                    ? 'Bepul yetkazish'
                    : formatMoney(vendor.deliveryFee)}
                </span>
              </div>
              {vendor.minOrder > 0 && (
                <>
                  <div className="meta-dot">•</div>
                  <div className="vendor-meta-item min-order">
                    <span>Min: {formatMoney(vendor.minOrder)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Expandable Search Bar */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            className="vendor-search-drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="vendor-search-input-wrap glass-card">
              <Search size={18} className="search-input-icon" />
              <input
                type="text"
                className="vendor-search-field"
                placeholder="Menyudan qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Category Tabs */}
      <nav className="vendor-category-bar">
        <div className="vendor-category-scroll">
          {vendorCategories.map((cat) => {
            const isActive = activeCategory === cat.id;
            const emoji = CATEGORY_ICONS[cat.id] || '🍽️';

            return (
              <button
                key={cat.id}
                type="button"
                className={`category-tab-pill ${isActive ? 'active' : ''}`}
                onClick={() => {
                  triggerHaptic();
                  setActiveCategory(cat.id);
                  const el = document.getElementById(`category-sec-${cat.id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                <span className="category-tab-emoji">{emoji}</span>
                <span className="category-tab-text">{cat.name}</span>
                {isActive && (
                  <motion.div
                    className="category-tab-indicator"
                    layoutId="activeCategoryIndicator"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Products Section */}
      <main className="vendor-menu-content">
        {Object.keys(productsByCategory).length > 0 ? (
          vendorCategories.map((cat) => {
            const prods = productsByCategory[cat.id];
            if (!prods || prods.length === 0) return null;

            return (
              <section
                key={cat.id}
                id={`category-sec-${cat.id}`}
                className="vendor-category-section"
              >
                <div className="category-section-header">
                  <h3 className="category-section-title">
                    <span className="category-sec-emoji">
                      {CATEGORY_ICONS[cat.id] || '🍽️'}
                    </span>
                    {cat.name}
                  </h3>
                  <span className="category-sec-count">
                    {prods.length} ta taom
                  </span>
                </div>

                <div className="vendor-products-grid">
                  {prods.map((product) => {
                    const qtyInCart = getProductCartQty(product.id);
                    const prodImg =
                      PRODUCT_IMAGES[product.id] ||
                      product.imageUrl ||
                      DEFAULT_COVER;

                    return (
                      <motion.article
                        key={product.id}
                        className={`product-card glass-card ${
                          qtyInCart > 0 ? 'in-cart' : ''
                        }`}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => {
                          if (
                            product.modifiers &&
                            product.modifiers.length > 0
                          ) {
                            setSelectedProductForModal(product);
                            setSelectedModifiers([]);
                          }
                        }}
                      >
                        {/* Square Thumbnail Image */}
                        <div className="product-card-thumb-wrapper">
                          <img
                            src={prodImg}
                            alt={product.name}
                            className="product-card-thumb"
                            loading="lazy"
                          />
                          {product.modifiers &&
                            product.modifiers.length > 0 && (
                              <span className="product-customizable-badge">
                                <SlidersHorizontal size={10} />
                              </span>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="product-card-details">
                          <div className="product-card-texts">
                            <h4 className="product-title">{product.name}</h4>
                            <p className="product-description">
                              {product.description ||
                                'Ajoyib taʼm, tabiiy masalliqlar va yangi tayyorlangan maxsus taom.'}
                            </p>
                          </div>

                          <div className="product-card-footer">
                            <span className="product-price">
                              {formatMoney(product.price)}
                            </span>

                            {/* Quantity Stepper or Plus Button */}
                            <div
                              className="product-actions"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {qtyInCart > 0 ? (
                                <div className="product-qty-stepper">
                                  <motion.button
                                    type="button"
                                    className="stepper-btn minus-btn"
                                    onClick={(e) => handleMinusClick(product, e)}
                                    whileTap={{ scale: 0.85 }}
                                    aria-label="Kamaytirish"
                                  >
                                    <Minus size={14} />
                                  </motion.button>
                                  <span className="stepper-count">
                                    {qtyInCart}
                                  </span>
                                  <motion.button
                                    type="button"
                                    className="stepper-btn plus-btn"
                                    onClick={(e) => handleAddClick(product, e)}
                                    whileTap={{ scale: 0.85 }}
                                    aria-label="Ko'paytirish"
                                  >
                                    <Plus size={14} />
                                  </motion.button>
                                </div>
                              ) : (
                                <motion.button
                                  type="button"
                                  className="product-add-btn"
                                  onClick={(e) => handleAddClick(product, e)}
                                  whileTap={{ scale: 0.88 }}
                                  aria-label="Savatga qo'shish"
                                >
                                  <Plus size={16} strokeWidth={2.5} />
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              </section>
            );
          })
        ) : (
          <div className="vendor-empty-search glass-card">
            <Search size={32} className="empty-search-icon" />
            <h4>Hech narsa topilmadi</h4>
            <p>Boshqa so'z bilan qidirib ko'ring</p>
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      <AnimatePresence>
        {cartItemCount > 0 && (
          <motion.div
            className="vendor-floating-cart-wrapper"
            initial={{ y: 90, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 90, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          >
            <div
              className="vendor-floating-cart-bar"
              onClick={() => {
                triggerHaptic();
                navigate('/cart');
              }}
              role="button"
              tabIndex={0}
            >
              <div className="cart-bar-left">
                <div className="cart-bar-icon-badge">
                  <ShoppingBag size={20} className="cart-bar-bag-icon" />
                  <span className="cart-bar-count-badge">
                    {cartItemCount}
                  </span>
                </div>
                <div className="cart-bar-info">
                  <span className="cart-bar-label">Savatingizda</span>
                  <span className="cart-bar-total">
                    {formatMoney(cartTotal)}
                  </span>
                </div>
              </div>

              <div className="cart-bar-cta">
                <span className="cart-bar-cta-text">Savatga o'tish</span>
                <div className="cart-bar-cta-arrow">→</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Modifiers Modal */}
      <AnimatePresence>
        {selectedProductForModal && (
          <div className="vendor-modal-backdrop">
            <motion.div
              className="vendor-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProductForModal(null)}
            />
            <motion.div
              className="vendor-modal-sheet glass-card"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <div className="modal-sheet-header">
                <div className="modal-handle-bar" />
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setSelectedProductForModal(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-sheet-body">
                <div className="modal-product-summary">
                  <img
                    src={
                      PRODUCT_IMAGES[selectedProductForModal.id] ||
                      selectedProductForModal.imageUrl ||
                      DEFAULT_COVER
                    }
                    alt={selectedProductForModal.name}
                    className="modal-product-thumb"
                  />
                  <div>
                    <h3 className="modal-product-title">
                      {selectedProductForModal.name}
                    </h3>
                    <p className="modal-product-base-price">
                      {formatMoney(selectedProductForModal.price)}
                    </p>
                  </div>
                </div>

                <div className="modal-modifiers-section">
                  <h4 className="modal-modifiers-title">
                    Qo'shimchalar tanlang:
                  </h4>
                  <div className="modal-modifiers-list">
                    {selectedProductForModal.modifiers?.map((mod, idx) => {
                      const isSelected = selectedModifiers.some(
                        (m) => m.name === mod.name
                      );

                      return (
                        <div
                          key={idx}
                          className={`modifier-option-row glass ${
                            isSelected ? 'selected' : ''
                          }`}
                          onClick={() => toggleModifier(mod)}
                        >
                          <div className="modifier-checkbox">
                            {isSelected && <Check size={14} />}
                          </div>
                          <span className="modifier-name">{mod.name}</span>
                          <span className="modifier-price">
                            +{formatMoney(mod.price)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="modal-sheet-footer">
                <button
                  type="button"
                  className="modal-submit-btn"
                  onClick={handleConfirmModifierAdd}
                >
                  <span>Savatga qo'shish</span>
                  <span className="modal-btn-price">
                    {formatMoney(
                      (selectedProductForModal.price || 0) +
                        selectedModifiers.reduce(
                          (acc, m) => acc + (m.price || 0),
                          0
                        )
                    )}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
