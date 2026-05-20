"use client"

import { useState, useRef, useEffect } from "react"
import apiClient from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Search, Camera, Loader2, Check, ChevronRight, Calendar } from "lucide-react"
import { toast } from "sonner"

interface NewExaminationDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (patientId: string, prescriptionId: string) => void
  defaultPatientId?: string
}

export function NewExaminationDialog({ 
  isOpen, 
  onOpenChange, 
  onSuccess, 
  defaultPatientId 
}: NewExaminationDialogProps) {
  const [patients, setPatients] = useState<any[]>([])
  const [patientId, setPatientId] = useState(defaultPatientId || "")
  const [patientSearch, setPatientSearch] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)
  const [scanPreviewUrl, setScanPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form State
  const [lensType, setLensType] = useState("monofocal")
  const [pd, setPd] = useState("")
  const [sphR, setSphR] = useState("")
  const [cylR, setCylR] = useState("")
  const [axisR, setAxisR] = useState("")
  const [addR, setAddR] = useState("")
  const [sphL, setSphL] = useState("")
  const [cylL, setCylL] = useState("")
  const [axisL, setAxisL] = useState("")
  const [addL, setAddL] = useState("")
  const [birthDate, setBirthDate] = useState("")

  useEffect(() => {
    if (isOpen) {
      fetchPatients()
      if (defaultPatientId) setPatientId(defaultPatientId)
    } else {
      resetForm()
    }
  }, [isOpen, defaultPatientId])

  useEffect(() => {
    const p = patients.find((x: any) => x.id === patientId)
    if (p?.birth_date) {
      setBirthDate(new Date(p.birth_date).toISOString().split('T')[0])
    } else {
      setBirthDate("")
    }
  }, [patientId, patients])

  const fetchPatients = async () => {
    try {
      const res = await apiClient.get("/patients")
      setPatients(res.data.data || [])
    } catch (error) {
      toast.error("Gagal memuat data pasien")
    }
  }

  const handleOcrScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setScanPreviewUrl(previewUrl)

    setIsScanning(true)
    setScanResult(null)
    const formData = new FormData()
    formData.append("prescription_image", file)

    try {
      const res = await apiClient.post("/prescriptions/scan", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      
      const { parsed } = res.data
      if (parsed) {
        setScanResult(parsed)
        setSphR(parsed.right.sph?.toString() || "")
        setCylR(parsed.right.cyl?.toString() || "")
        setAxisR(parsed.right.axis?.toString() || "")
        setSphL(parsed.left.sph?.toString() || "")
        setCylL(parsed.left.cyl?.toString() || "")
        setAxisL(parsed.left.axis?.toString() || "")
        setPd(parsed.pd?.toString() || "")
        toast.success("Ekstraksi AI selesai!")
      }
    } catch (error) {
      toast.error("Gagal membaca gambar resep")
    } finally {
      setIsScanning(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleCreatePrescription = async () => {
    if (!patientId) return toast.error("Silakan pilih pasien")
    if (!sphR || !sphL) return toast.error("Nilai SPH wajib diisi")

    // Validasi PD Medis
    if (pd) {
      const pdVal = parseFloat(pd);
      if (isNaN(pdVal) || pdVal < 40 || pdVal > 80) {
        return toast.error("Pupil Distance (PD) harus bernilai antara 40mm dan 80mm");
      }
    }

    // Validasi Mata Kanan (OD)
    const sphRVal = parseFloat(sphR);
    if (isNaN(sphRVal)) return toast.error("Nilai SPH Kanan harus berupa angka");

    if (cylR) {
      const cylRVal = parseFloat(cylR);
      if (isNaN(cylRVal)) return toast.error("Nilai CYL Kanan harus berupa angka");
      
      const axisRVal = parseInt(axisR);
      if (isNaN(axisRVal) || axisRVal < 0 || axisRVal > 180) {
        return toast.error("Axis Kanan (OD) wajib diisi antara 0° dan 180° jika nilai CYL diisi");
      }
    }

    if (addR) {
      const addRVal = parseFloat(addR);
      if (isNaN(addRVal) || addRVal < 0 || addRVal > 4) {
        return toast.error("Nilai ADD Kanan (OD) harus positif di rentang 0.00 hingga 4.00");
      }
    }

    // Validasi Mata Kiri (OS)
    const sphLVal = parseFloat(sphL);
    if (isNaN(sphLVal)) return toast.error("Nilai SPH Kiri harus berupa angka");

    if (cylL) {
      const cylLVal = parseFloat(cylL);
      if (isNaN(cylLVal)) return toast.error("Nilai CYL Kiri harus berupa angka");
      
      const axisLVal = parseInt(axisL);
      if (isNaN(axisLVal) || axisLVal < 0 || axisLVal > 180) {
        return toast.error("Axis Kiri (OS) wajib diisi antara 0° dan 180° jika nilai CYL diisi");
      }
    }

    if (addL) {
      const addLVal = parseFloat(addL);
      if (isNaN(addLVal) || addLVal < 0 || addLVal > 4) {
        return toast.error("Nilai ADD Kiri (OS) harus positif di rentang 0.00 hingga 4.00");
      }
    }

    setLoading(true)

    // Optional: Update patient DOB if it was empty/changed
    if (birthDate) {
      try {
        await apiClient.patch(`/patients/${patientId}`, { birth_date: birthDate })
      } catch (e) {
        console.error("Failed to update patient DOB", e)
      }
    }
    const details = [
      {
        eye: "R",
        sph: parseFloat(sphR) || 0,
        cyl: cylR ? parseFloat(cylR) : 0,
        axis: axisR ? parseInt(axisR) : 0,
        add_power: addR ? parseFloat(addR) : null,
      },
      {
        eye: "L",
        sph: parseFloat(sphL) || 0,
        cyl: cylL ? parseFloat(cylL) : 0,
        axis: axisL ? parseInt(axisL) : 0,
        add_power: addL ? parseFloat(addL) : null,
      },
    ]

    try {
      const res = await apiClient.post("/examinations", {
        patient_id: patientId,
        doctor_name: "Optometris Internal",
        source: "internal",
        prescriptions: [
          {
            type: lensType,
            pd: pd ? parseFloat(pd) : null,
            details,
          }
        ]
      })
      
      const newPrescriptionId = res.data.prescriptions?.[0]?.id
      toast.success("Catatan klinis berhasil disimpan")
      onOpenChange(false)
      if (onSuccess) onSuccess(patientId, newPrescriptionId)
      
      // Reset form
      resetForm()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menyimpan data")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setPatientId("")
    setPatientSearch("")
    setScanResult(null)
    setScanPreviewUrl(null)
    setSphR(""); setCylR(""); setAxisR(""); setAddR(""); setSphL(""); setCylL(""); setAxisL(""); setAddL(""); setPd("")
    setBirthDate("")
  }

  const calculateAge = (dob: string) => {
    if (!dob) return null
    const birth = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const selectedPatient = patients.find((p: any) => p.id === patientId)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] border-none rounded-2xl shadow-2xl bg-[#f8fafc] p-0 overflow-hidden">
        <div className="bg-white border-b border-slate-100 p-6 flex justify-between items-center">
          <DialogTitle className="text-lg font-bold text-slate-800">Input Hasil Pemeriksaan Optik</DialogTitle>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full h-8 w-8 hover:bg-slate-100">&times;</Button>
        </div>
        
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className={`space-y-8 ${scanPreviewUrl ? 'lg:order-last' : ''}`}>
              <section className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l-2 border-[#00a39d] pl-3">Data Pasien</h3>
                <div className="space-y-4">
                  <div className="grid gap-2 relative">
                    <Label className="text-[11px] font-bold text-slate-500">Cari Pasien</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        value={patientId ? (selectedPatient?.name || "") : patientSearch}
                        onChange={(e) => {
                          setPatientSearch(e.target.value)
                          if (patientId) setPatientId("")
                        }}
                        className="h-11 pl-9 rounded-lg bg-white border-slate-200 shadow-sm font-medium text-slate-700 focus:border-[#00a39d]" 
                        placeholder="Nama atau NIK..." 
                      />
                      {patientId && (
                        <button 
                          onClick={() => { setPatientId(""); setPatientSearch(""); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#00a39d] hover:underline"
                        >
                          GANTI
                        </button>
                      )}
                    </div>

                    {patientSearch && !patientId && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-2xl z-[100] max-h-48 overflow-y-auto">
                        {patients.filter((p: any) => 
                          p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
                          p.nik?.includes(patientSearch)
                        ).map((p: any) => (
                          <div 
                            key={p.id}
                            onClick={() => { setPatientId(p.id); setPatientSearch(""); }}
                            className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-all flex items-center justify-between group"
                          >
                            <div>
                              <p className="text-sm font-bold text-slate-800">{p.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium uppercase">NIK: {p.nik || '—'}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#00a39d] transition-all" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                       <Label className="text-[11px] font-bold text-slate-500">Tgl Lahir / Usia</Label>
                       <div className="relative group/dob">
                         <Input 
                           type="date"
                           className="h-11 rounded-lg bg-white border-slate-200 font-bold text-slate-700 focus:border-[#00a39d] transition-all" 
                           value={birthDate}
                           onChange={(e) => setBirthDate(e.target.value)}
                         />
                         {birthDate && (
                           <div className="absolute right-10 top-1/2 -translate-y-1/2 bg-[#1a2b3c] text-white text-[10px] px-2 py-1 rounded-md font-black italic">
                             {calculateAge(birthDate)} THN
                           </div>
                         )}
                         <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" />
                       </div>
                    </div>
                    <div className="grid gap-2">
                       <Label className="text-[11px] font-bold text-slate-500">Tipe Lensa</Label>
                       <select 
                         className="h-11 rounded-lg bg-white border border-slate-200 px-3 text-sm font-bold"
                         value={lensType}
                         onChange={(e) => setLensType(e.target.value)}
                       >
                         <option value="monofocal">Monofocal</option>
                         <option value="bifocal">Bifocal</option>
                         <option value="progressive">Progressive</option>
                       </select>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l-2 border-[#00a39d] pl-3">Ukuran Refraksi</h3>
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
                   <table className="w-full text-center">
                     <thead>
                       <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                         <th className="py-3 px-4 text-left">Mata</th>
                         <th className="py-3 px-4">SPH</th>
                         <th className="py-3 px-4">CYL</th>
                         <th className="py-3 px-4">AXIS</th>
                         <th className="py-3 px-4">ADD</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       <tr>
                         <td className="py-4 px-4 text-left text-xs font-bold text-slate-700">OD (Kanan)</td>
                         <td className="py-4 px-4"><Input className="h-9 w-20 mx-auto text-center font-bold rounded-md border-slate-200" value={sphR} onChange={e => setSphR(e.target.value)} placeholder="0.00" /></td>
                         <td className="py-4 px-4"><Input className="h-9 w-20 mx-auto text-center font-bold rounded-md border-slate-200" value={cylR} onChange={e => setCylR(e.target.value)} placeholder="0.00" /></td>
                         <td className="py-4 px-4"><Input className="h-9 w-20 mx-auto text-center font-bold rounded-md border-slate-200" value={axisR} onChange={e => setAxisR(e.target.value)} placeholder="0" /></td>
                         <td className="py-4 px-4"><Input className="h-9 w-20 mx-auto text-center font-bold rounded-md border-slate-200" value={addR} onChange={e => setAddR(e.target.value)} placeholder="0.00" /></td>
                       </tr>
                       <tr>
                         <td className="py-4 px-4 text-left text-xs font-bold text-slate-700">OS (Kiri)</td>
                         <td className="py-4 px-4"><Input className="h-9 w-20 mx-auto text-center font-bold rounded-md border-slate-200" value={sphL} onChange={e => setSphL(e.target.value)} placeholder="0.00" /></td>
                         <td className="py-4 px-4"><Input className="h-9 w-20 mx-auto text-center font-bold rounded-md border-slate-200" value={cylL} onChange={e => setCylL(e.target.value)} placeholder="0.00" /></td>
                         <td className="py-4 px-4"><Input className="h-9 w-20 mx-auto text-center font-bold rounded-md border-slate-200" value={axisL} onChange={e => setAxisL(e.target.value)} placeholder="0" /></td>
                         <td className="py-4 px-4"><Input className="h-9 w-20 mx-auto text-center font-bold rounded-md border-slate-200" value={addL} onChange={e => setAddL(e.target.value)} placeholder="0.00" /></td>
                       </tr>
                     </tbody>
                   </table>
                   <div className="p-4 bg-slate-50 flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-500 uppercase">Pupil Distance (PD)</span>
                     <div className="flex items-center gap-3">
                       <Input className="h-9 w-24 text-center font-bold rounded-md border-slate-200" value={pd} onChange={e => setPd(e.target.value)} placeholder="64" />
                       <span className="text-[11px] font-bold text-slate-400">MM</span>
                     </div>
                   </div>
                </div>
              </section>
            </div>

            <div className={`space-y-6 ${scanPreviewUrl ? 'lg:order-first' : ''}`}>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l-2 border-[#00a39d] pl-3">Otomasi AI (Scan Resep Luar)</h3>
              <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleOcrScan} />
              
              {scanPreviewUrl && !isScanning ? (
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-2xl overflow-hidden relative group bg-black/5 flex items-center justify-center h-[280px]">
                    <img src={scanPreviewUrl} alt="Scan Resep" className="max-h-full max-w-full object-contain" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                      <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="text-white border-white hover:bg-white/20 font-bold uppercase text-[10px] tracking-widest">
                        <Camera className="h-4 w-4 mr-2" /> Scan Ulang Dokumen
                      </Button>
                    </div>
                  </div>
                  {scanResult && (
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-emerald-800 leading-tight">AI Sinkronisasi Berhasil!</p>
                        <p className="text-[10px] text-emerald-600/70 font-medium">Data resep otomatis terisi di kolom sebelah kanan. Validasi hasil deteksi.</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center bg-white hover:bg-slate-50 hover:border-[#00a39d]/50 transition-all cursor-pointer group h-[280px]"
                >
                  {isScanning ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-10 w-10 text-[#00a39d] animate-spin" />
                      <p className="text-sm font-bold text-[#00a39d] uppercase">Memproses Gambar...</p>
                    </div>
                  ) : (
                    <>
                      <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-[#00a39d]/10 group-hover:text-[#00a39d] transition-all">
                        <Camera className="h-8 w-8" />
                      </div>
                      <p className="mt-6 text-sm font-bold text-slate-700">Foto Resep Rumah Sakit</p>
                      <p className="mt-1 text-[11px] text-slate-400 font-medium text-center">Gunakan kamera untuk mengisi data otomatis secara instan</p>
                    </>
                  )}
                </div>
              )}

              <div className="bg-[#1a2b3c] rounded-2xl p-6 text-white mt-12">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Instruksi</p>
                 <p className="text-[12px] leading-relaxed text-slate-300 italic">"Simpan hasil pemeriksaan ini untuk melanjutkan ke pemilihan frame dan lensa di terminal POS."</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-[#f1f5f9] p-8 border-t border-slate-200 flex flex-col items-center">
           <Button 
            onClick={handleCreatePrescription}
            disabled={loading || !patientId}
            className="w-full max-w-md bg-[#00a39d] hover:bg-[#008f8a] text-white h-14 rounded-xl font-bold flex gap-3 shadow-xl transition-all uppercase text-xs tracking-wider"
           >
             <span>{loading ? "Menyimpan..." : "Simpan & Lanjutkan ke Transaksi"}</span>
             <ChevronRight className="h-4 w-4" />
           </Button>
           <Button variant="ghost" className="mt-4 text-xs font-bold text-slate-400" onClick={() => onOpenChange(false)}>Tutup</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
