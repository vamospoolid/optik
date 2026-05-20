
"use client"

import React, { useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, X } from "lucide-react"
import { PrescriptionPrint } from "./prescription-print"

interface PrescriptionPrintPreviewProps {
    data: any
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export function PrescriptionPrintPreview({ data, isOpen, onOpenChange }: PrescriptionPrintPreviewProps) {
    const printRef = useRef<HTMLDivElement>(null)

    const handlePrint = () => {
        window.print()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] w-[95vw] max-h-[95vh] overflow-y-auto p-0 border-0 bg-slate-100">
                <div className="sticky top-0 z-50 bg-[#1a2b3c] p-4 flex justify-between items-center text-white no-print">
                    <div>
                        <h2 className="text-xl font-black italic uppercase flex items-center gap-2">
                             <Printer className="h-5 w-5 text-[#00a39d]" /> Pratinjau Cetak Resep
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400">Pastikan printer terhubung dan ukuran kertas sesuai (A4 / Folio)</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-white hover:bg-white/10 rounded-xl">
                            <X className="h-5 w-5" />
                        </Button>
                        <Button onClick={handlePrint} className="bg-[#00a39d] hover:bg-[#008f8a] text-white rounded-xl font-black px-8">
                            CETAK SEKARANG
                        </Button>
                    </div>
                </div>

                <div className="p-12 flex justify-center bg-slate-100 min-h-screen">
                    <div className="bg-white shadow-2xl p-0 h-fit scale-[0.85] origin-top">
                        <PrescriptionPrint data={data} ref={printRef} />
                    </div>
                </div>

                <style jsx global>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #prescription-print-area, #prescription-print-area * {
                            visibility: visible;
                        }
                        #prescription-print-area {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    )
}
