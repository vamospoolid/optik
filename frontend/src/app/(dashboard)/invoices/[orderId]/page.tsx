"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import apiClient from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Printer, Download, ArrowLeft, Loader2, FileText, CheckCircle2 } from "lucide-react"
import { InvoicePrint } from "@/components/print/invoice-print"
import { useReactToPrint } from "react-to-print"
import { toast } from "sonner"

export default function InvoicePage() {
    const params = useParams()
    const router = useRouter()
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const printRef = useRef<HTMLDivElement>(null)

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Nota-${order?.invoices?.[0]?.invoice_number || 'Optik88'}`,
    })

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await apiClient.get(`/invoices/order/${params.orderId}`)
                setOrder(res.data)
            } catch (error) {
                toast.error("Gagal memuat rincian nota")
            } finally {
                setLoading(false)
            }
        }
        if (params.orderId) fetchOrder()
    }, [params.orderId])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
                <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Menyiapkan Nota...</p>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="text-center py-20 px-4">
                <FileText className="h-16 w-16 mx-auto text-slate-200 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 uppercase">Nota Tidak Ditemukan</h2>
                <Button onClick={() => router.back()} className="mt-4 gap-2 rounded-xl">
                    <ArrowLeft className="h-4 w-4" /> Kembali
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 px-4">
            {/* Control Panel */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-none">Nota Siap</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-1.5 font-mono">
                            {order.invoices?.[0]?.invoice_number} • {order.patient?.name}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <Button 
                        onClick={() => router.back()} 
                        variant="outline" 
                        className="flex-1 md:flex-none h-11 rounded-xl font-bold text-xs border-slate-200"
                    >
                        <ArrowLeft className="h-3.5 w-3.5 mr-2" /> Kembali
                    </Button>
                    <Button 
                        onClick={handlePrint} 
                        className="flex-1 md:flex-none h-11 bg-slate-900 hover:bg-black text-white px-6 rounded-xl font-bold text-xs shadow-lg"
                    >
                        <Printer className="h-3.5 w-3.5 mr-2" /> Cetak Nota
                    </Button>
                </div>
            </div>

            {/* Print Preview Container */}
            <div className="flex justify-center bg-slate-50 p-4 md:p-8 rounded-2xl border border-slate-200 overflow-x-auto">
                <div className="shadow-2xl scale-75 md:scale-100 origin-top bg-white">
                    <InvoicePrint ref={printRef} data={order} />
                </div>
            </div>

            <div className="max-w-2xl mx-auto text-center space-y-2 opacity-60">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tips Pencetakan</p>
                <p className="text-[10px] text-slate-500 font-medium">
                    Untuk hasil terbaik, pastikan opsi "Background Graphics" aktif pada pengaturan cetak browser Anda. 
                    Template ini diformat untuk Kertas A5 (Landscape).
                </p>
            </div>
        </div>
    )
}
