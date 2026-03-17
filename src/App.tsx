import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProfile } from './types';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import CustomerForm from './components/CustomerForm';
import CustomerDetail from './components/CustomerDetail';
import Settings from './components/Settings';
import Login from './components/Login';
import { Loader2 } from 'lucide-react';

const ADMIN_PROFILE: UserProfile = {
  uid: 'admin-local',
  email: 'admin@taxpro.local',
  displayName: 'Admin',
  role: 'admin',
  createdAt: new Date().toISOString(),
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const checkAuth = useCallback(() => {
    const loggedIn = sessionStorage.getItem('taxpro_logged_in') === 'true';
    setIsLoggedIn(loggedIn);
    setProfile(loggedIn ? ADMIN_PROFILE : null);
  }, []);

  useEffect(() => {
    checkAuth();

    const handleLoginSuccess = () => checkAuth();
    window.addEventListener('login-success', handleLoginSuccess);
    return () => window.removeEventListener('login-success', handleLoginSuccess);
  }, [checkAuth]);

  if (isLoggedIn === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-stone-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-stone-50 font-sans text-stone-900">
        {isLoggedIn && profile && <Navbar profile={profile} />}
        <main className={isLoggedIn ? "container mx-auto px-4 py-8" : ""}>
          <Routes>
            <Route 
              path="/login" 
              element={!isLoggedIn ? <Login /> : <Navigate to="/" />} 
            />
            <Route 
              path="/" 
              element={isLoggedIn && profile ? <Dashboard /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/customers" 
              element={isLoggedIn ? <CustomerList /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/customers/new" 
              element={isLoggedIn ? <CustomerForm /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/customers/edit/:id" 
              element={isLoggedIn ? <CustomerForm /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/customers/:id" 
              element={isLoggedIn ? <CustomerDetail /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/settings" 
              element={isLoggedIn ? <Settings /> : <Navigate to="/login" />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
