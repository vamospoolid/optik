"use client"

import { useEffect, useState, useRef } from "react"
import apiClient from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ShoppingCart, Plus, User, Package, CreditCard, Check, Clock, Truck, X, Search, Eye, 
  Printer, Loader2, Glasses, UserPlus, FileText, ArrowRight, Save, Trash2, Calendar, 
  Sparkles, RefreshCw, ChevronRight, Info, BookOpen
} from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PrintPreview } from "@/components/print/print-preview"
import { PrescriptionPrintPreview } from "@/components/print/prescription-print-preview"
import { useAuth } from "@/hooks/use-auth"

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:   { label: 'Menunggu',   color: 'bg-amber-50 text-amber-600',    icon: Clock },
  processed: { label: 'Diproses',   color: 'bg-blue-50 text-blue-600',      icon: Package },
  ready:     { label: 'Siap',       color: 'bg-purple-50 text-purple-600',  icon: Truck },
  completed: { label: 'Selesai',    color: 'bg-emerald-50 text-emerald-600', icon: Check },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-50 text-red-600',        icon: X },
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("pos")
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Print & Details Dialog States
  const [printOrderId, setPrintOrderId] = useState<string | null>(null)
  const [isPrintOpen, setIsPrintOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null)
  const [isPrescriptionPrintOpen, setIsPrescriptionPrintOpen] = useState(false)
  
  // Settlement (Pelunasan) States
  const [settlementMethod, setSettlementMethod] = useState("cash")
  const [settlementAmount, setSettlementAmount] = useState("")

  // Terminal POS State: Patient Selection & Registration
  const [patientId, setPatientId] = useState("")
  const [patientSearch, setPatientSearch] = useState("")
  const [prescriptionId, setPrescriptionId] = useState("")
  const [transactionType, setTransactionType] = useState<"umum" | "bpjs">("umum")

  // Inline Quick Registration Form State
  const [showNewPatientForm, setShowNewPatientForm] = useState(false)
  const [newPatientNik, setNewPatientNik] = useState("")
  const [newPatientName, setNewPatientName] = useState("")
  const [newPatientPhone, setNewPatientPhone] = useState("")
  const [newPatientAddress, setNewPatientAddress] = useState("")
  const [newPatientBpjs, setNewPatientBpjs] = useState("")
  const [newPatientBirthDate, setNewPatientBirthDate] = useState("")
  const [newPatientType, setNewPatientType] = useState<"umum" | "bpjs">("umum")
  const [registeringPatient, setRegisteringPatient] = useState(false)

  // Inline New Prescription Form State
  const [showNewPrescriptionForm, setShowNewPrescriptionForm] = useState(false)
  const [newExamLensType, setNewExamLensType] = useState("monofocal")
  const [newExamPd, setNewExamPd] = useState("")
  const [newExamSphR, setNewExamSphR] = useState("")
  const [newExamCylR, setNewExamCylR] = useState("")
  const [newExamAxisR, setNewExamAxisR] = useState("")
  const [newExamAddR, setNewExamAddR] = useState("")
  const [newExamSphL, setNewExamSphL] = useState("")
  const [newExamCylL, setNewExamCylL] = useState("")
  const [newExamAxisL, setNewExamAxisL] = useState("")
  const [newExamAddL, setNewExamAddL] = useState("")
  const [newExamDoctor, setNewExamDoctor] = useState("Internal Optik 88")
  const [newExamSource, setNewExamSource] = useState("internal")
  const [savingPrescription, setSavingPrescription] = useState(false)

  // Terminal POS State: Cart
  const [cartItems, setCartItems] = useState<any[]>([])
  const [catalogSearch, setCatalogSearch] = useState("")
  const [catalogTab, setCatalogTab] = useState<"all" | "frame" | "lens">("all")
  const [cashReceived, setCashReceived] = useState("")
  const [showPrescriptionManager, setShowPrescriptionManager] = useState(false)

  const [serviceDesc, setServiceDesc] = useState("")
  const [servicePrice, setServicePrice] = useState("")
  const [discount, setDiscount] = useState("0")
  const [dpAmount, setDpAmount] = useState("0")
  const [dpMethod, setDpMethod] = useState("cash")

  // History & Filter State
  const [historySearch, setHistorySearch] = useState("")

  // Data Sources
  const [patients, setPatients] = useState<any[]>([])
  const [frames, setFrames] = useState<any[]>([])
  const [lenses, setLenses] = useState<any[]>([])
  const [prescriptions, setPrescriptions] = useState<any[]>([])

  // Refs for Keyboard Shortcuts
  const patientSearchRef = useRef<HTMLInputElement>(null)
  const catalogSearchRef = useRef<HTMLInputElement>(null)


  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get("/orders")
      setOrders(res.data)
    } catch (error) {
      toast.error("Gagal memuat data pesanan")
    } finally {
      setLoading(false)
    }
  }

  const fetchResources = async () => {
    try {
      const [pRes, fRes, lRes] = await Promise.all([
        apiClient.get("/patients"),
        apiClient.get("/inventory/frames"),
        apiClient.get("/inventory/lenses"),
      ])
      setPatients(pRes.data.data || [])
      setFrames(fRes.data || [])
      setLenses(lRes.data || [])
    } catch (error) {
      toast.error("Gagal memuat data inventori/pasien")
    }
  }

  const fetchPrescriptions = async (pid: string) => {
    if (!pid) return setPrescriptions([])
    try {
      const res = await apiClient.get(`/prescriptions/patient/${pid}`)
      setPrescriptions(res.data || [])
    } catch { }
  }

  useEffect(() => {
    fetchOrders()
    fetchResources()
  }, [])

  // Keyboard Shortcuts Effect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4') {
        e.preventDefault()
        if (activeTab !== "pos") setActiveTab("pos")
        setTimeout(() => patientSearchRef.current?.focus(), 100)
      }
      else if (e.key === 'F8') {
        e.preventDefault()
        if (activeTab !== "pos") setActiveTab("pos")
        setTimeout(() => catalogSearchRef.current?.focus(), 100)
      }
      else if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault()
        if (activeTab === "pos" && patientId && cartItems.length > 0) {
           handleCreateOrder()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, patientId, cartItems, prescriptionId, dpAmount, dpMethod, discount, transactionType])


  // Read URL search parameters on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const urlPatientId = params.get("patientId")
      const urlPrescriptionId = params.get("prescriptionId")
      if (urlPatientId) {
        setPatientId(urlPatientId)
        setActiveTab("pos")
      }
      if (urlPrescriptionId) {
        setPrescriptionId(urlPrescriptionId)
      }
    }
  }, [patients])

  // Watch selected patient to load prescriptions & set default transaction type
  useEffect(() => {
    if (patientId) {
      fetchPrescriptions(patientId)
      const p = patients.find(p => p.id === patientId)
      if (p?.bpjs_number) {
        setTransactionType("bpjs")
      } else {
        setTransactionType("umum")
      }
    } else {
      setPrescriptions([])
      setPrescriptionId("")
      setTransactionType("umum")
    }
  }, [patientId, patients])

  // Calculations
  const cartItemsTotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0)
  const discountVal = parseFloat(discount) || 0
  const total = Math.max(0, cartItemsTotal - discountVal)
  
  // Received Cash & Change Calculations
  const receivedVal = parseFloat(cashReceived) || 0
  const changeDue = Math.max(0, receivedVal - total)

  // Dynamically set DP amount based on Cash Received vs Total
  useEffect(() => {
    if (cashReceived !== "") {
      const val = parseFloat(cashReceived) || 0
      if (val >= total) {
        setDpAmount(total.toString())
      } else {
        setDpAmount(val.toString())
      }
    } else {
      setDpAmount("0")
    }
  }, [cashReceived, total])

  // Get dynamic cash denomination shortcut buttons
  const getShortcutDenominations = (totalPrice: number) => {
    if (totalPrice <= 0) return []
    const shortcuts = new Set<number>()
    shortcuts.add(totalPrice) // Uang Pas
    
    // Rounding to next 10k, 50k, 100k
    const options = [10000, 20000, 50000, 100000]
    for (const opt of options) {
      const nextVal = Math.ceil(totalPrice / opt) * opt
      if (nextVal > totalPrice && nextVal <= totalPrice + 200000) {
        shortcuts.add(nextVal)
      }
    }
    
    // Standard higher values
    const standards = [50000, 100000, 200000, 500000]
    for (const std of standards) {
      if (std > totalPrice && std <= totalPrice + 300000) {
        shortcuts.add(std)
      }
    }
    
    return Array.from(shortcuts).sort((a, b) => a - b).slice(0, 4)
  }

  // Cart Actions
  const addToCart = (product: any, type: 'frame' | 'lens') => {
    const stockQty = product.stocks?.[0]?.quantity ?? 0
    if (stockQty < 1) {
      toast.error(`Stok ${product.brand} tidak mencukupi!`)
      return
    }

    setCartItems(prev => {
      const existing = prev.find(item => item.product_id === product.id && item.product_type === type)
      if (existing) {
        if (existing.qty >= stockQty) {
          toast.error(`Stok ${product.brand} hanya tersedia ${stockQty} pcs!`)
          return prev
        }
        return prev.map(item => 
          (item.product_id === product.id && item.product_type === type) 
            ? { ...item, qty: item.qty + 1 }
            : item
        )
      }
      return [...prev, {
        product_id: product.id,
        product_type: type,
        brand: product.brand,
        modelOrType: type === 'frame' ? product.model : product.type,
        colorOrFeature: type === 'frame' ? product.color : product.feature,
        price: product.price,
        qty: 1,
        maxQty: stockQty
      }]
    })
    toast.success(`${product.brand} ditambahkan ke keranjang`)
  }

  const addCustomService = () => {
    if (!serviceDesc || !servicePrice) {
      toast.error("Nama jasa dan nominal wajib diisi")
      return
    }
    const priceVal = parseFloat(servicePrice) || 0
    setCartItems(prev => [
      ...prev,
      {
        product_id: null,
        product_type: 'service',
        brand: 'Jasa',
        modelOrType: serviceDesc,
        colorOrFeature: '',
        price: priceVal,
        qty: 1,
        maxQty: 999
      }
    ])
    setServiceDesc("")
    setServicePrice("")
    toast.success("Jasa layanan ditambahkan")
  }

  // Handle Quick Patient Registration Inline
  const handleRegisterPatientInline = async () => {
    if (!newPatientName || !newPatientPhone) {
      toast.error("Nama dan No. Telepon wajib diisi")
      return
    }
    setRegisteringPatient(true)
    try {
      const branchId = user?.branch_id || (patients.length > 0 ? patients[0].branch_id : null)
      if (!branchId) {
        toast.error("User tidak memiliki cabang. Hubungi admin.")
        return
      }

      const res = await apiClient.post("/patients", {
        nik: newPatientNik || null,
        name: newPatientName,
        phone: newPatientPhone,
        address: newPatientAddress,
        birth_date: newPatientBirthDate || null,
        bpjs_number: newPatientBpjs || null,
        branch_id: branchId
      })
      
      const created = res.data.data || res.data
      toast.success("Pasien berhasil terdaftar!")
      
      await fetchResources()
      setPatientId(created.id)
      setPatientSearch("")
      
      // Reset form
      setNewPatientNik(""); setNewPatientName(""); setNewPatientPhone(""); setNewPatientAddress(""); setNewPatientBpjs(""); setNewPatientBirthDate("")
      setShowNewPatientForm(false)
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal mendaftarkan pasien")
    } finally {
      setRegisteringPatient(false)
    }
  }

  // Handle Quick Prescription / Exam Entry Inline
  const handleSavePrescriptionInline = async () => {
    if (!patientId) {
      toast.error("Pilih pasien terlebih dahulu")
      return
    }
    if (!newExamPd) {
      toast.error("PD (Pupil Distance) wajib diisi")
      return
    }

    // Validasi PD Medis
    const pdVal = parseFloat(newExamPd);
    if (isNaN(pdVal) || pdVal < 40 || pdVal > 80) {
      toast.error("Pupil Distance (PD) harus bernilai antara 40mm dan 80mm");
      return;
    }

    // Validasi Mata Kanan (OD)
    if (newExamSphR) {
      const sphRVal = parseFloat(newExamSphR);
      if (isNaN(sphRVal)) {
        toast.error("Nilai SPH Kanan harus berupa angka");
        return;
      }
    }
    if (newExamCylR) {
      const cylRVal = parseFloat(newExamCylR);
      if (isNaN(cylRVal)) {
        toast.error("Nilai CYL Kanan harus berupa angka");
        return;
      }
      const axisRVal = parseInt(newExamAxisR);
      if (isNaN(axisRVal) || axisRVal < 0 || axisRVal > 180) {
        toast.error("Axis Kanan (OD) wajib diisi antara 0° dan 180° jika nilai CYL diisi");
        return;
      }
    }
    if (newExamAddR) {
      const addRVal = parseFloat(newExamAddR);
      if (isNaN(addRVal) || addRVal < 0 || addRVal > 4) {
        toast.error("Nilai ADD Kanan (OD) harus positif di rentang 0.00 hingga 4.00");
        return;
      }
    }

    // Validasi Mata Kiri (OS)
    if (newExamSphL) {
      const sphLVal = parseFloat(newExamSphL);
      if (isNaN(sphLVal)) {
        toast.error("Nilai SPH Kiri harus berupa angka");
        return;
      }
    }
    if (newExamCylL) {
      const cylLVal = parseFloat(newExamCylL);
      if (isNaN(cylLVal)) {
        toast.error("Nilai CYL Kiri harus berupa angka");
        return;
      }
      const axisLVal = parseInt(newExamAxisL);
      if (isNaN(axisLVal) || axisLVal < 0 || axisLVal > 180) {
        toast.error("Axis Kiri (OS) wajib diisi antara 0° dan 180° jika nilai CYL diisi");
        return;
      }
    }
    if (newExamAddL) {
      const addLVal = parseFloat(newExamAddL);
      if (isNaN(addLVal) || addLVal < 0 || addLVal > 4) {
        toast.error("Nilai ADD Kiri (OS) harus positif di rentang 0.00 hingga 4.00");
        return;
      }
    }

    setSavingPrescription(true)
    try {
      const details = [
        {
          eye: "R",
          sph: parseFloat(newExamSphR) || 0,
          cyl: newExamCylR ? parseFloat(newExamCylR) : 0,
          axis: newExamAxisR ? parseInt(newExamAxisR) : 0,
          add_power: newExamAddR ? parseFloat(newExamAddR) : null,
        },
        {
          eye: "L",
          sph: parseFloat(newExamSphL) || 0,
          cyl: newExamCylL ? parseFloat(newExamCylL) : 0,
          axis: newExamAxisL ? parseInt(newExamAxisL) : 0,
          add_power: newExamAddL ? parseFloat(newExamAddL) : null,
        }
      ]

      const res = await apiClient.post("/examinations", {
        patient_id: patientId,
        doctor_name: newExamDoctor || "Internal Optik 88",
        source: newExamSource,
        prescriptions: [
          {
            type: newExamLensType,
            pd: parseInt(newExamPd) || 0,
            details
          }
        ]
      })

      const examData = res.data
      const createdPrescription = examData.prescriptions?.[0] || examData.prescription
      
      toast.success("Resep baru berhasil disimpan dan diterapkan!")
      
      await fetchPrescriptions(patientId)
      
      if (createdPrescription && createdPrescription.id) {
        setPrescriptionId(createdPrescription.id)
      } else {
        const updatedPres = await apiClient.get(`/prescriptions/patient/${patientId}`)
        if (updatedPres.data?.length > 0) {
          setPrescriptionId(updatedPres.data[0].id)
        }
      }

      // Reset Form
      setNewExamPd(""); setNewExamSphR(""); setNewExamCylR(""); setNewExamAxisR(""); setNewExamAddR("")
      setNewExamSphL(""); setNewExamCylL(""); setNewExamAxisL(""); setNewExamAddL("")
      setShowNewPrescriptionForm(false)
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menyimpan resep baru")
    } finally {
      setSavingPrescription(false)
    }
  }

  // Handle POS Checkout Transaction
  const handleCreateOrder = async () => {
    if (!patientId) return toast.error("Silakan pilih pasien")

    if (cartItems.length === 0) {
      return toast.error("Keranjang belanja kosong! Silakan pilih frame atau lensa dari katalog, atau tambah jasa layanan.")
    }
    
    // BPJS validation
    if (transactionType === 'bpjs' && (!prescriptionId || prescriptionId === 'none')) {
      return toast.error("Transaksi BPJS wajib menggunakan resep klinis!")
    }

    // Stock validation
    for (const item of cartItems) {
      if (item.product_type !== 'service' && item.qty > item.maxQty) {
        return toast.error(`Stok ${item.brand} ${item.modelOrType} tidak mencukupi! (Tersedia: ${item.maxQty})`)
      }
    }

    const items = cartItems.map(item => ({
      product_type: item.product_type,
      product_id: item.product_id,
      price: item.price,
      qty: item.qty
    }))

    try {
      const res = await apiClient.post("/orders", {
        patient_id: patientId,
        prescription_id: prescriptionId === 'none' ? null : prescriptionId,
        items,
        discount: parseFloat(discount) || 0,
        dp_amount: parseFloat(dpAmount) || 0,
        dp_method: dpMethod,
        is_bpjs: transactionType === 'bpjs',
      })
      
      toast.success(`Transaksi berhasil dikonfirmasi! Faktur: ${res.data.invoice.invoice_number}`)
      setPrintOrderId(res.data.order.id)
      setIsPrintOpen(true)
      resetForm()
      fetchOrders()
      // Go to history tab
      setActiveTab("history")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal membuat transaksi POS")
    }
  }

  const resetForm = () => {
    setPatientId(""); setPatientSearch(""); setPrescriptionId(""); 
    setServiceDesc(""); setServicePrice(""); setDpAmount("0"); setDiscount("0");
    setCartItems([])
    setCatalogSearch("")
    setCashReceived("")
    setShowNewPatientForm(false)
    setShowNewPrescriptionForm(false)
  }

  // Settlement (Pelunasan) handler
  const handleSettlement = async () => {
    if (!selectedOrder || !settlementAmount) return
    try {
      await apiClient.post(`/orders/${selectedOrder.id}/payments`, {
        amount: parseFloat(settlementAmount),
        method: settlementMethod
      })
      toast.success("Pelunasan berhasil disimpan!")
      setIsPaymentOpen(false)
      setIsDetailOpen(false)
      fetchOrders()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memproses pelunasan")
    }
  }

  // Order status update handler
  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder) return
    try {
      await apiClient.patch(`/orders/${selectedOrder.id}/status`, { status: newStatus })
      toast.success("Status pesanan diperbarui")
      setIsDetailOpen(false)
      fetchOrders()
    } catch (error) {
      toast.error("Gagal memperbarui status pesanan")
    }
  }

  // Filter patients list
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
    p.phone?.includes(patientSearch) ||
    p.nik?.includes(patientSearch)
  ).slice(0, 5)

  // Selected patient details
  const currentPatient = patients.find(p => p.id === patientId)

  // Active prescription details
  const activePrescriptionObj = prescriptions.find(pr => pr.id === prescriptionId)
  const activeOD = activePrescriptionObj?.details?.find((d: any) => d.eye === 'R')
  const activeOS = activePrescriptionObj?.details?.find((d: any) => d.eye === 'L')

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1.5 w-6 bg-[#00a39d] rounded-full"></div>
            <span className="text-[10px] font-bold text-[#00a39d] uppercase tracking-[0.2em]">Dashboard Kasir Terpadu</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Terminal & POS Penjualan</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Registrasi pasien, resep mata, dan transaksi kasir terintegrasi dalam satu layar</p>
        </div>
      </div>

      {/* Main Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 p-1.5 rounded-2xl flex w-fit gap-2 border border-slate-200/50 mb-6 ml-4 shadow-sm">
          <TabsTrigger value="pos" className="rounded-xl px-6 py-3 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-[#1a2b3c] data-[state=active]:shadow-md transition-all flex items-center">
            <ShoppingCart className="h-4 w-4 mr-2 text-[#00a39d]" /> Terminal POS
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl px-6 py-3 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-[#1a2b3c] data-[state=active]:shadow-md transition-all flex items-center">
            <Clock className="h-4 w-4 mr-2 text-indigo-500" /> Riwayat Transaksi
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* TAB 1: TERMINAL POS TERPADU */}
        {/* ========================================================================= */}
        <TabsContent value="pos" className="outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 items-start">
            
            {/* SESSION HEADER - PATIENT & PRESCRIPTION STATS */}
            {patientId && (
              <div className="col-span-12">
                <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                      {/* Patient summary */}
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-teal-400 font-extrabold text-base shadow-inner">
                          {currentPatient?.name?.charAt(0).toUpperCase() || "P"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-extrabold leading-none text-white">{currentPatient?.name}</h4>
                            {currentPatient?.bpjs_number ? (
                              <span className="bg-[#00a39d] text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">BPJS</span>
                            ) : (
                              <span className="bg-white/10 text-slate-300 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">UMUM</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1.5 flex flex-wrap gap-x-3 gap-y-1 font-semibold">
                            <span>WhatsApp: <b>{currentPatient?.phone || '-'}</b></span>
                            <span>•</span>
                            <span>NIK: <b>{currentPatient?.nik || '-'}</b></span>
                          </p>
                        </div>
                      </div>

                      {/* Prescription summary details */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-3">
                        <div className="text-xs">
                          <span className="text-[9px] font-black uppercase text-indigo-300 block tracking-widest">Resep Aktif</span>
                          <span className="font-extrabold text-white text-[11px]">
                            {prescriptionId ? (
                              prescriptionId === 'none' ? "Input Manual (Tanpa Resep)" : `#${prescriptionId.substring(0, 8).toUpperCase()} [PD: ${activePrescriptionObj?.pd || 0}mm]`
                            ) : (
                              "Belum dipilih"
                            )}
                          </span>
                        </div>
                        
                        {prescriptionId && prescriptionId !== 'none' && (
                          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-4 text-[10px] font-mono text-slate-300">
                            <div>OD: <b className="text-teal-400">{activeOD ? `${activeOD.sph > 0 ? '+' : ''}${activeOD.sph.toFixed(2)} / ${activeOD.cyl.toFixed(2)} / AX ${activeOD.axis}°${activeOD.add_power ? ` ADD +${activeOD.add_power.toFixed(2)}` : ''}` : '—'}</b></div>
                            <div>OS: <b className="text-sky-400">{activeOS ? `${activeOS.sph > 0 ? '+' : ''}${activeOS.sph.toFixed(2)} / ${activeOS.cyl.toFixed(2)} / AX ${activeOS.axis}°${activeOS.add_power ? ` ADD +${activeOS.add_power.toFixed(2)}` : ''}` : '—'}</b></div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 w-full lg:w-auto">
                        <Button
                          onClick={() => setShowPrescriptionManager(!showPrescriptionManager)}
                          variant="outline"
                          className="flex-1 lg:flex-none h-10 border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2"
                        >
                          <BookOpen className="h-4 w-4 text-teal-400" />
                          {showPrescriptionManager ? "Sembunyikan Resep" : "Kelola Resep"}
                        </Button>
                        <Button
                          onClick={() => { setPatientId(""); setPrescriptionId(""); }}
                          variant="ghost"
                          className="h-10 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl font-bold text-xs uppercase tracking-wide"
                        >
                          Ganti Pasien
                        </Button>
                      </div>
                    </div>

                    {/* COLLAPSIBLE PRESCRIPTION MANAGER PANEL */}
                    {showPrescriptionManager && (
                      <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top duration-300">
                        {/* Left: Riwayat Resep / Pemeriksaan */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Riwayat Pemeriksaan</span>
                            <Button
                              onClick={() => setShowNewPrescriptionForm(!showNewPrescriptionForm)}
                              variant="ghost"
                              className="h-7 text-[#00a39d] hover:text-[#00c5bd] hover:bg-[#00a39d]/10 rounded-md font-bold text-[9px] uppercase tracking-wider flex items-center gap-1"
                            >
                              {showNewPrescriptionForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                              {showNewPrescriptionForm ? "Batal" : "Tambah Baru"}
                            </Button>
                          </div>

                          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                            {prescriptions.length === 0 ? (
                              <div className="p-6 text-center text-slate-500 text-xs font-semibold bg-white/5 border border-dashed border-white/10 rounded-xl">
                                Belum ada riwayat resep untuk pasien ini.
                              </div>
                            ) : (
                              <div className="relative pl-6 ml-3 border-l border-slate-700/40 space-y-4 py-2">
                                {prescriptions.map((pr: any) => {
                                  const isSelected = pr.id === prescriptionId
                                  const od = pr.details?.find((d: any) => d.eye === 'R')
                                  const os = pr.details?.find((d: any) => d.eye === 'L')
                                  const formatVal = (v: number) => (v > 0 ? '+' : '') + (v || 0).toFixed(2)
                                  const formatAdd = (detail: any) => detail && (detail.add_power !== null && detail.add_power !== undefined) ? ` Add +${detail.add_power.toFixed(2)}` : ''
                                  
                                  const getLensTypeBadge = (type: string) => {
                                    switch (type?.toLowerCase()) {
                                      case 'monofocal':
                                        return 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                                      case 'bifocal':
                                        return 'bg-blue-500/10 text-blue-450 border border-blue-500/20'
                                      case 'progressive':
                                        return 'bg-purple-500/10 text-purple-450 border border-purple-500/20'
                                      default:
                                        return 'bg-white/10 text-slate-350 border border-white/5'
                                    }
                                  }

                                  return (
                                    <div key={pr.id} className="relative group">
                                      {/* Timeline Dot */}
                                      <div className={`absolute -left-[32px] top-[14px] w-4 h-4 rounded-full border-2 transition-all duration-300 z-10 flex items-center justify-center ${
                                        isSelected
                                          ? 'bg-[#00a39d] border-[#00a39d] ring-4 ring-[#00a39d]/20 scale-105 shadow-md shadow-[#00a39d]/20'
                                          : 'bg-slate-900 border-slate-700 group-hover:border-slate-500 group-hover:bg-slate-800'
                                      }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-500'}`} />
                                      </div>
                                      
                                      {/* Pulse ring for active item */}
                                      {isSelected && (
                                        <span className="absolute -left-[32px] top-[14px] w-4 h-4 rounded-full bg-[#00a39d]/50 animate-ping z-0" />
                                      )}

                                      {/* Event Card */}
                                      <div 
                                        className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                                          isSelected 
                                            ? 'border-[#00a39d]/50 bg-[#00a39d]/10' 
                                            : 'border-white/5 bg-white/5 hover:bg-white/10'
                                        }`}
                                      >
                                        <div>
                                          <div className="flex items-center flex-wrap gap-2">
                                            <span className="font-extrabold text-white text-xs">
                                              {new Date(pr.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                                            </span>
                                            <span className={`text-[8px] font-black uppercase py-0.5 px-1.5 rounded tracking-wide ${getLensTypeBadge(pr.type)}`}>
                                              {pr.type}
                                            </span>
                                          </div>
                                          <div className="text-[10px] font-mono text-slate-350 grid grid-cols-2 gap-x-4 mt-1.5">
                                            <div>R: <b className="text-teal-400">{od ? `${formatVal(od.sph)} / ${od.cyl.toFixed(2)} / AX ${od.axis}°${formatAdd(od)}` : '—'}</b></div>
                                            <div>L: <b className="text-sky-400">{os ? `${formatVal(os.sph)} / ${os.cyl.toFixed(2)} / AX ${os.axis}°${formatAdd(os)}` : '—'}</b></div>
                                            <div className="col-span-2 text-[9px] text-slate-400 mt-1 font-sans">PD: {pr.pd || '0'}mm • Dokter: {pr.examination?.doctor_name || '—'}</div>
                                          </div>
                                        </div>
                                        <div className="flex gap-1.5 self-stretch sm:self-auto justify-end">
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => { setSelectedPrescription(pr); setIsPrescriptionPrintOpen(true); }}
                                            className="h-8 w-8 text-slate-450 hover:text-white border-white/10 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                          >
                                            <Printer className="h-3.5 w-3.5" />
                                          </Button>
                                          {!isSelected ? (
                                            <Button
                                              onClick={() => setPrescriptionId(pr.id)}
                                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] h-8 px-3 rounded-lg flex items-center gap-1 shadow-md shadow-indigo-900/20 transition-colors"
                                            >
                                              Gunakan
                                            </Button>
                                          ) : (
                                            <span className="bg-teal-500 text-white font-extrabold text-[8px] px-2 py-1.5 rounded-lg flex items-center tracking-wider shadow-md shadow-teal-900/20">AKTIF</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Input Pemeriksaan Resep Baru */}
                        <div className="space-y-4">
                          {showNewPrescriptionForm ? (
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                              <h3 className="text-xs font-bold text-[#00a39d] uppercase tracking-wide flex items-center gap-1.5 mb-1">
                                <Sparkles className="h-3.5 w-3.5" /> Input Resep Baru
                              </h3>
                              
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-[8px] font-bold text-slate-400 uppercase">Tipe Lensa</Label>
                                  <Select value={newExamLensType} onValueChange={(val) => setNewExamLensType(val || "monofocal")}>
                                    <SelectTrigger className="h-9 rounded bg-white text-slate-800 border-none font-bold text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-lg">
                                      <SelectItem value="monofocal">Monofocal</SelectItem>
                                      <SelectItem value="bifocal">Bifocal</SelectItem>
                                      <SelectItem value="progressive">Progressive</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[8px] font-bold text-[#00a39d] uppercase">PD (Pupil Distance) *</Label>
                                  <Input className="h-9 rounded bg-white text-slate-900 border-none font-bold text-xs" value={newExamPd} onChange={e => setNewExamPd(e.target.value)} placeholder="Contoh: 64" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[8px] font-bold text-slate-400 uppercase">Dokter / RS</Label>
                                  <Input className="h-9 rounded bg-white text-slate-900 border-none text-xs" value={newExamDoctor} onChange={e => setNewExamDoctor(e.target.value)} placeholder="Nama dokter..." />
                                </div>
                              </div>

                              <div className="overflow-x-auto bg-white/5 rounded-lg border border-white/10 p-1.5">
                                <table className="w-full text-center text-[10px] text-white">
                                  <thead>
                                    <tr className="bg-white/5 text-[8px] uppercase font-bold text-slate-400">
                                      <th className="py-1 px-1 text-left">Mata</th>
                                      <th className="py-1 px-1">SPH</th>
                                      <th className="py-1 px-1">CYL</th>
                                      <th className="py-1 px-1">AXIS</th>
                                      <th className="py-1 px-1 text-[#00a39d]">ADD</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5">
                                    <tr>
                                      <td className="py-2 px-1 text-left font-bold text-slate-300">Kanan (OD)</td>
                                      <td className="py-1 px-0.5"><Input className="h-8 w-16 mx-auto text-center font-bold bg-white text-slate-900" value={newExamSphR} onChange={e => setNewExamSphR(e.target.value)} placeholder="0.00" /></td>
                                      <td className="py-1 px-0.5"><Input className="h-8 w-16 mx-auto text-center font-bold bg-white text-slate-900" value={newExamCylR} onChange={e => setNewExamCylR(e.target.value)} placeholder="0.00" /></td>
                                      <td className="py-1 px-0.5"><Input className="h-8 w-16 mx-auto text-center font-bold bg-white text-slate-900" value={newExamAxisR} onChange={e => setNewExamAxisR(e.target.value)} placeholder="0" /></td>
                                      <td className="py-1 px-0.5"><Input className="h-8 w-16 mx-auto text-center font-bold bg-white text-slate-900 border-[#00a39d]/40 focus:border-[#00a39d]" value={newExamAddR} onChange={e => setNewExamAddR(e.target.value)} placeholder="0.00" /></td>
                                    </tr>
                                    <tr>
                                      <td className="py-2 px-1 text-left font-bold text-slate-300">Kiri (OS)</td>
                                      <td className="py-1 px-0.5"><Input className="h-8 w-16 mx-auto text-center font-bold bg-white text-slate-900" value={newExamSphL} onChange={e => setNewExamSphL(e.target.value)} placeholder="0.00" /></td>
                                      <td className="py-1 px-0.5"><Input className="h-8 w-16 mx-auto text-center font-bold bg-white text-slate-900" value={newExamCylL} onChange={e => setNewExamCylL(e.target.value)} placeholder="0.00" /></td>
                                      <td className="py-1 px-0.5"><Input className="h-8 w-16 mx-auto text-center font-bold bg-white text-slate-900" value={newExamAxisL} onChange={e => setNewExamAxisL(e.target.value)} placeholder="0" /></td>
                                      <td className="py-1 px-0.5"><Input className="h-8 w-16 mx-auto text-center font-bold bg-white text-slate-900 border-[#00a39d]/40 focus:border-[#00a39d]" value={newExamAddL} onChange={e => setNewExamAddL(e.target.value)} placeholder="0.00" /></td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              <div className="flex gap-2 justify-end pt-1">
                                <Button 
                                  onClick={handleSavePrescriptionInline} 
                                  disabled={savingPrescription}
                                  className="bg-[#00a39d] hover:bg-[#008a85] text-white font-bold text-[10px] uppercase tracking-wider rounded-lg h-9 px-4 flex gap-1.5"
                                >
                                  {savingPrescription ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                  Simpan Resep
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-8 text-center text-slate-400 text-xs font-semibold bg-white/5 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center h-full">
                              <BookOpen className="h-8 w-8 text-slate-600 mb-2" />
                              Gunakan panel sebelah kiri untuk memilih resep pemeriksaan pasien, atau klik "Tambah Baru" untuk menginput hasil pemeriksaan kacamata.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* PATIENT IDENTIFICATION CAROUSEL (IF NOT SELECTED) */}
            {!patientId && (
              <div className="col-span-12">
                <Card className="border-0 shadow-lg rounded-2xl bg-white overflow-hidden max-w-2xl mx-auto my-6">
                  <CardContent className="p-8 space-y-6">
                    <div className="text-center space-y-2">
                      <div className="h-14 w-14 rounded-2xl bg-teal-50 text-[#00a39d] flex items-center justify-center mx-auto shadow-inner">
                        <User className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-black text-slate-850">Identifikasi Pasien</h3>
                      <p className="text-slate-400 text-xs font-semibold">Cari data pelanggan terdaftar atau registrasikan data baru untuk memulai transaksi kasir.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            ref={patientSearchRef}
                            placeholder="Cari pasien berdasarkan nama, WhatsApp, NIK..."
                            className="pl-11 h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white text-sm font-semibold"
                            value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                          />
                          {patientSearch && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] overflow-hidden">
                              {filteredPatients.length > 0 ? (
                                filteredPatients.map((p) => (
                                  <div
                                    key={p.id}
                                    onClick={() => {
                                      setPatientId(p.id)
                                      setPatientSearch("")
                                    }}
                                    className="p-3 hover:bg-teal-50/50 cursor-pointer border-b last:border-0 flex items-center justify-between transition-colors"
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-bold text-slate-800 text-sm">{p.name}</span>
                                      <span className="text-[10px] text-slate-400 font-mono">NIK: {p.nik || '-'} • Telp: {p.phone || '-'}</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-slate-300" />
                                  </div>
                                ))
                              ) : (
                                <div className="p-4 text-center text-slate-400 text-xs font-bold">Pasien tidak ditemukan. Gunakan registrasi di bawah.</div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <Button 
                          onClick={() => setShowNewPatientForm(!showNewPatientForm)}
                          variant={showNewPatientForm ? "outline" : "default"}
                          className={`h-12 rounded-xl px-5 font-bold text-xs uppercase tracking-wider flex gap-2 ${
                            showNewPatientForm ? 'border-slate-300' : 'bg-[#1a2b3c] hover:bg-black text-white'
                          }`}
                        >
                          {showNewPatientForm ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                          {showNewPatientForm ? "Batal" : "Pasien Baru"}
                        </Button>
                      </div>

                      {/* INLINE NEW PATIENT REGISTRATION FORM */}
                      {showNewPatientForm && (
                        <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-4 animate-in slide-in-from-top duration-300">
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-[#00a39d]" /> Pendaftaran Pasien Baru
                          </h3>
                          
                          <div className="flex p-0.5 bg-slate-200/60 rounded-xl w-full mb-3">
                            <button
                              type="button"
                              onClick={() => { setNewPatientType("umum"); setNewPatientBpjs("") }}
                              className={`flex-1 py-2 rounded-lg text-[10px] font-extrabold transition-all ${newPatientType === 'umum' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                            >
                              PASIEN UMUM
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewPatientType("bpjs")}
                              className={`flex-1 py-2 rounded-lg text-[10px] font-extrabold transition-all ${newPatientType === 'bpjs' ? 'bg-[#00a39d] text-white shadow-sm' : 'text-slate-400'}`}
                            >
                              PASIEN BPJS
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold text-slate-400 uppercase">Nama Lengkap *</Label>
                              <Input className="h-10 rounded-lg bg-white border-slate-200 font-bold" value={newPatientName} onChange={e => setNewPatientName(e.target.value)} placeholder="Nama pasien..." />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold text-slate-400 uppercase">No. WhatsApp *</Label>
                              <Input className="h-10 rounded-lg bg-white border-slate-200 font-bold" value={newPatientPhone} onChange={e => setNewPatientPhone(e.target.value)} placeholder="08..." />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold text-slate-400 uppercase">NIK KTP (16 Digit)</Label>
                              <Input className="h-10 rounded-lg bg-white border-slate-200" value={newPatientNik} onChange={e => setNewPatientNik(e.target.value)} placeholder="NIK..." />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold text-slate-400 uppercase">Tanggal Lahir</Label>
                              <Input type="date" className="h-10 rounded-lg bg-white border-slate-200 text-slate-700 font-bold" value={newPatientBirthDate} onChange={e => setNewPatientBirthDate(e.target.value)} />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className={`text-[10px] font-bold uppercase ${newPatientType==='bpjs'?'text-[#00a39d]':'text-slate-400'}`}>Nomor Kartu BPJS</Label>
                              <Input 
                                className={`h-10 rounded-lg ${newPatientType==='bpjs'?'border-[#00a39d] bg-sky-50/20 font-bold text-slate-800':'border-slate-200 bg-slate-100 opacity-60'}`} 
                                value={newPatientBpjs} 
                                onChange={e => setNewPatientBpjs(e.target.value)} 
                                disabled={newPatientType==='umum'} 
                                placeholder="Kartu BPJS..."
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold text-slate-400 uppercase">Alamat Pasien</Label>
                              <Input className="h-10 rounded-lg bg-white border-slate-200" value={newPatientAddress} onChange={e => setNewPatientAddress(e.target.value)} placeholder="Alamat lengkap..." />
                            </div>
                          </div>

                          <Button 
                            onClick={handleRegisterPatientInline} 
                            disabled={registeringPatient}
                            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl mt-2 flex gap-2"
                          >
                            {registeringPatient ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            Simpan & Daftarkan Pasien
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {patientId && (
              <>
                {/* COLUMN LEFT (7) - PRODUCT CATALOG */}
                <div className="lg:col-span-7 space-y-6">
                  <Card className="border-0 shadow-lg rounded-2xl bg-white overflow-hidden">
                    <CardContent className="p-6 space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center text-[#00a39d]">
                            <Package className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Katalog Produk</span>
                            <span className="text-[9px] text-slate-400 font-semibold uppercase">Pilih produk kacamata & lensa aktif</span>
                          </div>
                        </div>

                        {/* Catalog tabs */}
                        <div className="flex p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                          <button
                            onClick={() => setCatalogTab("all")}
                            className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase transition-all ${catalogTab === 'all' ? 'bg-white text-[#1a2b3c] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            Semua
                          </button>
                          <button
                            onClick={() => setCatalogTab("frame")}
                            className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase transition-all ${catalogTab === 'frame' ? 'bg-white text-[#1a2b3c] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            Frame
                          </button>
                          <button
                            onClick={() => setCatalogTab("lens")}
                            className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase transition-all ${catalogTab === 'lens' ? 'bg-white text-[#1a2b3c] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            Lensa
                          </button>
                        </div>
                      </div>

                      {/* Catalog Search */}
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          ref={catalogSearchRef}
                          placeholder="Cari merk, model, tipe lensa..."
                          value={catalogSearch}
                          onChange={e => setCatalogSearch(e.target.value)}
                          className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 text-sm font-semibold"
                        />
                        {catalogSearch && (
                          <button onClick={() => setCatalogSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-red-500 hover:underline">Hapus</button>
                        )}
                      </div>

                      {/* Catalog Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                        {/* Render Frames */}
                        {(catalogTab === 'all' || catalogTab === 'frame') && (
                          frames
                            .filter(f => {
                              const q = catalogSearch.toLowerCase()
                              return (f.brand + " " + f.model + " " + f.color).toLowerCase().includes(q)
                            })
                            .map(f => {
                              // Branch stock quantity
                              const stockQty = f.stocks?.[0]?.quantity ?? 0
                              const cartItem = cartItems.find(item => item.product_id === f.id && item.product_type === 'frame')
                              const cartQty = cartItem?.qty || 0
                              const isOutOfStock = stockQty <= 0
                              const isMaxedOut = cartQty >= stockQty

                              return (
                                <div key={f.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between gap-4 hover:border-teal-250 transition-all hover:bg-slate-50/50">
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-start">
                                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-teal-100 text-teal-800 tracking-wider">FRAME</span>
                                      <span className={`text-[9px] font-bold ${isOutOfStock ? 'text-red-500' : 'text-slate-500'}`}>
                                        Stok Cabang: <b>{stockQty}</b>
                                      </span>
                                    </div>
                                    <h4 className="text-xs font-extrabold text-slate-800">{f.brand}</h4>
                                    <p className="text-[10px] text-slate-500 font-semibold">{f.model} • {f.color}</p>
                                  </div>

                                  <div className="flex justify-between items-center border-t border-slate-200/50 pt-3">
                                    <span className="text-xs font-black text-[#1a2b3c]">Rp {f.price?.toLocaleString()}</span>
                                    <Button
                                      onClick={() => addToCart(f, 'frame')}
                                      disabled={isOutOfStock || isMaxedOut}
                                      className={`h-8 px-3 rounded-lg text-[9px] font-extrabold uppercase tracking-wide transition-all ${
                                        isOutOfStock 
                                          ? 'bg-red-50 text-red-450 border border-red-100 cursor-not-allowed text-red-400'
                                          : isMaxedOut 
                                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                          : 'bg-[#00a39d] hover:bg-[#008f8a] text-white'
                                      }`}
                                    >
                                      {isOutOfStock ? "Habis" : isMaxedOut ? "Penuh" : "+ Tambah"}
                                    </Button>
                                  </div>
                                </div>
                              )
                            })
                        )}

                        {/* Render Lenses */}
                        {(catalogTab === 'all' || catalogTab === 'lens') && (
                          lenses
                            .filter(l => {
                              const q = catalogSearch.toLowerCase()
                              return (l.brand + " " + l.type).toLowerCase().includes(q)
                            })
                            .map(l => {
                              const stockQty = l.stocks?.[0]?.quantity ?? 0
                              const cartItem = cartItems.find(item => item.product_id === l.id && item.product_type === 'lens')
                              const cartQty = cartItem?.qty || 0
                              const isOutOfStock = stockQty <= 0
                              const isMaxedOut = cartQty >= stockQty

                              return (
                                <div key={l.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between gap-4 hover:border-sky-250 transition-all hover:bg-slate-50/50">
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-start">
                                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-sky-100 text-sky-800 tracking-wider">LENSA</span>
                                      <span className={`text-[9px] font-bold ${isOutOfStock ? 'text-red-500' : 'text-slate-500'}`}>
                                        Stok Cabang: <b>{stockQty}</b>
                                      </span>
                                    </div>
                                    <h4 className="text-xs font-extrabold text-slate-800">{l.brand}</h4>
                                    <p className="text-[10px] text-slate-500 font-semibold">{l.type}</p>
                                  </div>

                                  <div className="flex justify-between items-center border-t border-slate-200/50 pt-3">
                                    <span className="text-xs font-black text-[#1a2b3c]">Rp {l.price?.toLocaleString()}</span>
                                    <Button
                                      onClick={() => addToCart(l, 'lens')}
                                      disabled={isOutOfStock || isMaxedOut}
                                      className={`h-8 px-3 rounded-lg text-[9px] font-extrabold uppercase tracking-wide transition-all ${
                                        isOutOfStock 
                                          ? 'bg-red-50 text-red-450 border border-red-100 cursor-not-allowed text-red-400'
                                          : isMaxedOut 
                                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                          : 'bg-[#00a39d] hover:bg-[#008f8a] text-white'
                                      }`}
                                    >
                                      {isOutOfStock ? "Habis" : isMaxedOut ? "Penuh" : "+ Tambah"}
                                    </Button>
                                  </div>
                                </div>
                              )
                            })
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* COLUMN RIGHT (5) - CART & PAYMENTS */}
                <div className="lg:col-span-5 space-y-6">
                  {/* SHOPPING CART CARD */}
                  <Card className="border-0 shadow-lg rounded-2xl bg-white overflow-hidden">
                    <CardContent className="p-6 space-y-6">
                      <div className="flex items-center gap-2 border-b pb-4">
                        <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center text-[#00a39d]">
                          <ShoppingCart className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Keranjang Belanja</span>
                          <span className="text-[9px] text-slate-400 font-semibold uppercase">Kelola item transaksi pembayaran</span>
                        </div>
                      </div>

                      {/* Cart List */}
                      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                        {cartItems.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-xs font-semibold bg-slate-50 border border-dashed rounded-xl">
                            Keranjang kosong. Pilih barang dari katalog.
                          </div>
                        ) : (
                          cartItems.map((item, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                                  {item.product_type === 'frame' ? <Glasses className="h-4 w-4" /> : item.product_type === 'lens' ? <Eye className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                                </div>
                                <div>
                                  <h4 className="text-xs font-extrabold text-slate-805 leading-tight">
                                    {item.brand} {item.modelOrType}
                                  </h4>
                                  <p className="text-[9px] font-bold text-slate-400">
                                    Rp {item.price?.toLocaleString()} {item.product_type !== 'service' && `(Stok: ${item.maxQty})`}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                {/* Qty adjustments */}
                                {item.product_type !== 'service' && (
                                  <div className="flex items-center bg-white border rounded-lg p-0.5 gap-1.5 shadow-sm">
                                    <button
                                      onClick={() => {
                                        setCartItems(prev => prev.map((x, i) => 
                                          i === idx ? { ...x, qty: Math.max(1, x.qty - 1) } : x
                                        ))
                                      }}
                                      className="h-5 w-5 rounded flex items-center justify-center font-bold text-xs hover:bg-slate-100 text-slate-500"
                                    >
                                      -
                                    </button>
                                    <span className="text-[10px] font-extrabold text-slate-805 w-4 text-center">
                                      {item.qty}
                                    </span>
                                    <button
                                      onClick={() => {
                                        if (item.qty >= item.maxQty) {
                                          toast.error(`Kuantitas melebihi batas stok (${item.maxQty})`)
                                          return
                                        }
                                        setCartItems(prev => prev.map((x, i) => 
                                          i === idx ? { ...x, qty: x.qty + 1 } : x
                                        ))
                                      }}
                                      className="h-5 w-5 rounded flex items-center justify-center font-bold text-xs hover:bg-slate-100 text-slate-500"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                                <span className="text-xs font-black text-slate-700 min-w-[70px] text-right">
                                  Rp {(item.price * item.qty).toLocaleString()}
                                </span>
                                <button
                                  onClick={() => {
                                    setCartItems(prev => prev.filter((_, i) => i !== idx))
                                    toast.success("Item dihapus dari keranjang")
                                  }}
                                  className="text-red-400 hover:text-red-650 hover:bg-red-50 p-1 rounded-md"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Custom Service Input block */}
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tambah Jasa Layanan / Kustom</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-7">
                            <Input
                              placeholder="Reparasi, Ongkir, Pasang..."
                              value={serviceDesc}
                              onChange={e => setServiceDesc(e.target.value)}
                              className="h-9 rounded-lg bg-white border-slate-200 text-xs"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <Input
                              type="number"
                              placeholder="Biaya"
                              value={servicePrice}
                              onChange={e => setServicePrice(e.target.value)}
                              className="h-9 rounded-lg bg-white border-slate-200 text-xs font-bold text-right"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <Button
                              onClick={addCustomService}
                              className="h-9 w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs"
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* CHECKOUT CARD */}
                  <Card className="border-0 shadow-lg rounded-2xl bg-white overflow-hidden">
                    <CardContent className="p-6 space-y-6">
                      <div className="flex items-center justify-between border-b pb-4">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Metode & Rincian Pembayaran</span>
                        <span className="text-xl font-black text-[#1a2b3c] font-mono">Total: Rp {total.toLocaleString('id-ID')}</span>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          {/* Transaksi Type */}
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase">Tipe Transaksi</Label>
                            <div className="flex p-1 bg-slate-100/80 rounded-xl border border-slate-200 w-full max-w-[240px] h-10">
                              <button
                                onClick={() => {
                                  setTransactionType("umum")
                                  if (dpMethod === 'bpjs') setDpMethod('cash')
                                }}
                                className={`flex-1 rounded-lg text-xs font-bold transition-all ${transactionType === 'umum' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                UMUM
                              </button>
                              <button
                                onClick={() => setTransactionType("bpjs")}
                                className={`flex-1 rounded-lg text-xs font-bold transition-all ${transactionType === 'bpjs' ? 'bg-[#00a39d] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                BPJS
                              </button>
                            </div>
                          </div>

                          {/* Payment Method */}
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase">Metode Bayar</Label>
                            <div className="flex flex-wrap gap-2">
                               {['cash', 'qris', 'transfer'].map((method) => (
                                 <button
                                   key={method}
                                   onClick={() => setDpMethod(method)}
                                   className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${dpMethod === method ? 'bg-teal-50 border-[#00a39d] text-[#00a39d] shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
                                 >
                                   {method === 'cash' ? 'TUNAI' : method === 'qris' ? 'QRIS' : 'TRANSFER'}
                                 </button>
                               ))}
                               {transactionType === 'bpjs' && (
                                 <button
                                   onClick={() => setDpMethod("bpjs")}
                                   className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${dpMethod === 'bpjs' ? 'bg-teal-50 border-[#00a39d] text-[#00a39d] shadow-sm' : 'bg-white border-slate-200 text-[#00a39d] hover:border-slate-300 hover:bg-slate-50'}`}
                                 >
                                   KLAIM BPJS
                                 </button>
                               )}
                            </div>
                          </div>
                        </div>

                        {/* Discount */}
                        <div className="flex justify-between items-center gap-4 py-1">
                          <div>
                            <span className="text-xs font-bold text-red-505 uppercase tracking-wider block">Potongan Harga / Diskon</span>
                            <span className="text-[10px] text-slate-405 font-medium">Diskon tunai langsung</span>
                          </div>
                          <div className="relative w-36">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-red-500">Rp</span>
                            <Input 
                              className="h-10 rounded-xl bg-red-50/20 border-red-100 text-red-650 font-black text-right pr-4 text-xs focus:ring-red-200" 
                              value={discount} 
                              onChange={e => setDiscount(e.target.value)} 
                              placeholder="0" 
                            />
                          </div>
                        </div>

                        <div className="h-px bg-slate-100 w-full"></div>

                        {/* Uang Diterima & Uang Kembalian (Cashier utilities) */}
                        {dpMethod === 'cash' && (
                          <div className="space-y-3 p-4 bg-slate-50 border border-slate-200/50 rounded-2xl">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase">Uang Diterima</Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Rp</span>
                                  <Input
                                    value={cashReceived}
                                    onChange={e => setCashReceived(e.target.value)}
                                    className="h-11 rounded-xl bg-white border-slate-200 font-black text-xs text-right pr-4 text-slate-800"
                                    placeholder="0"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase">Uang Kembalian</Label>
                                <div className="h-11 flex items-center justify-end px-4 rounded-xl bg-[#00a39d]/10 border border-[#00a39d]/20 text-[#00a39d] font-black text-sm font-mono">
                                  Rp {changeDue.toLocaleString('id-ID')}
                                </div>
                              </div>
                            </div>

                            {/* Denomination quick buttons */}
                            {total > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1 justify-end">
                                <button
                                  onClick={() => setCashReceived(total.toString())}
                                  className="px-2 py-1 bg-white border hover:bg-slate-100 rounded text-[9px] font-bold text-slate-600 transition-all shadow-sm"
                                >
                                  Uang Pas
                                </button>
                                {getShortcutDenominations(total).map((denom, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setCashReceived(denom.toString())}
                                    className="px-2 py-1 bg-white border hover:bg-slate-100 rounded text-[9px] font-bold text-slate-600 transition-all shadow-sm"
                                  >
                                    Rp {denom.toLocaleString('id-ID')}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Sisa Tagihan (Down Payment calculation display) */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase">Nilai Bayar (DP/Penuh)</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Rp</span>
                              <Input
                                value={dpAmount}
                                onChange={e => setDpAmount(e.target.value)}
                                className="h-10 rounded-xl bg-slate-50 border-slate-200 font-bold pl-8 text-xs text-right pr-4"
                                placeholder="0"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase">Sisa Pelunasan</Label>
                            <div className="h-10 flex items-center justify-end px-4 rounded-xl bg-amber-50/50 border border-amber-100 font-bold text-xs text-amber-750 font-mono">
                              Rp {Math.max(0, total - (parseFloat(dpAmount) || 0)).toLocaleString('id-ID')}
                            </div>
                          </div>
                        </div>

                      </div>

                      <div className="pt-2 flex flex-col gap-3">
                        <Button 
                          onClick={handleCreateOrder} 
                          disabled={!patientId || total === 0}
                          className="w-full bg-[#00a39d] hover:bg-[#008f8a] text-white h-14 rounded-2xl font-black italic uppercase text-xs tracking-wider shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex justify-between px-6"
                        >
                          <span>Proses & Cetak Invoice</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button 
                          onClick={resetForm}
                          variant="ghost"
                          className="h-11 text-xs font-bold text-slate-400 hover:text-slate-650 rounded-xl"
                        >
                          Reset POS Terminal
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: RIWAYAT TRANSAKSI (TABLE VIEW) */}
        {/* ========================================================================= */}
        <TabsContent value="history" className="outline-none">
          <div className="px-4 space-y-4">
            
            {/* Search filter for orders */}
            <div className="relative w-full md:w-80 mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari transaksi berdasarkan nama/faktur..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="pl-10 h-11 rounded-xl border-none bg-white shadow-sm text-sm font-semibold"
              />
            </div>

            <Card className="border-0 shadow-xl rounded-2xl bg-white overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-[#1a2b3c]">
                      <TableRow className="hover:bg-transparent border-0">
                        <TableHead className="py-5 pl-8 text-[10px] font-bold text-slate-400 uppercase tracking-wider">No. Faktur</TableHead>
                        <TableHead className="py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Pasien</TableHead>
                        <TableHead className="py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item</TableHead>
                        <TableHead className="py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Harga</TableHead>
                        <TableHead className="py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Bayar</TableHead>
                        <TableHead className="py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progres</TableHead>
                        <TableHead className="pr-8 text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={7} className="h-64 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-300 mb-2" /><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Memuat Data...</p></TableCell></TableRow>
                      ) : orders.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="h-64 text-center text-slate-400 font-medium">Tidak ada transaksi ditemukan</TableCell></TableRow>
                      ) : orders.filter((order: any) => 
                        order.patient?.name?.toLowerCase().includes(historySearch.toLowerCase()) || 
                        order.invoices?.[0]?.invoice_number?.toLowerCase().includes(historySearch.toLowerCase())
                      ).map((order: any) => {
                        const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                        const invoice = order.invoices?.[0]
                        const StatusIcon = statusCfg.icon
                        return (
                          <TableRow key={order.id} className="hover:bg-slate-50/50 transition-all border-b border-slate-100 group">
                            <TableCell className="py-5 pl-8">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-primary">{invoice?.invoice_number || '—'}</span>
                                <span className="text-[10px] text-slate-400 font-medium">{new Date(order.order_date).toLocaleDateString('id-ID')}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                  <User className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                   <div className="flex items-center gap-2">
                                     <span className="font-bold text-slate-900 text-sm">{order.patient?.name}</span>
                                     {order.patient?.bpjs_number && (
                                       <span className="px-1.5 py-0.5 rounded bg-[#00a39d]/10 text-[#00a39d] text-[8px] font-black uppercase">BPJS</span>
                                     )}
                                   </div>
                                   <span className="text-[10px] text-slate-400 font-medium">{order.patient?.phone || '—'}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs font-semibold text-slate-500">{order.items?.length || 0} Item</span>
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-slate-900 text-sm">Rp {order.total_amount?.toLocaleString('id-ID')}</span>
                            </TableCell>
                            <TableCell>
                              {invoice?.remaining > 0 ? (
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-amber-600">Sisa Rp {invoice.remaining?.toLocaleString('id-ID')}</span>
                                  <span className="text-[9px] font-bold text-amber-400 uppercase tracking-tight">Hutang</span>
                                </div>
                              ) : (
                                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1"><Check className="h-3 w-3" /> Lunas</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-md ${statusCfg.color} uppercase tracking-wider w-fit`}>
                                <StatusIcon className="h-3 w-3" /> {statusCfg.label}
                              </div>
                            </TableCell>
                            <TableCell className="pr-8 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                 <Button variant="ghost" size="icon" onClick={() => { setPrintOrderId(order.id); setIsPrintOpen(true); }} className="h-9 w-9 rounded-lg hover:bg-slate-100">
                                    <Printer className="h-4 w-4 text-slate-500" />
                                  </Button>
                                  <Button 
                                    onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }}
                                    variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-100"
                                  >
                                     <Eye className="h-4 w-4 text-slate-500" />
                                  </Button>
                              </div>
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
        </TabsContent>
      </Tabs>

      {/* ========================================================================= */}
      {/* DIALOGS: PRINT PREVIEW, DETAIL, SETTLEMENT */}
      {/* ========================================================================= */}
      
      <PrintPreview orderId={printOrderId} isOpen={isPrintOpen} onOpenChange={setIsPrintOpen} />
      <PrescriptionPrintPreview data={selectedPrescription} isOpen={isPrescriptionPrintOpen} onOpenChange={setIsPrescriptionPrintOpen} />

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden bg-white">
          {selectedOrder && (
            <>
              <div className="bg-[#1a2b3c] p-8 text-white">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold">Detail Transaksi</h2>
                    <p className="text-slate-400 text-xs mt-1 uppercase font-bold tracking-widest">{selectedOrder.invoices?.[0]?.invoice_number || 'TRX-DEFAULT'}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_CONFIG[selectedOrder.status]?.color}`}>
                    {STATUS_CONFIG[selectedOrder.status]?.label}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{selectedOrder.patient?.name}</p>
                    <p className="text-xs text-slate-400">{selectedOrder.patient?.phone || 'No Phone'}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest">Item Pesanan</p>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400">
                            {item.product_type === 'frame' ? <Glasses className="h-4 w-4" /> : item.product_type === 'lens' ? <Eye className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-800 capitalize">{item.product_type}</p>
                             <p className="text-[10px] text-slate-500">
                                {item.product_type === 'frame' ? (item.frame?.brand + " " + item.frame?.model) : 
                                 item.product_type === 'lens' ? (item.lens?.brand + " " + item.lens?.type) : 
                                 'Layanan Kustom'}
                             </p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-slate-900">Rp {item.price?.toLocaleString('id-ID')}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-[#1a2b3c] rounded-2xl text-white space-y-4 shadow-xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Total Tagihan</span>
                    <span className="font-bold">Rp {selectedOrder.total_amount?.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Telah Dibayar (DP)</span>
                    <span className="font-bold text-emerald-400">Rp {selectedOrder.invoices?.[0]?.paid_amount?.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase">Sisa Pelunasan</span>
                    <span className="text-2xl font-bold text-amber-500">Rp {(selectedOrder.invoices?.[0]?.remaining || 0).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Kemajuan Lab (Lab Tracker)</p>
                   
                   {/* VISUAL STEPPER */}
                   <div className="relative flex justify-between items-center w-full pt-2 pb-6 px-4">
                     <div className="absolute left-10 right-10 top-6 h-1 bg-slate-200 z-0"></div>
                     {['pending', 'processed', 'ready', 'completed'].map((step, idx) => {
                       const statusIndex = ['pending', 'processed', 'ready', 'completed'].indexOf(selectedOrder.status);
                       const isPast = selectedOrder.status !== 'cancelled' && statusIndex >= idx;
                       const isCurrent = selectedOrder.status === step;
                       const cfg = STATUS_CONFIG[step];
                       const StepIcon = cfg.icon;
                       
                       return (
                         <div key={step} className="relative z-10 flex flex-col items-center gap-2 cursor-pointer group" onClick={() => handleUpdateStatus(step)}>
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center border-[3px] transition-all duration-300 ${isPast ? 'bg-[#00a39d] border-white text-white shadow-lg scale-110' : 'bg-white border-slate-200 text-slate-300 group-hover:border-[#00a39d]/50'}`}>
                             <StepIcon className="h-4 w-4" />
                           </div>
                           <span className={`absolute top-12 text-[9px] font-extrabold uppercase whitespace-nowrap tracking-wider transition-all duration-300 ${isCurrent ? 'text-[#00a39d] scale-105' : 'text-slate-400'}`}>
                             {cfg.label}
                           </span>
                         </div>
                       )
                     })}
                   </div>

                   {selectedOrder.status === 'cancelled' && (
                     <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2 mt-4">
                       <X className="h-4 w-4" /> Pesanan telah dibatalkan
                     </div>
                   )}
                   
                   {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                     <div className="flex justify-center pt-2 mt-4">
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="text-red-400 hover:text-red-600 hover:bg-red-50/50 text-[9px] font-bold uppercase tracking-wider"
                         onClick={() => {
                           if (confirm("Anda yakin ingin membatalkan pesanan ini?")) {
                             handleUpdateStatus('cancelled')
                           }
                         }}
                       >
                         <X className="h-3 w-3 mr-1" /> Batalkan Pesanan
                       </Button>
                     </div>
                   )}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold text-slate-600" onClick={() => { setIsPrintOpen(true); setPrintOrderId(selectedOrder.id); }}>
                    <Printer className="h-4 w-4 mr-2" /> Cetak Faktur
                  </Button>
                  {selectedOrder.invoices?.[0]?.remaining > 0 ? (
                    <Button 
                      className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                      onClick={() => {
                        setSettlementAmount(selectedOrder.invoices[0].remaining.toString());
                        setIsPaymentOpen(true);
                      }}
                    >
                      <Check className="h-4 w-4 mr-2" /> Pelunasan
                    </Button>
                  ) : (
                    <Button className="flex-1 h-12 bg-[#00a39d] hover:bg-[#008f8a] text-white rounded-xl font-bold" onClick={() => setIsDetailOpen(false)}>
                      Tutup
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <div className="bg-emerald-900 p-8 text-white">
             <h2 className="text-xl font-bold italic uppercase tracking-tight">Form Pelunasan</h2>
             <p className="text-emerald-300/60 text-[10px] font-bold uppercase tracking-widest mt-1">Input Pembayaran Sisa Tagihan</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Jumlah Bayar</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                <Input 
                  type="number" 
                  value={settlementAmount} 
                  onChange={(e) => setSettlementAmount(e.target.value)}
                  className="pl-12 h-14 rounded-2xl border-none bg-slate-50 text-xl font-black text-slate-900"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Metode Pelunasan</Label>
              <Select value={settlementMethod} onValueChange={(val) => setSettlementMethod(val || "cash")}>
                <SelectTrigger className="h-14 rounded-2xl border-none bg-slate-50 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="cash" className="font-bold">Tunai (Cash)</SelectItem>
                  <SelectItem value="debit" className="font-bold">Debit Bank</SelectItem>
                  <SelectItem value="transfer" className="font-bold">Transfer Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <Button 
                onClick={handleSettlement}
                disabled={!settlementAmount || parseFloat(settlementAmount) <= 0}
                className="h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black italic uppercase tracking-wider shadow-xl shadow-emerald-900/10"
              >
                Simpan Pembayaran
              </Button>
              <Button variant="ghost" onClick={() => setIsPaymentOpen(false)} className="font-bold text-slate-400">Batalkan</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
