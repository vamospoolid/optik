
"use client"

import { useEffect, useState } from "react"
import apiClient from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Glasses, Info, Loader2, Package, Truck, Layers, History, ArrowUpRight, ArrowDownLeft, SlidersHorizontal, User } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function InventoryPage() {
  const [frames, setFrames] = useState<any[]>([])
  const [lenses, setLenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [isFrameDialogOpen, setIsFrameDialogOpen] = useState(false)
  const [isLensDialogOpen, setIsLensDialogOpen] = useState(false)

  // Form States - Frame
  const [frameBrand, setFrameBrand] = useState("")
  const [frameModel, setFrameModel] = useState("")
  const [frameSku, setFrameSku] = useState("")
  const [frameColor, setFrameColor] = useState("")
  const [framePrice, setFramePrice] = useState("")
  const [frameSupplierId, setFrameSupplierId] = useState("")

  // Form States - Lens
  const [lensBrand, setLensBrand] = useState("")
  const [lensType, setLensType] = useState("monofocal")
  const [lensFeature, setLensFeature] = useState("normal")
  const [lensPrice, setLensPrice] = useState("")
  const [lensSupplierId, setLensSupplierId] = useState("")
  
  const [framePurchasePrice, setFramePurchasePrice] = useState("")
  
  // Stock Movement States
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [movements, setMovements] = useState<any[]>([])
  const [activeItem, setActiveItem] = useState<any>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  const [lensPurchasePrice, setLensPurchasePrice] = useState("")
  const [initialStock, setInitialStock] = useState("0")

  useEffect(() => {
    fetchData()
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const res = await apiClient.get("/suppliers")
      setSuppliers(res.data || [])
    } catch {}
  }

  const fetchData = async (searchTerm = "") => {
    setLoading(true)
    try {
      const [framesRes, lensesRes] = await Promise.all([
        apiClient.get(`/inventory/frames?search=${searchTerm}`),
        apiClient.get(`/inventory/lenses?search=${searchTerm}`)
      ])
      setFrames(framesRes.data || [])
      setLenses(lensesRes.data || [])
    } catch (error) {
      toast.error("Gagal memuat data inventory")
    } finally {
      setLoading(false)
    }
  }

  const fetchMovements = async (productId: string, item: any) => {
    setLoadingHistory(true)
    setActiveItem(item)
    setIsHistoryOpen(true)
    try {
      const res = await apiClient.get(`/inventory/${productId}/movements`)
      setMovements(res.data || [])
    } catch (error) {
      toast.error("Gagal memuat riwayat stok")
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleAddFrame = async () => {
    if (!frameBrand || !framePrice) return toast.error("Lengkapi data frame")
    try {
      await apiClient.post("/inventory/frames", {
        brand: frameBrand,
        model: frameModel,
        sku: frameSku,
        color: frameColor,
        selling_price: framePrice,
        purchase_price: framePurchasePrice,
        initial_stock: parseInt(initialStock),
        supplier_id: frameSupplierId === "none" ? null : frameSupplierId
      })
      toast.success("Frame berhasil ditambahkan")
      setIsFrameDialogOpen(false)
      fetchData()
    } catch {
      toast.error("Gagal menambahkan frame")
    }
  }

  const handleAddLens = async () => {
    if (!lensBrand || !lensPrice) return toast.error("Lengkapi data lensa")
    try {
      await apiClient.post("/inventory/lenses", {
        brand: lensBrand,
        type: lensType,
        feature: lensFeature,
        selling_price: lensPrice,
        purchase_price: lensPurchasePrice,
        initial_stock: parseInt(initialStock),
        supplier_id: lensSupplierId === "none" ? null : lensSupplierId
      })
      toast.success("Lensa berhasil ditambahkan")
      setIsLensDialogOpen(false)
      fetchData()
    } catch {
      toast.error("Gagal menambahkan lensa")
    }
  }

  const formatRupiah = (val: string | number) => {
    const num = typeof val === 'string' ? parseInt(val.replace(/\D/g, "")) : val
    if (isNaN(num)) return "0"
    return num.toLocaleString('id-ID')
  }

  const handleRupiahChange = (val: string, setter: (v: string) => void) => {
    const raw = val.replace(/\D/g, "")
    setter(raw)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchData(search)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="h-8 w-1 bg-[#00a39d] rounded-full"></div>
             <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">
               Manajemen Inventory
             </h1>
          </div>
          <p className="text-slate-500 font-bold text-sm ml-4">Kelola stok kacamata, lensa, dan aksesoris lainnya</p>
        </div>

        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Cari brand, model, atau kategory..." 
            className="pl-12 rounded-2xl border-none bg-white shadow-sm h-12 font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 flex items-center gap-5">
             <div className="h-14 w-14 rounded-2xl bg-[#1a2b3c] flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <Glasses className="h-7 w-7" />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Frame</p>
                <h3 className="text-2xl font-black text-slate-800 italic">{frames.length} <span className="text-xs not-italic text-slate-400 font-bold ml-1">Katalog</span></h3>
             </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 flex items-center gap-5">
             <div className="h-14 w-14 rounded-2xl bg-[#00a39d] flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <Layers className="h-7 w-7" />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Lensa</p>
                <h3 className="text-2xl font-black text-slate-800 italic">{lenses.length} <span className="text-xs not-italic text-slate-400 font-bold ml-1">Tipe</span></h3>
             </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 flex items-center gap-5">
             <div className="h-14 w-14 rounded-2xl bg-amber-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <Package className="h-7 w-7" />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Unit</p>
                <h3 className="text-2xl font-black text-slate-800 italic">
                  {frames.reduce((acc, f) => acc + (f.stocks?.[0]?.quantity || 0), 0) + lenses.reduce((acc, l) => acc + (l.stocks?.[0]?.quantity || 0), 0)}
                  <span className="text-xs not-italic text-slate-400 font-bold ml-1">Stok Tersedia</span>
                </h3>
             </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="frames" className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <TabsList className="bg-slate-200/50 p-1.5 rounded-2xl w-fit">
            <TabsTrigger value="frames" className="rounded-xl font-black italic uppercase text-[11px] px-8 data-[state=active]:bg-[#1a2b3c] data-[state=active]:text-white transition-all">
              Katalog Frame
            </TabsTrigger>
            <TabsTrigger value="lenses" className="rounded-xl font-black italic uppercase text-[11px] px-8 data-[state=active]:bg-[#1a2b3c] data-[state=active]:text-white transition-all">
              Katalog Lensa
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Dialog open={isFrameDialogOpen} onOpenChange={setIsFrameDialogOpen}>
              <DialogTrigger render={
                <Button className="bg-[#1a2b3c] hover:bg-black text-white rounded-2xl font-black italic uppercase text-[10px] gap-2 h-11 px-6 shadow-lg shadow-slate-200">
                  <Plus className="h-4 w-4" /> Tambah Frame
                </Button>
              } />
              <DialogContent className="rounded-[2rem] max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Tambah Frame Baru</DialogTitle>
                  <DialogDescription className="font-bold text-slate-400">Masukkan detail produk frame kacamata</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Brand</Label>
                       <Input placeholder="Ray-Ban" className="rounded-xl border-slate-200 focus:ring-primary" value={frameBrand} onChange={(e) => setFrameBrand(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Model</Label>
                       <Input placeholder="Aviator" className="rounded-xl border-slate-200" value={frameModel} onChange={(e) => setFrameModel(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">ID Frame / SKU</Label>
                    <Input placeholder="RB-AV-001" className="rounded-xl border-slate-200 font-mono" value={frameSku} onChange={(e) => setFrameSku(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Warna</Label>
                      <Input placeholder="Gold" className="rounded-xl border-slate-200" value={frameColor} onChange={(e) => setFrameColor(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-[#00a39d] ml-1">Stok Awal</Label>
                       <Input type="number" className="rounded-xl border-[#00a39d]/20 bg-[#00a39d]/5 font-black text-[#00a39d]" value={initialStock} onChange={(e) => setInitialStock(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Harga Beli (HPP)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">Rp</span>
                          <Input 
                            className="rounded-xl border-slate-200 font-bold pl-8 text-right bg-slate-50" 
                            value={formatRupiah(framePurchasePrice)} 
                            onChange={(e) => handleRupiahChange(e.target.value, setFramePurchasePrice)} 
                          />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Harga Jual</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">Rp</span>
                          <Input 
                            className="rounded-xl border-slate-200 font-bold pl-8 text-right" 
                            value={formatRupiah(framePrice)} 
                            onChange={(e) => handleRupiahChange(e.target.value, setFramePrice)} 
                          />
                        </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Supplier</Label>
                    <Select value={frameSupplierId} onValueChange={(v) => setFrameSupplierId(v || "none")}>
                      <SelectTrigger className="rounded-xl border-slate-200">
                        <SelectValue placeholder="Pilih Supplier">
                          {suppliers.find(s => s.id === frameSupplierId)?.name}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="none">Tanpa Supplier</SelectItem>
                        {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddFrame} className="w-full bg-[#00a39d] hover:bg-[#008a85] text-white rounded-2xl font-black italic uppercase py-6">Simpan Frame</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isLensDialogOpen} onOpenChange={setIsLensDialogOpen}>
              <DialogTrigger render={
                <Button className="bg-[#00a39d] hover:bg-[#008a85] text-white rounded-2xl font-black italic uppercase text-[10px] gap-2 h-11 px-6 shadow-lg shadow-teal-100">
                  <Plus className="h-4 w-4" /> Tambah Lensa
                </Button>
              } />
              <DialogContent className="rounded-[2rem] max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Tambah Lensa Baru</DialogTitle>
                  <DialogDescription className="font-bold text-slate-400">Masukkan detail spesifikasi lensa</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Brand Lensa</Label>
                    <Input placeholder="Essilor" className="rounded-xl border-slate-200" value={lensBrand} onChange={(e) => setLensBrand(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tipe</Label>
                      <Select value={lensType} onValueChange={(v) => setLensType(v || "monofocal")}>
                        <SelectTrigger className="rounded-xl border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="monofocal">Monofocal</SelectItem>
                          <SelectItem value="bifocal">Bifocal</SelectItem>
                          <SelectItem value="progressive">Progressive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Fitur</Label>
                      <Select value={lensFeature} onValueChange={(v) => setLensFeature(v || "normal")}>
                        <SelectTrigger className="rounded-xl border-slate-200 uppercase text-[10px] font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="bluecromic">Bluecromic</SelectItem>
                          <SelectItem value="photochromic">Photochromic</SelectItem>
                          <SelectItem value="blue_protect">Blue Protect</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Harga Beli (HPP)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">Rp</span>
                          <Input 
                            className="rounded-xl border-slate-200 font-bold pl-8 text-right bg-slate-50" 
                            value={formatRupiah(lensPurchasePrice)} 
                            onChange={(e) => handleRupiahChange(e.target.value, setLensPurchasePrice)} 
                          />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Harga Jual</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">Rp</span>
                          <Input 
                            className="rounded-xl border-slate-200 font-bold pl-8 text-right" 
                            value={formatRupiah(lensPrice)} 
                            onChange={(e) => handleRupiahChange(e.target.value, setLensPrice)} 
                          />
                        </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-secondary ml-1">Stok Awal</Label>
                         <Input type="number" className="rounded-xl border-secondary/20 bg-secondary/5 font-black text-secondary" value={initialStock} onChange={(e) => setInitialStock(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Supplier</Label>
                        <Select value={lensSupplierId} onValueChange={(v) => setLensSupplierId(v || "none")}>
                          <SelectTrigger className="rounded-xl border-slate-200">
                            <SelectValue placeholder="Pilih Supplier">
                              {suppliers.find(s => s.id === lensSupplierId)?.name}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="none">Tanpa Supplier</SelectItem>
                            {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddLens} className="w-full bg-[#1a2b3c] hover:bg-black text-white rounded-2xl font-black italic uppercase py-6">Simpan Lensa</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="frames" className="mt-0">
          <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="font-black text-[10px] uppercase text-slate-400 px-8 py-5">Frame & Model</TableHead>
                    <TableHead className="font-black text-[10px] uppercase text-slate-400">Warna</TableHead>
                    <TableHead className="font-black text-[10px] uppercase text-slate-400 text-right">Harga Jual</TableHead>
                    <TableHead className="font-black text-[10px] uppercase text-slate-400 text-center">Stok</TableHead>
                    <TableHead className="font-black text-[10px] uppercase text-slate-400 px-8">Supplier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-200" />
                        <p className="mt-3 font-bold text-slate-400">Mengambil data frame...</p>
                      </TableCell>
                    </TableRow>
                  ) : frames.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20 text-center italic text-slate-400 font-bold">
                        Data frame tidak ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    frames.map((frame) => (
                      <TableRow key={frame.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="px-8 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#1a2b3c]">
                               <Glasses className="h-5 w-5" />
                            </div>
                             <div>
                                <p className="font-black text-slate-800 italic uppercase leading-none mb-1">{frame.brand}</p>
                                <p className="text-[10px] font-bold text-slate-400">{frame.model} {frame.sku && <span className="text-[#00a39d]">| ID: {frame.sku}</span>}</p>
                             </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-slate-600 uppercase text-xs">
                          {frame.color || '-'}
                        </TableCell>
                        <TableCell className="text-right font-black italic text-[#00a39d]">
                          Rp {frame.price?.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-center">
                           <Badge className={`rounded-lg px-3 py-1 font-black ${
                             (frame.stocks?.[0]?.quantity || 0) < 5 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                           }`}>
                             {frame.stocks?.[0]?.quantity || 0} PCS
                           </Badge>
                        </TableCell>
                         <TableCell className="px-8 pr-12 text-right">
                           <div className="flex items-center justify-end gap-2">
                             <div className="flex flex-col items-end mr-4">
                                <span className="text-xs font-bold text-slate-500 uppercase">{frame.supplier?.name || '-'}</span>
                                <div className="flex items-center gap-1">
                                  <Truck className="h-3 w-3 text-slate-300" />
                                  <span className="text-[9px] font-bold text-slate-300 uppercase italic">Supplier</span>
                                </div>
                             </div>
                             <Button onClick={() => fetchMovements(frame.id, frame)} variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-[#1a2b3c] hover:text-white transition-all">
                               <History className="h-4 w-4" />
                             </Button>
                           </div>
                         </TableCell>
                       </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lenses" className="mt-0">
          <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="font-black text-[10px] uppercase text-slate-400 px-8 py-5">Brand & Tipe</TableHead>
                    <TableHead className="font-black text-[10px] uppercase text-slate-400">Fitur</TableHead>
                    <TableHead className="font-black text-[10px] uppercase text-slate-400 text-right">Harga Jual</TableHead>
                    <TableHead className="font-black text-[10px] uppercase text-slate-400 text-center">Stok</TableHead>
                    <TableHead className="font-black text-[10px] uppercase text-slate-400 px-8">Supplier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-200" />
                        <p className="mt-3 font-bold text-slate-400">Mengambil data lensa...</p>
                      </TableCell>
                    </TableRow>
                  ) : lenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20 text-center italic text-slate-400 font-bold">
                        Data lensa tidak ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    lenses.map((lens) => (
                      <TableRow key={lens.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="px-8 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#00a39d]">
                               <Layers className="h-5 w-5" />
                            </div>
                            <div>
                               <p className="font-black text-slate-800 italic uppercase leading-none mb-1">{lens.brand}</p>
                               <p className="text-[10px] font-bold text-slate-400 capitalize">{lens.type}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                           <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-600 font-bold text-[10px] uppercase py-0.5">
                              {lens.feature}
                           </Badge>
                        </TableCell>
                        <TableCell className="text-right font-black italic text-[#00a39d]">
                          Rp {lens.price?.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-center">
                           <Badge className={`rounded-lg px-3 py-1 font-black ${
                             (lens.stocks?.[0]?.quantity || 0) < 5 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                           }`}>
                             {lens.stocks?.[0]?.quantity || 0} PCS
                           </Badge>
                        </TableCell>
                         <TableCell className="px-8 pr-12 text-right">
                            <div className="flex items-center justify-end gap-2">
                               <div className="flex flex-col items-end mr-4">
                                  <span className="text-xs font-bold text-slate-500 uppercase">{lens.supplier?.name || '-'}</span>
                                  <div className="flex items-center gap-1">
                                    <Truck className="h-3 w-3 text-slate-300" />
                                    <span className="text-[9px] font-bold text-slate-300 uppercase italic">Supplier</span>
                                  </div>
                               </div>
                               <Button onClick={() => fetchMovements(lens.id, lens)} variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-[#00a39d] hover:text-white transition-all">
                                 <History className="h-4 w-4" />
                               </Button>
                            </div>
                         </TableCell>
                       </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-900 p-8 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <History className="h-32 w-32" />
            </div>
            <div className="relative z-10 flex justify-between items-center">
               <div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter">Riwayat Mutasi Stok</h2>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Log Histori Barang Masuk & Keluar</p>
               </div>
               <div className="px-4 py-2 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Total Unit</p>
                  <p className="text-xl font-black text-[#00a39d]">{activeItem?.stocks?.[0]?.quantity || 0} PCS</p>
               </div>
            </div>
            {activeItem && (
               <div className="mt-8 flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
                     {activeItem.brand ? <Glasses className="h-6 w-6" /> : <Layers className="h-6 w-6" />}
                  </div>
                  <div>
                     <p className="text-lg font-black italic uppercase tracking-tight">{activeItem.brand} {activeItem.model || activeItem.type}</p>
                     <p className="text-xs font-bold text-slate-500 uppercase">{activeItem.sku || activeItem.feature}</p>
                  </div>
               </div>
            )}
          </div>
          
          <div className="p-8 max-h-[50vh] overflow-y-auto custom-scrollbar bg-white">
            {loadingHistory ? (
              <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-200" /></div>
            ) : movements.length === 0 ? (
              <div className="py-20 text-center italic text-slate-400 font-bold">Belum ada riwayat mutasi stok</div>
            ) : (
              <div className="space-y-4">
                {movements.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all">
                    <div className="flex items-center gap-4">
                       <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                         m.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : m.type === 'OUT' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                       }`}>
                         {m.type === 'IN' ? <ArrowUpRight className="h-5 w-5" /> : m.type === 'OUT' ? <ArrowDownLeft className="h-5 w-5" /> : <SlidersHorizontal className="h-5 w-5" />}
                       </div>
                       <div>
                          <div className="flex items-center gap-2">
                             <span className="text-sm font-black text-slate-800 uppercase italic">{m.source}</span>
                             <span className="text-[10px] font-bold text-slate-400">• {new Date(m.created_at).toLocaleDateString('id-ID')}</span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">{m.notes || 'No description'}</p>
                          <div className="flex items-center gap-1 mt-1">
                             <User className="h-3 w-3 text-slate-300" />
                             <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">Oleh: {m.user?.name}</span>
                          </div>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className={`text-lg font-black ${m.type === 'IN' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {m.type === 'IN' ? '+' : '-'}{m.quantity}
                       </p>
                       <p className="text-[9px] font-bold text-slate-300 uppercase italic">Stok Unit</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-8 pt-0 bg-white">
             <Button onClick={() => setIsHistoryOpen(false)} variant="outline" className="w-full h-12 rounded-2xl font-black italic uppercase tracking-widest text-slate-400 border-slate-100">Tutup Histori</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
