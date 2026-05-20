"use client"

import { useEffect, useState } from "react"
import apiClient from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Eye, Info, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function LensesPage() {
  const [lenses, setLenses] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Form State
  const [brand, setBrand] = useState("")
  const [type, setType] = useState("monofocal")
  const [feature, setFeature] = useState("normal")
  const [sellingPrice, setSellingPrice] = useState("")
  const [supplierId, setSupplierId] = useState("")
  const [suppliers, setSuppliers] = useState<any[]>([])

  const fetchLenses = async (searchTerm = "") => {
    if (searchTerm) setIsSearching(true)
    setLoading(true)
    try {
      const res = await apiClient.get(`/inventory/lenses?search=${searchTerm}`)
      setLenses(res.data || [])
    } catch (error) {
      toast.error("Gagal memuat katalog lensa")
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
      fetchLenses(search)
    }, 400)
    return () => clearTimeout(delayDebounceFn)
  }, [search])

  const handleAddLens = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiClient.post("/inventory/lenses", { 
        brand, 
        type, 
        feature, 
        selling_price: parseFloat(sellingPrice),
        supplier_id: supplierId || null
      })
      toast.success("Tipe lensa berhasil didaftarkan")
      setIsDialogOpen(false)
      fetchLenses()
      setBrand("")
      setSellingPrice("")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menambah lensa")
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
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Katalog Lensa</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Kelola stok lensa optik, brand, dan fitur teknis</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button className="h-12 bg-[#00a39d] hover:bg-[#008f8a] text-white rounded-xl px-6 font-bold flex gap-2 shadow-lg active:scale-95 transition-all">
              <Plus className="h-5 w-5" /> Daftarkan Lensa Baru
            </Button>
          } />
          <DialogContent className="sm:max-w-[500px] border-0 p-0 overflow-hidden rounded-2xl shadow-2xl bg-white">
             <div className="bg-[#1a2b3c] p-8 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                <Eye className="h-32 w-32" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Lensa Baru</DialogTitle>
                <DialogDescription className="text-slate-400 font-medium">
                  Konfigurasikan spesifikasi teknis lensa untuk katalog inventaris
                </DialogDescription>
              </DialogHeader>
            </div>
            <form onSubmit={handleAddLens} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 ml-1">Nama Brand</Label>
                  <Input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Essilor / Zeiss / Hoya" required className="h-11 rounded-xl bg-slate-50 border-slate-200 font-medium" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 ml-1">Tipe Optik</Label>
                    <Select value={type} onValueChange={(val) => setType(val || "monofocal")}>
                      <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 font-medium"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monofocal" className="text-sm">Monofocal</SelectItem>
                        <SelectItem value="bifocal" className="text-sm">Bifocal</SelectItem>
                        <SelectItem value="progressive" className="text-sm">Progressive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 ml-1">Fitur Khusus</Label>
                    <Select value={feature} onValueChange={(val) => setFeature(val || "normal")}>
                      <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 font-medium"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal" className="text-sm">Normal</SelectItem>
                        <SelectItem value="bluecromic" className="text-sm">Bluecromic</SelectItem>
                        <SelectItem value="photochromic" className="text-sm">Photochromic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
              <CardTitle className="text-lg font-bold">Cari Lensa</CardTitle>
            </div>
          <div className="relative w-full md:w-96">
            <Input 
              placeholder="Cari berdasarkan brand lensa..." 
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
                  <TableHead className="py-5 pl-8 text-xs font-bold text-slate-400 uppercase tracking-wider">Brand Lensa</TableHead>
                  <TableHead className="py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Klasifikasi</TableHead>
                   <TableHead className="py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Harga Jual</TableHead>
                   <TableHead className="py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Supplier</TableHead>
                   <TableHead className="py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Stok</TableHead>
                  <TableHead className="pr-8 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && !lenses.length ? (
                  <TableRow><TableCell colSpan={5} className="h-64 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-300" /></TableCell></TableRow>
                ) : lenses.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-64 text-center text-slate-400 font-medium">Data lensa tidak ditemukan</TableCell></TableRow>
                ) : lenses.map((lens) => {
                  const stock = lens.stocks?.[0]?.quantity || 0;
                  return (
                    <TableRow key={lens.id} className="hover:bg-slate-50/50 transition-colors group border-b border-slate-100">
                      <TableCell className="py-5 pl-8">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-all text-slate-400">
                            <Eye className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{lens.brand}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{lens.type}</span>
                          <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">{lens.feature}</span>
                        </div>
                      </TableCell>
                       <TableCell className="text-sm font-bold text-slate-900">
                         Rp {(lens.selling_price || lens.price || 0).toLocaleString('id-ID')}
                       </TableCell>
                       <TableCell className="text-[10px] font-bold text-slate-500 uppercase">
                          {lens.supplier?.name || "—"}
                       </TableCell>
                      <TableCell className="text-center">
                        <div className={`inline-flex flex-col items-center px-3 py-1 rounded-xl ${stock > 5 ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                           <span className="text-base font-bold leading-none">{stock}</span>
                           <span className="text-[8px] font-bold uppercase mt-1">Pcs</span>
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
