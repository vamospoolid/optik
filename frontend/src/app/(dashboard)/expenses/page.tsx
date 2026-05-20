
"use client"

import { useEffect, useState } from "react"
import apiClient from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Loader2, Trash2, Calendar, Wallet, Receipt, TrendingDown, PieChart, Banknote } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"

export default function ExpensesPage() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)

  // Form States
  const [categoryId, setCategoryId] = useState("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])
  const [newCategoryName, setNewCategoryName] = useState("")

  useEffect(() => {
    if (user?.branch_id) {
      fetchExpenses()
      fetchCategories()
    }
  }, [user])

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get("/expenses/categories")
      setCategories(res.data || [])
    } catch (error) {
      console.error("Failed to fetch categories")
    }
  }

  const fetchExpenses = async () => {
    if (!user?.branch_id) return
    setLoading(true)
    try {
      const res = await apiClient.get(`/expenses/${user.branch_id}`)
      setExpenses(res.data || [])
    } catch (error) {
      toast.error("Gagal memuat data pengeluaran")
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = async () => {
    if (!categoryId || !amount) return toast.error("Lengkapi data pengeluaran")
    try {
      await apiClient.post("/expenses", {
        category_id: categoryId,
        branch_id: user?.branch_id,
        amount: parseFloat(amount),
        notes,
        expense_date: new Date(expenseDate)
      })
      toast.success("Pengeluaran berhasil dicatat")
      setIsExpenseDialogOpen(false)
      resetForm()
      fetchExpenses()
    } catch (error) {
      toast.error("Gagal mencatat pengeluaran")
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName) return toast.error("Masukkan nama kategori")
    try {
      await apiClient.post("/expenses/categories", { name: newCategoryName })
      toast.success("Kategori berhasil ditambahkan")
      setIsCategoryDialogOpen(false)
      setNewCategoryName("")
      fetchCategories()
    } catch (error) {
      toast.error("Gagal menambahkan kategori")
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Hapus catatan pengeluaran ini?")) return
    try {
      await apiClient.delete(`/expenses/${id}`)
      toast.success("Pengeluaran dihapus")
      fetchExpenses()
    } catch (error) {
      toast.error("Gagal menghapus pengeluaran")
    }
  }

  const resetForm = () => {
    setCategoryId("")
    setAmount("")
    setNotes("")
    setExpenseDate(new Date().toISOString().split('T')[0])
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

  const totalAmount = expenses.reduce((acc, exp) => acc + exp.amount, 0)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="h-8 w-1 bg-red-500 rounded-full"></div>
             <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">
               Manajemen Pengeluaran
             </h1>
          </div>
          <p className="text-slate-500 font-bold text-sm ml-4 uppercase tracking-wider opacity-60">Catat Biaya Operasional Toko & Kantor</p>
        </div>

        <div className="flex gap-2">
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger render={
                    <Button variant="outline" className="rounded-2xl font-black italic uppercase text-[10px] h-11 px-6 border-slate-200">
                        <Plus className="h-4 w-4 mr-2" /> Kategori
                    </Button>
                } />
                <DialogContent className="rounded-[2rem] max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Kategori Baru</DialogTitle>
                        <DialogDescription className="font-bold text-slate-400">Tambahkan jenis pengeluaran operasional</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nama Kategori</Label>
                            <Input 
                                placeholder="Contoh: Gaji Karyawan" 
                                className="rounded-xl border-slate-200" 
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreateCategory} className="w-full bg-[#1a2b3c] hover:bg-black text-white rounded-2xl font-black italic uppercase py-6">Simpan Kategori</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                <DialogTrigger render={
                    <Button className="bg-[#1a2b3c] hover:bg-black text-white rounded-2xl font-black italic uppercase text-[10px] h-11 px-8 shadow-xl shadow-slate-200">
                        <Plus className="h-4 w-4 mr-2" /> Catat Biaya
                    </Button>
                } />
                <DialogContent className="rounded-[2.5rem] max-w-md p-8">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">Catat Pengeluaran</DialogTitle>
                        <DialogDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Input Detail Biaya Operasional</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Kategori Pengeluaran</Label>
                            <Select value={categoryId} onValueChange={(v) => setCategoryId(v || "")}>
                                <SelectTrigger className="rounded-2xl border-slate-200 h-14 font-black italic uppercase text-slate-700 bg-slate-50/50">
                                    <SelectValue placeholder="PILIH KATEGORI" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {categories.map(c => <SelectItem key={c.id} value={c.id} className="font-bold uppercase text-[11px] py-3 tracking-tighter">{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Jumlah Biaya</Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">RP</span>
                                    <Input 
                                        className="rounded-2xl border-slate-200 h-14 font-black italic text-right pr-6 text-xl text-red-500 bg-red-50/20" 
                                        value={formatRupiah(amount)}
                                        onChange={(e) => handleRupiahChange(e.target.value, setAmount)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Tanggal</Label>
                                <Input 
                                    type="date" 
                                    className="rounded-2xl border-slate-200 h-14 font-bold text-slate-700 bg-slate-50/50" 
                                    value={expenseDate}
                                    onChange={(e) => setExpenseDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Catatan Tambahan</Label>
                            <Input 
                                placeholder="Keterangan pengeluaran..." 
                                className="rounded-2xl border-slate-200 h-14 font-bold bg-slate-50/50" 
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddExpense} className="w-full bg-red-500 hover:bg-red-600 text-white rounded-3xl font-black italic uppercase py-8 text-lg shadow-2xl shadow-red-100 transition-all active:scale-95">SIMPAN PENGELUARAN</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-300">
          <CardContent className="p-8 flex items-center gap-6">
             <div className="h-16 w-16 rounded-3xl bg-red-500 flex items-center justify-center text-white group-hover:rotate-12 transition-transform shadow-lg shadow-red-100">
                <TrendingDown className="h-8 w-8" />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-2">Total Biaya</p>
                <h3 className="text-2xl font-black text-red-500 italic tracking-tighter">
                    Rp {totalAmount.toLocaleString('id-ID')}
                </h3>
             </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-300">
          <CardContent className="p-8 flex items-center gap-6">
             <div className="h-16 w-16 rounded-3xl bg-slate-900 flex items-center justify-center text-white group-hover:rotate-12 transition-transform shadow-lg shadow-slate-100">
                <PieChart className="h-8 w-8" />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-2">Item Pengeluaran</p>
                <h3 className="text-2xl font-black text-slate-800 italic tracking-tighter">
                    {expenses.length} <span className="text-xs not-italic text-slate-400 font-bold ml-1 uppercase">Transaksi</span>
                </h3>
             </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-300">
          <CardContent className="p-8 flex items-center gap-6">
             <div className="h-16 w-16 rounded-3xl bg-[#00a39d] flex items-center justify-center text-white group-hover:rotate-12 transition-transform shadow-lg shadow-teal-100">
                <Receipt className="h-8 w-8" />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-2">Kategori Biaya</p>
                <h3 className="text-2xl font-black text-slate-800 italic tracking-tighter">
                    {categories.length} <span className="text-xs not-italic text-slate-400 font-bold ml-1 uppercase">Jenis</span>
                </h3>
             </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-900 overflow-hidden group hover:shadow-xl transition-all duration-300 text-white border-4 border-slate-800">
            <CardContent className="p-8 flex items-center gap-6 relative">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Banknote className="h-32 w-32" />
                </div>
                <div className="h-16 w-16 rounded-3xl bg-white/10 flex items-center justify-center text-white group-hover:rotate-12 transition-transform">
                    <Wallet className="h-8 w-8" />
                </div>
                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none mb-2">Rata-rata / Item</p>
                    <h3 className="text-2xl font-black text-white italic tracking-tighter">
                        Rp {(expenses.length > 0 ? totalAmount / expenses.length : 0).toLocaleString('id-ID')}
                    </h3>
                </div>
            </CardContent>
        </Card>
      </div>

      <Card className="rounded-[3rem] border-none shadow-sm bg-white overflow-hidden p-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="font-black text-[10px] uppercase text-slate-400 tracking-widest px-10 py-8">Kategori / Item</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-400 tracking-widest text-center">Tanggal</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-400 tracking-widest text-right">Jumlah Biaya</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-400 tracking-widest px-10 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-24 text-center">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-slate-200" />
                    <p className="mt-4 font-black italic uppercase text-[10px] text-slate-400 tracking-tighter">Sinkronisasi Data Biaya...</p>
                  </TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-24 text-center italic text-slate-400 font-bold uppercase tracking-widest text-xs opacity-50">
                    Belum ada pengeluaran yang dicatat
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((exp) => (
                  <TableRow key={exp.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all duration-300 group">
                    <TableCell className="px-10 py-6">
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:scale-110 group-hover:bg-red-50 group-hover:text-red-500 transition-all">
                           <Receipt className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 italic uppercase tracking-tighter text-lg leading-none mb-1">{exp.category.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{exp.notes || 'Tanpa keterangan'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                        <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                {new Date(exp.expense_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="font-black italic text-red-500 text-xl tracking-tighter">
                        Rp {exp.amount.toLocaleString('id-ID')}
                      </p>
                    </TableCell>
                    <TableCell className="px-10 text-right">
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="h-12 w-12 rounded-2xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                       >
                         <Trash2 className="h-5 w-5" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
