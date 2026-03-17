import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogIn, Loader2, Eye, EyeOff } from 'lucide-react';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Small delay for UX feel
    await new Promise(r => setTimeout(r, 500));

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      setError('Sai tài khoản hoặc mật khẩu!');
      setLoading(false);
      return;
    }

    // Store login state
    sessionStorage.setItem('taxpro_logged_in', 'true');
    navigate('/');
    // Force a re-render by dispatching storage event
    window.dispatchEvent(new Event('login-success'));
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl shadow-stone-200/50">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-stone-900">TaxPro CRM</h1>
          <p className="mt-2 text-stone-500">Hệ thống quản lý thuế chuyên nghiệp</p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-center text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-semibold text-stone-700">
              Tài khoản
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Nhập tài khoản"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-stone-700">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-4 py-3 pr-12 text-sm outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Nhập mật khẩu"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Đăng nhập
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-stone-400">
          © 2026 TaxPro CRM. All rights reserved.
        </div>
      </div>
    </div>
  );
}
