"use client"

import { useEffect, useState } from "react"
import apiClient from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, User, Shield, Trash2, ArrowLeft, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  admin: { label: 'Administrator', color: 'bg-red-50 text-red-600' },
  owner: { label: 'Owner', color: 'bg-purple-50 text-purple-600' },
  kasir: { label: 'Kasir', color: 'bg-blue-50 text-blue-600' },
  optometris: { label: 'Optometris', color: 'bg-emerald-50 text-emerald-600' },
}

export default function UserManagementPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password_hash: "",
    role: "kasir"
  })

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get("/users")
      setUsers(res.data)
    } catch (error) {
      toast.error("Gagal memuat daftar pengguna")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreateUser = async () => {
    if (!formData.name || !formData.email || !formData.password_hash) {
        return toast.error("Semua field wajib diisi")
    }
    setSaving(true)
    try {
      await apiClient.post("/users", formData)
      toast.success("Pengguna baru berhasil ditambahkan")
      setIsDialogOpen(false)
      setFormData({ name: "", email: "", password_hash: "", role: "kasir" })
      fetchUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menambahkan pengguna")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus pengguna ini?")) return
    try {
      await apiClient.delete(`/users/${id}`)
      toast.success("Pengguna berhasil dihapus")
      fetchUsers()
    } catch (error) {
      toast.error("Gagal menghapus pengguna")
    }
  }

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await apiClient.patch(`/users/${id}/role`, { role: newRole })
      toast.success("Role berhasil diperbarui")
      fetchUsers()
    } catch (error) {
      toast.error("Gagal memperbarui role")
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
        <div>
          <button 
            onClick={() => window.location.href='/settings'}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-4 text-xs font-bold uppercase tracking-wider"
          >
            <ArrowLeft className="h-3 w-3" /> Kembali ke Pengaturan
          </button>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1 w-6 bg-slate-900 rounded-full"></div>
            <span className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.2em]">Manajemen Akses</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Kelola Pengguna</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Daftar staf dan pengaturan hak akses role</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger 
            render={<Button className="h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 font-bold flex gap-2 shadow-lg active:scale-95 transition-all" />}
          >
             <Plus className="h-4 w-4" /> Tambah Staf Baru
          </DialogTrigger>
          <DialogContent className="rounded-2xl border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Tambah Pengguna Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500">Nama Lengkap</Label>
                <Input 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="rounded-xl bg-slate-50 border-slate-200" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500">Email Login</Label>
                <Input 
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="rounded-xl bg-slate-50 border-slate-200" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500">Kata Sandi Awal</Label>
                <Input 
                  type="password"
                  value={formData.password_hash}
                  onChange={e => setFormData({...formData, password_hash: e.target.value})}
                  className="rounded-xl bg-slate-50 border-slate-200" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500">Role / Hak Akses</Label>
                <Select value={formData.role} onValueChange={val => setFormData({...formData, role: val as any})}>
                  <SelectTrigger className="rounded-xl bg-slate-50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="kasir">Kasir</SelectItem>
                    <SelectItem value="optometris">Optometris</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
               <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold">Batal</Button>
               <Button onClick={handleCreateUser} disabled={saving} className="bg-slate-900 text-white rounded-xl font-bold px-8">
                 {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                 Simpan Akun
               </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-xl rounded-x2l bg-white overflow-hidden mx-4">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-0">
                <TableHead className="py-4 pl-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Informasi Pengguna</TableHead>
                <TableHead className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</TableHead>
                <TableHead className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right pr-8">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} className="h-64 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-200" /></TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="h-64 text-center text-slate-400 font-medium">Belum ada pengguna terdaftar</TableCell></TableRow>
              ) : users.map((u: any) => (
                <TableRow key={u.id} className="border-b border-slate-100 group">
                  <TableCell className="py-5 pl-8">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                         <User className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-sm">{u.name}</span>
                        <span className="text-[11px] text-slate-400 font-medium">{u.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select defaultValue={u.role} onValueChange={(val) => handleRoleChange(u.id, val)}>
                      <SelectTrigger className="w-fit border-0 bg-transparent p-0 h-auto focus:ring-0">
                        <Badge className={`${ROLE_CONFIG[u.role]?.color || 'bg-slate-100'} border-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider cursor-pointer`}>
                           {ROLE_CONFIG[u.role]?.label || u.role}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="kasir">Kasir</SelectItem>
                        <SelectItem value="optometris">Optometris</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => u.id && handleDelete(u.id)}
                      className="text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
