"use client"

import { useEffect, useState, useCallback } from "react"
import apiClient from "@/lib/api-client"
import { useSocket } from "@/components/providers/socket-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, ShoppingCart, DollarSign, Activity, ArrowUpRight, TrendingUp, Plus, Clock, Package, AlertTriangle, FileText, ChevronRight } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

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
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm overflow-hidden relative group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
               <h3 className="text-sm font-black italic uppercase tracking-tighter text-slate-800">Alur Kerja Terpadu</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Panduan operasional harian Optik88</p>
            </div>
            <div className="flex flex-1 max-w-2xl items-center gap-2">
               {/* Step 1 */}
               <div className="flex-1 group/step">
                  <div 
                     onClick={() => setIsNewPatientOpen(true)}
                     className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all cursor-pointer flex items-center gap-3"
                  >
                     <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">1</div>
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-700 uppercase">Input Pasien</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Registrasi</span>
                     </div>
                  </div>
               </div>
               
               <ChevronRight className="h-4 w-4 text-slate-200" />

                {/* Step 2 */}
               <div className="flex-1 group/step">
                  <div 
                     onClick={() => {
                        setSelectedPatientId("")
                        setIsNewExamOpen(true)
                     }}
                     className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all cursor-pointer flex items-center gap-3"
                  >
                     <div className="h-8 w-8 rounded-lg bg-[#00a39d] text-white flex items-center justify-center text-xs font-black">2</div>
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-700 uppercase">Periksa Mata</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Refraksi</span>
                     </div>
                  </div>
               </div>

               <ChevronRight className="h-4 w-4 text-slate-200" />

               {/* Step 3 */}
               <div className="flex-1 group/step">
                  <div 
                     onClick={() => router.push('/orders')}
                     className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all cursor-pointer flex items-center gap-3"
                  >
                     <div className="h-8 w-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs font-black">3</div>
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-700 uppercase">Transaksi POS</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Penjualan</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-4">
        {/* Graph Section */}
        <Card className="lg:col-span-3 border-none shadow-sm rounded-xl bg-white p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-base font-bold text-slate-900">Grafik Penjualan Bulanan</h3>
              <p className="text-[11px] text-slate-400 font-medium">Statistik performa optik 6 bulan terakhir</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-[#00a39d]"></div>
                 <span className="text-[10px] font-bold text-slate-400">Umum</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-sky-500"></div>
                 <span className="text-[10px] font-bold text-slate-400">BPJS</span>
               </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
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
        </Card>

        {/* Quick Actions Card */}
        <Card className="bg-[#1a2b3c] border-none shadow-sm rounded-xl p-6 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <h3 className="text-sm font-bold mb-6 italic uppercase tracking-tighter">Layanan Cepat</h3>
          <div className="space-y-3 relative z-10">
            <Button 
              onClick={() => router.push('/orders')}
              className="w-full justify-start gap-4 bg-emerald-500 hover:bg-emerald-400 text-white border-none h-14 rounded-2xl font-black italic uppercase text-[11px] shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <div className="bg-white/20 p-2 rounded-lg">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <span>+ Transaksi Baru</span>
            </Button>
            
            <Button 
              onClick={() => setIsNewPatientOpen(true)}
              className="w-full justify-start gap-4 bg-white/10 hover:bg-white/20 text-white border-white/5 h-14 rounded-2xl font-black italic uppercase text-[11px] transition-all hover:scale-[1.02] active:scale-95"
            >
              <div className="bg-white/10 p-2 rounded-lg">
                <Plus className="h-4 w-4" />
              </div>
              <span>+ Registrasi Pasien</span>
            </Button>

            <Button 
              onClick={() => router.push('/prescriptions')}
              className="w-full justify-start gap-4 bg-[#00a39d] hover:bg-[#008f8a] text-white h-14 rounded-2xl font-black italic uppercase text-[11px] shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02]"
            >
              <div className="bg-white/20 p-2 rounded-lg">
                <FileText className="h-4 w-4" />
              </div>
              <span>+ Input Resep RS</span>
            </Button>

            <div className="pt-6 border-t border-white/5 mt-6 grid grid-cols-2 gap-2">
               <button onClick={() => router.push('/patients')} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/5 transition-all text-slate-400 hover:text-white">
                  <Users className="h-5 w-5" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Database</span>
               </button>
               <button onClick={() => router.push('/orders')} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/5 transition-all text-slate-400 hover:text-white">
                  <Clock className="h-5 w-5" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Riwayat</span>
               </button>
            </div>
          </div>
          
          <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/0 border border-white/5">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status Sistem</p>
            <p className="text-[10px] leading-relaxed text-slate-300 font-medium">Terminal Optik88 Online & Terkoneksi</p>
          </div>
        </Card>
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
