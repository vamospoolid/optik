
import React from 'react';

interface InvoicePrintProps {
    data: any;
    branchSettings?: any;
}

export const InvoicePrint = React.forwardRef<HTMLDivElement, InvoicePrintProps>(({ data, branchSettings }, ref) => {
    if (!data) return null;

    const prescription = data.prescription;
    const items = data.items || [];
    const invoice = data.invoices?.[0];
    const patient = data.patient;

    const getPrescriptionValue = (eye: 'R' | 'L', field: string) => {
        const detail = prescription?.details?.find((d: any) => d.eye === eye);
        if (!detail) return '-';
        const key = field === 'add' ? 'add_power' : field;
        const val = detail[key];
        if (val === null || val === undefined) return '-';
        if (field === 'sph' || field === 'cyl' || field === 'add') {
            return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
        }
        return val || '-';
    };

    return (
        <div ref={ref} className="p-8 bg-white text-black font-serif w-[210mm] min-h-[148mm] mx-auto text-sm leading-relaxed" style={{ color: '#000' }}>
            {/* Header Section */}
            <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
                <div className="flex gap-4">
                    {branchSettings?.logo_url ? (
                        <img src={branchSettings.logo_url} alt="Logo" className="w-16 h-16 object-contain" />
                    ) : (
                        <div className="w-16 h-16 border-2 border-black flex items-center justify-center font-bold text-2xl">
                            88
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold tracking-tighter uppercase">{branchSettings?.name || 'OPTIK 88'}</h1>
                        <p className="text-[10px] leading-tight max-w-[200px] whitespace-pre-wrap">
                            {branchSettings?.address || 'Jl. H. Andi Depu Ruko No. 1, Polewali'}<br />
                            Hp. {branchSettings?.phone || '0821 8887 6686'}
                        </p>
                    </div>
                </div>
                
                <div className="text-center border border-black p-2 bg-slate-50">
                    <p className="text-[10px] font-bold uppercase">Jam Buka : 08.30 s/d 19.00</p>
                    <p className="text-[10px] font-bold">SENIN - SABTU</p>
                    <p className="text-[10px]">Kecuali</p>
                    <p className="text-[10px] font-bold text-red-600">MINGGU / Raya Tutup</p>
                </div>

                <div className="text-right max-w-[220px]">
                    <p className="text-[11px] font-bold">081 2112 688 (JEFF)</p>
                    <p className="text-[10px] italic">MELAYANI PESERTA BPJS</p>
                    <p className="text-[9px]">Menjual Soft Lens Ukuran & Kosmetik</p>
                    <p className="text-[9px]">(Menjual Alat Bantu Dengar)</p>
                </div>
            </div>

            {/* Title & Number */}
            <div className="text-center mb-6 relative">
                <h2 className="text-xl font-bold underline uppercase tracking-widest">TANDA TERIMA</h2>
                <div className="absolute right-0 top-0 text-lg">
                    No. <span className="font-mono text-red-600 font-bold">{invoice?.invoice_number?.split('-').pop() || '000000'}</span>
                </div>
            </div>

            {/* Content Body */}
            <div className="space-y-3 mb-6">
                <div className="flex gap-2">
                    <span className="w-16 font-bold uppercase">NAMA</span>
                    <span className="flex-1 border-b border-dotted border-black px-2 font-bold italic">
                        {patient?.name} {(patient?.address) ? `(${patient.address})` : ''}
                    </span>
                </div>

                <div className="flex gap-2">
                    <span className="w-16 font-bold uppercase text-[11px]">Frame</span>
                    <span className="flex-1 border-b border-dotted border-black px-2 italic">
                        {items.find((i: any) => i.product_type === 'frame')?.frame?.brand} {items.find((i: any) => i.product_type === 'frame')?.frame?.model}
                    </span>
                </div>

                <div className="flex gap-2">
                    <span className="w-16 font-bold uppercase text-[11px]">Lensa</span>
                    <span className="flex-1 border-b border-dotted border-black px-2 italic">
                        {items.find((i: any) => i.product_type === 'lens')?.lens?.brand} {items.find((i: any) => i.product_type === 'lens')?.lens?.type}
                    </span>
                </div>

                <div className="flex gap-2">
                    <span className="w-16 font-bold uppercase text-[11px]">Keterangan</span>
                    <span className="flex-1 border-b border-dotted border-black px-2">
                        {data.notes || '-'}
                    </span>
                </div>
            </div>

            {/* Table & Footer Grid */}
            <div className="grid grid-cols-2 gap-8 items-start">
                {/* Left Side: Prescription Table & Perhatian */}
                <div>
                    <table className="w-full border-collapse border border-black text-center text-xs font-bold mb-4">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="border border-black py-1">MATA</th>
                                <th className="border border-black">SPH</th>
                                <th className="border border-black">CYL</th>
                                <th className="border border-black">AXIS</th>
                                <th className="border border-black">ADD</th>
                                <th className="border border-black">PD</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-black py-2 font-black">R</td>
                                <td className="border border-black italic">{getPrescriptionValue('R', 'sph')}</td>
                                <td className="border border-black italic">{getPrescriptionValue('R', 'cyl')}</td>
                                <td className="border border-black italic">{getPrescriptionValue('R', 'axis')}</td>
                                <td className="border border-black italic">{getPrescriptionValue('R', 'add')}</td>
                                <td className="border border-black italic" rowSpan={2}>{prescription?.pd || '-'}</td>
                            </tr>
                            <tr>
                                <td className="border border-black py-2 font-black">L</td>
                                <td className="border border-black italic">{getPrescriptionValue('L', 'sph')}</td>
                                <td className="border border-black italic">{getPrescriptionValue('L', 'cyl')}</td>
                                <td className="border border-black italic">{getPrescriptionValue('L', 'axis')}</td>
                                <td className="border border-black italic">{getPrescriptionValue('L', 'add')}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="text-[9px] leading-tight space-y-1">
                        <p className="font-bold">Perhatian :</p>
                        <p>* Pesanan yang tidak diambil waktu 2 bulan, uang mukanya dianggap hilang</p>
                        <p>* Pemesan Lensa/frame dengan menggunakan frame/lensa milik sendiri tidak ditanggung bila rusak.</p>
                        <p>* Barang yang sudah dipesan tidak dapat ditukar / dikembalikan.</p>
                        <p className="font-black text-[12px] italic mt-2">UANG MUKA MIN. 50%</p>
                    </div>
                </div>

                {/* Right Side: Financial Details */}
                <div className="space-y-3 font-bold">
                    <div className="flex justify-between border-b border-black pb-1">
                        <div className="flex flex-col">
                            <span>Polewali</span>
                            <span className="text-[10px]">Tgl. {new Date(data.order_date).toLocaleDateString('id-ID')}</span>
                        </div>
                        <div className="flex flex-col text-right">
                            <span>Selesai</span>
                            <span className="text-[10px]">Tgl. {data.completed_at ? new Date(data.completed_at).toLocaleDateString('id-ID') : '..........'}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-lg">
                            <span>Harga Rp.</span>
                            <span className="font-mono text-xl">{invoice?.total_amount?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                            <span>BPJS Rp.</span>
                            <span className="font-mono">----------</span>
                        </div>
                        <div className="flex justify-between items-center text-lg">
                            <span>Bayar Rp.</span>
                            <span className="font-mono text-xl">{(invoice?.total_amount - (invoice?.remaining || 0))?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xl pt-2 border-t-2 border-double border-black">
                            <span>Sisa Rp.</span>
                            <span className="font-mono text-2xl text-red-600 underline">
                                {invoice?.remaining?.toLocaleString() || '0'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { margin: 0; }
                }
            `}</style>
        </div>
    );
});

InvoicePrint.displayName = 'InvoicePrint';
