
"use client"

import { useEffect, useState } from "react"
import apiClient from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Truck, Plus, Search, Edit2, Trash2, Phone, Mail, User, MapPin, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<any>(null)

  // Form State
  const [name, setName] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get("/suppliers")
      setSuppliers(res.data)
    } catch (error) {
      toast.error("Gagal memuat data supplier")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const handleSubmit = async () => {
    if (!name) return toast.error("Nama supplier wajib diisi")
    
    const payload = { name, contact_person: contactPerson, phone, email, address }
    
    try {
      if (editingSupplier) {
        await apiClient.put(`/suppliers/${editingSupplier.id}`, payload)
        toast.success("Supplier diperbarui")
      } else {
        await apiClient.post("/suppliers", payload)
        toast.success("Supplier ditambahkan")
      }
      setIsDialogOpen(false)
      resetForm()
      fetchSuppliers()
    } catch (error) {
      toast.error("Gagal menyimpan data")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus supplier ini?")) return
    try {
      await apiClient.delete(`/suppliers/${id}`)
      toast.success("Supplier dihapus")
      fetchSuppliers()
    } catch (error) {
      toast.error("Gagal menghapus supplier")
    }
  }

  const resetForm = () => {
    setEditingSupplier(null)
    setName("")
    setContactPerson("")
    setPhone("")
    setEmail("")
    setAddress("")
  }

  const openEdit = (supplier: any) => {
    setEditingSupplier(supplier)
    setName(supplier.name)
    setContactPerson(supplier.contact_person || "")
    setPhone(supplier.phone || "")
    setEmail(supplier.email || "")
    setAddress(supplier.address || "")
    setIsDialogOpen(true)
  }

  const filteredSuppliers = suppliers.filter((s: any) => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_person?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1 w-6 bg-[#00a39d] rounded-full"></div>
            <span className="text-[10px] font-bold text-[#00a39d] uppercase tracking-[0.2em]">Inventory & Supply Chain</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Manajemen Supplier</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Kelola data pemasok frame, lensa, dan aksesoris</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(val) => { setIsDialogOpen(val); if(!val) resetForm(); }}>
          <DialogTrigger render={
            <Button className="h-12 bg-[#1a2b3c] hover:bg-[#2a3b4c] text-white rounded-xl px-6 font-bold flex gap-2 shadow-lg transition-all active:scale-95">
              <Plus className="h-5 w-5" /> Tambah Supplier
            </Button>
          } />
          <DialogContent className="sm:max-w-[550px] rounded-[2rem] border-0 p-0 overflow-hidden shadow-2xl bg-white">
            <div className="bg-[#1a2b3c] p-8 relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Truck className="h-32 w-32" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">{editingSupplier ? 'Edit Supplier' : 'Supplier Baru'}</DialogTitle>
                <DialogDescription className="text-slate-400 font-medium">Lengkapi rincian kontak dan alamat pemasok barang</DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase ml-1">Nama Perusahaan / Toko</Label>
                  <Input 
                    placeholder="Contoh: PT. Optik Jaya Abadi" 
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium focus:ring-[#00a39d]/20"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase ml-1">Nama Kontak (Sales)</Label>
                    <Input 
                      placeholder="Nama PIC" 
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium"
                      value={contactPerson}
                      onChange={e => setContactPerson(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase ml-1">No. Telepon</Label>
                    <Input 
                      placeholder="0812..." 
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</Label>
                  <Input 
                    type="email"
                    placeholder="supplier@mail.com" 
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase ml-1">Alamat Kantor</Label>
                  <Input 
                    placeholder="Jl. Raya Utama No. 123..." 
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="p-8 pt-0 flex gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setIsDialogOpen(false)}
                className="h-12 rounded-xl px-6 font-bold text-slate-400"
              >
                Batal
              </Button>
              <Button 
                onClick={handleSubmit}
                className="flex-1 bg-[#00a39d] hover:bg-[#008f8a] text-white h-12 rounded-xl font-bold shadow-xl trasition-all"
              >
                {editingSupplier ? 'Simpan Perubahan' : 'Daftarkan Supplier'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="px-4">
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Cari nama supplier atau sales..." 
            className="pl-11 h-12 rounded-2xl border-none shadow-md bg-white font-medium"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <Card className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#1a2b3c]">
                  <TableRow className="hover:bg-transparent border-0">
                    <TableHead className="py-6 pl-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Supplier</TableHead>
                    <TableHead className="py-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Kontak PIC</TableHead>
                    <TableHead className="py-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Hubungi</TableHead>
                    <TableHead className="py-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Alamat</TableHead>
                    <TableHead className="py-6 pr-8 text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-200" />
                      </TableCell>
                    </TableRow>
                  ) : filteredSuppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center text-slate-400 font-medium italic">
                        Belum ada data supplier.
                      </TableCell>
                    </TableRow>
                  ) : filteredSuppliers.map((s: any) => (
                    <TableRow key={s.id} className="hover:bg-slate-50/50 transition-all border-b border-slate-100 group">
                      <TableCell className="py-6 pl-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#1a2b3c] group-hover:bg-[#00a39d]/10 group-hover:text-[#00a39d] transition-all">
                            <Truck className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{s.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">ID: {s.id.slice(0,8)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-slate-300" />
                          <span className="text-sm font-bold text-slate-700">{s.contact_person || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <Phone className="h-3 w-3" /> {s.phone || '—'}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                            <Mail className="h-3 w-3" /> {s.email || '—'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2 max-w-[200px]">
                          <MapPin className="h-3.5 w-3.5 text-slate-300 mt-1 shrink-0" />
                          <span className="text-xs font-medium text-slate-500 line-clamp-2">{s.address || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openEdit(s)}
                            className="h-9 w-9 rounded-lg hover:bg-white hover:shadow-md hover:text-[#00a39d]"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(s.id)}
                            className="h-9 w-9 rounded-lg hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
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
      </div>
    </div>
  )
}
