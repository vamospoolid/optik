"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { getAccessToken } from "@/lib/auth"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { fetchUser, isLoading, user } = useAuth()

  useEffect(() => {
    const token = getAccessToken()
    if (!token && pathname !== "/login") {
      router.push("/login")
    } else if (token && !user) {
      fetchUser()
    }
  }, [pathname, router, fetchUser, user])

  // Optional: show a loading spinner while validating user originally
  if (isLoading && pathname !== "/login") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] animate-pulse">
        <div className="text-[var(--navy-deep)] font-extrabold text-2xl tracking-tighter mb-2">
          OPTIK<span className="text-blue-500">88</span>
        </div>
        <div className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Memuat Sistem...</div>
      </div>
    )
  }

  return <>{children}</>
}
