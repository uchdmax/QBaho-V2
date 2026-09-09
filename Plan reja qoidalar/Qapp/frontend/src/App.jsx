import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import HomePage from './pages/HomePage';
import VendorListPage from './pages/VendorListPage';
import FavoritesPage from './pages/FavoritesPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderStatusPage from './pages/OrderStatusPage';
import ProfilePage from './pages/ProfilePage';
import ComingSoonPage from './pages/ComingSoonPage';
import TabBar from './components/TabBar';

import './styles/tokens.css';
import './styles/animations.css';
import './styles/globals.css';
import './App.css';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
    scale: 0.99,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.99,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

function AnimatedPage({ children }) {
  return (
    <motion.div
      className="page-wrapper"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();

  useEffect(() => {
    // Initialize Telegram WebApp features if running inside Telegram
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      if (window.Telegram.WebApp.setHeaderColor) {
        window.Telegram.WebApp.setHeaderColor('#0f0f1a');
      }
      if (window.Telegram.WebApp.setBackgroundColor) {
        window.Telegram.WebApp.setBackgroundColor('#0f0f1a');
      }
    }
  }, []);

  // Determine whether to show the floating TabBar
  // Hide on standalone order tracking flow if desired, or show consistently
  const hideTabBar = location.pathname.startsWith('/order/');

  return (
    <div className="app-root">
      <main className="app-content">
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <AnimatedPage>
                  <HomePage />
                </AnimatedPage>
              }
            />
            <Route
              path="/vendors"
              element={
                <AnimatedPage>
                  <VendorListPage />
                </AnimatedPage>
              }
            />
            <Route
              path="/favorites"
              element={
                <AnimatedPage>
                  <FavoritesPage />
                </AnimatedPage>
              }
            />
            <Route
              path="/history"
              element={
                <AnimatedPage>
                  <OrderHistoryPage />
                </AnimatedPage>
              }
            />
            <Route
              path="/order/:id"
              element={
                <AnimatedPage>
                  <OrderStatusPage />
                </AnimatedPage>
              }
            />
            <Route
              path="/profile"
              element={
                <AnimatedPage>
                  <ProfilePage />
                </AnimatedPage>
              }
            />
            <Route
              path="/qsavdo"
              element={
                <AnimatedPage>
                  <ComingSoonPage />
                </AnimatedPage>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>

      {!hideTabBar && <TabBar />}
    </div>
  );
}
