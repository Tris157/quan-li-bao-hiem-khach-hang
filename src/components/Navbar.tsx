import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserProfile } from '../types';
import { LayoutDashboard, Users, UserPlus, LogOut, ShieldCheck, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import NotificationCenter from './NotificationCenter';

interface NavbarProps {
  profile: UserProfile | null;
}

export default function Navbar({ profile }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    sessionStorage.removeItem('taxpro_logged_in');
    window.dispatchEvent(new Event('login-success'));
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Khách hàng', path: '/customers', icon: Users },
    { name: 'Thêm khách', path: '/customers/new', icon: UserPlus },
    { name: 'Cài đặt', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-emerald-700">
              <ShieldCheck className="h-6 w-6" />
              <span>TaxPro CRM</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === item.path
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationCenter />
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-stone-900">{profile?.displayName}</span>
              <span className="text-xs text-stone-500 capitalize">{profile?.role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
              title="Đăng xuất"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
