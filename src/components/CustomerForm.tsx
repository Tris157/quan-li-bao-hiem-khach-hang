import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCustomerById, addCustomer, updateCustomer } from '../lib/dataStore';
import { CustomerType } from '../types';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { format, addMonths, addYears, parseISO } from 'date-fns';

export default function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  
  const [formData, setFormData] = useState({
    fullName: '', pass: '', cccd: '', taxCode: '', address: '',
    customerType: 'individual' as CustomerType, taxCycle: '1_month',
    startDate: format(new Date(), 'yyyy-MM-dd'), nextTaxDate: '',
  });

  useEffect(() => {
    if (id) {
      getCustomerById(id).then(customer => {
        if (customer) {
          setFormData({
            fullName: customer.fullName, pass: customer.pass, cccd: customer.cccd,
            taxCode: customer.taxCode, address: customer.address,
            customerType: customer.customerType, taxCycle: customer.taxCycle,
            startDate: customer.startDate, nextTaxDate: customer.nextTaxDate,
          });
        }
        setFetching(false);
      });
    }
  }, [id]);

  useEffect(() => {
    if (formData.startDate && formData.taxCycle) {
      const start = parseISO(formData.startDate);
      let next;
      switch (formData.taxCycle) {
        case '1_month': next = addMonths(start, 1); break;
        case '3_months': next = addMonths(start, 3); break;
        case '6_months': next = addMonths(start, 6); break;
        case '1_year': next = addYears(start, 1); break;
        default: next = addMonths(start, 1);
      }
      setFormData(prev => ({ ...prev, nextTaxDate: format(next, 'yyyy-MM-dd') }));
    }
  }, [formData.startDate, formData.taxCycle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        await updateCustomer(id, formData);
      } else {
        await addCustomer({ ...formData, createdBy: 'admin-local' });
      }
      navigate('/customers');
    } catch (error) {
      console.error('Error saving customer:', error);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-emerald-600" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-stone-100 rounded-full transition-colors"><ArrowLeft className="h-5 w-5 text-stone-500" /></button>
        <h1 className="text-2xl font-bold text-stone-900">{id ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><label className="text-sm font-semibold text-stone-700">Họ và tên *</label>
              <input required type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="Nguyễn Văn A" /></div>
            <div className="space-y-2"><label className="text-sm font-semibold text-stone-700">Mã số thuế *</label>
              <input required type="text" value={formData.taxCode} onChange={e => setFormData({ ...formData, taxCode: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="0123456789" /></div>
            <div className="space-y-2"><label className="text-sm font-semibold text-stone-700">Số CCCD/CMND</label>
              <input type="text" value={formData.cccd} onChange={e => setFormData({ ...formData, cccd: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" /></div>
            <div className="space-y-2"><label className="text-sm font-semibold text-stone-700">PASS (nếu có)</label>
              <input type="text" value={formData.pass} onChange={e => setFormData({ ...formData, pass: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" /></div>
            <div className="space-y-2"><label className="text-sm font-semibold text-stone-700">Loại khách hàng</label>
              <select value={formData.customerType} onChange={e => setFormData({ ...formData, customerType: e.target.value as CustomerType })} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all">
                <option value="individual">Cá nhân</option><option value="business">Doanh nghiệp</option></select></div>
            <div className="space-y-2"><label className="text-sm font-semibold text-stone-700">Kỳ đóng thuế</label>
              <select value={formData.taxCycle} onChange={e => setFormData({ ...formData, taxCycle: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all">
                <option value="1_month">1 tháng</option><option value="3_months">3 tháng (Quý)</option><option value="6_months">6 tháng</option><option value="1_year">1 năm</option></select></div>
            <div className="space-y-2"><label className="text-sm font-semibold text-stone-700">Ngày bắt đầu</label>
              <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" /></div>
            <div className="space-y-2"><label className="text-sm font-semibold text-stone-700">Ngày đóng tiếp theo (Tự tính)</label>
              <input readOnly type="date" value={formData.nextTaxDate} className="w-full px-4 py-2.5 rounded-xl border border-stone-100 bg-stone-50 text-stone-500 outline-none cursor-not-allowed" /></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-semibold text-stone-700">Địa chỉ</label>
            <textarea rows={3} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none" /></div>
        </div>
        <div className="p-6 bg-stone-50 border-t border-stone-100 flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-xl font-semibold text-stone-600 hover:bg-stone-200 transition-all">Hủy</button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all shadow-md active:scale-95 disabled:opacity-50">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} Lưu khách hàng</button>
        </div>
      </form>
    </div>
  );
}
