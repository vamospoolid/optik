"use client"

import { useEffect, useState } from "react"
import apiClient from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings as SettingsIcon, Save, Shield, Store } from "lucide-react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Trash2, AlertTriangle, RefreshCw } from "lucide-react"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    name: "",
    address: "",
    phone: "",
    logo_url: ""
  })
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState("")

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get("/settings/branch")
        setSettings({
          name: res.data.name || "",
          address: res.data.address || "",
          phone: res.data.phone || "",
          logo_url: res.data.logo_url || ""
        })
      } catch (error) {
        toast.error("Gagal memuat pengaturan")
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiClient.patch("/settings/branch", settings)
      toast.success("Pengaturan berhasil diperbarui")
    } catch (error) {
      toast.error("Gagal menyimpan perubahan")
    } finally {
      setSaving(false)
    }
  }

  const handleResetDatabase = async () => {
    if (resetConfirmText !== "RESET SEKARANG") {
      return toast.error("Silakan ketik 'RESET SEKARANG' untuk konfirmasi")
    }
    
    setResetting(true)
    try {
      await apiClient.post("/settings/reset")
      toast.success("Database berhasil diriset!")
      setIsResetDialogOpen(false)
      // Optional: redirect to dashboard or logout
      setTimeout(() => window.location.reload(), 2000)
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal meriset database")
    } finally {
      setResetting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1 w-6 bg-slate-900 rounded-full"></div>
            <span className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.2em]">Konfigurasi Sistem</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Pengaturan</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Kelola preferensi outlet dan keamanan akun</p>
        </div>
        
        <Button 
          disabled={saving}
          onClick={handleSave}
          className="h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 font-bold flex gap-2 shadow-lg active:scale-95 transition-all"
        >
          {saving ? <Save className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>

      <div className="grid gap-6 max-w-2xl px-4">
        <Card className="shadow-lg border-0 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                <Store className="h-4 w-4" />
              </div>
              <CardTitle className="text-lg font-bold">Informasi Outlet</CardTitle>
            </div>
            <CardDescription className="text-xs font-medium">Data utama yang akan ditampilkan pada struk dan laporan</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 ml-1">Nama Outlet</Label>
              <Input 
                value={settings.name} 
                onChange={e => setSettings({...settings, name: e.target.value})}
                placeholder="Contoh: Optik 88"
                className="h-11 rounded-xl bg-slate-50 border-slate-200 font-medium" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 ml-1">Telepon</Label>
                    <Input 
                        value={settings.phone} 
                        onChange={e => setSettings({...settings, phone: e.target.value})}
                        placeholder="08..."
                        className="h-11 rounded-xl bg-slate-50 border-slate-200 font-medium" 
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 ml-1">Logo URL (Icon)</Label>
                    <Input 
                        value={settings.logo_url} 
                        onChange={e => setSettings({...settings, logo_url: e.target.value})}
                        placeholder="https://..."
                        className="h-11 rounded-xl bg-slate-50 border-slate-200 font-medium" 
                    />
                </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 ml-1">Alamat Lengkap</Label>
              <Input 
                value={settings.address} 
                onChange={e => setSettings({...settings, address: e.target.value})}
                placeholder="Jl. ..."
                className="h-11 rounded-xl bg-slate-50 border-slate-200 font-medium" 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                <Shield className="h-4 w-4" />
              </div>
              <CardTitle className="text-lg font-bold">Akses & Manajemen</CardTitle>
            </div>
            <CardDescription className="text-xs font-medium">Kelola akun staf dan keamanan sistem</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
             <div className="flex gap-4">
                <Button variant="outline" onClick={() => window.location.href='/settings/users'} className="h-11 rounded-xl font-bold border-slate-200 hover:bg-slate-50 flex-1">
                    Kelola Pengguna & Role
                </Button>
                <Button variant="outline" className="h-11 rounded-xl font-bold border-slate-200 hover:bg-slate-50 flex-1">
                    Ganti Kata Sandi
                </Button>
             </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border border-red-100 bg-red-50/10 rounded-2xl overflow-hidden mt-8">
          <CardHeader className="p-6 border-b border-red-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg text-red-500">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <CardTitle className="text-lg font-bold text-red-600">Danger Zone</CardTitle>
            </div>
            <CardDescription className="text-xs font-bold text-red-400">Tindakan berikut bersifat permanen dan tidak dapat dibatalkan</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
             <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase italic leading-none mb-1">Hapus Seluruh Data Transaksi</h4>
                  <p className="text-[11px] font-medium text-slate-500">Menghapus semua data pasien, resep, pesanan, dan histori stok.</p>
                </div>
                
                <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                  <DialogTrigger render={
                    <Button variant="destructive" className="h-11 rounded-xl font-black italic uppercase text-[10px] tracking-widest px-8 shadow-lg shadow-red-200 gap-2">
                       <Trash2 className="h-4 w-4" /> Riset Database
                    </Button>
                  } />
                  <DialogContent className="rounded-[2rem] border-0 shadow-2xl">
                    <DialogHeader className="p-4">
                      <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4 mx-auto">
                        <AlertTriangle className="h-8 w-8" />
                      </div>
                      <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-center">Konfirmasi Reset Data</DialogTitle>
                      <DialogDescription className="text-center font-bold text-slate-500 px-6 mt-2">
                        Anda akan menghapus <span className="text-red-600">SELURUH</span> data transaksi, pasien, dan inventory. Tindakan ini <span className="underline">tidak dapat dibatalkan</span>.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="p-6 pt-0 space-y-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <Label className="text-[10px] font-black uppercase text-slate-400 block mb-2 text-center">Ketik <span className="text-slate-900">RESET SEKARANG</span> untuk melanjutkan</Label>
                        <Input 
                          value={resetConfirmText}
                          onChange={e => setResetConfirmText(e.target.value.toUpperCase())}
                          placeholder="Ketik di sini..."
                          className="h-12 rounded-xl border-slate-200 bg-white text-center font-black tracking-widest"
                        />
                      </div>
                    </div>

                    <DialogFooter className="p-6 bg-slate-50 rounded-b-[2rem] flex sm:justify-center gap-3">
                       <Button variant="ghost" onClick={() => setIsResetDialogOpen(false)} className="rounded-xl font-bold px-6">Batal</Button>
                       <Button 
                         variant="destructive" 
                         disabled={resetConfirmText !== "RESET SEKARANG" || resetting}
                         onClick={handleResetDatabase}
                         className="rounded-xl font-black italic uppercase px-8 h-12 gap-2"
                       >
                         {resetting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                         Mulai Reset Total
                       </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
