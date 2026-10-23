import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import CleanCheck from './pages/CleanCheck';
import EcoPoint from './pages/EcoPoint';
import GreenReport from './pages/GreenReport';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import AdminSetupNotification from './components/AdminSetupNotification';
import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  const { isLoggedIn } = useAuth();
  
  // Baca hash awal saat aplikasi dibuka
  const getInitialPage = () => {
    if (!isLoggedIn) return 'login';
    const hash = window.location.hash.replace('#', '');
    if (!hash) return 'home';
    const validPages = ['home', 'clean-check', 'eco-point', 'green-report', 'admin-dashboard'];
    return validPages.includes(hash) ? hash : 'not-found';
  };

  const [activePage, setActivePage] = useState(getInitialPage);

  // Inisialisasi awal history state
  useEffect(() => {
    const currentPage = isLoggedIn ? activePage : 'login';
    window.history.replaceState({ page: currentPage }, '', '#' + currentPage);
  }, []);

  // Strict Guard: jika logout atau belum login, otomatis arahkan ke login
  useEffect(() => {
    if (!isLoggedIn) {
      setActivePage('login');
      window.history.replaceState({ page: 'login' }, '', '#login');
    }
  }, [isLoggedIn]);

  // Listener tombol Back/Forward browser & mouse back button (popstate & hashchange)
  useEffect(() => {
    const handlePopState = (event) => {
      if (!isLoggedIn) {
        setActivePage('login');
        return;
      }

      const hashPage = window.location.hash.replace('#', '');
      const targetPage = event.state?.page || hashPage;
      const validPages = ['home', 'clean-check', 'eco-point', 'green-report', 'admin-dashboard'];

      if (!targetPage || targetPage === 'home') {
        setActivePage('home');
      } else if (validPages.includes(targetPage)) {
        setActivePage(targetPage);
      } else {
        setActivePage('not-found');
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, [isLoggedIn]);

  const handleNavigate = (page, replace = false) => {
    if (!isLoggedIn) {
      setActivePage('login');
      window.history.replaceState({ page: 'login' }, '', '#login');
      return;
    }

    if (page === activePage) return;

    if (replace) {
      window.history.replaceState({ page }, '', '#' + page);
    } else {
      window.history.pushState({ page }, '', '#' + page);
    }
    setActivePage(page);
  };

  const handleLoginSuccess = () => {
    // Alur: setelah login berhasil, diarahkan ke Beranda ('home')
    window.history.pushState({ page: 'home' }, '', '#home');
    setActivePage('home');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar activePage={activePage} setActivePage={handleNavigate} />

      {/* Notifikasi Inisialisasi Akun Pengguna Khusus Admin */}
      {isLoggedIn && <AdminSetupNotification setActivePage={handleNavigate} />}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4">
        {!isLoggedIn ? (
          <Login onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
            {activePage === 'home' && <Home setActivePage={handleNavigate} />}
            {activePage === 'clean-check' && <CleanCheck setActivePage={handleNavigate} />}
            {activePage === 'eco-point' && <EcoPoint setActivePage={handleNavigate} />}
            {activePage === 'green-report' && <GreenReport setActivePage={handleNavigate} />}
            {activePage === 'admin-dashboard' && <AdminDashboard setActivePage={handleNavigate} />}
            {activePage === 'not-found' && <NotFound setActivePage={handleNavigate} />}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <AppContent />
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
