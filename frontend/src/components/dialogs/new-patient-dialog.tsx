"use client"

import { useState } from "react"
import apiClient from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Save, Plus, Check, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"

interface NewPatientDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (patient: any) => void
}

export function NewPatientDialog({ isOpen, onOpenChange, onSuccess }: NewPatientDialogProps) {
  const { user } = useAuth()
  const [nik, setNik] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [bpjsNumber, setBpjsNumber] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [patientType, setPatientType] = useState<"umum" | "bpjs">("umum")
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdPatient, setCreatedPatient] = useState<any>(null)

  const handleAddPatient = async () => {
    if (!name || !phone) {
      toast.error("Nama dan No. Telepon wajib diisi")
      return
    }

    setLoading(true)
    try {
      if (!user?.branch_id) {
        toast.error("User tidak memiliki cabang. Silakan hubungi admin.")
        return
      }
      
      const res = await apiClient.post("/patients", { 
        nik: nik || null, 
        name, 
        phone, 
        address,
        birth_date: birthDate || null,
        bpjs_number: bpjsNumber || null,
        branch_id: user.branch_id 
      })
      
      const newPatient = res.data.data || res.data
      setCreatedPatient(newPatient)
      toast.success("Data pasien berhasil dibuat")
      setShowSuccess(true)
      
      // Reset form fields but keep createdPatient for the success view
      setNik(""); setName(""); setPhone(""); setAddress(""); setBpjsNumber(""); setBirthDate("")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menambahkan pasien")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setShowSuccess(false)
    setCreatedPatient(null)
    onOpenChange(false)
    if (onSuccess && createdPatient) onSuccess(createdPatient)
  }

  const handleStartExam = () => {
    onOpenChange(false)
    setShowSuccess(false)
    const patient = createdPatient
    setCreatedPatient(null)
    if (onSuccess) onSuccess(patient)
  }

  if (showSuccess && createdPatient) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="rounded-[2.5rem] border-0 shadow-2xl p-0 overflow-hidden max-w-lg bg-white">
          <div className="bg-[#1a2b3c] p-10 text-center relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
             <div className="h-20 w-20 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-6 mx-auto shadow-xl shadow-emerald-500/20 ring-8 ring-emerald-500/10">
                <Check className="h-10 w-10 stroke-[3]" />
             </div>
             <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">Registrasi Berhasil!</DialogTitle>
             <p className="text-slate-400 font-bold px-6 text-sm">
                Pasien <span className="text-white">"{createdPatient.name}"</span> telah terdaftar. Apa langkah selanjutnya?
             </p>
          </div>

          <div className="p-8 space-y-3">
             <Button 
                onClick={handleStartExam}
                className="w-full h-16 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black italic uppercase text-xs tracking-widest shadow-lg shadow-emerald-100 flex items-center justify-between px-8 group transition-all"
             >
                <div className="flex flex-col items-start gap-0.5">
                   <span>Lanjutkan ke Pemeriksaan</span>
                   <span className="text-[9px] lowercase font-medium opacity-60 italic">Input data refraksi & PD</span>
                </div>
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
             </Button>

             <Button 
                variant="outline" 
                onClick={handleClose}
                className="w-full h-14 rounded-2xl font-bold text-slate-500 border-slate-200 hover:bg-slate-50"
             >
                Selesai & Tutup
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] border-0 rounded-[2rem] shadow-2xl bg-white p-0 overflow-hidden">
        <div className="bg-[#1a2b3c] p-8 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
           <div className="relative z-10">
             <DialogTitle className="text-2xl font-bold mb-1">Registrasi Pasien Baru</DialogTitle>
             <p className="text-slate-400 text-xs font-medium">Lengkapi data untuk pendaftaran pasien Optik88</p>
           </div>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="flex p-1 bg-slate-100 rounded-2xl w-full mb-2">
            <button 
              onClick={() => { setPatientType("umum"); setBpjsNumber("") }}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${patientType === 'umum' ? 'bg-white text-[#1a2b3c] shadow-sm' : 'text-slate-400'}`}
            >
              PASIEN UMUM
            </button>
            <button 
              onClick={() => setPatientType("bpjs")}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${patientType === 'bpjs' ? 'bg-[#00a39d] text-white shadow-sm' : 'text-slate-400'}`}
            >
              PASIEN BPJS
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-500 ml-1">Nama Lengkap</Label>
              <Input className="rounded-xl border-slate-200 h-12 font-medium" value={name} onChange={e => setName(e.target.value)} placeholder="Nama Pasien" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-500 ml-1">No. WhatsApp</Label>
              <Input className="rounded-xl border-slate-200 h-12 font-medium" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08..." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-500 ml-1">NIK (KTP)</Label>
              <Input className="rounded-xl border-slate-200 h-12 font-medium" value={nik} onChange={e => setNik(e.target.value)} placeholder="16 Digit" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-500 ml-1">Tanggal Lahir</Label>
              <Input type="date" className="rounded-xl border-slate-200 h-12 font-medium" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className={`text-xs font-semibold ml-1 ${patientType === 'bpjs' ? 'text-[#00a39d]' : 'text-slate-500'}`}>No. BPJS</Label>
              <Input 
                className={`rounded-xl h-12 font-bold transition-all ${patientType === 'bpjs' ? 'border-[#00a39d] bg-sky-50/30' : 'border-slate-200 bg-white opacity-50'}`} 
                value={bpjsNumber} 
                onChange={e => setBpjsNumber(e.target.value)} 
                disabled={patientType === 'umum'}
                placeholder="No. Kartu"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-500 ml-1">Alamat</Label>
              <Input className="rounded-xl border-slate-200 h-12 font-medium" value={address} onChange={e => setAddress(e.target.value)} placeholder="Alamat lengkap..." />
            </div>
          </div>
        </div>

        <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100 gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-12 rounded-xl px-6 font-semibold">Batal</Button>
          <Button onClick={handleAddPatient} disabled={loading} className="flex-1 bg-[#1a2b3c] hover:bg-black text-white h-12 rounded-xl font-bold flex gap-2 shadow-lg">
            <Save className="h-5 w-5" /> {loading ? "Menyimpan..." : "Simpan Pasien"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
