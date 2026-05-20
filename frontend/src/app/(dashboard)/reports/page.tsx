"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import apiClient from "@/lib/api-client"
import { useSocket } from "@/components/providers/socket-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, Users, ShoppingCart, Download, Eye, Glasses, Activity, ArrowRight, AlertTriangle, Printer, Plus, Clock, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { PrintPreview } from "@/components/print/print-preview"
import { ReportPreview } from "@/components/print/report-preview"

export default function ReportsPage() {
  const [metrics, setMetrics] = useState<any>(null)
  const [sales, setSales] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { socket } = useSocket()

  const [printOrderId, setPrintOrderId] = useState<string | null>(null)
  const [isPrintOpen, setIsPrintOpen] = useState(false)

  const [isReportOpen, setIsReportOpen] = useState(false)

  const [month, setMonth] = useState((new Date().getMonth() + 1).toString())
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [isReceivablesOpen, setIsReceivablesOpen] = useState(false)
  const router = useRouter()

  const fetchReports = useCallback(async () => {
    try {
      const [mRes, sRes] = await Promise.all([
        apiClient.get("/reports/dashboard"),
        apiClient.get(`/reports/sales?month=${month}&year=${year}`)
      ])
      setMetrics(mRes.data)
      setSales(sRes.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  useEffect(() => {
    if (socket) {
      socket.on('data_changed', (data: any) => {
        if (['Order', 'Invoice', 'Payment', 'Patient'].includes(data.model)) {
          fetchReports();
        }
      });
      return () => { socket.off('data_changed'); }
    }
  }, [socket, fetchReports])

  if (loading || !metrics || !sales) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-6 scale-in-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="flex flex-col items-center gap-1">
           <span className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Menyusun Laporan...</span>
           <span className="text-[10px] text-slate-300 uppercase tracking-widest">Mengakses Data Terenkripsi</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1 w-6 bg-primary rounded-full"></div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Analitik Bisnis</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Statistik & Laporan</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Pantau performa finansial dan operasional cabang</p>
        </div>
        
        <Button 
          onClick={() => setIsReportOpen(true)}
          className="h-12 bg-[#1a2b3c] hover:bg-slate-800 text-white rounded-xl px-6 font-bold flex gap-2 shadow-lg active:scale-95 transition-all"
        >
          <Download className="h-5 w-5" /> Cetak Laporan PDF
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {/* Revenue */}
        <Card className="border-0 bg-blue-600 rounded-2xl overflow-hidden relative shadow-xl h-44">
          <CardContent className="p-6 text-white h-full flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200 opacity-80">Total Pendapatan</p>
              <p className="text-2xl font-bold mt-2">Rp {(metrics.revenue?.total || 0).toLocaleString('id-ID')}</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold bg-white/10 w-fit px-3 py-1.5 rounded-lg border border-white/10">
              <Activity className="h-3 w-3" />
              <span>+ Rp {(metrics.revenue?.today || 0).toLocaleString('id-ID')} <span className="text-white/60 ml-1 italic">HARI INI</span></span>
            </div>
          </CardContent>
        </Card>

        {/* Orders */}
        <Card className="border-0 bg-white rounded-2xl shadow-xl h-44 overflow-hidden relative">
          <CardContent className="p-6 h-full flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Transaksi</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{metrics.orders?.total}</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-primary bg-primary/5 w-fit px-3 py-1.5 rounded-lg border border-primary/5">
              <span>{metrics.orders?.today} <span className="text-slate-400 ml-1 italic">Transaksi Baru Hari Ini</span></span>
            </div>
          </CardContent>
        </Card>

        {/* Patients */}
        <Card className="border-0 bg-white rounded-2xl shadow-xl h-44 overflow-hidden relative">
          <CardContent className="p-6 h-full flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Database Pasien</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{metrics.patients?.total}</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 bg-slate-50 w-fit px-3 py-1.5 rounded-lg">
              <Plus className="h-3 w-3 text-primary" />
              <span>{metrics.patients?.today} <span className="text-slate-400 ml-1 italic">Pendaftaran Baru</span></span>
            </div>
          </CardContent>
        </Card>

        {/* Receivables */}
        <Card 
          onClick={() => setIsReceivablesOpen(true)}
          className="border-0 bg-[#1a2b3c] rounded-2xl shadow-xl h-44 overflow-hidden relative cursor-pointer group hover:scale-[1.02] transition-all active:scale-[0.98]"
        >
          <CardContent className="p-6 text-white h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#00a39d]">Sisa Tagihan (Piutang)</p>
                <p className="text-2xl font-bold text-amber-500 mt-2">Rp {(sales.summary?.total_receivables || 0).toLocaleString('id-ID')}</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-amber-500" />
              </div>
            </div>
            <div className="text-[10px] font-bold text-amber-500/80 bg-amber-500/10 w-fit px-3 py-1.5 rounded-lg border border-amber-500/10 uppercase italic">
              BUTUH PENAGIHAN
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-0 shadow-xl rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Analisis Per Sektor</CardTitle>
                  <CardDescription className="text-xs font-medium text-slate-500 mt-1">
                    Distribusi penjualan berdasarkan kategori produk
                  </CardDescription>
                </div>
                <div className="flex gap-2 p-1.5 bg-slate-50 rounded-xl">
                  <Select value={month} onValueChange={(val) => val && setMonth(val)}>
                    <SelectTrigger className="w-32 h-9 border-0 bg-transparent text-[10px] font-bold uppercase tracking-wider"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"].map((m, i) => (
                        <SelectItem key={i+1} value={(i+1).toString()} className="text-[10px] font-bold uppercase">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={year} onValueChange={(val) => val && setYear(val)}>
                    <SelectTrigger className="w-24 h-9 border-0 bg-transparent text-[10px] font-bold uppercase tracking-wider"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2026" className="text-[10px] font-bold">2026</SelectItem>
                      <SelectItem value="2025" className="text-[10px] font-bold">2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-slate-900"><Glasses className="w-4 h-4" /></div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Frame</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">Rp {(sales.summary?.breakdown?.frame_sales || 0).toLocaleString('id-ID')}</p>
                </div>
                
                <div className="bg-sky-50 p-6 rounded-2xl border border-sky-100/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-sky-600"><Eye className="w-4 h-4" /></div>
                    <span className="text-[10px] font-bold uppercase text-sky-700/60">Lensa</span>
                  </div>
                  <p className="text-xl font-bold text-sky-900">Rp {(sales.summary?.breakdown?.lens_sales || 0).toLocaleString('id-ID')}</p>
                </div>

                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-600"><BarChart3 className="w-4 h-4" /></div>
                    <span className="text-[10px] font-bold uppercase text-emerald-700/60">Jasa</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-900">Rp {(sales.summary?.breakdown?.service_sales || 0).toLocaleString('id-ID')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stok Menipis */}
          <Card className="border-0 bg-red-600 rounded-2xl shadow-xl overflow-hidden relative text-white">
             <CardHeader className="p-6 border-b border-white/10">
                <CardTitle className="text-lg font-bold flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5" /> Stok Menipis (Hampir Habis)
                </CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                <div className="grid md:grid-cols-2 divide-x divide-white/10">
                  <div className="p-6 space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-200 opacity-60">Katalog Frame</p>
                    {metrics.alerts?.low_frames?.length === 0 ? (
                      <p className="text-xs font-semibold py-4 opacity-40">Semua stok frame masih aman</p>
                    ) : (
                      <div className="space-y-2">
                        {metrics.alerts?.low_frames?.slice(0, 3).map((s: any) => (
                          <div key={s.id} className="flex justify-between items-center bg-white/10 p-4 rounded-xl">
                            <div>
                               <p className="text-sm font-bold">{s.frame?.brand}</p>
                               <p className="text-[10px] font-medium text-white/60">{s.frame?.model}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-lg font-bold leading-none">{s.quantity}</p>
                               <p className="text-[9px] font-bold uppercase opacity-60">Unit</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-200 opacity-60">Stok Lensa Lab</p>
                    {metrics.alerts?.low_lenses?.length === 0 ? (
                      <p className="text-xs font-semibold py-4 opacity-40">Suplai lab masih memadai</p>
                    ) : (
                      <div className="space-y-2">
                        {metrics.alerts?.low_lenses?.slice(0, 3).map((s: any) => (
                          <div key={s.id} className="flex justify-between items-center bg-white/10 p-4 rounded-xl">
                            <div>
                               <p className="text-sm font-bold">{s.lens?.brand}</p>
                               <p className="text-[10px] font-medium text-white/60">{s.lens?.type}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-lg font-bold leading-none">{s.quantity}</p>
                               <p className="text-[9px] font-bold uppercase opacity-60">Pcs</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Alur Aktivitas */}
        <Card className="border-0 shadow-xl rounded-2xl bg-white overflow-hidden flex flex-col h-full">
          <CardHeader className="p-6 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-slate-900">Alur Transaksi</CardTitle>
              <Badge className="bg-primary/10 text-primary border-0 font-bold text-[9px]">Live Data</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-2 flex-1 overflow-auto">
            {metrics.recent_orders?.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center p-8 opacity-20">
                 <Activity className="h-12 w-12 mb-4" />
                 <p className="text-xs font-bold uppercase tracking-widest text-center">Belum ada aktivitas</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {metrics.recent_orders?.slice(0, 10).map((o: any) => {
                  const invoice = o.invoices?.[0]
                  return (
                    <div key={o.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-all rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                          <ShoppingCart className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{o.patient?.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {new Date(o.order_date).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">Rp {(invoice?.total_amount || 0).toLocaleString('id-ID')}</p>
                          <span className={`text-[9px] font-bold ${invoice?.remaining > 0 ? 'text-amber-500' : 'text-emerald-500'} uppercase tracking-tighter`}>
                             {invoice?.remaining > 0 ? 'Hutang' : 'Lunas'}
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setPrintOrderId(o.id); setIsPrintOpen(true); }}
                          className="h-8 w-8 rounded-lg hover:bg-white shadow-sm opacity-0 group-hover:opacity-100"
                        >
                          <Printer className="h-4 w-4 text-slate-400" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
          <div className="p-4 bg-slate-50 border-t border-slate-100">
             <Button variant="ghost" className="w-full text-xs font-bold text-slate-400">Lihat Seluruh Aktivitas</Button>
          </div>
        </Card>
      </div>

      <PrintPreview orderId={printOrderId} isOpen={isPrintOpen} onOpenChange={setIsPrintOpen} />
      <ReportPreview
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        data={sales}
        period={{ month, year }}
      />

      {/* Receivables Detail Dialog */}
      <Dialog open={isReceivablesOpen} onOpenChange={setIsReceivablesOpen}>
        <DialogContent className="sm:max-w-[1000px] w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-0 rounded-3xl shadow-2xl">
          <div className="bg-[#1a2b3c] p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="relative z-10">
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Draft Piutang Pelanggan</DialogTitle>
              <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">
                Daftar transaksi yang belum lunas pembayarannya ({month}/{year})
              </DialogDescription>
            </div>
          </div>

          <div className="p-8 bg-slate-50 min-h-[400px]">
            <div className="flex justify-between items-end mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
               <div>
                  <h3 className="text-[10px] font-black italic uppercase tracking-widest text-slate-400">Total Piutang Periode Ini</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                    <p className="text-sm font-bold text-slate-600">Memerlukan Penagihan Segera</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-3xl font-black text-[#1a2b3c] tracking-tighter">
                    <span className="text-amber-500 mr-2 italic">Rp</span>
                    {(sales.summary?.total_receivables || 0).toLocaleString('id-ID')}
                  </p>
               </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase text-slate-500 pl-8 h-12">Tanggal</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-500 h-12">Nama Pasien</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-500 h-12">Nomor Invoice</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-500 text-right h-12">Total Tagihan</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-amber-600 text-right pr-8 h-12">Sisa Piutang</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.data?.filter((o: any) => o.invoices?.[0]?.remaining > 0).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center bg-white/50">
                        <div className="flex flex-col items-center justify-center gap-3 opacity-20">
                          <Activity className="h-10 w-10" />
                          <p className="text-xs font-black uppercase tracking-widest">Tidak ada piutang aktif</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.data?.filter((o: any) => o.invoices?.[0]?.remaining > 0).map((o: any) => {
                      const inv = o.invoices?.[0]
                      return (
                        <TableRow 
                          key={o.id} 
                          className="hover:bg-blue-50/50 cursor-pointer transition-all group" 
                          onClick={() => {
                            setIsReceivablesOpen(false)
                            router.push(`/invoices/${o.id}`)
                          }}
                        >
                          <TableCell className="pl-8 text-[11px] font-bold text-slate-400">
                            {new Date(o.order_date).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})}
                          </TableCell>
                          <TableCell className="font-bold text-slate-800 text-sm">
                            {o.patient?.name}
                          </TableCell>
                          <TableCell className="font-mono text-[10px] text-slate-500 bg-slate-50 rounded px-2 w-fit">
                            {inv?.invoice_number}
                          </TableCell>
                          <TableCell className="text-right text-xs font-bold text-slate-500">
                            Rp {inv?.total_amount.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-sm font-black text-amber-600 italic tracking-tighter">
                                Rp {inv?.remaining.toLocaleString('id-ID')}
                              </span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[8px] font-black text-blue-500 uppercase">Input Bayar</span>
                                <ArrowRight className="h-2 w-2 text-blue-500" />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-8 p-5 bg-[#1a2b3c] rounded-2xl border border-white/5 flex items-start gap-4">
               <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <AlertTriangle className="h-6 w-6" />
               </div>
               <div className="space-y-1">
                  <p className="text-[11px] font-black text-white uppercase tracking-wider">Instruksi Penagihan</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic pr-10">
                    Gunakan daftar ini untuk memantau saldo tertahan. Klik pada baris transaksi untuk melihat rincian nota atau memproses pelunasan sisa tagihan di terminal POS.
                  </p>
               </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
