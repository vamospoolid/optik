"use client"

import { useEffect, useState } from "react"
import apiClient from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShoppingCart, Search, Plus, Package, Check, Eye, Glasses } from "lucide-react"
import { toast } from "sonner"

interface NewOrderDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (orderId: string) => void
  defaultPatientId?: string
  defaultPrescriptionId?: string
}

export function NewOrderDialog({ isOpen, onOpenChange, onSuccess, defaultPatientId, defaultPrescriptionId }: NewOrderDialogProps) {
  // New Order State
  const [patientId, setPatientId] = useState(defaultPatientId || "")
  const [patientSearch, setPatientSearch] = useState("")
  const [prescriptionId, setPrescriptionId] = useState(defaultPrescriptionId || "")
  const [selectedFrame, setSelectedFrame] = useState<any>(null)
  const [selectedLens, setSelectedLens] = useState<any>(null)
  const [fittingPrice, setFittingPrice] = useState("")
  const [otherServiceDesc, setOtherServiceDesc] = useState("")
  const [otherServicePrice, setOtherServicePrice] = useState("")
  const [dpAmount, setDpAmount] = useState("0")
  const [dpMethod, setDpMethod] = useState("cash")
  const [discount, setDiscount] = useState("0")
  const [frameSearch, setFrameSearch] = useState("")
  const [lensSearch, setLensSearch] = useState("")
  const [transactionType, setTransactionType] = useState<"umum" | "bpjs">("umum")

  // Data Sources
  const [patients, setPatients] = useState<any[]>([])
  const [frames, setFrames] = useState<any[]>([])
  const [lenses, setLenses] = useState<any[]>([])
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchResources = async () => {
    try {
      const [pRes, fRes, lRes] = await Promise.all([
        apiClient.get("/patients"),
        apiClient.get("/inventory/frames"),
        apiClient.get("/inventory/lenses"),
      ])
      setPatients(pRes.data.data || [])
      setFrames(fRes.data || [])
      setLenses(lRes.data || [])
    } catch (error) {
      toast.error("Gagal memuat sumber daya")
    }
  }

  const fetchPrescriptions = async (pid: string) => {
    if (!pid) return setPrescriptions([])
    try {
      const res = await apiClient.get(`/prescriptions/patient/${pid}`)
      setPrescriptions(res.data || [])
    } catch { }
  }

  useEffect(() => {
    if (isOpen) {
      fetchResources()
      if (defaultPatientId) setPatientId(defaultPatientId)
      if (defaultPrescriptionId) setPrescriptionId(defaultPrescriptionId)
    }
  }, [isOpen, defaultPatientId, defaultPrescriptionId])

  useEffect(() => {
    fetchPrescriptions(patientId)
    setPrescriptionId("") 
    const p = patients.find(p => p.id === patientId)
    if (p?.bpjs_number) {
      setTransactionType("bpjs")
    } else {
      setTransactionType("umum")
    }
  }, [patientId, patients])

  const frameObj = frames.find((f: any) => f.id === selectedFrame)
  const lensObj = lenses.find((l: any) => l.id === selectedLens)
  const totalItems = (frameObj?.price || 0) + (lensObj?.price || 0) + (Number(fittingPrice) || 0) + (Number(otherServicePrice) || 0)
  const total = totalItems - (Number(discount) || 0)

  const handleCreateOrder = async () => {
    if (!patientId) return toast.error("Silakan pilih pasien")
    const items: any[] = []
    if (selectedFrame) items.push({ product_type: "frame", product_id: selectedFrame, price: frameObj?.price, qty: 1 })
    if (selectedLens) items.push({ product_type: "lens", product_id: selectedLens, price: lensObj?.price, qty: 1 })
    if (Number(fittingPrice) > 0) items.push({ product_type: "service", product_id: null, price: Number(fittingPrice), qty: 1 })
    if (otherServiceDesc && Number(otherServicePrice) > 0) items.push({ product_type: "service", product_id: null, price: Number(otherServicePrice), qty: 1 })
    if (items.length === 0) return toast.error("Minimal harus ada satu item")

    if (transactionType === 'bpjs' && (!prescriptionId || prescriptionId === 'none')) {
      return toast.error("Transaksi BPJS wajib menggunakan resep")
    }

    setLoading(true)
    try {
      const res = await apiClient.post("/orders", {
        patient_id: patientId,
        prescription_id: prescriptionId === 'none' ? null : prescriptionId,
        items,
        discount: Number(discount) || 0,
        dp_amount: Number(dpAmount) || 0,
        dp_method: dpMethod,
        is_bpjs: transactionType === 'bpjs'
      })
      toast.success(`Pesanan berhasil! Invoice: ${res.data.invoice.invoice_number}`)
      onOpenChange(false)
      resetForm()
      if (onSuccess) onSuccess(res.data.order.id)
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal membuat pesanan")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFittingPrice(""); setOtherServiceDesc(""); setOtherServicePrice(""); setDpAmount("0"); setFrameSearch(""); setLensSearch("")
    setDiscount("0")
  }

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
    p.phone?.includes(patientSearch) ||
    p.nik?.includes(patientSearch)
  ).slice(0, 5)

  const formatRupiah = (val: string | number) => {
    const num = typeof val === 'string' ? parseInt(val.replace(/\D/g, "")) : val
    if (isNaN(num)) return "0"
    return num.toLocaleString('id-ID')
  }

  const handleRupiahChange = (val: string, setter: (v: string) => void) => {
    const raw = val.replace(/\D/g, "")
    setter(raw)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1100px] rounded-[2rem] border-0 p-0 overflow-hidden shadow-2xl bg-[#f8fafc]">
        <div className="bg-[#1a2b3c] p-6 relative overflow-hidden text-white flex justify-between items-center">
           <div className="flex items-center gap-4 relative z-10">
             <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-white" />
             </div>
             <div>
                <DialogTitle className="text-xl font-bold tracking-tight">Transaksi POS Cepat</DialogTitle>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Kasir Optik88 Dashboard</p>
             </div>
           </div>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start overflow-visible max-h-[85vh] overflow-y-auto">
          <div className="lg:col-span-7 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 relative">
                <Label className="text-xs font-semibold text-slate-500 ml-1">Cari Pasien</Label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Nama atau WA..." 
                    className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200"
                    value={patientId ? (patients.find(p=>p.id===patientId)?.name || "") : patientSearch}
                    onChange={(e) => { setPatientSearch(e.target.value); if (patientId) setPatientId("") }}
                  />
                  {patientId && (
                    <button onClick={() => setPatientId("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-bold text-xs">GANTI</button>
                  )}
                </div>
                {patientSearch && !patientId && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl z-[100] overflow-hidden">
                    {filteredPatients.map((p: any) => (
                      <div 
                        key={p.id} 
                        onClick={() => { setPatientId(p.id); setPatientSearch("") }}
                        className="p-3 hover:bg-primary/5 cursor-pointer border-b border-slate-50 last:border-0 transition-colors flex flex-col"
                      >
                        <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                        <span className="text-[10px] font-medium text-slate-400 uppercase">{p.phone || 'No Phone'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 ml-1">Jenis Transaksi</Label>
                <div className="flex p-1 bg-slate-100 rounded-xl h-12">
                   <button onClick={() => setTransactionType("umum")} className={`flex-1 rounded-lg text-xs font-bold ${transactionType==='umum'?'bg-white shadow-sm':'text-slate-400'}`}>UMUM</button>
                   <button onClick={() => setTransactionType("bpjs")} className={`flex-1 rounded-lg text-xs font-bold ${transactionType==='bpjs'?'bg-[#00a39d] text-white shadow-sm':'text-slate-400'}`}>BPJS</button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-400 ml-1">Resep Klinis</Label>
              <Select value={prescriptionId} onValueChange={(val) => setPrescriptionId(val || "")}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold">
                  <SelectValue placeholder="Pilih resep...">
                    {(() => {
                      const p = prescriptions.find(x => x.id === prescriptionId)
                      if (!p) return null
                      const od = p.details?.find((d: any) => d.eye === 'R')
                      const os = p.details?.find((d: any) => d.eye === 'L')
                    const formatVal = (v: number) => (v > 0 ? '+' : '') + v.toFixed(2)
                    const formatAdd = (detail: any) => detail && (detail.add_power !== null && detail.add_power !== undefined) ? ` Add +${detail.add_power.toFixed(2)}` : ''
                    return (
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-primary/70">[{new Date(p.created_at).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})}]</span>
                        <span className="text-slate-700">R: {od ? formatVal(od.sph) : '—'}{od ? formatAdd(od) : ''}</span>
                        <span className="text-slate-700">L: {os ? formatVal(os.sph) : '—'}{os ? formatAdd(os) : ''}</span>
                        <span className="text-slate-400">PD: {p.pd || '0'}mm</span>
                      </div>
                    )
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="italic">— Tanpa Resep —</SelectItem>
                {prescriptions.map((p: any) => {
                  const od = p.details?.find((d: any) => d.eye === 'R')
                  const os = p.details?.find((d: any) => d.eye === 'L')
                  const formatVal = (v: number) => (v > 0 ? '+' : '') + v.toFixed(2)
                  const formatAdd = (detail: any) => detail && (detail.add_power !== null && detail.add_power !== undefined) ? ` Add +${detail.add_power.toFixed(2)}` : ''
                  
                  return (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex flex-col py-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1a2b3c]">{new Date(p.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase py-0.5 px-1.5 bg-slate-100 rounded-md">{p.type}</span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-500 mt-1 flex gap-3">
                          <span>R: <b className="text-[#00a39d]">{od ? `${formatVal(od.sph)} / ${od.cyl.toFixed(2)}` : '—'}{od ? formatAdd(od) : ''}</b></span>
                          <span>L: <b className="text-sky-500">{os ? `${formatVal(os.sph)} / ${os.cyl.toFixed(2)}` : '—'}{os ? formatAdd(os) : ''}</b></span>
                          <span>PD: <b className="text-slate-800">{p.pd || '0'}mm</b></span>
                        </div>
                      </div>
                    </SelectItem>
                  )
                })}
                </SelectContent>
              </Select>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 relative">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Input Frame</Label>
                  <div className="relative">
                    <Input 
                      placeholder="Brand/Model..." 
                      className="rounded-xl h-11 font-medium bg-white border-slate-200"
                      value={selectedFrame ? (() => {
                        const f = frames.find(f => f.id === selectedFrame);
                        return f ? `${f.brand} ${f.model}` : "";
                      })() : frameSearch}
                      onChange={(e) => { setFrameSearch(e.target.value); if (selectedFrame) setSelectedFrame(null) }}
                    />
                  </div>
                  {frameSearch && !selectedFrame && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-[110] max-h-48 overflow-y-auto">
                      {frames.filter(f => (f.brand + " " + f.model).toLowerCase().includes(frameSearch.toLowerCase())).map((f: any) => (
                        <div key={f.id} onClick={() => { setSelectedFrame(f.id); setFrameSearch("") }} className="p-3 hover:bg-slate-50 cursor-pointer border-b text-xs font-bold transition-colors">
                          {f.brand} {f.model} - Rp {f.price?.toLocaleString()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1 relative">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Input Lensa</Label>
                  <div className="relative">
                    <Input 
                      placeholder="Lensa tipe..." 
                      className="rounded-xl h-11 font-medium bg-white border-slate-200"
                      value={selectedLens ? (() => {
                        const l = lenses.find(l => l.id === selectedLens);
                        return l ? `${l.brand} ${l.type}` : "";
                      })() : lensSearch}
                      onChange={(e) => { setLensSearch(e.target.value); if (selectedLens) setSelectedLens(null) }}
                    />
                  </div>
                  {lensSearch && !selectedLens && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-[110] max-h-48 overflow-y-auto">
                      {lenses.filter(l => (l.brand + " " + l.type).toLowerCase().includes(lensSearch.toLowerCase())).map((l: any) => (
                        <div key={l.id} onClick={() => { setSelectedLens(l.id); setLensSearch("") }} className="p-3 hover:bg-slate-50 cursor-pointer border-b text-xs font-bold transition-colors">
                          {l.brand} {l.type} - Rp {l.price?.toLocaleString()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px bg-slate-200 w-full opacity-40"></div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                   <Label className="text-[10px] font-bold text-slate-400 uppercase">Biaya Jasa Pasang</Label>
                   <p className="text-[11px] text-slate-500 font-medium">Fiting & kalibrasi kacamata</p>
                </div>
                <div className="relative w-40">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">Rp</span>
                  <Input 
                    className="rounded-xl h-11 font-bold pl-8 text-right bg-white border-slate-200" 
                    value={formatRupiah(fittingPrice)} 
                    onChange={e => handleRupiahChange(e.target.value, setFittingPrice)} 
                    placeholder="0" 
                  />
                </div>
              </div>

              <div className="h-px bg-slate-200 w-full opacity-40"></div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                   <Label className="text-[10px] font-bold text-red-500 uppercase italic tracking-wider">Potongan Harga / Diskon</Label>
                   <p className="text-[11px] text-slate-500 font-medium italic">Diskon khusus untuk pelanggan</p>
                </div>
                <div className="relative w-40">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">Rp</span>
                  <Input 
                    className="rounded-xl h-11 font-black pl-8 text-right bg-white border-red-100 text-red-600 focus:ring-red-200 shadow-sm" 
                    value={formatRupiah(discount)} 
                    onChange={e => handleRupiahChange(e.target.value, setDiscount)} 
                    placeholder="0" 
                  />
                </div>
              </div>

              <div className="h-px bg-slate-200 w-full opacity-40"></div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Biaya Lainnya (Opsional)</Label>
                  <Input 
                    className="rounded-xl h-11 font-medium bg-white border-slate-200" 
                    value={otherServiceDesc} 
                    onChange={e => setOtherServiceDesc(e.target.value)} 
                    placeholder="Contoh: Ongkir, Box khusus, dll" 
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">Rp</span>
                  <Input 
                    className="rounded-xl h-11 font-bold pl-8 text-right bg-white border-slate-200" 
                    value={formatRupiah(otherServicePrice)} 
                    onChange={e => handleRupiahChange(e.target.value, setOtherServicePrice)} 
                    placeholder="0" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 bg-slate-900 text-white rounded-[2rem] space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="flex justify-between items-center border-b border-white/5 pb-6 relative z-10">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Grand Total Tagihan</span>
                <p className="text-3xl font-black italic tracking-tighter">Rp {total.toLocaleString('id-ID')}</p>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase">Setoran DP / Bayar</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">Rp</span>
                      <Input 
                        className="rounded-xl bg-white/5 border-white/5 h-12 text-white font-bold pl-8 text-right focus:border-white/20" 
                        value={formatRupiah(dpAmount)} 
                        onChange={e => handleRupiahChange(e.target.value, setDpAmount)} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase">Metode</Label>
                    <Select value={dpMethod} onValueChange={(val) => setDpMethod(val || "cash")}>
                      <SelectTrigger className="rounded-xl h-12 bg-white/5 border-white/5 font-bold text-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">TUNAI</SelectItem>
                        <SelectItem value="debit">DEBIT CARD</SelectItem>
                        <SelectItem value="transfer">E-TRANSFER</SelectItem>
                        {transactionType === 'bpjs' && <SelectItem value="bpjs" className="font-bold text-[#00a39d]">KLAIM BPJS</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={handleCreateOrder} disabled={!patientId || total === 0 || loading} className="w-full bg-[#00a39d] hover:bg-black text-white h-16 rounded-2xl font-black italic uppercase text-sm shadow-xl transition-all">
              {loading ? "Menghubungkan..." : "Simpan & Proses Pesanan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
