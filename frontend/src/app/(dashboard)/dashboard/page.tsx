"use client"

import { useEffect, useState, useCallback } from "react"
import apiClient from "@/lib/api-client"
import { useSocket } from "@/components/providers/socket-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, ShoppingCart, DollarSign, Activity, ArrowUpRight, TrendingUp, Plus, Clock, Package, AlertTriangle, FileText, ChevronRight } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const data = [
  { name: 'Mei', umum: 400, bpjs: 240, total: 640 },
  { name: 'Jun', umum: 300, bpjs: 139, total: 439 },
  { name: 'Jul', umum: 200, bpjs: 980, total: 1180 },
  { name: 'Agt', umum: 278, bpjs: 390, total: 668 },
  { name: 'Sep', umum: 189, bpjs: 480, total: 669 },
  { name: 'Okt', umum: 239, bpjs: 380, total: 619 },
  { name: 'Nov', umum: 349, bpjs: 430, total: 779 },
]

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { NewOrderDialog } from "@/components/dialogs/new-order-dialog"
import { NewPatientDialog } from "@/components/dialogs/new-patient-dialog"
import { NewExaminationDialog } from "@/components/dialogs/new-examination-dialog"
import { PrintPreview } from "@/components/print/print-preview"
import POSTerminal from "@/components/pos/pos-terminal"

function DashboardOverview() {
  const [metrics, setMetrics] = useState<any>(null)
  const [crmAlerts, setCrmAlerts] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { socket } = useSocket()
  const router = useRouter()

  // New Dialog States
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false)
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false)
  const [isNewExamOpen, setIsNewExamOpen] = useState(false)
  const [isPrintOpen, setIsPrintOpen] = useState(false)
  const [orderIdForPrint, setOrderIdForPrint] = useState<string | null>(null)
  const [selectedPatientId, setSelectedPatientId] = useState("")
  
  // Redirect / Guided Flow State
  const searchParams = useSearchParams()
  const [redirectPatientId, setRedirectPatientId] = useState("")
  const [redirectPrescriptionId, setRedirectPrescriptionId] = useState("")

  useEffect(() => {
    const pId = searchParams.get('patientId')
    const prId = searchParams.get('prescriptionId')
    const openOrder = searchParams.get('openOrder') === 'true'

    if (pId && prId && openOrder) {
      router.push(`/orders?patientId=${pId}&prescriptionId=${prId}`)
    }
  }, [searchParams, router])

  const fetchMetrics = useCallback(async () => {
    try {
      const [mRes, cRes] = await Promise.all([
        apiClient.get("/reports/dashboard"),
        apiClient.get("/notifications/alerts")
      ])
      setMetrics(mRes.data)
      setCrmAlerts(cRes.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  useEffect(() => {
    if (socket) {
      socket.on('data_changed', (data: any) => {
        fetchMetrics();
      });
      return () => { socket.off('data_changed'); }
    }
  }, [socket, fetchMetrics])

  useEffect(() => {
    const handlePosCompleted = () => {
      fetchMetrics()
    }
    window.addEventListener("pos_transaction_completed", handlePosCompleted)
    return () => {
      window.removeEventListener("pos_transaction_completed", handlePosCompleted)
    }
  }, [fetchMetrics])

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-6">
        <Activity className="h-10 w-10 text-[#1a2b3c] animate-pulse" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat Dashboard...</span>
      </div>
    )
  }

  const KpiCard = ({ title, value, sub, icon: Icon, trendColor, bg, onClick }: any) => (
    <Card 
      onClick={onClick}
      className={`${bg} border-none shadow-sm rounded-xl h-32 flex flex-col justify-between p-5 cursor-pointer hover:scale-[1.02] transition-transform`}
    >
      <div className="flex justify-between items-start">
        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">{title}</span>
        <Icon className="h-4 w-4 text-slate-400 opacity-50" />
      </div>
      <div>
        <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10px] font-medium text-slate-400">{sub}</span>
          {trendColor && <div className={`h-1.5 w-1.5 rounded-full ${trendColor} animate-pulse`}></div>}
        </div>
      </div>
    </Card>
  )

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      {/* Top Row KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard 
          title="Penjualan Hari Ini" 
          value={`Rp ${(metrics.revenue?.today || 0).toLocaleString('id-ID')}`}
          sub="Lihat Laporan"
          icon={DollarSign}
          bg="bg-[#1a2b3c]"
          trendColor="bg-emerald-400"
          onClick={() => router.push('/reports')}
        />
        <KpiCard 
          title="Pengeluaran Hari Ini" 
          value={`Rp ${(metrics.expenses?.today || 0).toLocaleString('id-ID')}`}
          sub="Kelola Pengeluaran"
          icon={Activity}
          bg="bg-[#1a2b3c]"
          trendColor="bg-red-400"
          onClick={() => router.push('/expenses')}
        />
        <KpiCard 
          title="Laba Kotor" 
          value={`Rp ${(metrics.revenue?.today - (metrics.expenses?.today || 0)).toLocaleString('id-ID')}`}
          sub="Estimasi Harian"
          icon={TrendingUp}
          bg="bg-[#1a2b3c]"
          trendColor="bg-emerald-400"
          onClick={() => router.push('/reports')}
        />
        <KpiCard 
          title="Klaim BPJS Pending" 
          value={metrics.bpjs?.pending || 0}
          sub="Verifikasi Klaim"
          icon={Activity}
          bg="bg-[#1a2b3c]"
          trendColor="bg-sky-400"
          onClick={() => router.push('/bpjs')}
        />
      </div>

      {/* Guided Workflow Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm overflow-hidden relative">
         <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
            {/* Alur Kerja */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
              <div className="shrink-0">
                <h3 className="text-sm font-black italic uppercase tracking-tighter text-slate-800">Alur Kerja Terpadu</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Panduan operasional harian</p>
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                 <div onClick={() => setIsNewPatientOpen(true)} className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all cursor-pointer flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0">1</div>
                    <div className="flex flex-col min-w-0"><span className="text-[10px] font-black text-slate-700 uppercase truncate">Input Pasien</span><span className="text-[9px] text-slate-400 font-bold uppercase">Registrasi</span></div>
                 </div>
                 <ChevronRight className="h-3 w-3 text-slate-200 shrink-0" />
                 <div onClick={() => { setSelectedPatientId(""); setIsNewExamOpen(true) }} className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all cursor-pointer flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-[#00a39d] text-white flex items-center justify-center text-xs font-black shrink-0">2</div>
                    <div className="flex flex-col min-w-0"><span className="text-[10px] font-black text-slate-700 uppercase truncate">Periksa Mata</span><span className="text-[9px] text-slate-400 font-bold uppercase">Refraksi</span></div>
                 </div>
                 <ChevronRight className="h-3 w-3 text-slate-200 shrink-0" />
                 <div onClick={() => router.push('/orders')} className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all cursor-pointer flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs font-black shrink-0">3</div>
                    <div className="flex flex-col min-w-0"><span className="text-[10px] font-black text-slate-700 uppercase truncate">Transaksi POS</span><span className="text-[9px] text-slate-400 font-bold uppercase">Penjualan</span></div>
                 </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={() => router.push('/orders')}
                className="h-10 px-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-black text-[11px] uppercase tracking-wider shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">+ Transaksi Baru</span>
              </Button>
              <Button
                onClick={() => setIsNewPatientOpen(true)}
                variant="outline"
                className="h-10 px-4 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center gap-2 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">+ Pasien Baru</span>
              </Button>
              <Button
                onClick={() => router.push('/prescriptions')}
                variant="outline"
                className="h-10 px-4 border-[#00a39d]/30 text-[#00a39d] hover:bg-teal-50 rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center gap-2 transition-all"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">+ Resep RS</span>
              </Button>
            </div>
         </div>
      </div>

      <div className="space-y-6">
        <Card className="border-none shadow-sm rounded-xl bg-white p-6">
          <Tabs defaultValue="chart" className="w-full">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Monitoring Aktivitas Toko</h3>
                <p className="text-[11px] text-slate-400 font-medium">Pantau grafik performa dan riwayat penjualan terbaru</p>
              </div>
              <TabsList className="bg-slate-100 p-1.5 rounded-xl flex gap-1 w-fit border border-slate-200/50 shadow-sm">
                <TabsTrigger value="chart" className="rounded-lg px-4 py-2 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-[#1a2b3c] data-[state=active]:shadow-sm transition-all flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-[#00a39d]" /> Grafik Penjualan
                </TabsTrigger>
                <TabsTrigger value="transactions" className="rounded-lg px-4 py-2 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-[#1a2b3c] data-[state=active]:shadow-sm transition-all flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-indigo-500" /> Transaksi Terbaru
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="chart" className="outline-none">
              <div className="flex justify-end gap-4 mb-4">
                 <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-[#00a39d]"></div>
                   <span className="text-[10px] font-bold text-slate-400">Umum</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-sky-500"></div>
                   <span className="text-[10px] font-bold text-slate-400">BPJS</span>
                 </div>
              </div>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.trends || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontSize: '11px', fontWeight: 700 }}
                      formatter={(value: any) => `Rp ${value.toLocaleString('id-ID')}`}
                    />
                    <Line type="monotone" dataKey="umum" name="Umum" stroke="#00a39d" strokeWidth={3} dot={{ r: 4, fill: '#00a39d', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="bpjs" name="BPJS" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="outline-none">
              <div className="overflow-x-auto min-h-[320px]">
                <table className="w-full text-left text-xs font-semibold text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-2">No. Invoice</th>
                      <th className="py-3 px-2">Customer</th>
                      <th className="py-3 px-2">Tanggal</th>
                      <th className="py-3 px-2">Total Tagihan</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.recent_orders?.length > 0 ? (
                      metrics.recent_orders.map((order: any) => {
                        const invoice = order.invoices?.[0];
                        const total = invoice?.total_amount || order.total_amount || 0;
                        const remaining = invoice?.remaining ?? 0;
                        const isLunas = remaining === 0;
                        return (
                          <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-2 font-mono text-slate-900 font-bold">
                              {invoice?.invoice_number || "Draft"}
                            </td>
                            <td className="py-4 px-2">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 text-sm">{order.patient?.name || "Pasien Umum"}</span>
                                <span className="text-[10px] text-slate-400">{order.patient?.phone || "—"}</span>
                              </div>
                            </td>
                            <td className="py-4 px-2 text-slate-500 font-medium">
                              {new Date(order.order_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="py-4 px-2 text-slate-900 font-bold">
                              Rp {total.toLocaleString('id-ID')}
                            </td>
                            <td className="py-4 px-2">
                              {isLunas ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">Lunas</span>
                              ) : (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">DP (Sisa: Rp {remaining.toLocaleString('id-ID')})</span>
                              )}
                            </td>
                            <td className="py-4 px-2 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setOrderIdForPrint(order.id)
                                  setIsPrintOpen(true)
                                }}
                                className="h-8 rounded-lg font-bold text-xs hover:bg-[#00a39d]/10 hover:text-[#00a39d] transition-colors"
                              >
                                Cetak Nota
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                          Belum ada transaksi terbaru hari ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

      </div>

      {/* POS Transaction Terminal below dashboard charts/monitoring */}
      <div id="pos-section" className="mt-8 pt-8 border-t border-slate-200">
        <POSTerminal />
      </div>

      {/* Dialogs */}
      <NewOrderDialog 
        isOpen={isNewOrderOpen} 
        onOpenChange={setIsNewOrderOpen} 
        defaultPatientId={redirectPatientId}
        defaultPrescriptionId={redirectPrescriptionId}
        onSuccess={(oid) => {
          setOrderIdForPrint(oid)
          setIsPrintOpen(true)
          setRedirectPatientId("")
          setRedirectPrescriptionId("")
          fetchMetrics()
        }}
      />
      <NewPatientDialog 
        isOpen={isNewPatientOpen} 
        onOpenChange={setIsNewPatientOpen} 
        onSuccess={(patient) => {
          fetchMetrics()
          if (patient) {
            setSelectedPatientId(patient.id)
            setIsNewExamOpen(true)
          }
        }} 
      />
      <NewExaminationDialog
        isOpen={isNewExamOpen}
        onOpenChange={setIsNewExamOpen}
        defaultPatientId={selectedPatientId}
        onSuccess={(pid, prid) => {
          setRedirectPatientId(pid)
          setRedirectPrescriptionId(prid)
          setIsNewOrderOpen(true)
          fetchMetrics()
        }}
      />
      <PrintPreview 
        orderId={orderIdForPrint} 
        isOpen={isPrintOpen} 
        onOpenChange={setIsPrintOpen} 
      />

      {/* Notifications Section */}
      <Card className="bg-[#111c2a] border-none shadow-sm rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-white">Notifikasi Penting</h3>
          <Button variant="link" onClick={() => router.push('/logs')} className="text-[11px] font-bold text-slate-500 hover:text-[#00a39d] p-0 h-auto">Lihat Semua</Button>
        </div>
        <div className="space-y-4">
          <div onClick={() => router.push('/lenses')} className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-amber-400">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-200">Stok Lensa Menipis</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Dibutuhkan pemesanan ulang segera</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-slate-600 group-hover:text-white"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div onClick={() => router.push('/orders')} className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-sky-400">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-200">Terdapat Tagihan Belum Lunas</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Cek rincian piutang di terminal transaksi</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-slate-600 group-hover:text-white"><ChevronRight className="h-4 w-4" /></Button>
          </div>

          {crmAlerts?.birthdays?.length > 0 && (
            <div onClick={() => router.push('/patients')} className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500">
                   <Plus className="h-5 w-5 rotate-45" />
                </div>
                <div>
                   <p className="text-[13px] font-bold text-slate-200">{crmAlerts.birthdays.length} Pasien Ulang Tahun</p>
                   <p className="text-[10px] text-slate-500 font-medium mt-0.5">Berikan promo khusus hari ini</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-slate-600 group-hover:text-white"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}

          {crmAlerts?.checkupReminders?.length > 0 && (
            <div onClick={() => router.push('/patients')} className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                   <Users className="h-5 w-5" />
                </div>
                <div>
                   <p className="text-[13px] font-bold text-slate-200">{crmAlerts.checkupReminders.length} Pengingat Kontrol</p>
                   <p className="text-[10px] text-slate-500 font-medium mt-0.5">Pasien belum periksa &gt; 1 tahun</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-slate-600 group-hover:text-white"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}

          {crmAlerts?.pickupReminders?.length > 0 && (
            <div onClick={() => router.push('/orders')} className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                   <Clock className="h-5 w-5" />
                </div>
                <div>
                   <p className="text-[13px] font-bold text-slate-200">{crmAlerts.pickupReminders.length} Barang Belum Diambil</p>
                   <p className="text-[10px] text-slate-500 font-medium mt-0.5">Kacamata sudah SIAP &gt; 3 hari</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-slate-600 group-hover:text-white"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-6">
        <Activity className="h-10 w-10 text-[#1a2b3c] animate-pulse" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat Dashboard...</span>
      </div>
    }>
      <DashboardOverview />
    </Suspense>
  )
}
