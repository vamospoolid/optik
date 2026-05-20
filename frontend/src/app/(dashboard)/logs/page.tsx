"use client"

import { useEffect, useState } from "react"
import apiClient from "@/lib/api-client"
import { useSocket } from "@/components/providers/socket-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, Clock, Terminal, User, Database, Search, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const { socket } = useSocket()

  const fetchLogs = async () => {
    try {
      const res = await apiClient.get("/logs")
      setLogs(res.data)
    } catch (error) {
      toast.error("Gagal memuat log aktivitas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  useEffect(() => {
    if (socket) {
      socket.on('new_audit_log', (newLog: any) => {
        setLogs(prev => [newLog, ...prev.slice(0, 49)])
        toast.info(`Aktivitas: ${newLog.action}`, {
          description: `Oleh ${newLog.user?.name || 'Sistem'} pada tabel ${newLog.table_name}`,
          icon: <Terminal className="h-4 w-4" />
        })
      })

      return () => {
        socket.off('new_audit_log')
      }
    }
  }, [socket])

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.table_name.toLowerCase().includes(search.toLowerCase()) ||
    log.user?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-emerald-50 text-emerald-600 border-emerald-100'
    if (action.includes('UPDATE')) return 'bg-blue-50 text-blue-600 border-blue-100'
    if (action.includes('DELETE')) return 'bg-red-50 text-red-600 border-red-100'
    return 'bg-slate-50 text-slate-600 border-slate-100'
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 px-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1 w-6 bg-[#1a2b3c] rounded-full"></div>
            <span className="text-[10px] font-bold text-[#1a2b3c] uppercase tracking-[0.2em]">Keamanan Sistem</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Log Aktivitas</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Pantau setiap perubahan data secara real-time</p>
        </div>

        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Cari aksi, tabel, atau pengguna..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 bg-white border-slate-200 rounded-xl font-medium shadow-sm transition-all text-sm"
          />
        </div>
      </div>

      <Card className="border-0 shadow-xl rounded-2xl bg-white overflow-hidden mx-4">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#1a2b3c]">
                <TableRow className="hover:bg-transparent border-0">
                  <TableHead className="py-5 pl-8 text-xs font-bold text-slate-400 uppercase tracking-wider">Waktu / Pengguna</TableHead>
                  <TableHead className="py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Aksi Protokol</TableHead>
                  <TableHead className="py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Tabel Terkait</TableHead>
                  <TableHead className="py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Data Perubahan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="h-64 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-300" /></TableCell></TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-64 text-center text-slate-400 font-medium">Berdasar pencarian, log tidak ditemukan</TableCell></TableRow>
                ) : filteredLogs.map((log: any) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/50 transition-all border-b border-slate-100 group">
                    <TableCell className="py-6 pl-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm italic">{log.user?.name || 'SISTEM'}</span>
                          <span className="text-[10px] font-medium text-slate-400">
                            {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {new Date(log.created_at).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline" className={`rounded-lg px-2.5 py-1 font-bold text-[9px] uppercase tracking-wider ${getActionColor(log.action)}`}>
                        {log.action}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-700 uppercase text-[10px] tracking-tight">
                          <Database className="h-3 w-3 text-slate-400" />
                          {log.table_name}
                        </div>
                        <span className="text-[9px] font-medium text-slate-300 font-mono">ID: {log.record_id?.substring(0, 8)}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-4">
                      <div className="max-w-[300px]">
                        {log.new_data ? (
                          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 shadow-lg">
                            <pre className="text-[9px] font-mono text-emerald-400 overflow-x-auto custom-scrollbar-horizontal pb-1 opacity-80 group-hover:opacity-100 transition-opacity">
                               {JSON.stringify(log.new_data, null, 2)}
                            </pre>
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-300 uppercase italic tracking-widest">Tidak ada data</span>
                        )}
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
  )
}
