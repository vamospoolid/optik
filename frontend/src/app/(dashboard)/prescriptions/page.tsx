"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import apiClient from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, User, Info, Camera, Loader2, Save, Send, Eye, Brain, Check, Search, Calendar, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Printer as PrinterIcon } from "lucide-react"
import { PrescriptionPrintPreview } from "@/components/print/prescription-print-preview"
import { NewExaminationDialog } from "@/components/dialogs/new-examination-dialog"

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isPrintOpen, setIsPrintOpen] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null)
  const [search, setSearch] = useState("")
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [createdPatientId, setCreatedPatientId] = useState("")
  const [createdPrescriptionId, setCreatedPrescriptionId] = useState("")
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [axisL, setAxisL] = useState("")
  const [scanResult, setScanResult] = useState<any>(null)

  const fetchPrescriptions = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get("/prescriptions")
      setPrescriptions(res.data)
    } catch (error) {
      console.error(error)
      toast.error("Gagal memuat data resep")
    } finally {
      setLoading(false)
    }
  }

  const fetchPatients = async () => {
    try {
      const res = await apiClient.get("/patients")
      setPatients(res.data.data || [])
    } catch (error) {
      toast.error("Gagal memuat data pasien")
    }
  }

  useEffect(() => {
    fetchPrescriptions()
    fetchPatients()
  }, [])

  const handleCreateSuccess = (pid: string, prid: string) => {
    setCreatedPatientId(pid)
    setCreatedPrescriptionId(prid)
    setIsSuccessDialogOpen(true)
    fetchPrescriptions()
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Input Resep Dari Rumah Sakit</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Lengkapi data resep untuk diproses ke transaksi</p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Cari pasien..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 pl-9 rounded-xl border-none bg-white shadow-sm font-medium"
            />
          </div>
          
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="h-11 bg-[#00a39d] hover:bg-[#008f8a] text-white rounded-xl px-6 font-bold flex gap-2 shadow-lg transition-all"
          >
             <Plus className="h-5 w-5" /> Input Resep Baru
          </Button>
          
          <NewExaminationDialog 
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onSuccess={handleCreateSuccess}
          />
      </div>
    </div>

    <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#1a2b3c]">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="py-5 pl-8 text-[11px] font-bold text-white uppercase tracking-wider">Mata Kanan (OD)</TableHead>
                  <TableHead className="py-5 text-[11px] font-bold text-white uppercase tracking-wider">Mata Kiri (OS)</TableHead>
                  <TableHead className="py-5 text-[11px] font-bold text-white uppercase tracking-wider">PD</TableHead>
                  <TableHead className="py-5 text-[11px] font-bold text-white uppercase tracking-wider">Nama Pasien</TableHead>
                  <TableHead className="py-5 text-[11px] font-bold text-white uppercase tracking-wider">Waktu Input</TableHead>
                  <TableHead className="pr-8 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="h-64 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-300 mb-2" /><p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Sinkronisasi Data...</p></TableCell></TableRow>
                ) : prescriptions.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-64 text-center text-slate-400 font-medium">Data rekam medis kosong</TableCell></TableRow>
                ) : (prescriptions as any[]).filter((p: any) => 
                  p.examination?.patient?.name?.toLowerCase().includes(search.toLowerCase())
                ).map((p: any) => {
                  const od = (p.details || []).find((d: any) => d.eye === 'R')
                  const os = (p.details || []).find((d: any) => d.eye === 'L')
                  return (
                    <TableRow 
                      key={p.id} 
                      onClick={() => { setSelectedPrescription(p); setIsDetailOpen(true); }}
                      className="hover:bg-slate-50/50 transition-all border-b border-slate-100 group cursor-pointer"
                    >
                      <TableCell className="py-5 pl-8">
                        {od ? (
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-[#1a2b3c]">{od.sph > 0 ? '+' : ''}{od.sph.toFixed(2)}</span>
                            <div className="flex flex-col text-[10px] leading-tight font-bold text-[#00a39d]">
                              <span>C {od.cyl.toFixed(2)}</span>
                              <span>AX {od.axis}°</span>
                              {od.add_power !== null && od.add_power !== undefined && <span>ADD +{od.add_power.toFixed(2)}</span>}
                            </div>
                          </div>
                        ) : <span className="text-slate-200">-</span>}
                      </TableCell>
                      <TableCell>
                        {os ? (
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-[#1a2b3c]">{os.sph > 0 ? '+' : ''}{os.sph.toFixed(2)}</span>
                            <div className="flex flex-col text-[10px] leading-tight font-bold text-sky-500">
                              <span>C {os.cyl.toFixed(2)}</span>
                              <span>AX {os.axis}°</span>
                              {os.add_power !== null && os.add_power !== undefined && <span>ADD +{os.add_power.toFixed(2)}</span>}
                            </div>
                          </div>
                        ) : <span className="text-slate-200">-</span>}
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-1">
                           <span className="text-sm font-bold text-slate-700">{p.pd || '0'}</span>
                           <span className="text-[9px] font-bold text-slate-400">MM</span>
                         </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex flex-col">
                           <span className="font-bold text-slate-800 text-sm italic">{p.examination?.patient?.name}</span>
                           <span className="text-[10px] font-medium text-slate-400"># {p.id.substring(0,8)}</span>
                         </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-600">{new Date(p.created_at).toLocaleDateString('id-ID')}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{new Date(p.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                        </div>
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                         <Button 
                          onClick={() => { setSelectedPrescription(p); setIsDetailOpen(true); }}
                          variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-[#00a39d] hover:bg-[#00a39d]/5 rounded-lg"
                         >
                           <Info className="h-4 w-4" />
                         </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden bg-white">
          {selectedPrescription && (
            <>
              <div className="bg-[#1a2b3c] p-8 text-white">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                       <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                       <h2 className="text-xl font-bold leading-none">{selectedPrescription.examination?.patient?.name}</h2>
                       <p className="text-slate-400 text-xs mt-1 uppercase font-bold tracking-widest">Detail Rekam Medis # {selectedPrescription.id.substring(0,8)}</p>
                    </div>
                 </div>
              </div>
              <div className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                       <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Mata Kanan (OD)</p>
                       {(() => {
                         const od = selectedPrescription.details.find((d: any) => d.eye === 'R')
                         if (!od) return <p className="text-sm font-bold text-slate-300">N/A</p>
                         return (
                           <div className="space-y-1">
                              <p className="text-lg font-bold text-slate-800">SPH: {od.sph > 0 ? '+' : ''}{od.sph.toFixed(2)}</p>
                              <p className="text-sm font-bold text-[#00a39d]">CYL: {od.cyl.toFixed(2)}</p>
                              <p className="text-sm font-bold text-[#00a39d]">AXIS: {od.axis}°</p>
                              {od.add_power !== null && od.add_power !== undefined && (
                                <p className="text-sm font-bold text-amber-600">ADD: +{od.add_power.toFixed(2)}</p>
                              )}
                           </div>
                         )
                       })()}
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                       <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Mata Kiri (OS)</p>
                       {(() => {
                         const os = selectedPrescription.details.find((d: any) => d.eye === 'L')
                         if (!os) return <p className="text-sm font-bold text-slate-300">N/A</p>
                         return (
                           <div className="space-y-1">
                              <p className="text-lg font-bold text-slate-800">SPH: {os.sph > 0 ? '+' : ''}{os.sph.toFixed(2)}</p>
                              <p className="text-sm font-bold text-sky-500">CYL: {os.cyl.toFixed(2)}</p>
                              <p className="text-sm font-bold text-sky-500">AXIS: {os.axis}°</p>
                              {os.add_power !== null && os.add_power !== undefined && (
                                <p className="text-sm font-bold text-amber-600">ADD: +{os.add_power.toFixed(2)}</p>
                              )}
                           </div>
                         )
                       })()}
                    </div>
                 </div>

                 <div className="flex justify-between items-center p-4 bg-slate-900 rounded-xl text-white">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pupil Distance (PD)</span>
                    <span className="text-xl font-bold">{selectedPrescription.pd || '0'} <small className="text-[10px] ml-1">MM</small></span>
                 </div>

                 <div className="space-y-3">
                    <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                       <span className="text-slate-400 font-medium">Tipe Lensa</span>
                       <span className="font-bold text-slate-700 uppercase">{selectedPrescription.type}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                       <span className="text-slate-400 font-medium">Dokter/RS</span>
                       <span className="font-bold text-slate-700">{selectedPrescription.examination?.doctor_name || 'Optometris Internal'}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2">
                       <span className="text-slate-400 font-medium">Tanggal Input</span>
                       <span className="font-bold text-slate-700">{new Date(selectedPrescription.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</span>
                    </div>
                 </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <Button 
                      onClick={() => setIsPrintOpen(true)}
                      className="h-12 bg-[#1a2b3c] hover:bg-black text-white rounded-xl font-bold flex gap-2"
                    >
                       <PrinterIcon className="h-4 w-4" /> Cetak Resep
                    </Button>
                    <Button variant="ghost" className="h-12 border border-slate-200 rounded-xl font-bold text-slate-500 hover:text-slate-900" onClick={() => setIsDetailOpen(false)}>
                       Tutup Detail
                    </Button>
                  </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <PrescriptionPrintPreview 
        data={selectedPrescription} 
        isOpen={isPrintOpen} 
        onOpenChange={setIsPrintOpen} 
      />
       {/* Success Follow-up Dialog */}
       <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
         <DialogContent className="rounded-[2.5rem] border-0 shadow-2xl p-0 overflow-hidden max-w-lg">
            <div className="bg-slate-900 p-10 text-center relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
               <div className="h-20 w-20 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-6 mx-auto shadow-xl shadow-emerald-500/20 ring-8 ring-emerald-500/10">
                  <Check className="h-10 w-10 stroke-[3]" />
               </div>
               <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">Pemeriksaan Selesai!</DialogTitle>
               <DialogDescription className="text-slate-400 font-bold px-6">
                  Data resep telah disimpan ke dalam rekam medis pasien. Apa langkah selanjutnya?
               </DialogDescription>
            </div>

            <div className="p-8 space-y-3 bg-white">
               <Button 
                  onClick={() => router.push(`/dashboard?patientId=${createdPatientId}&prescriptionId=${createdPrescriptionId}&openOrder=true`)}
                  className="w-full h-16 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black italic uppercase text-xs tracking-widest shadow-lg shadow-emerald-100 flex items-center justify-between px-8 group transition-all"
               >
                  <div className="flex flex-col items-start gap-0.5">
                     <span>Lanjutkan ke Penjualan</span>
                     <span className="text-[9px] lowercase font-medium opacity-60 italic">Buka POS dengan resep ini</span>
                  </div>
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
               </Button>

               <div className="grid grid-cols-2 gap-3">
                  <Button 
                     variant="outline" 
                     onClick={() => setIsSuccessDialogOpen(false)}
                     className="h-14 rounded-2xl font-bold text-slate-500 border-slate-200 hover:bg-slate-50"
                  >
                     Tutup
                  </Button>
                  <Button 
                     variant="outline" 
                     onClick={() => {
                        setIsSuccessDialogOpen(false)
                        setIsDialogOpen(true)
                     }}
                     className="h-14 rounded-2xl font-bold text-[#00a39d] border-[#00a39d]/20 hover:bg-teal-50"
                  >
                     Periksa Lagi
                  </Button>
               </div>
            </div>
         </DialogContent>
       </Dialog>
    </div>
  )
}
