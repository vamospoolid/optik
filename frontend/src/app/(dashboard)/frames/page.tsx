"use client"

import { useEffect, useState } from "react"
import apiClient from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Glasses, Info, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function FramesPage() {
  const [frames, setFrames] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Form State
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [color, setColor] = useState("")
  const [sellingPrice, setSellingPrice] = useState("")
  const [supplierId, setSupplierId] = useState("")
  const [suppliers, setSuppliers] = useState<any[]>([])

  const fetchFrames = async (searchTerm = "") => {
    if (searchTerm) setIsSearching(true)
    setLoading(true)
    try {
      const res = await apiClient.get(`/inventory/frames?search=${searchTerm}`)
      setFrames(res.data || [])
    } catch (error) {
      toast.error("Gagal memuat katalog frame")
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const res = await apiClient.get("/suppliers")
      setSuppliers(res.data || [])
    } catch {}
  }

  useEffect(() => {
    fetchSuppliers()
    const delayDebounceFn = setTimeout(() => {
      fetchFrames(search)
    }, 400)
    return () => clearTimeout(delayDebounceFn)
  }, [search])

  const handleAddFrame = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiClient.post("/inventory/frames", { 
        brand, 
        model, 
        color, 
        selling_price: parseFloat(sellingPrice),
        supplier_id: supplierId || null
      })
      toast.success("Model frame berhasil didaftarkan")
      setIsDialogOpen(false)
      fetchFrames()
      setBrand("")
      setModel("")
      setColor("")
      setSellingPrice("")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menambah frame")
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1 w-6 bg-primary rounded-full"></div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Inventaris Produk</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Katalog Frame</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Kelola stok kacamata, brand, dan spesifikasi model</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button className="h-12 bg-[#00a39d] hover:bg-[#008f8a] text-white rounded-xl px-6 font-bold flex gap-2 shadow-lg active:scale-95 transition-all">
              <Plus className="h-5 w-5" /> Daftarkan Model Baru
            </Button>
          } />
          <DialogContent className="sm:max-w-[500px] border-0 p-0 overflow-hidden rounded-2xl shadow-2xl bg-white">
            <div className="bg-[#1a2b3c] p-8 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                <Glasses className="h-32 w-32" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Model Baru</DialogTitle>
                <DialogDescription className="text-slate-400 font-medium">
                  Tambahkan model kacamata baru ke dalam sistem inventaris cabang
                </DialogDescription>
              </DialogHeader>
            </div>
            <form onSubmit={handleAddFrame} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 ml-1">Nama Brand</Label>
                    <Input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Contoh: Ray-Ban" required className="h-11 rounded-xl bg-slate-50 border-slate-200 font-medium" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 ml-1">Seri / Model</Label>
                    <Input value={model} onChange={e => setModel(e.target.value)} placeholder="Contoh: Wayfarer" required className="h-11 rounded-xl bg-slate-50 border-slate-200 font-medium" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 ml-1">Varian Warna</Label>
                  <Input value={color} onChange={e => setColor(e.target.value)} placeholder="Matte Black / Gold" className="h-11 rounded-xl bg-slate-50 border-slate-200 font-medium" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 ml-1">Harga Jual (Rp)</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                    <Input type="number" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} placeholder="0" required className="h-12 pl-12 rounded-xl bg-slate-50 border-slate-200 font-bold text-primary" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 ml-1">Supplier / Pemasok</Label>
                  <Select value={supplierId} onValueChange={(val) => setSupplierId(val || "")}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 font-medium">
                      <SelectValue placeholder="Pilih supplier..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tanpa Supplier</SelectItem>
                      {suppliers.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="pt-2 gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-11 rounded-xl font-bold text-slate-500">Batal</Button>
                <Button type="submit" className="h-11 flex-1 rounded-xl bg-[#1a2b3c] hover:bg-black text-white font-bold shadow-lg">Simpan Data</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-xl rounded-2xl bg-white overflow-hidden mx-4">
        <CardHeader className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <CardTitle className="text-lg font-bold">Cari Katalog</CardTitle>
            </div>
          <div className="relative w-full md:w-96">
            <Input 
              placeholder="Cari brand, model, atau warna..." 
              className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-100 font-medium transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
               {isSearching ? <Loader2 className="h-4 w-4 text-primary animate-spin" /> : <Search className="h-4 w-4 text-slate-300" />}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#1a2b3c]">
                <TableRow className="hover:bg-transparent border-0">
                  <TableHead className="py-5 pl-8 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seri & Model</TableHead>
                  <TableHead className="py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Warna</TableHead>
                   <TableHead className="py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Harga Jual</TableHead>
                   <TableHead className="py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supplier</TableHead>
                   <TableHead className="py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Stok</TableHead>
                  <TableHead className="pr-8 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && !frames.length ? (
                  <TableRow><TableCell colSpan={5} className="h-64 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-300" /></TableCell></TableRow>
                ) : frames.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-64 text-center text-slate-400 font-medium">Model tidak ditemukan</TableCell></TableRow>
                ) : frames.map((frame) => {
                  const stock = frame.stocks?.[0]?.quantity || 0;
                  return (
                    <TableRow key={frame.id} className="hover:bg-slate-50/50 transition-colors group border-b border-slate-100">
                      <TableCell className="py-5 pl-8">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-all">
                            <Glasses className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{frame.brand}</span>
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{frame.model}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-md border-0 uppercase text-[9px]">
                          {frame.color || "—"}
                        </Badge>
                      </TableCell>
                       <TableCell className="text-sm font-bold text-slate-900">
                         Rp {(frame.selling_price || frame.price || 0).toLocaleString('id-ID')}
                       </TableCell>
                       <TableCell className="text-[10px] font-bold text-slate-500 uppercase">
                          {frame.supplier?.name || "—"}
                       </TableCell>
                      <TableCell className="text-center">
                        <div className={`inline-flex flex-col items-center px-3 py-1 rounded-xl ${stock > 5 ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                           <span className="text-base font-bold leading-none">{stock}</span>
                           <span className="text-[8px] font-bold uppercase mt-1">Unit</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 text-right pr-8">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all">
                           <Info className="h-4 w-4 text-slate-400" />
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
    </div>
  )
}
