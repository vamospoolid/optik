
import React from 'react';

interface SalesReportPrintProps {
    data: any;
    period: { month: string; year: string };
}

export const SalesReportPrint = React.forwardRef<HTMLDivElement, SalesReportPrintProps>(({ data, period }, ref) => {
    if (!data) return null;

    const summary = data.summary;
    const records = data.data || [];
    
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const periodName = `${monthNames[parseInt(period.month) - 1]} ${period.year}`;

    return (
        <div ref={ref} className="p-10 bg-white text-black font-sans w-[297mm] min-h-[210mm] mx-auto text-sm" style={{ color: '#000' }}>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-black uppercase tracking-tighter">Sales Report</h1>
                <p className="text-lg font-bold text-slate-500 uppercase tracking-widest">{periodName}</p>
                <div className="w-20 h-1 bg-slate-900 mx-auto mt-4"></div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="border-2 border-slate-900 p-4 rounded-2xl bg-slate-900 text-white">
                    <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Total Orders</p>
                    <p className="text-2xl font-black italic">{summary?.total_orders}</p>
                </div>
                <div className="border border-slate-200 p-4 rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total Omzet</p>
                    <p className="text-2xl font-black italic">Rp {summary?.total_revenue?.toLocaleString()}</p>
                </div>
                <div className="border border-slate-200 p-4 rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-emerald-500 mb-1">Estimasi Laba</p>
                    <p className="text-2xl font-black italic text-emerald-600">Rp {summary?.total_profit?.toLocaleString()}</p>
                </div>
                <div className="border border-slate-200 p-4 rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-amber-500 mb-1">Total Piutang</p>
                    <p className="text-2xl font-black italic text-amber-600">Rp {summary?.total_receivables?.toLocaleString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-8 mb-10">
                <div className="col-span-2">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Rincian Penjualan Produk</p>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                            <span className="font-bold">Frame & Kacamata</span>
                            <span className="font-black text-slate-900">Rp {summary?.breakdown?.frame_sales?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                            <span className="font-bold">Lensa & Lab</span>
                            <span className="font-black text-slate-900">Rp {summary?.breakdown?.lens_sales?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                            <span className="font-bold">Jasa Service & Lainnya</span>
                            <span className="font-black text-slate-900">Rp {summary?.breakdown?.service_sales?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Metode Pembayaran</p>
                    <div className="space-y-2">
                        {Object.entries(summary?.payment_methods || {}).map(([method, amount]: [any, any]) => (
                            <div key={method} className="flex justify-between items-center py-2 border-b border-slate-100">
                                <span className="font-bold text-xs uppercase text-slate-600">{method}</span>
                                <span className="font-black text-sm">Rp {amount.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Log Transaksi Detail</p>
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-slate-100 text-slate-600">
                        <th className="p-3 text-left font-black uppercase text-[9px]">Tgl / Faktur</th>
                        <th className="p-3 text-left font-black uppercase text-[9px]">Pasien</th>
                        <th className="p-3 text-left font-black uppercase text-[9px]">Item Terjual</th>
                        <th className="p-3 text-right font-black uppercase text-[9px]">Total</th>
                        <th className="p-3 text-right font-black uppercase text-[9px]">Sisa</th>
                        <th className="p-3 text-center font-black uppercase text-[9px]">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((order: any, idx: number) => {
                        const invoice = order.invoices?.[0];
                        return (
                            <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="p-3">
                                    <p className="font-bold text-xs">{new Date(order.order_date).toLocaleDateString()}</p>
                                    <p className="text-[10px] font-mono text-blue-600">{invoice?.invoice_number}</p>
                                </td>
                                <td className="p-3">
                                    <p className="font-black text-slate-800 uppercase text-xs">{order.patient?.name}</p>
                                    <p className="text-[9px] text-slate-400">{order.patient?.phone}</p>
                                </td>
                                <td className="p-3 max-w-[200px]">
                                    <div className="space-y-0.5">
                                        {order.items?.map((item: any, i: number) => (
                                            <p key={i} className="text-[9px] font-medium text-slate-600 truncate">
                                                • {item.qty}x {item.product_type === 'frame' ? item.frame?.brand : item.product_type === 'lens' ? item.lens?.brand : item.product_type}
                                            </p>
                                        ))}
                                    </div>
                                </td>
                                <td className="p-3 text-right font-black text-xs">Rp {order.total_amount?.toLocaleString()}</td>
                                <td className="p-3 text-right font-bold text-[10px] text-amber-600">
                                    {invoice?.remaining > 0 ? `Rp ${invoice.remaining.toLocaleString()}` : 'Lunas'}
                                </td>
                                <td className="p-3 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                                        order.status === 'completed' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 'border-slate-200 text-slate-500'
                                    }`}>
                                        {order.status}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className="mt-12 flex justify-between items-end">
                <div className="text-[10px] text-slate-400 font-bold">
                    Generated on {new Date().toLocaleString()}<br />
                    Optik 88 Management System
                </div>
                <div className="text-center w-48">
                    <p className="mb-16 font-bold">Store Manager</p>
                    <div className="border-t-2 border-slate-900 pt-2 font-black uppercase">Signature</div>
                </div>
            </div>
        </div>
    );
});

SalesReportPrint.displayName = 'SalesReportPrint';
