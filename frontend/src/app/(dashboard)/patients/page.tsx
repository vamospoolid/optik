"use client"

import { useEffect, useState } from "react"
import apiClient from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Users, User, Save, Loader2, Info, Phone, Eye, Camera, Printer } from "lucide-react"
import { useRef } from "react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { PrescriptionPrintPreview } from "@/components/print/prescription-print-preview"

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form State
  const [nik, setNik] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [bpjsNumber, setBpjsNumber] = useState("")
  const [patientType, setPatientType] = useState<"umum" | "bpjs">("umum")

  // Detail Dialog & Timeline State
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedPatientPrescriptions, setSelectedPatientPrescriptions] = useState<any[]>([])
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null)
  const [isPrescriptionPrintOpen, setIsPrescriptionPrintOpen] = useState(false)

  const handleViewPatientDetail = async (patient: any) => {
    setSelectedPatient(patient)
    setIsDetailOpen(true)
    setLoadingPrescriptions(true)
    try {
      const res = await apiClient.get(`/prescriptions/patient/${patient.id}`)
      setSelectedPatientPrescriptions(res.data || [])
    } catch (error) {
      toast.error("Gagal memuat riwayat resep")
    } finally {
      setLoadingPrescriptions(false)
    }
  }

  const fetchPatients = async (searchTerm = "") => {
    if (searchTerm) setIsSearching(true)
    setLoading(true)
    try {
      const res = await apiClient.get(`/patients?search=${searchTerm}`)
      setPatients(res.data.data || [])
    } catch (error) {
      toast.error("Gagal memuat data pasien")
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPatients(search)
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [search])

  const handleKtpScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsScanning(true)
    const formData = new FormData()
    formData.append("ktp_image", file)

    try {
      const res = await apiClient.post("/patients/scan", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      
      const { parsed } = res.data
      if (parsed) {
        if (parsed.nik) setNik(parsed.nik)
        if (parsed.name) setName(parsed.name)
        if (parsed.address) setAddress(parsed.address)
        toast.success("Data KTP berhasil diekstrak")
      }
    } catch (error) {
      toast.error("Gagal memproses gambar KTP")
    } finally {
      setIsScanning(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const { user } = useAuth()

  const handleAddPatient = async () => {
    try {
      if (!user?.branch_id) {
        toast.error("User tidak memiliki cabang. Silakan hubungi admin.")
        return
      }
      
      await apiClient.post("/patients", { 
        nik: nik || null, 
        name, 
        phone, 
        address,
        bpjs_number: bpjsNumber || null,
        branch_id: user.branch_id 
      })
      toast.success("Data pasien berhasil dibuat")
      setIsDialogOpen(false)
      setNik(""); setName(""); setPhone(""); setAddress(""); setBpjsNumber("")
      fetchPatients(search)
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menambahkan pasien")
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1 w-6 bg-primary rounded-full"></div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Data Master</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Database Pasien</h2>
          <p className="text-slate-500 text-sm font-medium">Manajemen data pelanggan dan informasi klinis</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Cari Nama, NIK, atau Telepon..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 bg-white border-slate-200 rounded-xl font-medium shadow-sm focus:ring-primary/20 transition-all text-sm"
            />
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={
              <Button className="h-12 bg-[#1a2b3c] hover:bg-slate-800 text-white rounded-xl px-6 font-bold flex gap-2 shadow-lg active:scale-95">
                 <Plus className="h-5 w-5" /> Registrasi Pasien
              </Button>
            } />
            <DialogContent className="sm:max-w-[550px] border-0 rounded-[2rem] shadow-2xl bg-white p-0 overflow-hidden scale-in-center">
              <div className="bg-[#1a2b3c] p-8 text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <DialogTitle className="text-2xl font-bold mb-1 focus:outline-none">Tambah Profil Baru</DialogTitle>
                      <p className="text-slate-400 text-xs font-medium">Integrasi data pasien baru ke dalam sistem repositori</p>
                    </div>
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isScanning}
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl h-12 px-4 flex gap-2 font-bold"
                    >
                      {isScanning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                      <span>{isScanning ? "Scanning..." : "Scan KTP"}</span>
                    </Button>
                    <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleKtpScan} />
                  </div>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="flex p-1 bg-slate-100 rounded-2xl w-full mb-2">
                  <button 
                    onClick={() => { setPatientType("umum"); setBpjsNumber("") }}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${patientType === 'umum' ? 'bg-white text-[#1a2b3c] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    PASIEN UMUM
                  </button>
                  <button 
                    onClick={() => setPatientType("bpjs")}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${patientType === 'bpjs' ? 'bg-[#00a39d] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    PASIEN BPJS
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500 ml-1">Nama Lengkap</Label>
                    <Input className="rounded-xl border-slate-200 h-12 font-medium text-slate-900" value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Budi Santoso" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500 ml-1">No. Telepon / WhatsApp</Label>
                    <Input className="rounded-xl border-slate-200 h-12 font-medium text-slate-900" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0812..." />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500 ml-1">NIK (Sesuai KTP)</Label>
                    <Input className="rounded-xl border-slate-200 h-12 font-medium text-slate-900" value={nik} onChange={e => setNik(e.target.value)} placeholder="16 Digit NIK" />
                  </div>
                  <div className="space-y-2">
                    <Label className={`text-xs font-semibold ml-1 ${patientType === 'bpjs' ? 'text-[#00a39d]' : 'text-slate-500'}`}>
                      No. Kartu BPJS {patientType === 'bpjs' && <span className="text-[10px] italic">(Wajib)</span>}
                    </Label>
                    <Input 
                      className={`rounded-xl h-12 font-bold text-slate-900 transition-all ${patientType === 'bpjs' ? 'border-[#00a39d] bg-sky-50/30' : 'border-slate-200 bg-white opacity-50'}`} 
                      value={bpjsNumber} 
                      onChange={e => setBpjsNumber(e.target.value)} 
                      placeholder="Contoh: 000123"
                      disabled={patientType === 'umum'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 ml-1">Alamat Domisili</Label>
                  <Input className="rounded-xl border-slate-200 h-12 font-medium text-slate-900" value={address} onChange={e => setAddress(e.target.value)} placeholder="Nama jalan, perumahan, dll" />
                </div>
              </div>

              <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100 gap-3">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-12 rounded-xl px-6 font-semibold text-slate-500 hover:bg-white hover:text-slate-900 transition-all">
                  Batal
                </Button>
                <Button onClick={handleAddPatient} className="flex-1 bg-[#1a2b3c] hover:bg-black text-white h-12 rounded-xl font-bold flex gap-2 shadow-lg transition-all">
                  <Save className="h-5 w-5" /> Simpan Pasien
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-0 shadow-xl rounded-2xl bg-white overflow-hidden mx-4">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#1a2b3c]">
                <TableRow className="hover:bg-transparent border-0">
                  <TableHead className="py-6 pl-10 text-xs font-bold text-slate-400 uppercase tracking-wider">Informasi Pasien</TableHead>
                  <TableHead className="py-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Identitas NIK</TableHead>
                  <TableHead className="py-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Kontak & Alamat</TableHead>
                  <TableHead className="py-6 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Tanggal Daftar</TableHead>
                  <TableHead className="pr-10 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && !patients.length ? (
                  <TableRow><TableCell colSpan={5} className="h-64 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400 mb-2" /><p className="text-xs font-medium text-slate-400">Menghubungkan ke pusat data...</p></TableCell></TableRow>
                ) : patients.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-64 text-center text-slate-400 font-medium">Data pasien tidak ditemukan</TableCell></TableRow>
                ) : patients.map((p: any) => (
                  <TableRow 
                    key={p.id} 
                    onClick={() => handleViewPatientDetail(p)}
                    className="hover:bg-slate-50/50 transition-all border-b border-slate-100 group cursor-pointer"
                  >
                    <TableCell className="py-6 pl-10">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/20 group-hover:text-primary transition-all">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                          <span className="text-[10px] font-medium text-slate-400">Verifikasi Medis Aktif</span>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                       <span className="text-xs font-medium text-slate-600 font-mono tracking-wider">{p.nik || 'UMUM'}</span>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                           <Phone className="h-3 w-3 text-slate-400" />
                           {p.phone}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[200px]">{p.address}</span>
                      </div>
                    </TableCell>

                    <TableCell className="hidden md:table-cell">
                      <span className="text-xs font-medium text-slate-500">
                        {new Date(p.created_at).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}
                      </span>
                    </TableCell>

                    <TableCell className="pr-10 text-right">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                         <Button 
                           variant="ghost" 
                           onClick={(e) => { e.stopPropagation(); handleViewPatientDetail(p); }} 
                           className="h-10 w-10 p-0 rounded-lg hover:bg-slate-100"
                         >
                            <Info className="h-4 w-4 text-slate-400" />
                         </Button>
                         <Button 
                           variant="ghost" 
                           onClick={(e) => { e.stopPropagation(); handleViewPatientDetail(p); }} 
                           className="h-10 w-10 p-0 rounded-lg hover:bg-primary/10 hover:text-primary"
                         >
                            <Eye className="h-4 w-4" />
                         </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Patient Detail and Prescription History Timeline Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[850px] border-0 rounded-[2rem] shadow-2xl bg-[#0f172a] text-white p-0 overflow-hidden scale-in-center">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-[#1a2b3c] to-indigo-950 p-6 border-b border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <DialogTitle className="text-xl font-black mb-1">Rekam Medis & Riwayat Pemeriksaan</DialogTitle>
                <p className="text-slate-400 text-xs font-semibold">Detail riwayat klinis pasien terintegrasi</p>
              </div>
            </div>
          </div>
          
          {/* Body */}
          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800 bg-[#0b0f19]">
            {/* Left: Patient Info (col-span-5) */}
            <div className="col-span-5 p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-850 flex items-center justify-center text-teal-400 font-extrabold text-lg shadow-inner">
                    {selectedPatient?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base leading-tight">{selectedPatient?.name}</h3>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Status: </span>
                    {selectedPatient?.bpjs_number ? (
                      <span className="bg-[#00a39d] text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">BPJS</span>
                    ) : (
                      <span className="bg-slate-850 text-slate-350 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">UMUM</span>
                    )}
                  </div>
                </div>
                
                <div className="h-px bg-slate-800/80 w-full"></div>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">NIK (Nomor Induk Kependudukan)</span>
                    <p className="text-xs font-mono font-bold text-slate-300">{selectedPatient?.nik || '—'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">No. Telepon / WhatsApp</span>
                    <p className="text-xs font-bold text-slate-350">{selectedPatient?.phone || '—'}</p>
                  </div>

                  {selectedPatient?.bpjs_number && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-[#00a39d] uppercase tracking-wider">No. Kartu BPJS</span>
                      <p className="text-xs font-mono font-bold text-[#00a39d]">{selectedPatient?.bpjs_number}</p>
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Alamat Lengkap</span>
                    <p className="text-xs text-slate-400 leading-relaxed font-semibold">{selectedPatient?.address || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right: Timeline (col-span-7) */}
            <div className="col-span-7 p-6 space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-450 border-b border-slate-800/50 pb-2">Jejak Riwayat Pemeriksaan</h4>
              
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {loadingPrescriptions ? (
                  <div className="py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#00a39d] mb-2" />
                    <p className="text-xs font-semibold text-slate-500">Memuat riwayat resep...</p>
                  </div>
                ) : selectedPatientPrescriptions.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-semibold bg-slate-900/40 border border-dashed border-slate-800 rounded-xl">
                    Belum ada riwayat resep pemeriksaan untuk pasien ini.
                  </div>
                ) : (
                  <div className="relative pl-6 ml-3 border-l border-slate-800 space-y-4 py-2">
                    {selectedPatientPrescriptions.map((pr: any) => {
                      const od = pr.details?.find((d: any) => d.eye === 'R')
                      const os = pr.details?.find((d: any) => d.eye === 'L')
                      const formatVal = (v: number) => (v > 0 ? '+' : '') + (v || 0).toFixed(2)
                      const formatAdd = (detail: any) => detail && (detail.add_power !== null && detail.add_power !== undefined) ? ` Add +${detail.add_power.toFixed(2)}` : ''
                      
                      const getLensTypeBadge = (type: string) => {
                        switch (type?.toLowerCase()) {
                          case 'monofocal':
                            return 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                          case 'bifocal':
                            return 'bg-blue-500/10 text-blue-450 border border-blue-500/20'
                          case 'progressive':
                            return 'bg-purple-500/10 text-purple-450 border border-purple-500/20'
                          default:
                            return 'bg-white/10 text-slate-350 border border-white/5'
                        }
                      }

                      return (
                        <div key={pr.id} className="relative group">
                          {/* Timeline Dot */}
                          <div className="absolute -left-[32px] top-[14px] w-4 h-4 rounded-full border-2 border-slate-700 bg-slate-950 group-hover:border-slate-500 transition-colors z-10 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover:bg-slate-300" />
                          </div>

                          {/* Timeline Card */}
                          <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/30 hover:bg-slate-900/60 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                              <div className="flex items-center flex-wrap gap-2">
                                <span className="font-extrabold text-white text-xs">
                                  {new Date(pr.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                                </span>
                                <span className={`text-[8px] font-black uppercase py-0.5 px-1.5 rounded tracking-wide ${getLensTypeBadge(pr.type)}`}>
                                  {pr.type}
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-slate-350 grid grid-cols-2 gap-x-4 mt-1.5">
                                <div>R: <b className="text-teal-400">{od ? `${formatVal(od.sph)} / ${od.cyl.toFixed(2)} / AX ${od.axis}°${formatAdd(od)}` : '—'}</b></div>
                                <div>L: <b className="text-sky-400">{os ? `${formatVal(os.sph)} / ${os.cyl.toFixed(2)} / AX ${os.axis}°${formatAdd(os)}` : '—'}</b></div>
                                <div className="col-span-2 text-[9px] text-slate-400 mt-1 font-sans">PD: {pr.pd || '0'}mm • Dokter: {pr.examination?.doctor_name || '—'}</div>
                              </div>
                            </div>
                            <div className="flex gap-1.5 self-stretch sm:self-auto justify-end">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => { setSelectedPrescription(pr); setIsPrescriptionPrintOpen(true); }}
                                className="h-8 w-8 text-slate-450 hover:text-white border-slate-800 bg-slate-950 hover:bg-slate-900 rounded-lg transition-colors"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Prescription Print Dialog */}
      <PrescriptionPrintPreview 
        data={selectedPrescription} 
        isOpen={isPrescriptionPrintOpen} 
        onOpenChange={setIsPrescriptionPrintOpen} 
      />
    </div>
  )
}
