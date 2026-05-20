"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import apiClient from "@/lib/api-client"
import { SalesReportPrint } from "@/components/print/sales-report-print"
import { Loader2 } from "lucide-react"

export default function ReportPrintPage() {
    const searchParams = useSearchParams()
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            if (!month || !year) return
            try {
                const res = await apiClient.get(`/reports/sales?month=${month}&year=${year}`)
                setData(res.data)
            } catch (error) {
                console.error("Failed to fetch report data:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [month, year])

    useEffect(() => {
        if (!loading && data) {
            // Auto-print
            setTimeout(() => window.print(), 1000)
        }
    }, [loading, data])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <Loader2 className="h-10 w-10 animate-spin text-slate-300" />
            </div>
        )
    }

    if (!data) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <p className="text-slate-400 font-bold uppercase tracking-widest">Laporan tidak ditemukan</p>
            </div>
        )
    }

    return (
        <div className="bg-white min-h-screen p-0 sm:p-10 flex justify-center">
            <SalesReportPrint data={data} period={{ month: month || "", year: year || "" }} />
        </div>
    )
}
