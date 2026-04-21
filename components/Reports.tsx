
import React, { useState, useMemo } from 'react';
import type { Invoice, Product, Customer } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ReportsProps {
    invoices: Invoice[];
    products: Product[];
    viewMode?: 'pc' | 'mobile';
}

export const Reports: React.FC<ReportsProps> = ({ invoices, products, viewMode = 'pc' }) => {
    const { t } = useLanguage();
    const isMobile = viewMode === 'mobile';
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedCustomerPhone, setSelectedCustomerPhone] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const customers = useMemo(() => {
        const map = new Map<string, Customer>();
        invoices.forEach(inv => {
            if (!map.has(inv.customer.phone)) {
                map.set(inv.customer.phone, inv.customer);
            }
        });
        return Array.from(map.values());
    }, [invoices]);

    const filteredCustomers = useMemo(() => {
        if (!customerSearch) return [];
        return customers.filter(c => 
            c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
            c.phone.includes(customerSearch) ||
            (c.nickname && c.nickname.toLowerCase().includes(customerSearch.toLowerCase()))
        ).slice(0, 5);
    }, [customers, customerSearch]);

    const selectedCustomer = useMemo(() => {
        if (!selectedCustomerPhone) return null;
        return customers.find(c => c.phone.replace(/\D/g, '') === selectedCustomerPhone.replace(/\D/g, ''));
    }, [customers, selectedCustomerPhone]);

    const exportToExcel = (data: any[], fileName: string) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    };

    const exportToPDF = (title: string, headers: string[], rows: any[][], fileName: string, subTitle?: string) => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(title, 14, 15);
        if (subTitle) {
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(subTitle, 14, 22);
        }
        (doc as any).autoTable({
            head: [headers],
            body: rows,
            startY: subTitle ? 28 : 20,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [79, 70, 229] }
        });
        doc.save(`${fileName}.pdf`);
    };

    const handleInventoryReport = (format: 'pdf' | 'excel') => {
        const data = products.map(p => ({
            ID: p.id,
            Name: p.name,
            Price: p.price,
            Stock: p.stock,
            Value: p.price * p.stock
        }));

        if (format === 'excel') {
            exportToExcel(data, 'Inventory_Report');
        } else {
            const rows = data.map(p => [p.ID, p.Name, p.Price, p.Stock, p.Value]);
            exportToPDF('Inventory Report', ['ID', 'Name', 'Price', 'Stock', 'Total Value'], rows, 'Inventory_Report');
        }
    };

    const handleSalesReport = (format: 'pdf' | 'excel') => {
        const filteredInvoices = invoices.filter(inv => {
            if (!dateRange.start || !dateRange.end) return true;
            const date = new Date(inv.createdAt);
            return date >= new Date(dateRange.start) && date <= new Date(dateRange.end);
        });

        const data = filteredInvoices.map(inv => ({
            ID: inv.id,
            Date: inv.createdAt.split('T')[0],
            Customer: inv.customer.name,
            Total: inv.totalAmount,
            Paid: inv.amountPaid,
            Balance: inv.balance,
            Status: inv.status
        }));

        if (format === 'excel') {
            exportToExcel(data, 'Sales_Report');
        } else {
            const rows = data.map(inv => [inv.ID, inv.Date, inv.Customer, inv.Total, inv.Paid, inv.Balance, inv.Status]);
            exportToPDF('Sales Report', ['ID', 'Date', 'Customer', 'Total', 'Paid', 'Balance', 'Status'], rows, 'Sales_Report');
        }
    };

    const handleArrearsReport = (format: 'pdf' | 'excel') => {
        const overdue = invoices.filter(inv => inv.balance > 0);
        const data = overdue.map(inv => ({
            ID: inv.id,
            Customer: inv.customer.name,
            Phone: inv.customer.phone,
            Total: inv.totalAmount,
            Paid: inv.amountPaid,
            Balance: inv.balance,
            Status: inv.status
        }));

        if (format === 'excel') {
            exportToExcel(data, 'Arrears_Report');
        } else {
            const rows = data.map(inv => [inv.ID, inv.Customer, inv.Phone, inv.Total, inv.Paid, inv.Balance, inv.Status]);
            exportToPDF('Arrears Report', ['ID', 'Customer', 'Phone', 'Total', 'Paid', 'Balance', 'Status'], rows, 'Arrears_Report');
        }
    };

    const handleCustomerReport = (format: 'pdf' | 'excel') => {
        const data = customers.map(c => ({
            Name: c.name,
            Nickname: c.nickname || '-',
            Phone: c.phone,
            Address: c.address
        }));

        if (format === 'excel') {
            exportToExcel(data, 'Customer_List');
        } else {
            const rows = data.map(c => [c.Name, c.Nickname, c.Phone, c.Address]);
            exportToPDF('Customer List', ['Name', 'Nickname', 'Phone', 'Address'], rows, 'Customer_List');
        }
    };

    const [isGenerating, setIsGenerating] = useState<string | null>(null);

    const [reportError, setReportError] = useState<string | null>(null);

    const handleCustomerDetailedReport = async (format: 'pdf' | 'excel') => {
        if (!selectedCustomer) return;
        setIsGenerating(`${selectedCustomer.phone}-${format}`);
        setReportError(null);

        try {
            // Small delay to allow UI to update
            await new Promise(resolve => setTimeout(resolve, 100));
            
            let customerInvoices = invoices.filter(inv => 
                inv.customer.phone.replace(/\D/g, '') === selectedCustomer.phone.replace(/\D/g, '')
            );
            
            if (customerInvoices.length === 0) {
                setReportError('No invoices found for this customer.');
                setIsGenerating(null);
                return;
            }
        
        // Apply date range filter if set
        if (dateRange.start && dateRange.end) {
            const start = new Date(dateRange.start);
            const end = new Date(dateRange.end);
            customerInvoices = customerInvoices.filter(inv => {
                const date = new Date(inv.createdAt);
                return date >= start && date <= end;
            });
        }

        const totalPurchases = customerInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const totalPaid = customerInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
        const totalBalance = customerInvoices.reduce((sum, inv) => sum + inv.balance, 0);

        const dateRangeStr = dateRange.start && dateRange.end 
            ? `Period: ${dateRange.start} to ${dateRange.end}` 
            : 'Full History';

        if (format === 'excel') {
            const invoiceData = customerInvoices.map(inv => ({
                'Invoice ID': inv.id,
                'Date': inv.createdAt.split('T')[0],
                'Total': inv.totalAmount,
                'Paid': inv.amountPaid,
                'Balance': inv.balance,
                'Status': inv.status
            }));

            const itemData: any[] = [];
            customerInvoices.forEach(inv => {
                inv.items.forEach(item => {
                    itemData.push({
                        'Invoice ID': inv.id,
                        'Date': inv.createdAt.split('T')[0],
                        'Description': item.description,
                        'IMEI/Serial': item.imei,
                        'Qty': item.quantity,
                        'Price': item.price,
                        'Amount': item.amount
                    });
                });
            });

            const paymentData: any[] = [];
            customerInvoices.forEach(inv => {
                inv.payments.forEach((p, index) => {
                    paymentData.push({
                        'Invoice ID': inv.id,
                        'Date': p.date.split('T')[0],
                        'Amount': p.amount,
                        'Type': index === 0 ? 'Down Payment' : 'Installment/Other',
                        'Note': p.note || '-'
                    });
                });
            });

            const installmentData: any[] = [];
            customerInvoices.forEach(inv => {
                inv.installments.forEach(inst => {
                    installmentData.push({
                        'Invoice ID': inv.id,
                        'No': inst.installmentNumber,
                        'Due Date': inst.dueDate,
                        'Amount': inst.amount,
                        'Status': inst.paid ? 'Paid' : 'Pending',
                        'Paid Date': inst.paidAt ? inst.paidAt.split('T')[0] : '-'
                    });
                });
            });

            const workbook = XLSX.utils.book_new();
            const wsInfo = XLSX.utils.json_to_sheet([
                { 'Field': 'Name', 'Value': selectedCustomer.name },
                { 'Field': 'Nickname', 'Value': selectedCustomer.nickname || '-' },
                { 'Field': 'Phone', 'Value': selectedCustomer.phone },
                { 'Field': 'Address', 'Value': selectedCustomer.address },
                { 'Field': 'Total Purchases', 'Value': totalPurchases },
                { 'Field': 'Total Paid', 'Value': totalPaid },
                { 'Field': 'Total Balance', 'Value': totalBalance }
            ]);
            
            XLSX.utils.book_append_sheet(workbook, wsInfo, "Customer Info");
            XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(invoiceData), "Invoices");
            XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(itemData), "Purchased Items");
            XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(paymentData), "Payments");
            XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(installmentData), "Installment Schedule");

            XLSX.writeFile(workbook, `Customer_Report_${selectedCustomer.name.replace(/\s+/g, '_')}.xlsx`);
        } else {
            const doc = new jsPDF();
            doc.setFontSize(20);
            doc.text(`Customer Statement: ${selectedCustomer.name}`, 14, 20);
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(dateRangeStr, 14, 27);
            
            doc.setTextColor(0);
            doc.text(`Nickname: ${selectedCustomer.nickname || '-'}`, 14, 35);
            doc.text(`Phone: ${selectedCustomer.phone}`, 14, 40);
            doc.text(`Address: ${selectedCustomer.address}`, 14, 45);

            doc.text(`Financial Summary (${dateRangeStr}):`, 14, 60);
            doc.text(`Total Purchases: Rs. ${totalPurchases.toLocaleString()}`, 14, 67);
            doc.text(`Total Paid: Rs. ${totalPaid.toLocaleString()}`, 14, 72);
            doc.text(`Total Balance: Rs. ${totalBalance.toLocaleString()}`, 14, 77);

            doc.setFontSize(14);
            doc.text('1. Purchased Items', 14, 90);
            const itemRows: any[][] = [];
            customerInvoices.forEach(inv => {
                inv.items.forEach(item => {
                    itemRows.push([inv.id, inv.createdAt.split('T')[0], item.description, item.imei, item.quantity, item.price, item.amount]);
                });
            });
            (doc as any).autoTable({
                head: [['Inv ID', 'Date', 'Description', 'IMEI/Serial', 'Qty', 'Price', 'Amount']],
                body: itemRows,
                startY: 95,
                theme: 'grid',
                styles: { fontSize: 7 }
            });

            let currentY = (doc as any).lastAutoTable.finalY + 15;
            doc.text('2. Invoice Summary', 14, currentY);
            (doc as any).autoTable({
                head: [['ID', 'Date', 'Total', 'Paid', 'Balance', 'Status']],
                body: customerInvoices.map(inv => [inv.id, inv.createdAt.split('T')[0], inv.totalAmount, inv.amountPaid, inv.balance, inv.status]),
                startY: currentY + 5,
                theme: 'grid',
                styles: { fontSize: 8 }
            });

            currentY = (doc as any).lastAutoTable.finalY + 15;
            doc.text('3. Installment Schedule', 14, currentY);
            const installmentRows: any[][] = [];
            customerInvoices.forEach(inv => {
                inv.installments.forEach(inst => {
                    installmentRows.push([inv.id, inst.installmentNumber, inst.dueDate, inst.amount, inst.paid ? 'Paid' : 'Pending', inst.paidAt ? inst.paidAt.split('T')[0] : '-']);
                });
            });
            (doc as any).autoTable({
                head: [['Inv ID', 'No', 'Due Date', 'Amount', 'Status', 'Paid Date']],
                body: installmentRows,
                startY: currentY + 5,
                theme: 'grid',
                styles: { fontSize: 7 }
            });

            currentY = (doc as any).lastAutoTable.finalY + 15;
            doc.text('4. Payment History (including Down Payments)', 14, currentY);
            const paymentRows: any[][] = [];
            customerInvoices.forEach(inv => {
                inv.payments.forEach((p, idx) => {
                    paymentRows.push([inv.id, p.date.split('T')[0], p.amount, idx === 0 ? 'Down Payment' : 'Installment', p.note || '-']);
                });
            });

            (doc as any).autoTable({
                head: [['Inv ID', 'Date', 'Amount', 'Type', 'Note']],
                body: paymentRows,
                startY: currentY + 5,
                theme: 'grid',
                styles: { fontSize: 8 }
            });

            doc.save(`Customer_Report_${selectedCustomer.name.replace(/\s+/g, '_')}.pdf`);
        }
        setIsGenerating(null);
    } catch (error) {
        console.error('Error generating report:', error);
        setReportError('Failed to generate report. Please try again.');
        setIsGenerating(null);
    }
};

    const ReportCard = ({ title, description, onPdf, onExcel, icon, disabled }: any) => (
        <div className={`bg-white dark:bg-slate-900/60 p-8 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800/60 shadow-xl hover:shadow-2xl transition-all duration-500 group ${disabled ? 'opacity-50 grayscale' : ''}`}>
            <div className="flex items-center gap-6 mb-6">
                <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{description}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={onPdf}
                    disabled={disabled}
                    className="flex items-center justify-center gap-2 py-4 bg-rose-500/10 text-rose-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-500 hover:text-white transition-all shadow-sm disabled:cursor-not-allowed"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    PDF
                </button>
                <button 
                    onClick={onExcel}
                    disabled={disabled}
                    className="flex items-center justify-center gap-2 py-4 bg-emerald-500/10 text-emerald-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-500 hover:text-white transition-all shadow-sm disabled:cursor-not-allowed"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Excel
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-12 animate-fade-in pb-32">
            <div className="relative group bg-white/40 dark:bg-slate-900/40 rounded-[4rem] border border-white/60 dark:border-slate-800/60 shadow-2xl backdrop-blur-3xl p-8 md:p-12 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[120px] -mr-20 -mt-20"></div>
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 mb-6">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">System Intelligence</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
                        Reports <span className="text-indigo-600 dark:text-indigo-400">Center</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold tracking-tight text-lg mt-4">Generate and download system-wide reports in multiple formats.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Global Filters */}
                <div className="bg-white dark:bg-slate-900/60 p-8 rounded-[3rem] border border-slate-200/60 dark:border-slate-800/60 shadow-xl">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                        Date Range Filter
                    </h3>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-1 w-full">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Start Date</label>
                            <input 
                                type="date" 
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">End Date</label>
                            <input 
                                type="date" 
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                            />
                        </div>
                        <button 
                            onClick={() => setDateRange({ start: '', end: '' })}
                            className="mt-6 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                        >
                            Clear
                        </button>
                    </div>
                </div>

                {/* Customer Selector */}
                <div className="bg-white dark:bg-slate-900/60 p-8 rounded-[3rem] border border-slate-200/60 dark:border-slate-800/60 shadow-xl">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Specific Customer Report
                    </h3>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Search by Name or Phone..."
                            value={customerSearch}
                            onChange={(e) => {
                                setCustomerSearch(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        />
                        {showSuggestions && filteredCustomers.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-20">
                                {filteredCustomers.map(c => (
                                    <button
                                        key={c.phone}
                                        onClick={() => {
                                            setSelectedCustomerPhone(c.phone);
                                            setCustomerSearch(c.name);
                                            setShowSuggestions(false);
                                            setReportError(null);
                                        }}
                                        className="w-full px-6 py-4 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                                    >
                                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{c.name} {c.nickname ? `(${c.nickname})` : ''}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.phone}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {selectedCustomer && (
                        <div className="mt-6 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/30">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Selected Customer</p>
                                    <p className="text-lg font-black text-slate-900 dark:text-white uppercase">{selectedCustomer.name}</p>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedCustomer.phone}</p>
                                </div>
                                <button onClick={() => {
                                    setSelectedCustomerPhone('');
                                    setCustomerSearch('');
                                    setReportError(null);
                                }} className="w-10 h-10 bg-white dark:bg-slate-800 text-rose-500 rounded-xl flex items-center justify-center shadow-sm hover:bg-rose-50 transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => handleCustomerDetailedReport('pdf')}
                                    disabled={isGenerating !== null}
                                    className="flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGenerating === `${selectedCustomer.phone}-pdf` ? (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    )}
                                    {isGenerating === `${selectedCustomer.phone}-pdf` ? 'Generating...' : 'Download PDF'}
                                </button>
                                <button 
                                    onClick={() => handleCustomerDetailedReport('excel')}
                                    disabled={isGenerating !== null}
                                    className="flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGenerating === `${selectedCustomer.phone}-excel` ? (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    )}
                                    {isGenerating === `${selectedCustomer.phone}-excel` ? 'Generating...' : 'Download Excel'}
                                </button>
                            </div>
                            {reportError && (
                                <p className="mt-4 text-xs font-bold text-rose-500 uppercase tracking-widest text-center animate-shake">
                                    {reportError}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <ReportCard 
                    title="Inventory Status"
                    description="Current stock levels and asset value"
                    onPdf={() => handleInventoryReport('pdf')}
                    onExcel={() => handleInventoryReport('excel')}
                    icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                />
                <ReportCard 
                    title="Sales & Revenue"
                    description="Transaction history and income summary"
                    onPdf={() => handleSalesReport('pdf')}
                    onExcel={() => handleSalesReport('excel')}
                    icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                />
                <ReportCard 
                    title="Arrears & Risk"
                    description="Outstanding balances and overdue accounts"
                    onPdf={() => handleArrearsReport('pdf')}
                    onExcel={() => handleArrearsReport('excel')}
                    icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <ReportCard 
                    title="Customer Registry"
                    description="Complete list of registered clients"
                    onPdf={() => handleCustomerReport('pdf')}
                    onExcel={() => handleCustomerReport('excel')}
                    icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                />
                <ReportCard 
                    title="Customer Statement"
                    description="Detailed history for selected client"
                    disabled={!selectedCustomer}
                    onPdf={() => handleCustomerDetailedReport('pdf')}
                    onExcel={() => handleCustomerDetailedReport('excel')}
                    icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                />
            </div>
        </div>
    );
};
