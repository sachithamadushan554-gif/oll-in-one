
import React, { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Phone, DollarSign, AlertCircle } from 'lucide-react';
import type { Invoice, Installment } from '../types';
import { InvoiceStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface CalendarViewProps {
  invoices: Invoice[];
  onViewInvoice: (invoiceId: string) => void;
  viewMode?: 'pc' | 'mobile';
}

interface DueInstallment {
  invoice: Invoice;
  installment: Installment;
}

const CalendarView: React.FC<CalendarViewProps> = ({ invoices, onViewInvoice, viewMode = 'pc' }) => {
  const { t } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const isMobile = viewMode === 'mobile';

  // Extract all installments and map them to dates
  const installmentsByDate = useMemo(() => {
    const map = new Map<string, DueInstallment[]>();
    
    invoices.forEach(invoice => {
      if (invoice.status === InvoiceStatus.Paid) return;
      
      invoice.installments.forEach(inst => {
        if (inst.paid) return;
        
        const dateKey = format(parseISO(inst.dueDate), 'yyyy-MM-dd');
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, { invoice, installment: inst }]);
      });
    });
    
    return map;
  }, [invoices]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const selectedInstallments = selectedDateKey ? (installmentsByDate.get(selectedDateKey) || []) : [];

  return (
    <div className={`space-y-6 ${isMobile ? 'px-2 pb-32' : 'animate-fade-in pb-20'}`}>
      {/* Header */}
      <div className={`${isMobile ? 'p-4 rounded-2xl' : 'bg-slate-900/60 p-8 rounded-[3rem] border border-white/5 backdrop-blur-xl'} flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl`}>
        <div className="flex items-center gap-3">
            <div className={`bg-indigo-500 rounded-full ${isMobile ? 'w-1 h-8' : 'w-1.5 h-12'}`} />
            <div>
                <h2 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-black text-white uppercase tracking-tighter leading-none`}>{t('calendar_title')}</h2>
                <p className="text-slate-500 font-bold uppercase text-[8px] tracking-[0.3em] mt-1">{t('calendar_subtitle')}</p>
            </div>
        </div>
        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
          <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-xl text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-white font-black uppercase text-xs tracking-widest min-w-[120px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-xl text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6`}>
        {/* Calendar Grid */}
        <div className={`lg:col-span-2 bg-white dark:bg-slate-950 ${isMobile ? 'p-4 rounded-2xl' : 'p-8 rounded-[2.5rem]'} border border-slate-200 dark:border-slate-800 shadow-xl`}>
          <div className="grid grid-cols-7 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-[10px] font-black uppercase text-slate-400 tracking-widest py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayInstallments = installmentsByDate.get(dateKey) || [];
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, monthStart);
              
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    relative aspect-square flex flex-col items-center justify-center rounded-xl transition-all
                    ${!isCurrentMonth ? 'opacity-20' : 'opacity-100'}
                    ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-105 z-10' : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'}
                    ${isToday(day) && !isSelected ? 'border-2 border-indigo-500/30' : ''}
                  `}
                >
                  <span className={`text-xs font-black ${isSelected ? 'text-white' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {dayInstallments.length > 0 && (
                    <div className={`absolute bottom-1.5 flex gap-0.5`}>
                      {dayInstallments.slice(0, 3).map((_, i) => (
                        <div key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`} />
                      ))}
                      {dayInstallments.length > 3 && (
                        <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/50' : 'bg-slate-300'}`} />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Details Panel */}
        <div className="space-y-4">
          <div className={`bg-white dark:bg-slate-950 ${isMobile ? 'p-5 rounded-2xl' : 'p-6 rounded-[2.5rem]'} border border-slate-200 dark:border-slate-800 shadow-xl h-full flex flex-col`}>
            <div className="flex items-center gap-3 mb-6">
              <CalendarIcon className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest">
                  {selectedDate ? format(selectedDate, 'EEEE, MMM do') : 'Select a date'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {t('calendar_due_count', selectedInstallments.length)}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scroll max-h-[500px]">
              {selectedInstallments.length > 0 ? (
                selectedInstallments.map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => onViewInvoice(item.invoice.id)}
                    className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-slate-400" />
                        <p className="font-black text-xs text-slate-800 dark:text-white uppercase truncate max-w-[120px]">
                          {item.invoice.customer.name}
                        </p>
                      </div>
                      <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                        #{item.invoice.id}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <p className="text-[10px] font-bold text-slate-500">{item.invoice.customer.phone}</p>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-emerald-500" />
                        <p className="font-black text-sm text-emerald-600">
                          Rs. {item.installment.amount.toLocaleString()}
                        </p>
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">
                        Inst. {item.installment.installmentNumber}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-3">
                    <AlertCircle className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('calendar_no_payments')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
