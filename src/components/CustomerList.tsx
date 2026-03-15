import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Customer, CustomerType, CustomerStatus } from '../types';
import { Search, Filter, Plus, ChevronRight, Building2, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '../lib/utils';

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CustomerType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'all'>('all');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const q = query(collection(db, 'customers'), orderBy('nextTaxDate', 'asc'));
        const querySnapshot = await getDocs(q);
        setCustomers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.fullName.toLowerCase().includes(search.toLowerCase()) || 
                         c.taxCode.includes(search) || 
                         c.cccd.includes(search);
    const matchesType = typeFilter === 'all' || c.customerType === typeFilter;
    
    const now = new Date();
    const nextDate = parseISO(c.nextTaxDate);
    const diff = differenceInDays(nextDate, now);
    let status: CustomerStatus = 'normal';
    if (diff < 0) status = 'overdue';
    else if (diff <= 7) status = 'due-soon';

    const matchesStatus = statusFilter === 'all' || status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) return <div className="animate-pulse space-y-4">
    <div className="h-12 bg-stone-200 rounded-xl" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-stone-200 rounded-2xl" />)}
    </div>
  </div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-stone-900">Danh sách khách hàng</h1>
        <Link 
          to="/customers/new"
          className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-sm active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Thêm khách hàng
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, MST, CCCD..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Tất cả loại</option>
            <option value="individual">Cá nhân</option>
            <option value="business">Doanh nghiệp</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="normal">Bình thường</option>
            <option value="due-soon">Sắp đến hạn</option>
            <option value="overdue">Quá hạn</option>
          </select>
        </div>
      </div>

      {filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => {
            const nextDate = parseISO(customer.nextTaxDate);
            const diff = differenceInDays(nextDate, new Date());
            const status: CustomerStatus = diff < 0 ? 'overdue' : diff <= 7 ? 'due-soon' : 'normal';

            return (
              <Link
                key={customer.id}
                to={`/customers/${customer.id}`}
                className="group bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn(
                    "p-2 rounded-lg",
                    customer.customerType === 'business' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                  )}>
                    {customer.customerType === 'business' ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    status === 'overdue' ? "bg-red-100 text-red-700" :
                    status === 'due-soon' ? "bg-amber-100 text-amber-700" :
                    "bg-emerald-100 text-emerald-700"
                  )}>
                    {status === 'overdue' ? 'Quá hạn' : status === 'due-soon' ? 'Sắp đến hạn' : 'Ổn định'}
                  </span>
                </div>
                
                <h3 className="font-bold text-lg text-stone-900 group-hover:text-emerald-700 transition-colors truncate">
                  {customer.fullName}
                </h3>
                <p className="text-sm text-stone-500 mb-4">MST: {customer.taxCode}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-stone-50">
                  <div className="text-xs">
                    <p className="text-stone-400">Đóng tiếp theo</p>
                    <p className="font-semibold text-stone-700">{format(nextDate, 'dd/MM/yyyy')}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-stone-300 group-hover:text-emerald-500 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-stone-300">
          <p className="text-stone-400">Không tìm thấy khách hàng nào phù hợp.</p>
        </div>
      )}
    </div>
  );
}
