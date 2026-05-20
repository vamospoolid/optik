
"use client"

import React, { useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Printer, Loader2, Maximize2, ExternalLink } from "lucide-react"
import { SalesReportPrint } from "./sales-report-print"
import { generateInvoicePDF } from "@/lib/print-utils"
import { toast } from "sonner"

interface ReportPreviewProps {
    data: any
    period: { month: string; year: string }
    isOpen: boolean
    onClose: () => void
}

export function ReportPreview({ data, period, isOpen, onClose }: ReportPreviewProps) {
    const onOpenChange = (open: boolean) => {
        if (!open) onClose()
    }
    const [generating, setGenerating] = useState(false)
    const printRef = useRef<HTMLDivElement>(null)

    const handleDownloadPDF = async () => {
        if (!data) return
        setGenerating(true)
        try {
            await generateInvoicePDF("report-to-print", `Sales-Report-${period.month}-${period.year}`, { orientation: 'l' })
            toast.success("Report PDF generated successfully")
        } catch (error) {
            console.error(error)
            toast.error("Failed to generate report PDF")
        } finally {
            setGenerating(false)
        }
    }

    const handleBrowserPrint = () => {
        window.print()
    }

    const handleOpenNewTab = () => {
        // We can't easily pass the complex data object via simple URL params if it's very large,
        // but we can pass month and year and let the new page fetch it.
        // For now, let's just make the current view full-screen and better for printing.
        window.open(`/reports/print?month=${period.month}&year=${period.year}`, '_blank')
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-none w-screen h-screen overflow-auto p-0 border-0 bg-slate-50 flex flex-col">
                <div className="sticky top-0 z-50 bg-[#1a2b3c] text-white border-b border-white/10 p-5 flex justify-between items-center shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                            <Maximize2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black italic uppercase tracking-tighter">Export Sales Report</DialogTitle>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Monthly performance summary</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={handleOpenNewTab} className="rounded-xl font-bold gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10">
                            <ExternalLink className="h-4 w-4" /> New Tab
                        </Button>
                        <Button variant="outline" onClick={handleBrowserPrint} className="rounded-xl font-bold gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10">
                            <Printer className="h-4 w-4" /> Print View
                        </Button>
                        <Button onClick={handleDownloadPDF} disabled={generating} className="bg-[#00a39d] hover:bg-[#008f8a] text-white rounded-xl font-black gap-2 shadow-lg shadow-[#00a39d]/20 transition-all active:scale-95">
                            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            {generating ? "Generating..." : "Download PDF"}
                        </Button>
                        <Button variant="ghost" onClick={onClose} className="text-white/60 hover:text-white hover:bg-white/5 rounded-xl font-bold ml-4">Close (Esc)</Button>
                    </div>
                </div>

                <div className="p-8 flex justify-center">
                    <div id="report-to-print" className="bg-white shadow-2xl p-0">
                        <SalesReportPrint data={data} period={period} ref={printRef} />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
