import { useState, useEffect } from 'react';
import { getCustomers } from '../lib/dataStore';
import { Customer } from '../types';
import { Users, AlertCircle, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '../lib/utils';
import { checkExpirations } from './NotificationCenter';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, dueSoon: 0, overdue: 0 });
  const [urgentCustomers, setUrgentCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      await checkExpirations();
      const allCustomers = await getCustomers();
      const now = new Date();
      let dueSoon = 0;
      let overdue = 0;

      const urgent = allCustomers
        .filter(c => {
          const nextDate = parseISO(c.nextTaxDate);
          const diff = differenceInDays(nextDate, now);
          if (diff < 0) { overdue++; return true; }
          if (diff <= 7) { dueSoon++; return true; }
          return false;
        })
        .sort((a, b) => parseISO(a.nextTaxDate).getTime() - parseISO(b.nextTaxDate).getTime())
        .slice(0, 6);

      setStats({ total: allCustomers.length, dueSoon, overdue });
      setUrgentCustomers(urgent);
      setLoading(false);
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Tổng khách hàng', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Sắp đến hạn', value: stats.dueSoon, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Quá hạn', value: stats.overdue, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => <div key={i} className="h-32 bg-stone-200 rounded-2xl" />)}
    </div>
    <div className="h-64 bg-stone-200 rounded-2xl" />
  </div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Tổng quan hệ thống</h1>
        <p className="text-stone-500">Chào mừng bạn trở lại với TaxPro CRM</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-500">{card.label}</p>
                <p className="text-3xl font-bold text-stone-900 mt-1">{card.value}</p>
              </div>
              <div className={cn("p-3 rounded-xl", card.bg)}>
                <card.icon className={cn("h-6 w-6", card.color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900">Khách hàng cần chú ý</h2>
          <Link to="/customers" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            Xem tất cả <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="divide-y divide-stone-100">
          {urgentCustomers.length > 0 ? (
            urgentCustomers.map((customer) => {
              const nextDate = parseISO(customer.nextTaxDate);
              const diff = differenceInDays(nextDate, new Date());
              const isOverdue = diff < 0;
              return (
                <Link key={customer.id} to={`/customers/${customer.id}`}
                  className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center font-bold text-white", isOverdue ? "bg-red-500" : "bg-amber-500")}>
                      {customer.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900">{customer.fullName}</p>
                      <p className="text-xs text-stone-500">MST: {customer.taxCode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm font-medium", isOverdue ? "text-red-600" : "text-amber-600")}>
                      {isOverdue ? `Quá hạn ${Math.abs(diff)} ngày` : `Còn ${diff} ngày`}
                    </p>
                    <p className="text-xs text-stone-400">{format(nextDate, 'dd/MM/yyyy')}</p>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <p className="text-stone-500 font-medium">Tất cả khách hàng đều ổn định!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
