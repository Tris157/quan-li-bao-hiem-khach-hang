import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { ShieldCheck, LogIn } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
    }
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

        <div className="mt-8">
          <button
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 shadow-sm transition-all hover:bg-stone-50 hover:shadow-md active:scale-[0.98]"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
            Đăng nhập với Google
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-stone-400">
          Bằng cách đăng nhập, bạn đồng ý với các điều khoản sử dụng của chúng tôi.
        </div>
      </div>
    </div>
  );
}
