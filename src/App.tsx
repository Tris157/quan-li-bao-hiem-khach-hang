import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from './types';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import CustomerForm from './components/CustomerForm';
import CustomerDetail from './components/CustomerDetail';
import Settings from './components/Settings';
import Login from './components/Login';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // Create default profile for first-time login
          const isDefaultAdmin = firebaseUser.email === 'doanbatri.it@gmail.com';
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'User',
            role: isDefaultAdmin ? 'admin' : 'staff',
            createdAt: new Date().toISOString(),
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-stone-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-stone-50 font-sans text-stone-900">
        {user && profile && <Navbar profile={profile} />}
        <main className={user ? "container mx-auto px-4 py-8" : ""}>
          <Routes>
            <Route 
              path="/login" 
              element={!user ? <Login /> : <Navigate to="/" />} 
            />
            <Route 
              path="/" 
              element={user && profile ? <Dashboard /> : (user ? <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-emerald-600" /></div> : <Navigate to="/login" />)} 
            />
            <Route 
              path="/customers" 
              element={user && profile ? <CustomerList /> : (user ? <Navigate to="/" /> : <Navigate to="/login" />)} 
            />
            <Route 
              path="/customers/new" 
              element={user && profile ? <CustomerForm /> : (user ? <Navigate to="/" /> : <Navigate to="/login" />)} 
            />
            <Route 
              path="/customers/edit/:id" 
              element={user && profile ? <CustomerForm /> : (user ? <Navigate to="/" /> : <Navigate to="/login" />)} 
            />
            <Route 
              path="/customers/:id" 
              element={user && profile ? <CustomerDetail /> : (user ? <Navigate to="/" /> : <Navigate to="/login" />)} 
            />
            <Route 
              path="/settings" 
              element={user && profile ? <Settings /> : (user ? <Navigate to="/" /> : <Navigate to="/login" />)} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
