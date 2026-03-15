import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Save, Send, ShieldCheck, Loader2, BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [settings, setSettings] = useState({
    telegramBotToken: '',
    telegramChatId: '',
    enableTelegram: false,
  });

  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'notifications'));
        if (docSnap.exists()) {
          setSettings(docSnap.data() as any);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setFetching(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });
    try {
      await setDoc(doc(db, 'settings', 'notifications'), settings);
      setStatus({ type: 'success', message: 'Đã lưu cấu hình thông báo thành công!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setStatus({ type: 'error', message: 'Lỗi khi lưu cấu hình. Vui lòng thử lại.' });
    } finally {
      setLoading(false);
    }
  };

  const testTelegram = async () => {
    if (!settings.telegramBotToken || !settings.telegramChatId) {
      setStatus({ type: 'error', message: 'Vui lòng nhập đầy đủ Token và Chat ID' });
      return;
    }
    setLoading(true);
    setStatus({ type: null, message: '' });
    try {
      const message = "🔔 Test thông báo từ TaxPro CRM!";
      const response = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: settings.telegramBotToken,
          chatId: settings.telegramChatId,
          text: message,
        }),
      });
      
      let result;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Phản hồi từ máy chủ không phải JSON: ${text.substring(0, 50)}...`);
      }
      
      // Check the 'ok' field from Telegram API response (proxied through our server)
      if (result.ok) {
        setStatus({ type: 'success', message: '✅ Đã gửi tin nhắn thử nghiệm thành công! Vui lòng kiểm tra Telegram của bạn.' });
      } else {
        let errorMsg = result.error || 'Gửi thất bại. ';
        if (result.description) {
          errorMsg += `Lỗi từ Telegram: ${result.description}`;
        }
        
        const errorCode = result.error_code;
        if (errorCode === 403) {
          errorMsg += ' (Gợi ý: Bot bị chặn hoặc bạn chưa nhấn "Bắt đầu/Start" chat với Bot)';
        } else if (errorCode === 401) {
          errorMsg += ' (Gợi ý: Bot Token không chính xác)';
        } else if (errorCode === 400) {
          errorMsg += ' (Gợi ý: Chat ID không chính xác)';
        }
        setStatus({ type: 'error', message: errorMsg });
      }
    } catch (error) {
      console.error('Telegram test error:', error);
      setStatus({ 
        type: 'error', 
        message: `Lỗi kết nối hệ thống: ${error instanceof Error ? error.message : 'Không xác định'}. Vui lòng kiểm tra lại kết nối mạng hoặc Token.` 
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-emerald-600" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5 text-stone-500" />
        </button>
        <h1 className="text-2xl font-bold text-stone-900">Cấu hình thông báo</h1>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-8 space-y-8">
          <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <BellRing className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-bold text-blue-900">Thông báo qua Telegram</h3>
              <p className="text-sm text-blue-700 mt-1">
                Nhận thông báo nhắc nợ thuế ngay lập tức qua ứng dụng Telegram trên điện thoại của bạn.
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {status.message && (
              <div className={cn(
                "p-4 rounded-xl text-sm font-medium",
                status.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
              )}>
                {status.message}
              </div>
            )}

            <div className="flex items-center justify-between p-4 rounded-xl border border-stone-100 bg-stone-50/50">
              <div>
                <p className="font-bold text-stone-900">Kích hoạt Telegram</p>
                <p className="text-xs text-stone-500">Bật/tắt gửi thông báo qua Telegram</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.enableTelegram}
                  onChange={e => setSettings({...settings, enableTelegram: e.target.checked})}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700">Bot Token</label>
                <input
                  type="password"
                  value={settings.telegramBotToken}
                  onChange={e => setSettings({...settings, telegramBotToken: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="Nhập token từ BotFather"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700">Chat ID</label>
                <input
                  type="text"
                  value={settings.telegramChatId}
                  onChange={e => setSettings({...settings, telegramChatId: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="Nhập Chat ID của bạn"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={testTelegram}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 font-semibold text-stone-700 hover:bg-stone-50 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Gửi thử nghiệm
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all shadow-md disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-4 w-4" />}
                Lưu cấu hình
              </button>
            </div>
          </form>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 text-xs text-stone-500 space-y-2">
            <p className="font-bold text-stone-700">Hướng dẫn nhanh:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Chat với <a href="https://t.me/botfather" target="_blank" className="text-emerald-600 underline">@BotFather</a> để tạo bot và lấy Token.</li>
              <li>Chat với <a href="https://t.me/userinfobot" target="_blank" className="text-emerald-600 underline">@userinfobot</a> để lấy Chat ID của bạn.</li>
              <li>Nhấn "Gửi thử nghiệm" để kiểm tra kết nối.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
