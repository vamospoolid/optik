
"use client"

import React, { useRef, useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Printer, Loader2, Share2, X } from "lucide-react"
import { InvoicePrint } from "./invoice-print"
import apiClient from "@/lib/api-client"
import { generateInvoicePDF } from "@/lib/print-utils"
import { toast } from "sonner"

interface PrintPreviewProps {
    orderId: string | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export function PrintPreview({ orderId, isOpen, onOpenChange }: PrintPreviewProps) {
    const [data, setData] = useState<any>(null)
    const [branchSettings, setBranchSettings] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const printRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen && orderId) {
            fetchOrderDetails()
            fetchBranchSettings()
        } else {
            setData(null)
            setBranchSettings(null)
        }
    }, [isOpen, orderId])

    const fetchOrderDetails = async () => {
        setLoading(true)
        try {
            const res = await apiClient.get(`/orders/${orderId}`)
            setData(res.data)
        } catch (error) {
            toast.error("Failed to load order details for printing")
            onOpenChange(false)
        } finally {
            setLoading(false)
        }
    }

    const fetchBranchSettings = async () => {
        try {
            const res = await apiClient.get("/settings/branch")
            setBranchSettings(res.data)
        } catch (error) {
            console.error("Failed to fetch branch settings", error)
        }
    }

    const handleDownloadPDF = async () => {
        if (!data) return
        setGenerating(true)
        try {
            const invoiceNumber = data.invoices?.[0]?.invoice_number || "invoice"
            await generateInvoicePDF("invoice-to-print", `Nota-${invoiceNumber}`)
            toast.success("PDF generated successfully")
        } catch (error) {
            console.error(error)
            toast.error("Failed to generate PDF")
        } finally {
            setGenerating(false)
        }
    }

    const handleSendWhatsApp = () => {
        if (!data) return
        const phone = data.patient?.phone
        if (!phone) {
            toast.error("Nomor telepon pasien tidak tersedia")
            return
        }

        const cleanPhone = phone.replace(/[^0-9]/g, "")
        const formattedPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone

        const invoiceNumber = data.invoices?.[0]?.invoice_number || ""
        const totalAmount = data.total_amount?.toLocaleString("id-ID") || "0"
        const dpAmount = data.invoices?.[0]?.dp_amount?.toLocaleString("id-ID") || "0"
        const remaining = data.invoices?.[0]?.remaining?.toLocaleString("id-ID") || "0"
        
        let itemsStr = ""
        if (data.items && data.items.length > 0) {
            itemsStr = "\nDetail Item:\n" + data.items.map((item: any) => {
                const name = item.product_type === 'frame' ? `${item.frame?.brand} ${item.frame?.model || ''}` : 
                             item.product_type === 'lens' ? `${item.lens?.brand} - ${item.lens?.type || ''}` : 
                             "Layanan Kustom"
                return `- ${item.qty}x ${name} (Rp ${item.price.toLocaleString("id-ID")})`
            }).join("\n")
        }

        const text = encodeURIComponent(
            `Halo *${data.patient?.name}*,\n\nTerima kasih telah berbelanja di *Optik 88*.\n` +
            `Berikut adalah ringkasan nota pesanan Anda:\n\n` +
            `• No. Faktur: *${invoiceNumber}*\n` +
            `• Tanggal: *${new Date(data.order_date).toLocaleDateString('id-ID')}*\n` +
            `${itemsStr}\n\n` +
            `• Total Tagihan: *Rp ${totalAmount}*\n` +
            `• Uang Muka (DP): *Rp ${dpAmount}*\n` +
            `• Sisa Pelunasan: *Rp ${remaining}*\n\n` +
            `*Catatan:* Harap tunjukkan pesan WhatsApp ini saat melakukan pengambilan kacamata Anda.\n\n` +
            `Salam hangat,\n*Optik 88*`
        )

        window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${text}`, "_blank")
    }

    const handleBrowserPrint = () => {
        window.print()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] w-[95vw] max-h-[95vh] overflow-y-auto p-0 border-0 bg-slate-200/50">
                <div className="sticky top-0 z-50 bg-white border-b p-4 flex justify-between items-center">
                    <div>
                        <DialogTitle className="text-xl font-black italic uppercase">Print Preview</DialogTitle>
                        <p className="text-xs font-bold text-slate-400">Review before generating PDF or printing</p>
                    </div>
                    <div className="flex gap-2">
                        {data?.patient?.phone && (
                            <Button onClick={handleSendWhatsApp} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold gap-2">
                                <Share2 className="h-4 w-4" /> Kirim WA
                            </Button>
                        )}
                        <Button variant="outline" onClick={handleBrowserPrint} className="rounded-xl font-bold gap-2">
                            <Printer className="h-4 w-4" /> Print Browser
                        </Button>
                        <Button onClick={handleDownloadPDF} disabled={generating || loading} className="bg-slate-900 hover:bg-black text-white rounded-xl font-black gap-2">
                            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            {generating ? "Generating..." : "Download PDF"}
                        </Button>
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 font-bold px-3 border border-transparent hover:border-red-200">
                            <X className="h-4 w-4 mr-1" /> Tutup
                        </Button>
                    </div>
                </div>

                <div className="p-8 flex justify-center">
                    {loading ? (
                        <div className="p-20 text-center">
                            <Loader2 className="h-10 w-10 animate-spin mx-auto text-slate-300" />
                            <p className="mt-4 font-bold text-slate-400">Fetching order data...</p>
                        </div>
                    ) : (
                        <div id="invoice-to-print" className="bg-white shadow-2xl p-0">
                            <InvoicePrint data={data} branchSettings={branchSettings} ref={printRef} />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
