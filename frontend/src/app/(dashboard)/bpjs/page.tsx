"use client"

import { useEffect, useState } from "react"
import apiClient from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, User, FileText, CheckCircle, XCircle, Info, Clock, Check, Activity, Save, Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft:     { label: 'Draft',     color: 'bg-slate-100 text-slate-500',    icon: FileText },
  submitted: { label: 'Diajukan', color: 'bg-amber-50 text-amber-600',    icon: Clock },
  approved:  { label: 'Disetujui',  color: 'bg-blue-50 text-blue-600',      icon: Check },
  paid:      { label: 'Sudah Cair',color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle },
  rejected:  { label: 'Ditolak',  color: 'bg-red-50 text-red-600',        icon: XCircle },
}

export default function BpjsClaimsPage() {
  const [claims, setClaims] = useState([])
  const [stats, setStats] = useState({ total: 0, draft: 0, submitted: 0, approved: 0, rejected: 0, paid: 0 })
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Selection Data
  const [patients, setPatients] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [orders, setOrders] = useState([])

  // Form State
  const [patientId, setPatientId] = useState("")
  const [prescriptionId, setPrescriptionId] = useState("")
  const [orderId, setOrderId] = useState("")

  const fetchData = async () => {
    setLoading(true)
    try {
      const [claimsRes, statsRes] = await Promise.all([
        apiClient.get("/bpjs"),
        apiClient.get("/bpjs/stats")
      ])
      setClaims(claimsRes.data)
      setStats(statsRes.data)
    } catch (error) {
      toast.error("Gagal memuat data BPJS")
    } finally {
      setLoading(false)
    }
  }

  const fetchResources = async () => {
    try {
      const pRes = await apiClient.get("/patients")
      setPatients(pRes.data.data.filter((p: any) => p.bpjs_number)) // Only patients with BPJS
    } catch (error) { }
  }

  const fetchPatientDetails = async (pid: string) => {
    if (!pid) {
      setPrescriptions([])
      setOrders([])
      return
    }
    try {
      const [rxRes, ordRes] = await Promise.all([
        apiClient.get(`/prescriptions/patient/${pid}`),
        apiClient.get(`/orders`)
      ])
      setPrescriptions(rxRes.data)
      setOrders(ordRes.data.filter((o: any) => o.patient_id === pid))
    } catch (error) { }
  }

  useEffect(() => {
    fetchData()
    fetchResources()
  }, [])

  useEffect(() => {
    fetchPatientDetails(patientId)
  }, [patientId])

  const handleCreateDraft = async () => {
    if (!patientId || !prescriptionId) return toast.error("Pasien & Resep wajib dipilih")
    
    try {
      await apiClient.post("/bpjs", {
        patient_id: patientId,
        prescription_id: prescriptionId,
        order_id: (orderId === "none" || !orderId) ? null : orderId
      })
      toast.success("Draf klaim berhasil dibuat!")
      setIsDialogOpen(false)
      setPatientId(""); setPrescriptionId(""); setOrderId("")
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal membuat draf")
    }
  }

  const handleAction = async (claimId: string, action: string) => {
    try {
      if (action === 'submit') {
        await apiClient.patch(`/bpjs/${claimId}/submit`)
        toast.success("Klaim berhasil diajukan ke BPJS!")
      } else {
        await apiClient.patch(`/bpjs/${claimId}/status`, { status: action })
        toast.success(`Klaim beralih ke status ${action}`)
      }
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memproses aksi")
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1 w-6 bg-emerald-500 rounded-full"></div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em]">Asuransi Kesehatan</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">BPJS Hub</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Kelola siklus klaim JKN dan integrasi data pasien</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button className="h-12 bg-[#1a2b3c] hover:bg-slate-800 text-white rounded-xl px-6 font-bold flex gap-2 shadow-lg active:scale-95 transition-all">
               <Plus className="h-5 w-5 text-emerald-500" /> Siapkan Klaim
            </Button>
          } />
          <DialogContent className="sm:max-w-[550px] border-0 rounded-[2rem] shadow-2xl bg-white p-0 overflow-hidden scale-in-center">
            <div className="bg-emerald-900 p-8 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
               <div className="relative z-10 flex items-center gap-4">
                 <div className="p-3 bg-white/10 rounded-2xl">
                    <ShieldCheck className="h-6 w-6 text-emerald-400" />
                 </div>
                 <div>
                   <DialogTitle className="text-2xl font-bold">Entri Klaim BPJS</DialogTitle>
                   <p className="text-emerald-300/60 text-xs font-medium">Registrasi urutan verifikasi asuransi</p>
                 </div>
               </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 ml-1">Pilih Pasien (Sesuai Kartu BPJS)</Label>
                <Select value={patientId} onValueChange={(val) => setPatientId(val || "")}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-12 font-medium text-slate-900 bg-slate-50">
                    <SelectValue placeholder="Cari profil pasien BPJS..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {patients.map((p: any) => (
                      <SelectItem key={p.id} value={p.id} className="text-sm font-medium">
                        {p.name} • {p.bpjs_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 ml-1">Riwayat Resep Klinis</Label>
                <Select value={prescriptionId} onValueChange={(val) => setPrescriptionId(val || "")} disabled={!patientId}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-12 font-medium text-slate-900 bg-slate-50 disabled:opacity-50">
                    <SelectValue placeholder="Pilih catatan klinis..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {prescriptions.map((px: any) => (
                      <SelectItem key={px.id} value={px.id} className="text-sm font-medium">
                        {px.type.toUpperCase()} • {new Date(px.created_at).toLocaleDateString('id-ID')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 ml-1">Hubungkan Transaksi (Opsional)</Label>
                <Select value={orderId} onValueChange={(val) => setOrderId(val || "")} disabled={!patientId}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-12 font-medium text-slate-900 bg-slate-50 disabled:opacity-50">
                    <SelectValue placeholder="Pilih transaksi toko..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none" className="text-xs italic text-slate-400">Tanpa Tautan Transaksi</SelectItem>
                    {orders.map((o: any) => (
                      <SelectItem key={o.id} value={o.id} className="text-sm font-medium">
                        REF: {o.id.substring(0,6)} • Rp {o.total_amount?.toLocaleString('id-ID')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100 gap-3">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-12 rounded-xl px-6 font-semibold text-slate-500 hover:bg-white hover:text-slate-900 transition-all">
                Batal
              </Button>
              <Button onClick={handleCreateDraft} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl font-bold flex gap-2 shadow-lg shadow-emerald-200">
                <Save className="h-5 w-5" /> Buat Draf Klaim
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {[
          { label: "Menunggu Draft", val: stats.draft, color: "text-slate-700", bg: "bg-white" },
          { label: "Sedang Diajukan", val: stats.submitted, color: "text-amber-600", bg: "bg-white" },
          { label: "Telah Disetujui", val: stats.approved, color: "text-blue-600", bg: "bg-white" },
          { label: "Total Dicairkan", val: stats.paid, color: "text-emerald-600", bg: "bg-white" }
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <p className={`text-xs font-bold uppercase tracking-wider opacity-60 ${s.color}`}>{s.label}</p>
              <p className={`text-3xl font-bold mt-2 ${s.color}`}>{s.val}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-xl rounded-2xl bg-white overflow-hidden mx-4">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#1a2b3c]">
                <TableRow className="hover:bg-transparent border-0">
                  <TableHead className="py-5 pl-8 text-xs font-bold text-slate-400 uppercase tracking-wider">Informasi Klaim</TableHead>
                  <TableHead className="py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Data Resep</TableHead>
                  <TableHead className="py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status Alur</TableHead>
                  <TableHead className="pr-8 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Aksi Terminal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="h-64 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-300" /></TableCell></TableRow>
                ) : claims.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-64 text-center text-slate-400 font-medium">Tidak ada data klaim ditemukan</TableCell></TableRow>
                ) : claims.map((claim: any) => {
                  const statusCfg = STATUS_CONFIG[claim.status] || STATUS_CONFIG.draft
                  const StatusIcon = statusCfg.icon
                  return (
                    <TableRow key={claim.id} className="hover:bg-slate-50/50 transition-all border-b border-slate-100 group">
                      <TableCell className="py-6 pl-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <User className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-sm">{claim.patient?.name}</span>
                            <span className="text-[10px] font-medium text-slate-400 tracking-wider">BPJS: {claim.patient?.bpjs_number || 'TIDAK_ADA'}</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-slate-700">{claim.prescription?.type.toUpperCase()} Optik</span>
                          <span className="text-[10px] text-slate-400 font-medium">ID: {claim.id.substring(0, 8)}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                         <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-md ${statusCfg.color} uppercase tracking-wider w-fit border border-current/20`}>
                           <StatusIcon className="h-3 w-3" /> {statusCfg.label}
                         </div>
                         {claim.status === 'submitted' && (
                           <div className="text-[9px] text-slate-400 mt-1 ml-1">Diajukan: {new Date(claim.claim_date).toLocaleDateString('id-ID')}</div>
                         )}
                      </TableCell>

                      <TableCell className="pr-8 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          {claim.status === 'draft' && (
                            <Button size="sm" onClick={() => handleAction(claim.id, 'submit')} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase rounded-lg px-4">
                              Ajukan
                            </Button>
                          )}
                          {claim.status === 'submitted' && (
                            <div className="flex gap-1.5">
                              <Button size="sm" onClick={() => handleAction(claim.id, 'approved')} className="h-9 bg-slate-900 hover:bg-black text-white font-bold text-[10px] uppercase rounded-lg px-4">Setujui</Button>
                              <Button size="sm" onClick={() => handleAction(claim.id, 'rejected')} variant="outline" className="h-9 border-slate-200 hover:bg-red-50 text-red-600 font-bold text-[10px] uppercase rounded-lg px-4">Tolak</Button>
                            </div>
                          )}
                          {claim.status === 'approved' && (
                            <Button size="sm" onClick={() => handleAction(claim.id, 'paid')} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase rounded-lg px-4">
                              Cairkan
                            </Button>
                          )}
                          {claim.status === 'paid' && (
                             <div className="h-9 w-9 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500">
                                <CheckCircle className="h-5 w-5" />
                             </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
