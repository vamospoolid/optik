"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { LayoutDashboard, Users, Truck, Activity, Glasses, ShoppingCart, FileText, Settings, Menu, Bell, Search, Eye, LogOut, BarChart3 } from "lucide-react"
import { AuthProvider } from "@/components/providers/auth-provider"
import { SocketProvider } from "@/components/providers/socket-provider"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["owner", "admin", "kasir", "optometris"] },
    { 
      name: "Data Pasien", 
      href: "/patients", 
      icon: Users,
      roles: ["owner", "admin", "kasir", "optometris"],
      items: [
        { name: "Daftar Pasien", href: "/patients" },
        { name: "Pemeriksaan Baru", href: "/prescriptions" },
      ]
    },
    { name: "Suppliers", href: "/suppliers", icon: Truck, roles: ["owner", "admin"] },
    { 
      name: "Inventory", 
      href: "/inventory", 
      icon: Glasses,
      roles: ["owner", "admin", "optometris", "kasir"],
      items: [
        { name: "Stok Overview", href: "/inventory" },
        { name: "Katalog Frame", href: "/frames" },
        { name: "Katalog Lensa", href: "/lenses" },
      ]
    },
    { name: "Transaksi", href: "/orders", icon: ShoppingCart, roles: ["owner", "admin", "kasir"] },
    { name: "Pengeluaran", href: "/expenses", icon: Activity, roles: ["owner", "admin"] },
    { name: "Klaim BPJS", href: "/bpjs", icon: FileText, roles: ["owner", "admin", "kasir"] },
    { name: "Laporan", href: "/reports", icon: BarChart3, roles: ["owner", "admin"] },
    { name: "Pengaturan", href: "/settings", icon: Settings, roles: ["owner", "admin"] },
  ]

  const ROLE_MAP: Record<string, string> = {
    owner: "Pemilik Toko",
    admin: "Administrator",
    kasir: "Kasir / Penjualan",
    optometris: "Optometris / RO"
  }

  const filteredNavItems = navItems.filter(item => 
    !item.roles || (user?.role && item.roles.includes(user.role))
  )

  const isPrintView = pathname.includes('/print')

  if (isPrintView) {
    return (
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen w-full bg-white font-sans text-slate-900">
            {children}
          </div>
        </SocketProvider>
      </AuthProvider>
    )
  }

  return (
    <AuthProvider>
      <SocketProvider>
        <div className="flex min-h-screen w-full bg-slate-50 font-sans text-slate-900">
          {/* Sidebar */}
          <aside className={`bg-[var(--sidebar-bg)] text-white flex flex-col h-screen fixed inset-y-0 left-0 z-30 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} border-r border-white/5`}>
            <div className="h-16 flex items-center px-6 border-b border-white/10 bg-black/10">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="bg-white p-1.5 rounded-lg text-[var(--navy-deep)] shadow-sm">
                  <Eye className="h-5 w-5" />
                </div>
                {isSidebarOpen && (
                  <div className="flex flex-col">
                    <span className="font-bold text-lg tracking-tighter leading-none">OPTIK<span className="text-blue-400">88</span></span>
                    <span className="text-[10px] text-white/40 font-medium tracking-widest uppercase mt-0.5">Premium Vision</span>
                  </div>
                )}
              </Link>
            </div>
            
            <div className="flex-1 overflow-auto py-6">
              <nav className="space-y-1 px-3">
                {filteredNavItems.map((item) => {
                  const isActive = pathname === item.href || (item.items && item.items.some(sub => pathname === sub.href))
                  return (
                    <div key={item.name} className="space-y-1">
                      <Link
                        href={item.href}
                        className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 group relative ${
                          isActive
                            ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                            : "text-white/50 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {isActive && <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-400 rounded-r-full"></div>}
                        <item.icon className={`h-5 w-5 shrink-0 transition-colors ${isActive ? "text-blue-400" : "text-white/40 group-hover:text-white"}`} />
                        {isSidebarOpen && <span className="text-sm font-semibold tracking-tight">{item.name}</span>}
                      </Link>
                      
                      {isSidebarOpen && isActive && item.items && (
                        <div className="ml-12 space-y-1 py-1">
                          {item.items.map((sub) => (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={`block py-2 text-xs font-bold transition-all ${
                                pathname === sub.href 
                                  ? "text-blue-400 translate-x-1" 
                                  : "text-white/30 hover:text-white"
                              }`}
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </nav>
            </div>

            <div className="p-4 border-t border-white/10 bg-black/5">
                <div className="space-y-1">
                  <button 
                    onClick={handleLogout} 
                    className="flex w-full items-center gap-4 text-sm font-semibold text-white/40 hover:text-red-400 transition-all py-3 px-4 hover:bg-white/5 rounded-xl group"
                  >
                    <LogOut className="h-5 w-5 text-white/40 group-hover:text-red-400 transition-colors" />
                    {isSidebarOpen && <span>Keluar Sistem</span>}
                  </button>
                </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'pl-64' : 'pl-20'} min-h-screen`}>
             {/* Topbar */}
             <header className="h-16 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
               <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg lg:hidden">
                 <Menu className="h-5 w-5 text-slate-600" />
               </button>

               <div className="flex items-center gap-6 ml-auto">
                  <div className="relative w-72 hidden sm:block">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Cari pasien atau transaksi..." 
                        className="pr-10 bg-slate-100/50 border-slate-200 focus:bg-white transition-all rounded-xl h-10 text-xs font-medium w-full"
                      />
                  </div>

                  <button className="relative p-2.5 rounded-xl hover:bg-slate-100 transition-all group border border-slate-200">
                    <Bell className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                    <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-blue-500 rounded-full border-2 border-white shadow-sm animate-pulse"></span>
                  </button>
                  
                  <div className="flex items-center gap-4 border-l pl-6 border-slate-200">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name || "Administrator"}</p>
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">{user?.role ? ROLE_MAP[user.role] : "Akses Terbatas"}</p>
                    </div>
                    <Avatar className="h-10 w-10 rounded-xl border border-slate-200 shadow-sm ring-2 ring-white">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Admin'}`} />
                      <AvatarFallback className="bg-[var(--navy-deep)] text-white text-xs font-bold">{user?.name?.charAt(0) || "A"}</AvatarFallback>
                    </Avatar>
                  </div>
               </div>
             </header>

            {/* Page Content */}
            <div className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {children}
            </div>
          </main>
        </div>
      </SocketProvider>
    </AuthProvider>
  )
}
