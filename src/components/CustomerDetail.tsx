import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCustomerById, getTaxRecords, addTaxRecord, deleteCustomer } from '../lib/dataStore';
import { Customer, TaxRecord } from '../types';
import { ArrowLeft, Edit, Trash2, Plus, Calendar, FileText, MapPin, CreditCard, Loader2, History } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '../lib/utils';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [records, setRecords] = useState<TaxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [newRecord, setNewRecord] = useState({ period: '', amount: 0, paymentDate: format(new Date(), 'yyyy-MM-dd'), note: '' });

  useEffect(() => {
    if (id) {
      Promise.all([getCustomerById(id), getTaxRecords(id)]).then(([c, r]) => {
        if (c) { setCustomer(c); setRecords(r); }
        setLoading(false);
      });
    }
  }, [id]);

  const handleDelete = async () => {
    if (id && window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      await deleteCustomer(id);
      navigate('/customers');
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const record = await addTaxRecord({ ...newRecord, customerId: id });
    setRecords([record, ...records]);
    setShowAddRecord(false);
    setNewRecord({ period: '', amount: 0, paymentDate: format(new Date(), 'yyyy-MM-dd'), note: '' });
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-emerald-600" /></div>;
  if (!customer) return <div className="text-center py-20">Khách hàng không tồn tại.</div>;

  const nextDate = parseISO(customer.nextTaxDate);
  const diff = differenceInDays(nextDate, new Date());
  const status = diff < 0 ? 'overdue' : diff <= 7 ? 'due-soon' : 'normal';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/customers')} className="p-2 hover:bg-stone-100 rounded-full transition-colors"><ArrowLeft className="h-5 w-5 text-stone-500" /></button>
          <div><h1 className="text-2xl font-bold text-stone-900">{customer.fullName}</h1><p className="text-stone-500">MST: {customer.taxCode}</p></div>
        </div>
        <div className="flex gap-2">
          <Link to={`/customers/edit/${id}`} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 bg-white font-semibold text-stone-700 hover:bg-stone-50 transition-all"><Edit className="h-4 w-4" /> Sửa</Link>
          <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-100 bg-red-50 font-semibold text-red-600 hover:bg-red-100 transition-all"><Trash2 className="h-4 w-4" /> Xóa</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-stone-900">Thông tin cơ bản</h2>
              <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                status === 'overdue' ? "bg-red-100 text-red-700" : status === 'due-soon' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
                {status === 'overdue' ? 'Quá hạn' : status === 'due-soon' ? 'Sắp đến hạn' : 'Ổn định'}
              </span>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3"><CreditCard className="h-5 w-5 text-stone-400 mt-0.5" /><div><p className="text-xs text-stone-400 uppercase font-bold tracking-wider">CCCD/CMND</p><p className="text-stone-700 font-medium">{customer.cccd || 'Chưa cập nhật'}</p></div></div>
              <div className="flex items-start gap-3"><FileText className="h-5 w-5 text-stone-400 mt-0.5" /><div><p className="text-xs text-stone-400 uppercase font-bold tracking-wider">PASS</p><p className="text-stone-700 font-medium">{customer.pass || 'Chưa cập nhật'}</p></div></div>
              <div className="flex items-start gap-3"><MapPin className="h-5 w-5 text-stone-400 mt-0.5" /><div><p className="text-xs text-stone-400 uppercase font-bold tracking-wider">Địa chỉ</p><p className="text-stone-700 font-medium">{customer.address || 'Chưa cập nhật'}</p></div></div>
              <div className="flex items-start gap-3"><Calendar className="h-5 w-5 text-stone-400 mt-0.5" /><div><p className="text-xs text-stone-400 uppercase font-bold tracking-wider">Kỳ đóng thuế</p><p className="text-stone-700 font-medium">{customer.taxCycle.replace('_', ' ')}</p></div></div>
            </div>
          </div>
          <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-200/50">
            <p className="text-emerald-100 text-sm font-medium">Hạn đóng tiếp theo</p>
            <p className="text-3xl font-bold mt-1">{format(nextDate, 'dd/MM/yyyy')}</p>
            <p className="text-emerald-100 text-xs mt-2">{diff < 0 ? `Đã quá hạn ${Math.abs(diff)} ngày` : `Còn ${diff} ngày nữa`}</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2"><History className="h-5 w-5 text-emerald-600" /><h2 className="font-bold text-stone-900">Lịch sử đóng thuế</h2></div>
              <button onClick={() => setShowAddRecord(!showAddRecord)} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"><Plus className="h-4 w-4" /> Thêm bản ghi</button>
            </div>
            {showAddRecord && (
              <form onSubmit={handleAddRecord} className="p-6 bg-stone-50 border-b border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required placeholder="Kỳ đóng (VD: Quý 1/2024)" value={newRecord.period} onChange={e => setNewRecord({...newRecord, period: e.target.value})} className="px-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="date" value={newRecord.paymentDate} onChange={e => setNewRecord({...newRecord, paymentDate: e.target.value})} className="px-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="number" placeholder="Số tiền" value={newRecord.amount || ''} onChange={e => setNewRecord({...newRecord, amount: Number(e.target.value)})} className="px-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500" />
                <div className="flex gap-2">
                  <input placeholder="Ghi chú" value={newRecord.note} onChange={e => setNewRecord({...newRecord, note: e.target.value})} className="flex-1 px-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500" />
                  <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700">Lưu</button>
                </div>
              </form>
            )}
            <div className="divide-y divide-stone-100">
              {records.length > 0 ? records.map((record) => (
                <div key={record.id} className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                  <div><p className="font-bold text-stone-900">{record.period}</p><p className="text-xs text-stone-400">{format(parseISO(record.paymentDate), 'dd/MM/yyyy')}</p></div>
                  <div className="text-right"><p className="font-bold text-emerald-600">{record.amount.toLocaleString()} VNĐ</p><p className="text-xs text-stone-500 italic">{record.note}</p></div>
                </div>
              )) : (<div className="p-12 text-center text-stone-400 italic">Chưa có lịch sử đóng thuế.</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
