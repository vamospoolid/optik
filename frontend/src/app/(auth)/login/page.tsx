"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import apiClient from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EyeIcon } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await apiClient.post("/auth/login", { email, password })
      const { accessToken, refreshToken, user } = res.data
      
      login({ accessToken, refreshToken }, user)
      
      toast.success("Login successful")
      router.push("/dashboard")
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid credentials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-2xl border border-white/10 bg-white/5 backdrop-blur-2xl px-2">
      <CardHeader className="space-y-4 text-center pb-8">
        <div className="flex justify-center mb-2">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-slate-900 p-5 rounded-2xl ring-1 ring-white/10">
              <EyeIcon className="w-10 h-10 text-white stroke-[1.5]" />
            </div>
          </div>
        </div>
        <div>
          <CardTitle className="text-4xl font-black italic tracking-tighter text-white uppercase">
            OPTIK<span className="text-blue-500 font-black">88</span>
          </CardTitle>
          <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">
            Premium Optical <span className="text-slate-600">Management System</span>
          </CardDescription>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      </CardHeader>

      <CardContent className="px-8 pb-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-400 font-black text-[10px] uppercase tracking-widest ml-1">Alamat Email</Label>
            <div className="relative group">
               <Input 
                  id="email" 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/5 h-12 focus:bg-white/10 focus:border-blue-500/50 transition-all rounded-xl text-white placeholder:text-slate-600 font-medium"
                  placeholder="admin@optik88.com"
               />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
               <Label htmlFor="password" className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Kata Sandi</Label>
               <span className="text-[9px] font-bold text-blue-500/50 hover:text-blue-400 cursor-pointer transition-colors uppercase tracking-tighter">Lupa sandi?</span>
            </div>
            <Input 
              id="password" 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border-white/5 h-12 focus:bg-white/10 focus:border-blue-500/50 transition-all rounded-xl text-white placeholder:text-slate-600 font-medium"
              placeholder="••••••••"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full mt-8 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black italic uppercase text-xs tracking-[0.15em] rounded-xl shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all border-t border-white/10" 
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-3">
                 <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 <span>Otentikasi...</span>
              </div>
            ) : "Masuk ke Dashboard"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
