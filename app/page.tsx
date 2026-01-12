'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas'; // Pastikan sudah: npm install html2canvas
import { 
  Menu, X, Search, ShoppingCart, LogOut, 
  Smartphone, Monitor, CreditCard, CheckCircle, 
  ChevronRight, ShieldCheck, Zap,
  Loader2, AlertCircle,
  Download, ExternalLink, Mail, Copy, AlignJustify,
  ArrowUpDown, Plus, Trash2, Edit3, Tag, HelpCircle, Eye, Wallet, 
  ChevronLeft, Gamepad2, Ticket, AlertTriangle 
} from 'lucide-react';

// --- 1. SETUP ENV & SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

const createSupabaseClient = (baseUrl: string, key: string) => {
  if (!baseUrl || !key) return null;
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  return {
    from: (table: string) => {
      const url = new URL(`${baseUrl}/rest/v1/${table}`);
      let method = 'GET';
      let body: any = null;
      let isSingle = false;

      const builder = {
        select: (columns = '*') => { url.searchParams.set('select', columns); return builder; },
        order: (column: string, { ascending = true } = {}) => { url.searchParams.set('order', `${column}.${ascending ? 'asc' : 'desc'}`); return builder; },
        eq: (column: string, value: any) => { url.searchParams.set(column, `eq.${value}`); return builder; },
        gte: (column: string, value: any) => { url.searchParams.set(column, `gte.${value}`); return builder; },
        range: (from: number, to: number) => { return builder; }, // Client side pagination used for smooth UX
        single: () => { isSingle = true; return builder; },
        insert: (data: any) => { method = 'POST'; body = JSON.stringify(data); return builder; },
        update: (data: any) => { method = 'PATCH'; body = JSON.stringify(data); return builder; }, 
        delete: () => { method = 'DELETE'; return builder; },
        then: (resolve: Function, reject: Function) => {
          const execute = async () => {
            try {
              const res = await fetch(url.toString(), { method, headers, body });
              if (!res.ok) { const text = await res.text(); return { data: null, error: { message: text } }; }
              if (res.status === 204) return { data: null, error: null };
              const result = await res.json();
              if (isSingle && Array.isArray(result)) return { data: result.length > 0 ? result[0] : null, error: null };
              return { data: result, error: null };
            } catch (err: any) { return { data: null, error: { message: err.message } }; }
          };
          return execute().then((res) => resolve(res)).catch((err) => reject(err));
        }
      };
      return builder;
    }
  };
};

const supabase: any = createSupabaseClient(supabaseUrl, supabaseKey);
const ADMIN_PHONE_FALLBACK = "6281528483575"; 

// --- FAQ DATA ---
const FAQ_DATA = [
  { q: "Bagaimana cara order?", a: "Pilih produk -> Isi Data -> Pilih Pembayaran -> Konfirmasi -> Kirim ke WA Admin." },
  { q: "Apakah proses instan?", a: "Ya, proses 1-10 menit setelah admin menerima bukti transfer." },
  { q: "Apa itu Label Produk?", a: "Label menunjukkan status produk seperti 'Promo', 'Best Seller', atau 'New'." },
  { q: "Jam operasional?", a: "09:00 - 22:00 WIB. Di luar jam itu slow respon." }
];

// --- TOAST COMPONENT ---
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl animate-slideIn transition-all backdrop-blur-md border ${
    type === 'success' ? 'bg-green-500/80 border-green-400 text-white' : 'bg-red-500/80 border-red-400 text-white'
  }`}>
    {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
    <span className="font-medium text-sm">{message}</span>
    <button onClick={onClose} className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors"><X size={14}/></button>
  </div>
);

// --- MAIN COMPONENT ---
export default function WuregStore() {
  const [activePage, setActivePage] = useState('home'); 
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  // Data State
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [contactMethods, setContactMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 16;

  // Staff State
  const [isStaffLoggedIn, setIsStaffLoggedIn] = useState(false);
  const [staffPinInput, setStaffPinInput] = useState('');
  const [isStaffLoginLoading, setIsStaffLoginLoading] = useState(false); 
  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'transactions' | 'products' | 'payments' | 'contacts'>('dashboard');
  
  // Staff: Transactions & Detail
  const [reportFilter, setReportFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [adminSearchTrx, setAdminSearchTrx] = useState('');
  const [statusUpdateId, setStatusUpdateId] = useState<string | null>(null);
  const [selectedTrxDetail, setSelectedTrxDetail] = useState<any>(null);
  const invoiceRef = useRef<HTMLDivElement>(null); // Ref untuk download invoice

  // Staff: CRUD Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false); 
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  // Forms
  const [productForm, setProductForm] = useState({ name: '', price: '', category: 'Game', image_url: '', label: '', is_ready: true });
  const [paymentForm, setPaymentForm] = useState({ name: '', va_number: '', image_url: '' });
  const [contactForm, setContactForm] = useState({ platform_name: '', url: '', image_url: '' });

  // Store & Checkout State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'default' | 'price_low' | 'price_high' | 'name'>('default');
  const [selectedProduct, setSelectedProduct] = useState<any>(null); 
  const [checkoutStep, setCheckoutStep] = useState(1); 
  const [selectedPayment, setSelectedPayment] = useState<any>(null); 
  
  // Buyer Forms
  const [buyerForm, setBuyerForm] = useState({ name: '', email: '', device_model: '' });
  const [topUpForm, setTopUpForm] = useState({ userId: '', zoneId: '' });
  const [accNick, setAccNick] = useState('');
  const [isCheckingNick, setIsCheckingNick] = useState(false);

  // Voucher State
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{code: string, amount: number} | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);

  const [formErrors, setFormErrors] = useState({ name: '', email: '', device_model: '', game_id: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchProducts();
    fetchPaymentMethods();
    fetchContactMethods();
    const savedLogin = localStorage.getItem('isStaffLoggedIn');
    if (savedLogin === 'true') setIsStaffLoggedIn(true);
  }, []);

  useEffect(() => {
    if (isStaffLoggedIn) {
      fetchFilteredTransactions();
    }
  }, [reportFilter, isStaffLoggedIn]);

  // --- ACTIONS (FETCH) ---
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      if (!supabase) throw new Error("Supabase missing");
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      setProducts(data || []);
    } catch (error) { showToast("Gagal memuat data", "error"); } 
    finally { setIsLoading(false); }
  };

  const fetchPaymentMethods = async () => {
    const { data } = await supabase.from('payment_methods').select('*').eq('is_active', true);
    setPaymentMethods(data || []);
  };

  const fetchContactMethods = async () => {
    const { data } = await supabase.from('contact_methods').select('*').eq('is_active', true);
    setContactMethods(data || []);
  };

  const fetchFilteredTransactions = async () => {
    if (!supabase) return;
    try {
      const now = new Date();
      let startDate = null;
      if (reportFilter === 'today') startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      if (reportFilter === 'week') { const d = new Date(); d.setDate(d.getDate() - 7); startDate = d.toISOString(); }
      if (reportFilter === 'month') { const d = new Date(); d.setMonth(d.getMonth() - 1); startDate = d.toISOString(); }

      let query = supabase.from('transactions').select('*').order('created_at', { ascending: false });
      if (startDate) query = query.gte('created_at', startDate);
      const { data } = await query;
      setTransactions(data || []);
    } catch (err) { showToast("Gagal memuat laporan", "error"); }
  };

  // --- ACTIONS (VOUCHER & CHECK NICK) ---
  const handleApplyVoucher = async () => {
    if(!voucherCode) return showToast("Masukkan kode voucher", "error");
    setVoucherLoading(true);
    try {
        // Ganti dengan table 'vouchers' di supabase
        const { data, error } = await supabase.from('vouchers').select('*').eq('code', voucherCode).eq('is_active', true).single();
        if (error || !data) {
            showToast("Kode voucher tidak valid / habis", "error");
            setAppliedVoucher(null);
        } else {
            setAppliedVoucher({ code: data.code, amount: data.amount });
            showToast(`Voucher Applied! Hemat Rp ${data.amount.toLocaleString()}`, "success");
        }
    } catch(err) { showToast("Gagal cek voucher", "error"); }
    finally { setVoucherLoading(false); }
  };

  const checkGameNick = async () => {
    if(!topUpForm.userId) return showToast("Masukkan User ID", "error");
    setIsCheckingNick(true);
    setAccNick('');
    
    // --- SIMULASI API CHECK NAME ---
    // Di sini Anda bisa fetch ke API Provider (e.g., Digiflazz, Vola, Atlantic)
    // Karena ini environment statis, kita mock response sukses.
    setTimeout(() => {
        setAccNick('WuregPlayer_test'); // Mock Result
        setIsCheckingNick(false);
    }, 1500);
  };

  // --- ACTIONS (DOWNLOAD INVOICE) ---
  const downloadInvoice = async () => {
    if (!invoiceRef.current) return;
    try {
        const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true });
        const image = canvas.toDataURL("image/jpeg", 1.0);
        const link = document.createElement("a");
        link.href = image;
        link.download = `Invoice-${selectedTrxDetail?.id || 'TRX'}.jpg`;
        link.click();
        showToast("Invoice berhasil didownload", "success");
    } catch (err) {
        showToast("Gagal download invoice", "error");
        console.error(err);
    }
  };

  // --- ACTIONS (STAFF CRUD) ---
  const handleSaveProduct = async () => {
     if(!productForm.name || !productForm.price) return showToast("Wajib diisi", "error");
     const payload = { ...productForm, price: parseInt(productForm.price.toString()) };
     try {
        if (editingProduct) await supabase.from('products').update(payload).eq('id', editingProduct.id);
        else await supabase.from('products').insert([payload]);
        setIsProductModalOpen(false);
        fetchProducts();
        showToast("Sukses", "success");
     } catch (err) { showToast("Gagal", "error"); }
  };

  const handleDeleteProduct = async (id: string) => {
     if(!confirm("Hapus?")) return;
     await supabase.from('products').delete().eq('id', id);
     setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleSavePayment = async () => {
    if(!paymentForm.name) return showToast("Data kurang", "error");
    await supabase.from('payment_methods').insert([paymentForm]);
    setIsPaymentModalOpen(false);
    fetchPaymentMethods();
    showToast("Sukses", "success");
  };

  const handleDeletePayment = async (id: string) => {
    if(!confirm("Hapus?")) return;
    await supabase.from('payment_methods').delete().eq('id', id);
    setPaymentMethods(prev => prev.filter(p => p.id !== id));
  };

  const handleSaveContact = async () => {
    if(!contactForm.platform_name || !contactForm.url) return showToast("Data kurang", "error");
    await supabase.from('contact_methods').insert([contactForm]);
    setIsContactModalOpen(false);
    fetchContactMethods();
    showToast("Kontak Ditambah", "success");
  };

  const handleDeleteContact = async (id: string) => {
    if(!confirm("Hapus kontak ini?")) return;
    await supabase.from('contact_methods').delete().eq('id', id);
    setContactMethods(prev => prev.filter(c => c.id !== id));
  };

  const handleUpdateStatus = async (transactionId: string, currentStatus: string) => {
    let newStatus = currentStatus === 'Pending' ? 'Selesai' : currentStatus === 'Selesai' ? 'Gagal' : 'Pending';
    setStatusUpdateId(transactionId);
    try {
      await supabase.from('transactions').update({ status: newStatus }).eq('id', transactionId);
      setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, status: newStatus } : t));
      if(selectedTrxDetail && selectedTrxDetail.id === transactionId) setSelectedTrxDetail({...selectedTrxDetail, status: newStatus});
      showToast(`Status: ${newStatus}`, "success");
    } catch (err) { showToast("Gagal", "error"); } 
    finally { setStatusUpdateId(null); }
  };

  const handleDeleteTransaction = async (id: string) => {
    if(!confirm("Hapus permanen?")) return;
    try {
       await supabase.from('transactions').delete().eq('id', id);
       setTransactions(prev => prev.filter(t => t.id !== id));
       showToast("Dihapus", "success");
    } catch(err) { showToast("Gagal hapus", "error"); }
  };

  // --- ACTIONS (USER) ---
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStaffLoginLoading(true);
    try {
      const { data } = await supabase.from('admins').select('*').eq('pin', staffPinInput).single();
      if (data) {
        setIsStaffLoggedIn(true);
        localStorage.setItem('isStaffLoggedIn', 'true');
        showToast("Login Berhasil", "success");
        setStaffPinInput('');
      } else { showToast("PIN Salah!", "error"); }
    } catch (err) { showToast("Koneksi Error", "error"); }
    finally { setIsStaffLoginLoading(false); }
  };

  const handleLogout = () => {
    setIsStaffLoggedIn(false);
    localStorage.removeItem('isStaffLoggedIn');
    setActivePage('home');
  };

  // --- VALIDATION & CHECKOUT ---
  const handleNextStep = () => {
    let isValid = true;
    let errors = { name: '', email: '', device_model: '', game_id: '' };
    
    if (buyerForm.name.length < 3) { errors.name = 'Min 3 karakter'; isValid = false; }
    
    const phoneRegex = /^08[0-9]{8,13}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!phoneRegex.test(buyerForm.email) && !emailRegex.test(buyerForm.email)) {
       errors.email = 'Harus Email atau No. HP (08...)';
       isValid = false;
    }

    if (selectedProduct?.category === 'Akun' && !buyerForm.device_model) { 
       errors.device_model = 'Wajib diisi untuk Akun'; 
       isValid = false; 
    }

    // Validasi TopUp
    if (selectedProduct?.category === 'TopUp' && (!topUpForm.userId)) {
       errors.game_id = 'ID Wajib diisi';
       isValid = false;
    }
    // Jika TopUp, user harus cek nick dulu (Opsional tergantung kebijakan, tapi lebih aman dipaksa)
    if (selectedProduct?.category === 'TopUp' && !accNick && topUpForm.userId) {
       showToast("Silakan Cek ID terlebih dahulu!", "error");
       isValid = false;
    }

    setFormErrors(errors);
    
    if(isValid) {
        setCheckoutStep(2);
    } else {
        showToast("Data belum lengkap!", "error");
    }
  };

  const finalPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    let price = selectedProduct.price;
    if (appliedVoucher) price -= appliedVoucher.amount;
    return price < 0 ? 0 : price;
  }, [selectedProduct, appliedVoucher]);

  const handleCheckoutSubmit = async () => {
    if (!selectedPayment) return showToast("Pilih metode pembayaran!", "error");
    setIsSubmitting(true);
    
    const trxData = {
      buyer_name: buyerForm.name,
      buyer_email: buyerForm.email,
      product_name: selectedProduct.name,
      price: finalPrice, // Simpan harga setelah diskon
      payment_method: selectedPayment.name,
      status: 'Pending',
      device_model: selectedProduct.category === 'TopUp' ? `${topUpForm.userId} (${topUpForm.zoneId}) - ${accNick}` : (buyerForm.device_model || '-'),
    };
    try {
      const { data, error } = await supabase.from('transactions').insert([trxData]).select();
      if (error) throw error;
      const newTrxId = data?.[0]?.id || 'NEW';
      // Safe find for WhatsApp
      const waLink = contactMethods.find(c => (c.platform_name || '').toLowerCase().includes('whatsapp'))?.url || `https://wa.me/${ADMIN_PHONE_FALLBACK}`;
      
      let msgDetails = ``;
      if (selectedProduct.category === 'TopUp') {
          msgDetails = `🎮 ID: ${topUpForm.userId} (${topUpForm.zoneId})\n👤 Nick: ${accNick}\n`;
      } else if (selectedProduct.category === 'Akun') {
          msgDetails = `📱 Device: ${buyerForm.device_model}\n`;
      }

      let voucherMsg = appliedVoucher ? `\n🎟️ Voucher: ${appliedVoucher.code} (-Rp ${appliedVoucher.amount.toLocaleString()})` : '';

      const msg = `Halo Admin, Order Baru! 🚀\n📦 ${selectedProduct.name}\n💰 Rp ${finalPrice.toLocaleString()} ${voucherMsg}\n\n👤 ${buyerForm.name}\n📞 ${buyerForm.email}\n${msgDetails}💳 ${selectedPayment.name}\n🆔 ${newTrxId}`;
      window.open(`${waLink}?text=${encodeURIComponent(msg)}`, '_blank');
      showToast("Order Berhasil!", "success");
      setSelectedProduct(null);
      setCheckoutStep(1);
      setBuyerForm({ name: '', email: '', device_model: '' });
      setTopUpForm({ userId: '', zoneId: '' });
      setAccNick('');
      setAppliedVoucher(null);
      setVoucherCode('');
    } catch (err) { showToast("Gagal Order", "error"); } 
    finally { setIsSubmitting(false); }
  };

  // --- MEMOS & PAGINATION ---
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) && (selectedCategory === 'All' || p.category === selectedCategory));
    if (sortBy === 'price_low') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_high') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'name') result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return result;
  }, [products, searchQuery, selectedCategory, sortBy]);

  // Client-Side Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
        setCurrentPage(newPage);
        window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  }

  const filteredAdminTrx = useMemo(() => transactions.filter(t => 
    (t.buyer_name || "").toLowerCase().includes(adminSearchTrx.toLowerCase()) || 
    (t.product_name || "").toLowerCase().includes(adminSearchTrx.toLowerCase()) ||
    (t.id || "").toString().includes(adminSearchTrx)
  ), [transactions, adminSearchTrx]);

  const { totalRevenue, topProducts, paymentCount, lowStockCount } = useMemo(() => {
    const rev = transactions.reduce((acc, curr) => acc + (curr.price || 0), 0);
    const pCount = transactions.reduce((acc: any, curr) => { acc[curr.product_name] = (acc[curr.product_name] || 0) + 1; return acc; }, {});
    const top = Object.entries(pCount).sort((a:any, b:any) => b[1] - a[1]).slice(0, 3);
    const payCount = transactions.reduce((acc: any, curr) => { acc[curr.payment_method] = (acc[curr.payment_method] || 0) + 1; return acc; }, {});
    const lowStock = products.filter(p => !p.is_ready).length;
    return { totalRevenue: rev, topProducts: top, paymentCount: payCount, lowStockCount: lowStock };
  }, [transactions, products]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 font-sans relative overflow-hidden">
        {/* BG ANIMATION */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
           <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/30 rounded-full blur-[100px] animate-pulse mix-blend-multiply opacity-70"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/30 rounded-full blur-[100px] animate-pulse delay-700 mix-blend-multiply opacity-70"></div>
        </div>
        
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

        {/* NAVBAR */}
        <nav className="fixed top-5 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-50 bg-white/30 dark:bg-black/30 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg rounded-full">
          <div className="px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActivePage('home'); setIsContactOpen(false); }}>
              <img src="https://cdn.lynkid.my.id/profile/10-04-2025/1744247502273_9419383" alt="Logo" className="w-9 h-9 rounded-xl shadow-lg shadow-cyan-500/30"/>
              <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">WuregStore</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setActivePage('home')} className={`hidden md:block text-sm font-bold px-4 py-2 rounded-full transition-all ${activePage === 'home' ? 'bg-white/80 dark:bg-white/10 text-cyan-600' : 'text-slate-600 dark:text-slate-300'}`}>Store</button>
              <button onClick={() => setActivePage('staff')} className={`hidden md:block text-sm font-bold px-4 py-2 rounded-full transition-all ${activePage === 'staff' ? 'bg-white/80 dark:bg-white/10 text-cyan-600' : 'text-slate-600 dark:text-slate-300'}`}>Staff</button>
              <button onClick={() => setIsFaqOpen(true)} className="hidden md:flex items-center gap-2 text-slate-600 dark:text-slate-300 px-3 hover:text-cyan-500 transition-colors" title="Bantuan & FAQ"><HelpCircle size={20}/></button>
              <button onClick={() => setIsContactOpen(true)} className="hidden md:flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2 rounded-full text-sm font-bold"><Menu size={16}/> Contact</button>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2"><AlignJustify size={24}/></button>
            </div>
          </div>
          {isMobileMenuOpen && (
             <div className="md:hidden absolute top-20 left-0 w-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md rounded-3xl border border-white/20 p-2 flex flex-col gap-1 shadow-xl z-50">
                <button onClick={() => {setActivePage('home'); setIsMobileMenuOpen(false)}} className="p-3 font-bold text-left flex gap-3"><ShoppingCart size={20}/> Store</button>
                <button onClick={() => {setActivePage('staff'); setIsMobileMenuOpen(false)}} className="p-3 font-bold text-left flex gap-3"><ShieldCheck size={20}/> Staff</button>
                <button onClick={() => {setIsFaqOpen(true); setIsMobileMenuOpen(false)}} className="p-3 font-bold text-left flex gap-3"><HelpCircle size={20}/> FAQ</button>
                <button onClick={() => {setIsContactOpen(true); setIsMobileMenuOpen(false)}} className="p-3 font-bold text-left flex gap-3"><Mail size={20}/> Contact</button>
             </div>
          )}
        </nav>

        {/* MAIN CONTENT */}
        <main className="container mx-auto px-4 pt-36 pb-20 min-h-screen relative z-10">
          {activePage === 'home' ? (
             <div className="space-y-12 animate-fadeIn">
                {/* Promo Banner */}
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                   <div className="absolute top-0 right-0 opacity-20"><Tag size={120}/></div>
                   <div className="relative z-10"><h3 className="text-2xl font-black mb-1">FLASH SALE 🔥</h3><p className="font-medium text-yellow-100">Harga termurah & Produk terbaik!</p></div>
                </div>

                {/* Search */}
                <div className="text-center py-10">
                  <div className="max-w-lg mx-auto relative flex items-center bg-white/90 dark:bg-black/90 rounded-full p-1.5 shadow-2xl backdrop-blur-xl">
                      <div className="pl-4 text-slate-400"><Search size={22}/></div>
                      <input type="text" placeholder="Cari item..." className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 font-medium text-slate-800 dark:text-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
                  </div>
                </div>

                {/* Filter & Sort */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                   <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide w-full md:w-auto">
                     {['All', 'Game', 'TopUp', 'Akun', 'Software'].map(cat => (
                       <button key={cat} onClick={() => {setSelectedCategory(cat); setCurrentPage(1);}} className={`px-6 py-2 rounded-full text-sm font-bold border backdrop-blur-md ${selectedCategory === cat ? 'bg-slate-900 dark:bg-white text-white dark:text-black scale-105' : 'bg-white/50 dark:bg-zinc-900/50 text-slate-700 dark:text-slate-300'}`}>{cat}</button>
                     ))}
                   </div>
                   <div className="relative"><select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-white/50 dark:border-white/10 font-bold py-2 px-4 rounded-full focus:outline-none cursor-pointer"><option value="default">✨ Rekomendasi</option><option value="price_low">💰 Termurah</option><option value="price_high">💎 Termahal</option></select></div>
                </div>

                {/* Product Grid */}
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{[1,2,3,4,5,6,7,8].map(i=><div key={i} className="h-64 bg-slate-200 dark:bg-zinc-800 rounded-3xl animate-pulse"/>)}</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {paginatedProducts.map(product => (
                          <div key={product.id} onClick={() => product.is_ready ? (setSelectedProduct(product), setCheckoutStep(1)) : null} className={`group bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-3xl p-4 relative overflow-hidden transition-all duration-500 ${product.is_ready ? 'cursor-pointer hover:shadow-2xl hover:-translate-y-2' : 'opacity-60 grayscale cursor-not-allowed'}`}>
                              {product.label && <div className="absolute top-4 left-4 z-10 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-1 rounded-full uppercase shadow-md">{product.label}</div>}
                              <div className="aspect-[4/3] bg-slate-100 dark:bg-black/40 rounded-2xl mb-5 overflow-hidden relative shadow-inner">
                                {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover"/> : <div className="absolute inset-0 flex items-center justify-center font-black text-4xl opacity-20">{product.name.slice(0,2)}</div>}
                                {!product.is_ready && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-black text-xl rotate-12 border-2 border-white m-8 rounded-xl">HABIS</div>}
                              </div>
                              <h3 className="font-bold text-lg line-clamp-1">{product.name}</h3>
                              <div className="flex justify-between items-center mt-2"><p className="text-cyan-600 dark:text-cyan-400 font-black">Rp {product.price?.toLocaleString()}</p><div className={`p-2 rounded-full ${product.is_ready ? 'bg-slate-100 dark:bg-white/5' : 'bg-red-100 text-red-500'}`}><ShoppingCart size={18}/></div></div>
                              <div className={`mt-3 flex items-center gap-1 text-[10px] font-bold uppercase ${product.is_ready ? 'text-green-600' : 'text-red-600'}`}><div className={`w-2 h-2 rounded-full ${product.is_ready ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div> {product.is_ready ? 'Ready Stock' : 'Stok Kosong'}</div>
                          </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-12">
                            <button onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1} className="p-3 rounded-full bg-white dark:bg-zinc-800 disabled:opacity-50"><ChevronLeft/></button>
                            <span className="font-bold">Page {currentPage} of {totalPages}</span>
                            <button onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages} className="p-3 rounded-full bg-white dark:bg-zinc-800 disabled:opacity-50"><ChevronRight/></button>
                        </div>
                    )}
                  </>
                )}
             </div>
          ) : (
            // --- STAFF PAGE ---
            <div className="animate-fadeIn max-w-6xl mx-auto">
               {!isStaffLoggedIn ? (
                 <div className="max-w-md mx-auto bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/50 dark:border-white/10 shadow-2xl mt-20 text-center">
                    <ShieldCheck size={48} className="mx-auto mb-4 text-cyan-600"/>
                    <h2 className="text-3xl font-black mb-2 text-slate-900 dark:text-white">Staff Access</h2>
                    <form onSubmit={handleStaffLogin} className="space-y-6 mt-6">
                       <input type="password" value={staffPinInput} onChange={e=>setStaffPinInput(e.target.value)} className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 p-4 rounded-2xl text-center text-3xl tracking-[0.5em] font-bold outline-none focus:border-cyan-500" placeholder="••••"/>
                       <button disabled={isStaffLoginLoading} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold py-4 rounded-2xl hover:-translate-y-1 transition-all flex justify-center">{isStaffLoginLoading ? <Loader2 className="animate-spin"/> : 'LOGIN'}</button>
                    </form>
                 </div>
               ) : (
                 <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-4 rounded-[2rem] border border-white/50 dark:border-white/10 shadow-sm">
                       <div className="flex gap-2 p-1 bg-slate-100 dark:bg-black/40 rounded-full overflow-x-auto">
                          <button onClick={() => setActiveAdminTab('dashboard')} className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all ${activeAdminTab === 'dashboard' ? 'bg-white dark:bg-zinc-800 shadow text-cyan-600' : 'text-slate-500'}`}>Dashboard</button>
                          <button onClick={() => setActiveAdminTab('transactions')} className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all ${activeAdminTab === 'transactions' ? 'bg-white dark:bg-zinc-800 shadow text-cyan-600' : 'text-slate-500'}`}>Transaksi</button>
                          <button onClick={() => setActiveAdminTab('products')} className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all ${activeAdminTab === 'products' ? 'bg-white dark:bg-zinc-800 shadow text-cyan-600' : 'text-slate-500'}`}>Produk</button>
                          <button onClick={() => setActiveAdminTab('payments')} className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all ${activeAdminTab === 'payments' ? 'bg-white dark:bg-zinc-800 shadow text-cyan-600' : 'text-slate-500'}`}>Payments</button>
                          <button onClick={() => setActiveAdminTab('contacts')} className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all ${activeAdminTab === 'contacts' ? 'bg-white dark:bg-zinc-800 shadow text-cyan-600' : 'text-slate-500'}`}>Contacts</button>
                       </div>
                       <button onClick={handleLogout} className="px-4 py-2 bg-red-50 text-red-500 rounded-full font-bold text-sm hover:bg-red-100 flex items-center gap-2"><LogOut size={16}/> Logout</button>
                    </div>

                    {activeAdminTab === 'dashboard' && (
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slideIn">
                          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-6 rounded-3xl text-white shadow-lg"><h3 className="text-3xl font-black">Rp {totalRevenue.toLocaleString()}</h3><p className="opacity-80">Total Omzet</p></div>
                          <div className="bg-white/60 dark:bg-zinc-900/60 p-6 rounded-3xl border border-white/50 dark:border-white/10"><h3 className="text-3xl font-black">{transactions.length}</h3><p className="text-slate-500">Total Order</p></div>
                          <div className="bg-white/60 dark:bg-zinc-900/60 p-6 rounded-3xl border border-white/50 dark:border-white/10 flex justify-between items-center"><div><h3 className="text-3xl font-black text-red-500">{lowStockCount}</h3><p className="text-slate-500">Stok Habis</p></div><div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-2xl text-red-500"><AlertTriangle size={32}/></div></div>
                          
                          <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                             <div className="bg-white/80 dark:bg-zinc-900/80 p-6 rounded-[2rem] border border-white/50 dark:border-white/10">
                                <h4 className="font-bold mb-4 flex items-center gap-2"><Star size={20} className="text-yellow-500"/> Produk Terlaris</h4>
                                <div className="space-y-3">{topProducts.map(([name, count]: any, idx: number) => (<div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-white/5 rounded-xl"><div className="flex items-center gap-3"><div className="font-black text-slate-300">#{idx+1}</div><span className="font-bold">{name}</span></div><span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold">{count}x</span></div>))}</div>
                             </div>
                             <div className="bg-white/80 dark:bg-zinc-900/80 p-6 rounded-[2rem] border border-white/50 dark:border-white/10">
                                <h4 className="font-bold mb-4 flex items-center gap-2"><CreditCard size={20} className="text-blue-500"/> Metode Pembayaran</h4>
                                <div className="space-y-4">{Object.entries(paymentCount).map(([method, count]: any) => (<div key={method}><div className="flex justify-between text-xs font-bold mb-1"><span>{method}</span><span>{count}</span></div><div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-cyan-500 rounded-full" style={{width: `${(count / transactions.length) * 100}%`}}></div></div></div>))}</div>
                             </div>
                          </div>
                       </div>
                    )}

                    {activeAdminTab === 'transactions' && (
                      <div className="space-y-6 animate-slideIn">
                          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/50 dark:border-white/10 shadow-sm">
                             <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                                <div className="flex gap-2">{['today', 'week', 'all'].map(f => (<button key={f} onClick={() => setReportFilter(f as any)} className={`px-4 py-1.5 rounded-full text-xs font-bold border ${reportFilter === f ? 'bg-cyan-500 text-white border-transparent' : 'bg-transparent border-slate-300 dark:border-white/20'}`}>{f.toUpperCase()}</button>))}</div>
                                <input type="text" placeholder="Cari ID / Nama / Produk..." className="bg-slate-50 dark:bg-black/30 px-4 py-2 rounded-xl text-sm border-none focus:ring-2 ring-cyan-500/50" value={adminSearchTrx} onChange={(e) => setAdminSearchTrx(e.target.value)}/>
                             </div>
                             <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                   <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 dark:bg-white/5"><tr><th className="p-4 rounded-l-xl">ID</th><th className="p-4">Produk</th><th className="p-4">Kontak (HP/Email)</th><th className="p-4">Device/ID</th><th className="p-4">Status</th><th className="p-4 rounded-r-xl">Aksi</th></tr></thead>
                                   <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                      {filteredAdminTrx.map(t => (
                                         <tr key={t.id}>
                                            <td className="p-4"><span className="font-mono text-xs bg-slate-100 dark:bg-white/10 p-1 rounded">{t.id?.toString().slice(0,6) || '#'}</span></td>
                                            <td className="p-4"><div className="font-bold">{t.product_name}</div></td>
                                            <td className="p-4"><div className="font-bold text-xs">{t.buyer_name}</div><div className="text-xs opacity-60">{t.buyer_email}</div></td>
                                            <td className="p-4"><span className="text-xs font-mono">{t.device_model || '-'}</span></td>
                                            <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${t.status === 'Selesai' ? 'bg-green-100 text-green-600' : t.status === 'Gagal' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>{t.status}</span></td>
                                            <td className="p-4 flex gap-2"><button onClick={() => setSelectedTrxDetail(t)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Eye size={14}/></button></td>
                                         </tr>
                                      ))}
                                   </tbody>
                                </table>
                             </div>
                          </div>
                      </div>
                    )}

                    {activeAdminTab === 'products' && (
                      <div className="space-y-6 animate-slideIn">
                          <div className="flex justify-between items-center bg-white/60 dark:bg-zinc-900/60 p-6 rounded-3xl border border-white/50 dark:border-white/10">
                             <h3 className="text-2xl font-black">Produk</h3>
                             <button onClick={() => { setEditingProduct(null); setProductForm({ name: '', price: '', category: 'Game', image_url: '', label: '', is_ready: true }); setIsProductModalOpen(true); }} className="px-6 py-3 bg-cyan-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2"><Plus size={20}/> Tambah</button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             {products.map(p => (
                                <div key={p.id} className="bg-white/80 dark:bg-zinc-900/80 p-4 rounded-3xl border border-white/50 dark:border-white/10 flex gap-4 items-center relative overflow-hidden">
                                   {!p.is_ready && <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center font-bold text-red-600 rotate-12 border-2 border-red-500 m-6 rounded-xl">HABIS</div>}
                                   <div className="w-16 h-16 bg-slate-100 dark:bg-black/50 rounded-xl overflow-hidden flex-shrink-0">{p.image_url && <img src={p.image_url} className="w-full h-full object-cover"/>}</div>
                                   <div className="flex-1 min-w-0"><h4 className="font-bold truncate">{p.name}</h4><p className="text-cyan-600 font-bold text-sm">Rp {p.price?.toLocaleString()}</p></div>
                                   <div className="flex flex-col gap-2 z-20"><button onClick={() => { setEditingProduct(p); setProductForm(p); setIsProductModalOpen(true); }} className="p-2 bg-slate-100 dark:bg-white/10 rounded-lg hover:text-blue-500"><Edit3 size={16}/></button><button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-slate-100 dark:bg-white/10 rounded-lg hover:text-red-500"><Trash2 size={16}/></button></div>
                                </div>
                             ))}
                          </div>
                      </div>
                    )}

                    {activeAdminTab === 'payments' && (
                      <div className="space-y-6 animate-slideIn">
                          <div className="flex justify-between items-center bg-white/60 dark:bg-zinc-900/60 p-6 rounded-3xl border border-white/50 dark:border-white/10">
                             <h3 className="text-2xl font-black">Metode Pembayaran</h3>
                             <button onClick={() => { setPaymentForm({ name: '', va_number: '', image_url: '' }); setIsPaymentModalOpen(true); }} className="px-6 py-3 bg-cyan-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2"><Plus size={20}/> Tambah</button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {paymentMethods.map(pm => (
                                <div key={pm.id} className="bg-white/80 dark:bg-zinc-900/80 p-6 rounded-3xl border border-white/50 flex justify-between items-center">
                                   <div className="flex items-center gap-4"><div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border p-2 overflow-hidden">{pm.image_url ? <img src={pm.image_url} alt={pm.name} className="w-full h-full object-contain"/> : <Wallet size={20}/>}</div><div><h4 className="font-bold">{pm.name}</h4><p className="text-sm font-mono text-slate-500">{pm.va_number}</p></div></div>
                                   <button onClick={() => handleDeletePayment(pm.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                                </div>
                             ))}
                          </div>
                      </div>
                    )}

                    {activeAdminTab === 'contacts' && (
                      <div className="space-y-6 animate-slideIn">
                          <div className="flex justify-between items-center bg-white/60 dark:bg-zinc-900/60 p-6 rounded-3xl border border-white/50 dark:border-white/10">
                             <h3 className="text-2xl font-black">Kontak Admin</h3>
                             <button onClick={() => { setContactForm({ platform_name: '', url: '', image_url: '' }); setIsContactModalOpen(true); }} className="px-6 py-3 bg-cyan-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2"><Plus size={20}/> Tambah</button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {contactMethods.map(cm => (
                                <div key={cm.id} className="bg-white/80 dark:bg-zinc-900/80 p-6 rounded-3xl border border-white/50 flex justify-between items-center">
                                   <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border p-2 overflow-hidden">{cm.image_url ? <img src={cm.image_url} className="w-full h-full object-contain"/> : <Mail size={20}/>}</div>
                                      <div><h4 className="font-bold">{cm.platform_name}</h4><p className="text-xs text-slate-500 truncate max-w-[200px]">{cm.url}</p></div>
                                   </div>
                                   <button onClick={() => handleDeleteContact(cm.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                                </div>
                             ))}
                          </div>
                      </div>
                    )}
                 </div>
               )}
            </div>
          )}
        </main>

        {/* --- MODALS --- */}
        {isFaqOpen && (<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 animate-fadeIn" onClick={(e) => e.target === e.currentTarget && setIsFaqOpen(false)}><div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] max-w-md w-full relative"><button onClick={() => setIsFaqOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-zinc-800 rounded-full"><X size={20}/></button><h3 className="text-2xl font-black mb-6 flex items-center gap-2"><HelpCircle/> Bantuan & FAQ</h3><div className="space-y-4">{FAQ_DATA.map((faq, i) => (<div key={i} className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl"><h4 className="font-bold text-sm mb-1 text-cyan-600">{faq.q}</h4><p className="text-sm text-slate-500">{faq.a}</p></div>))}</div></div></div>)}

        {/* --- MODAL DETAIL TRANSAKSI & DOWNLOAD INVOICE --- */}
        {selectedTrxDetail && (
           <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={(e) => e.target === e.currentTarget && setSelectedTrxDetail(null)}>
              <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                 {/* Area yang akan di-screenshot oleh html2canvas */}
                 <div ref={invoiceRef} className="bg-white dark:bg-zinc-900 p-4">
                     <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
                     <div className="flex justify-between items-center mb-4 mt-2">
                        <h3 className="text-xl font-black">INVOICE</h3>
                        <span className="font-mono text-xs bg-slate-100 p-1 rounded">{selectedTrxDetail.id.slice(0,8)}</span>
                     </div>
                     <div className="space-y-4 bg-slate-50 dark:bg-black/20 p-4 rounded-2xl mb-6">
                        <div className="flex justify-between"><span className="text-sm text-slate-500">Tanggal</span><span className="font-bold text-sm">{new Date(selectedTrxDetail.created_at).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-slate-500">Pembeli</span><span className="font-bold text-sm">{selectedTrxDetail.buyer_name}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-slate-500">Device/ID</span><span className="font-bold text-sm">{selectedTrxDetail.device_model}</span></div>
                        <hr className="border-dashed border-slate-300 dark:border-white/10"/>
                        <div className="flex justify-between"><span className="text-sm text-slate-500">Produk</span><span className="font-bold text-sm">{selectedTrxDetail.product_name}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-slate-500">Total Bayar</span><span className="font-bold text-sm text-cyan-600">Rp {selectedTrxDetail.price?.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-slate-500">Status</span><span className={`font-bold text-sm uppercase ${selectedTrxDetail.status === 'Selesai' ? 'text-green-600' : 'text-yellow-600'}`}>{selectedTrxDetail.status}</span></div>
                     </div>
                     <div className="text-center text-xs text-slate-400">Terima kasih telah berbelanja di WuregStore</div>
                 </div>

                 {/* Tombol Aksi (Tidak ikut di-screenshot) */}
                 <div className="flex flex-col gap-2 mt-2">
                     <button onClick={downloadInvoice} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex justify-center items-center gap-2"><Download size={18}/> Download JPG</button>
                     <div className="flex gap-2">
                        <button onClick={() => handleUpdateStatus(selectedTrxDetail.id, selectedTrxDetail.status)} className={`flex-1 py-3 rounded-xl font-bold text-white transition-all ${selectedTrxDetail.status === 'Selesai' ? 'bg-green-600' : selectedTrxDetail.status === 'Gagal' ? 'bg-red-600' : 'bg-yellow-500'}`}>Ubah Status</button>
                        <button onClick={() => setSelectedTrxDetail(null)} className="px-4 py-3 bg-slate-100 dark:bg-white/10 rounded-xl font-bold">Tutup</button>
                     </div>
                 </div>
              </div>
           </div>
        )}

        {isProductModalOpen && (<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"><div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl p-6 shadow-2xl"><h3 className="text-xl font-black mb-4">{editingProduct ? 'Edit Produk' : 'Tambah Produk'}</h3><div className="space-y-4"><input type="text" placeholder="Nama Produk" className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})}/><input type="number" placeholder="Harga" className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})}/><div className="flex gap-2"><select className="flex-1 bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}><option value="Game">Game</option><option value="Akun">Akun</option><option value="TopUp">TopUp</option><option value="Software">Software</option></select><input type="text" placeholder="Label (Optional)" className="flex-1 bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={productForm.label} onChange={e => setProductForm({...productForm, label: e.target.value})}/></div><div className="flex items-center justify-between bg-slate-100 dark:bg-black/50 p-3 rounded-xl"><span className="font-bold text-sm">Status Stok: {productForm.is_ready ? 'Ready' : 'Habis'}</span><button onClick={()=>setProductForm({...productForm, is_ready: !productForm.is_ready})} className={`p-1 rounded-full w-12 flex transition-all ${productForm.is_ready ? 'bg-green-500 justify-end' : 'bg-red-500 justify-start'}`}><div className="w-5 h-5 bg-white rounded-full shadow-sm"></div></button></div><input type="text" placeholder="Image URL (Optional)" className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={productForm.image_url} onChange={e => setProductForm({...productForm, image_url: e.target.value})}/></div><div className="flex gap-3 mt-8"><button onClick={() => setIsProductModalOpen(false)} className="flex-1 py-3 font-bold bg-slate-100 dark:bg-zinc-800 rounded-xl">Batal</button><button onClick={handleSaveProduct} className="flex-1 py-3 font-bold text-white bg-cyan-600 rounded-xl">Simpan</button></div></div></div>)}

        {isPaymentModalOpen && (<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"><div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl p-6 shadow-2xl"><h3 className="text-xl font-black mb-4">Tambah Payment</h3><div className="space-y-4"><input type="text" placeholder="Nama Bank/E-Wallet" className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={paymentForm.name} onChange={e => setPaymentForm({...paymentForm, name: e.target.value})}/><input type="text" placeholder="No. Rekening / VA" className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={paymentForm.va_number} onChange={e => setPaymentForm({...paymentForm, va_number: e.target.value})}/><input type="text" placeholder="Logo Image URL" className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={paymentForm.image_url} onChange={e => setPaymentForm({...paymentForm, image_url: e.target.value})}/></div><div className="flex gap-3 mt-8"><button onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-3 font-bold bg-slate-100 dark:bg-zinc-800 rounded-xl">Batal</button><button onClick={handleSavePayment} className="flex-1 py-3 font-bold text-white bg-cyan-600 rounded-xl">Simpan</button></div></div></div>)}

        {isContactModalOpen && (<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"><div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl p-6 shadow-2xl"><h3 className="text-xl font-black mb-4">Tambah Kontak</h3><div className="space-y-4"><input type="text" placeholder="Nama Platform (WA, IG)" className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={contactForm.platform_name} onChange={e => setContactForm({...contactForm, platform_name: e.target.value})}/><input type="text" placeholder="URL Link (https://...)" className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={contactForm.url} onChange={e => setContactForm({...contactForm, url: e.target.value})}/><input type="text" placeholder="Icon URL (Optional)" className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={contactForm.image_url} onChange={e => setContactForm({...contactForm, image_url: e.target.value})}/></div><div className="flex gap-3 mt-8"><button onClick={() => setIsContactModalOpen(false)} className="flex-1 py-3 font-bold bg-slate-100 dark:bg-zinc-800 rounded-xl">Batal</button><button onClick={handleSaveContact} className="flex-1 py-3 font-bold text-white bg-cyan-600 rounded-xl">Simpan</button></div></div></div>)}

        {isContactOpen && (<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={(e) => e.target === e.currentTarget && setIsContactOpen(false)}><div className="bg-white p-6 rounded-3xl max-w-sm w-full"><h3 className="font-bold text-xl mb-4 text-center">Hubungi Admin</h3><div className="space-y-3">{contactMethods.map(c=><a key={c.id} href={c.url} target="_blank" className="flex items-center gap-3 p-4 bg-slate-100 rounded-xl font-bold transition hover:bg-slate-200">{c.image_url ? <img src={c.image_url} className="w-6 h-6"/> : <Mail size={20}/>} {c.platform_name}</a>)}</div></div></div>)}
        
        {/* --- MODAL CHECKOUT (UPDATED) --- */}
        {selectedProduct && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
               <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-md">
                  <div><h3 className="font-black text-xl">Checkout</h3><p className="text-sm text-slate-500">{checkoutStep === 1 ? 'Data Diri' : 'Pembayaran'}</p></div>
                  <button onClick={() => setSelectedProduct(null)} className="p-2 bg-slate-100 dark:bg-white/10 rounded-full"><X size={20}/></button>
               </div>
               <div className="p-8 overflow-y-auto custom-scrollbar">
                  <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl mb-6 border border-slate-100 dark:border-white/5">
                     <div className="h-12 w-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center text-cyan-600 font-black">{selectedProduct.name.slice(0,1)}</div>
                     <div><h4 className="font-bold">{selectedProduct.name}</h4><p className="text-sm text-slate-500">{selectedProduct.category} • Rp {selectedProduct.price.toLocaleString()}</p></div>
                  </div>
                  
                  {checkoutStep === 1 ? (
                    <div className="space-y-4 animate-slideIn">
                       <div><label className="text-xs font-bold text-slate-500 ml-1">NAMA LENGKAP</label><input className={`w-full bg-slate-100 dark:bg-black/50 p-4 rounded-xl font-bold mt-1 outline-none ${formErrors.name ? 'border-2 border-red-500' : ''}`} placeholder="Nama Anda" value={buyerForm.name} onChange={e=>setBuyerForm({...buyerForm, name: e.target.value})}/>{formErrors.name && <p className="text-red-500 text-xs mt-1 font-bold">{formErrors.name}</p>}</div>
                       <div><label className="text-xs font-bold text-slate-500 ml-1">NO. HP / EMAIL</label><input className={`w-full bg-slate-100 dark:bg-black/50 p-4 rounded-xl font-bold mt-1 outline-none ${formErrors.email ? 'border-2 border-red-500' : ''}`} placeholder="08... atau email@..." value={buyerForm.email} onChange={e=>setBuyerForm({...buyerForm, email: e.target.value})}/>{formErrors.email && <p className="text-red-500 text-xs mt-1 font-bold">{formErrors.email}</p>}</div>
                       
                       {/* LOGIC FIELD BERDASARKAN KATEGORI */}
                       {selectedProduct.category === 'Akun' && (<div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-500/30"><label className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1"><Smartphone size={12}/> DEVICE MODEL (WAJIB)</label><input className="w-full bg-white dark:bg-black/50 p-3 rounded-lg font-bold mt-2 outline-none" placeholder="Contoh: Android, iPhone 11" value={buyerForm.device_model} onChange={e=>setBuyerForm({...buyerForm, device_model: e.target.value})}/>{formErrors.device_model && <p className="text-red-500 text-xs mt-1 font-bold">{formErrors.device_model}</p>}</div>)}

                       {selectedProduct.category === 'TopUp' && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-500/30">
                              <label className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1"><Gamepad2 size={12}/> MASUKKAN ID GAME</label>
                              <div className="flex gap-2 mt-2">
                                  <input className="flex-[2] bg-white dark:bg-black/50 p-3 rounded-lg font-bold outline-none" placeholder="User ID" value={topUpForm.userId} onChange={e=>setTopUpForm({...topUpForm, userId: e.target.value})}/>
                                  <input className="flex-1 bg-white dark:bg-black/50 p-3 rounded-lg font-bold outline-none" placeholder="Zone ID" value={topUpForm.zoneId} onChange={e=>setTopUpForm({...topUpForm, zoneId: e.target.value})}/>
                              </div>
                              <button onClick={checkGameNick} disabled={isCheckingNick || !topUpForm.userId} className="mt-3 w-full bg-purple-600 text-white py-2 rounded-lg font-bold text-xs hover:bg-purple-700 disabled:opacity-50">{isCheckingNick ? <Loader2 className="animate-spin mx-auto" size={16}/> : 'CEK ID'}</button>
                              {accNick && <div className="mt-2 text-center font-black text-green-600 bg-green-100 py-1 rounded">Nick: {accNick}</div>}
                              {formErrors.game_id && <p className="text-red-500 text-xs mt-1 font-bold">{formErrors.game_id}</p>}
                          </div>
                       )}

                       <button onClick={handleNextStep} className="w-full bg-slate-900 dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl mt-4 flex justify-center items-center gap-2">Lanjut Pembayaran <ChevronRight size={18}/></button>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-slideIn">
                       {/* VOUCHER FIELD */}
                       <div className="flex gap-2 mb-4">
                           <div className="relative flex-1">
                               <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                               <input className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-black/50 rounded-xl font-bold text-sm uppercase outline-none border border-slate-200" placeholder="KODE VOUCHER" value={voucherCode} onChange={e=>setVoucherCode(e.target.value)}/>
                           </div>
                           <button onClick={handleApplyVoucher} disabled={voucherLoading} className="px-4 bg-slate-900 text-white rounded-xl font-bold text-xs">{voucherLoading ? '...' : 'APPLY'}</button>
                       </div>
                       
                       <p className="text-xs font-bold text-slate-500 ml-1">PILIH METODE</p>
                       <div className="space-y-3">
                          {paymentMethods.length === 0 ? <p className="text-center text-sm text-slate-400 py-4">Belum ada metode pembayaran.</p> : paymentMethods.map(m => (
                             <div key={m.id} onClick={() => setSelectedPayment(m)} className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedPayment?.id === m.id ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 ring-1 ring-cyan-500' : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                                <div className="flex justify-between items-center">
                                   <div className="flex items-center gap-3">
                                      {m.image_url ? <img src={m.image_url} alt={m.name} className="w-8 h-8 object-contain rounded-full bg-white p-1"/> : <span className="font-bold">{m.name}</span>}
                                      <span className="font-bold">{m.name}</span>
                                   </div>
                                   {selectedPayment?.id === m.id && <CheckCircle className="text-cyan-500" size={20}/>}
                                </div>
                                {selectedPayment?.id === m.id && (<div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 flex justify-between items-center"><code className="font-mono font-bold">{m.va_number}</code><button onClick={(e)=>{e.stopPropagation(); navigator.clipboard.writeText(m.va_number); showToast("Disalin!", "success")}} className="p-1.5 bg-cyan-100 text-cyan-700 rounded-lg"><Copy size={14}/></button></div>)}
                             </div>
                          ))}
                       </div>

                       {/* TOTAL PRICE SUMMARY */}
                       <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-xl space-y-2">
                           <div className="flex justify-between text-sm"><span>Harga Awal</span><span>Rp {selectedProduct.price.toLocaleString()}</span></div>
                           {appliedVoucher && <div className="flex justify-between text-sm text-green-500"><span>Diskon ({appliedVoucher.code})</span><span>- Rp {appliedVoucher.amount.toLocaleString()}</span></div>}
                           <div className="flex justify-between font-black text-lg pt-2 border-t border-slate-200"><span>Total Bayar</span><span>Rp {finalPrice.toLocaleString()}</span></div>
                       </div>

                       <div className="flex gap-3 mt-6"><button onClick={() => setCheckoutStep(1)} className="flex-1 py-4 bg-slate-100 dark:bg-zinc-800 rounded-xl font-bold">Kembali</button><button disabled={!selectedPayment || isSubmitting} onClick={handleCheckoutSubmit} className="flex-[2] py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold disabled:opacity-50">Konfirmasi Order</button></div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
          .animate-fadeIn { animation: fadeIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
          .animate-slideIn { animation: slideIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
        `}} />
    </div>
  );
}
