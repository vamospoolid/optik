
import React from 'react';

interface PrescriptionPrintProps {
    data: any;
}

export const PrescriptionPrint = React.forwardRef<HTMLDivElement, PrescriptionPrintProps>(({ data }, ref) => {
    if (!data) return null;

    const patient = data.examination?.patient;
    const details = data.details || [];
    
    const getPrescriptionValue = (eye: 'R' | 'L', field: string) => {
        const detail = details.find((d: any) => d.eye === eye);
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
        <div id="prescription-print-area" ref={ref} className="p-12 bg-white text-black font-serif w-[210mm] min-h-[148mm] mx-auto text-sm leading-relaxed border-[12px] border-double border-slate-200" style={{ color: '#000' }}>
            {/* Header Section */}
            <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-8">
                <div className="flex gap-4">
                    <div className="w-16 h-16 border-2 border-black flex items-center justify-center font-bold text-2xl">
                        88
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tighter">OPTIK 88</h1>
                        <p className="text-[10px] leading-tight max-w-[200px]">
                            Jl. H. Andi Depu Ruko No. 1<br />
                            (Samping Kantor BKKBN / MANDALA Finance)<br />
                            Hp. 0821 8887 6686<br />
                            POLEWALI - SUL-BAR
                        </p>
                    </div>
                </div>
                
                <div className="text-right">
                    <h2 className="text-lg font-bold tracking-widest uppercase underline">SALINAN RESEP</h2>
                    <p className="text-[10px] font-bold mt-1">Tanggal: {new Date(data.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="text-[10px] text-slate-500 font-mono">No. Reg: {data.id.substring(0,8).toUpperCase()}</p>
                </div>
            </div>

            {/* Content Body */}
            <div className="space-y-4 mb-8">
                <div className="flex gap-2 text-lg">
                    <span className="w-24 font-bold uppercase">PASIEN</span>
                    <span className="flex-1 border-b border-dotted border-black px-2 font-bold italic">
                        {patient?.name}
                    </span>
                </div>
                <div className="flex gap-2">
                    <span className="w-24 font-bold uppercase">ALAMAT</span>
                    <span className="flex-1 border-b border-dotted border-black px-2">
                        {patient?.address || '-'}
                    </span>
                </div>
            </div>

            {/* Table Section */}
            <div className="mb-8">
                <table className="w-full border-collapse border-2 border-black text-center text-sm font-bold">
                    <thead className="bg-[#1a2b3c] text-white">
                        <tr>
                            <th className="border border-black py-3">MATA</th>
                            <th className="border border-black">SPH</th>
                            <th className="border border-black">CYL</th>
                            <th className="border border-black">AXIS</th>
                            <th className="border border-black">ADD</th>
                            <th className="border border-black">PD</th>
                        </tr>
                    </thead>
                    <tbody className="text-lg">
                        <tr className="h-16">
                            <td className="border border-black font-black">R (Kanan)</td>
                            <td className="border border-black font-mono">{getPrescriptionValue('R', 'sph')}</td>
                            <td className="border border-black font-mono">{getPrescriptionValue('R', 'cyl')}</td>
                            <td className="border border-black font-mono">{getPrescriptionValue('R', 'axis')}°</td>
                            <td className="border border-black font-mono">{getPrescriptionValue('R', 'add')}</td>
                            <td className="border border-black font-black" rowSpan={2}>{data.pd || '-'} <small className="text-[10px] font-normal">mm</small></td>
                        </tr>
                        <tr className="h-16">
                            <td className="border border-black font-black">L (Kiri)</td>
                            <td className="border border-black font-mono">{getPrescriptionValue('L', 'sph')}</td>
                            <td className="border border-black font-mono">{getPrescriptionValue('L', 'cyl')}</td>
                            <td className="border border-black font-mono">{getPrescriptionValue('L', 'axis')}°</td>
                            <td className="border border-black font-mono">{getPrescriptionValue('L', 'add')}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-2 gap-12 mt-12">
                <div className="space-y-4">
                    <div className="flex gap-2 items-center">
                        <span className="font-bold uppercase text-xs">TIPE LENSA:</span>
                        <span className="border-b border-black flex-1 font-bold italic uppercase">{data.type}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                        <span className="font-bold uppercase text-xs">SUMBER:</span>
                        <span className="border-b border-black flex-1 font-bold italic">{data.examination?.doctor_name || 'RS / Klinik'}</span>
                    </div>
                    
                    <div className="mt-8 text-[9px] leading-tight text-slate-500 italic">
                        * Salinan resep ini berlaku sebagai rekam medis internal Optik 88.<br />
                        * Harap simpan kartu ini untuk kemudahan pemesanan selanjutnya.
                    </div>
                </div>

                <div className="text-center space-y-20 pt-4">
                    <p className="font-bold text-xs uppercase underline">Optometris / Penanggung Jawab</p>
                    <div className="mx-auto w-32 border-b-2 border-black italic font-bold">
                        ( .......................... )
                    </div>
                </div>
            </div>
            
            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { margin: 0; padding: 0; background: white; }
                    .no-print { display: none !important; }
                }
            `}</style>
        </div>
    );
});

PrescriptionPrint.displayName = 'PrescriptionPrint';
