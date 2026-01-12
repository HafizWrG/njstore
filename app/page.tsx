'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Menu, X, Search, ShoppingCart, LogOut, 
  Smartphone, Monitor, Gamepad, CreditCard, CheckCircle, 
  ChevronRight, ShieldCheck, Zap,
  Loader2, AlertCircle,
  Calendar, TrendingUp, Download,
  RefreshCw, ExternalLink, Mail, Star, Copy, AlignJustify,
  ArrowUpDown, Plus, Trash2, Edit3, Tag, HelpCircle, Eye, Wallet, AlertTriangle
} from 'lucide-react';
import html2canvas from 'html2canvas';

// --- 1. SETUP ENV & SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

const createSupabaseClient = (baseUrl: string, key: string) => {
  if (!baseUrl || !key) return null;
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
  return {
    from: (table: string) => {
      const url = new URL(`${baseUrl}/rest/v1/${table}`);
      let method = 'GET'; let body: any = null; let isSingle = false;
      const builder = {
        select: (columns = '*') => { url.searchParams.set('select', columns); return builder; },
        order: (column: string, { ascending = true } = {}) => { url.searchParams.set('order', `${column}.${ascending ? 'asc' : 'desc'}`); return builder; },
        eq: (column: string, value: any) => { url.searchParams.set(column, `eq.${value}`); return builder; },
        gte: (column: string, value: any) => { url.searchParams.set(column, `gte.${value}`); return builder; },
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
const ADMIN_PHONE = "6281528483575"; 

// --- FAQ & SOCIALS ---
const SOCIALS = [
  { name: 'WhatsApp', url: `https://wa.me/${ADMIN_PHONE}`, color: 'from-green-400 to-green-600', icon: <Smartphone size={20}/> },
  { name: 'Instagram', url: 'https://www.instagram.com/hfz.wrg/', color: 'from-pink-500 via-red-500 to-yellow-500', icon: <Monitor size={20}/> },
  { name: 'YouTube', url: 'https://www.youtube.com/@HAFIZWRG', color: 'from-red-500 to-red-700', icon: <Monitor size={20}/> }
];

const FAQ_DATA = [
  { q: "Bagaimana cara order?", a: "Pilih produk -> Isi Data -> Pilih Pembayaran -> Konfirmasi -> Kirim ke WA Admin." },
  { q: "Cara pakai voucher?", a: "Masukkan kode voucher di halaman checkout bagian Data Diri, lalu klik 'Cek'." },
  { q: "Apakah proses instan?", a: "Ya, proses 1-10 menit setelah admin menerima bukti transfer." }
];

// --- TOAST ---
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

  // Data
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [contactMethods, setContactMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Staff
  const [isStaffLoggedIn, setIsStaffLoggedIn] = useState(false);
  const [staffPinInput, setStaffPinInput] = useState('');
  const [isStaffLoginLoading, setIsStaffLoginLoading] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'transactions' | 'products' | 'payments' | 'contacts'>('dashboard');
  
  // Staff Filtering
  const [reportFilter, setReportFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [adminSearchTrx, setAdminSearchTrx] = useState('');
  const [adminSearchProduct, setAdminSearchProduct] = useState(''); // New: Separate search for admin products
  const [statusUpdateId, setStatusUpdateId] = useState<string | null>(null);
  const [selectedTrxDetail, setSelectedTrxDetail] = useState<any>(null);

  // Staff CRUD Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false); 
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  // Forms
  const [productForm, setProductForm] = useState({ name: '', price: '', category: 'Game', image_url: '', label: '', is_ready: true });
  const [paymentForm, setPaymentForm] = useState({ name: '', va_number: '', image_url: '' });
  const [contactForm, setContactForm] = useState({ platform_name: '', url: '', image_url: '' });

  // Store & Checkout State
  const [searchQuery, setSearchQuery] = useState(''); // FIXED: Defined here
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'default' | 'price_low' | 'price_high' | 'name'>('default');
  const [selectedProduct, setSelectedProduct] = useState<any>(null); 
  const [checkoutStep, setCheckoutStep] = useState(1); 
  const [selectedPayment, setSelectedPayment] = useState<any>(null); 
  const [buyerForm, setBuyerForm] = useState({ name: '', email: '', device_model: '', game_id: '', zone_id: '' });
  const [reviewForm, setReviewForm] = useState({ name: '', comment: '', rating: 5 });
  const [formErrors, setFormErrors] = useState<any>({});
  
  // Voucher & Game Check
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [isCheckingGame, setIsCheckingGame] = useState(false);

  // Invoice
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [lastTrxId, setLastTrxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchProducts();
    fetchTestimonials();
    fetchPaymentMethods();
    fetchContactMethods();
    if (localStorage.getItem('isStaffLoggedIn') === 'true') setIsStaffLoggedIn(true);
  }, []);

  useEffect(() => {
    if (isStaffLoggedIn) fetchFilteredTransactions();
  }, [reportFilter, isStaffLoggedIn]);

  // --- ACTIONS ---
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      setProducts(data || []);
    } catch (e) { showToast("Gagal memuat produk", "error"); } 
    finally { setIsLoading(false); }
  };

  const fetchTestimonials = async () => {
    const { data } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false }).limit(10);
    setTestimonials(data || []);
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

  // --- STAFF ACTIONS ---
  const handleSaveProduct = async () => {
     if(!productForm.name || !productForm.price) return showToast("Wajib diisi", "error");
     const payload = { ...productForm, price: parseInt(productForm.price.toString()) };
     try {
        if (editingProduct) await supabase.from('products').update(payload).eq('id', editingProduct.id);
        else await supabase.from('products').insert([payload]);
        setIsProductModalOpen(false); fetchProducts(); showToast("Sukses", "success");
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
    setIsPaymentModalOpen(false); fetchPaymentMethods(); showToast("Sukses", "success");
  };

  const handleDeletePayment = async (id: string) => {
    if(!confirm("Hapus?")) return;
    await supabase.from('payment_methods').delete().eq('id', id);
    setPaymentMethods(prev => prev.filter(p => p.id !== id));
  };

  const handleSaveContact = async () => {
    if(!contactForm.platform_name || !contactForm.url) return showToast("Data kurang", "error");
    await supabase.from('contact_methods').insert([contactForm]);
    setIsContactModalOpen(false); fetchContactMethods(); showToast("Sukses", "success");
  };

  const handleDeleteContact = async (id: string) => {
    if(!confirm("Hapus?")) return;
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

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStaffLoginLoading(true);
    try {
      const { data } = await supabase.from('admins').select('*').eq('pin', staffPinInput).single();
      if (data) {
        setIsStaffLoggedIn(true); localStorage.setItem('isStaffLoggedIn', 'true');
        showToast("Login Berhasil", "success"); setStaffPinInput('');
      } else { showToast("PIN Salah!", "error"); }
    } catch (err) { showToast("Koneksi Error", "error"); }
    finally { setIsStaffLoginLoading(false); }
  };

  const handleLogout = () => { setIsStaffLoggedIn(false); localStorage.removeItem('isStaffLoggedIn'); setActivePage('home'); };

  // --- CHECKOUT LOGIC ---
  const checkGameNickname = () => {
    if(!buyerForm.game_id || !buyerForm.zone_id) return showToast("Isi User ID & Zone ID", "error");
    setIsCheckingGame(true);
    setTimeout(() => {
       const mock = ["ProPlayer", "SkyWalker", "IndoGamer", "WinnerChicken"];
       setNickname(mock[Math.floor(Math.random()*mock.length)]);
       setIsCheckingGame(false);
       showToast("Nickname ditemukan!", "success");
    }, 1500);
  };

  const checkVoucher = async () => {
    if(!voucherCode) return;
    try {
      const { data } = await supabase.from('vouchers').select('*').eq('code', voucherCode).eq('is_active', true).single();
      if(data) { setAppliedVoucher(data); showToast("Voucher dipakai!", "success"); }
      else { showToast("Voucher tidak valid", "error"); setAppliedVoucher(null); }
    } catch(e) { showToast("Error cek voucher", "error"); }
  };

  const downloadInvoice = async () => {
    if (invoiceRef.current) {
      const canvas = await html2canvas(invoiceRef.current);
      const link = document.createElement('a');
      link.download = `Invoice-${lastTrxId}.jpg`;
      link.href = canvas.toDataURL('image/jpeg');
      link.click();
      showToast("Struk didownload", "success");
    }
  };

  const handleNextStep = () => {
    let isValid = true;
    let errors:any = {};
    if (buyerForm.name.length < 3) { errors.name = 'Min 3 karakter'; isValid = false; }
    if (!buyerForm.email.includes('@') && buyerForm.email.length < 10) { errors.email = 'Kontak tidak valid'; isValid = false; }
    if (selectedProduct?.category === 'Game') {
       if(!buyerForm.game_id) { errors.game_id = 'User ID wajib'; isValid = false; }
       if(!buyerForm.zone_id) { errors.zone_id = 'Zone ID wajib'; isValid = false; }
    }
    setFormErrors(errors);
    if(isValid) setCheckoutStep(2); else showToast("Lengkapi data!", "error");
  };

  const handleCheckoutSubmit = async () => {
    if (!selectedPayment) return showToast("Pilih metode pembayaran!", "error");
    setIsSubmitting(true);
    const finalPrice = selectedProduct.price - (appliedVoucher?.discount_amount || 0);
    const trxData = {
      buyer_name: buyerForm.name,
      buyer_email: buyerForm.email,
      product_name: selectedProduct.name,
      price: finalPrice,
      payment_method: selectedPayment.name,
      status: 'Pending',
      device_model: selectedProduct.category === 'Game' ? `ID: ${buyerForm.game_id} (${buyerForm.zone_id})` : buyerForm.device_model || '-',
    };

    try {
      const { data, error } = await supabase.from('transactions').insert([trxData]).select();
      if (error) throw error;
      const newTrxId = data?.[0]?.id || 'NEW';
      setLastTrxId(newTrxId);
      
      const waLink = contactMethods.find(c => c.platform_name.toLowerCase().includes('whatsapp'))?.url || `https://wa.me/${ADMIN_PHONE}`;
      const msg = `Halo Admin, Order Baru!\n📦 ${selectedProduct.name}\n💰 Rp ${finalPrice.toLocaleString()}\n👤 ${buyerForm.name}\n🆔 ${newTrxId}`;
      window.open(`${waLink}?text=${encodeURIComponent(msg)}`, '_blank');
      
      setCheckoutStep(3); 
      showToast("Order Dibuat!", "success");
    } catch (err) { showToast("Gagal Order", "error"); }
    finally { setIsSubmitting(false); }
  };

  // --- MEMOS ---
  // 1. Filter Products for STORE (Uses searchQuery)
  const filteredProducts = useMemo(() => {
    let result = (products || []).filter(p => (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) && (selectedCategory === 'All' || p.category === selectedCategory));
    if (sortBy === 'price_low') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_high') result.sort((a, b) => b.price - a.price);
    return result;
  }, [products, searchQuery, selectedCategory, sortBy]);

  // 2. Filter Products for ADMIN (Uses adminSearchProduct) - NEW
  const filteredAdminProducts = useMemo(() => {
    return (products || []).filter(p => (p.name || '').toLowerCase().includes(adminSearchProduct.toLowerCase()));
  }, [products, adminSearchProduct]);

  // 3. Filter Transactions for ADMIN (Uses adminSearchTrx)
  const filteredAdminTrx = useMemo(() => (transactions || []).filter(t => 
    (t.buyer_name || "").toLowerCase().includes(adminSearchTrx.toLowerCase()) || 
    (t.id || "").toString().includes(adminSearchTrx)
  ), [transactions, adminSearchTrx]);

  const { totalRevenue, successCount, topProducts, paymentCount, lowStockCount } = useMemo(() => {
    const rev = transactions.reduce((acc, curr) => acc + (curr.price || 0), 0);
    const success = transactions.filter(t => t.status === 'Selesai').length;
    const pCount = transactions.reduce((acc: any, curr) => { acc[curr.product_name] = (acc[curr.product_name] || 0) + 1; return acc; }, {});
    const top = Object.entries(pCount).sort((a:any, b:any) => b[1] - a[1]).slice(0, 3);
    const payCount = transactions.reduce((acc: any, curr) => { acc[curr.payment_method] = (acc[curr.payment_method] || 0) + 1; return acc; }, {});
    const lowStock = products.filter(p => !p.is_ready).length;
    return { totalRevenue: rev, successCount: success, topProducts: top, paymentCount: payCount, lowStockCount: lowStock };
  }, [transactions, products]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 font-sans relative overflow-hidden">
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
              <button onClick={() => setIsFaqOpen(true)} className="hidden md:flex items-center gap-2 text-slate-600 dark:text-slate-300 px-3 hover:text-cyan-500 transition-colors" title="Bantuan"><HelpCircle size={20}/></button>
              <button onClick={() => setIsContactOpen(true)} className="hidden md:flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2 rounded-full text-sm font-bold"><Menu size={16}/> Contact</button>
            </div>
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <main className="container mx-auto px-4 pt-36 pb-20 min-h-screen relative z-10">
          {activePage === 'home' ? (
             <div className="space-y-12 animate-fadeIn">
                {/* Promo Banner */}
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                   <div className="absolute top-0 right-0 opacity-20"><Tag size={120}/></div>
                   <div className="relative z-10"><h3 className="text-2xl font-black mb-1">FLASH SALE 🔥</h3><p className="font-medium text-yellow-100">Gunakan kode <b>WUREGNEW</b> untuk diskon spesial!</p></div>
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
                     {['All', 'Game', 'Akun', 'Software'].map(cat => (
                       <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-6 py-2 rounded-full text-sm font-bold border backdrop-blur-md ${selectedCategory === cat ? 'bg-slate-900 dark:bg-white text-white dark:text-black scale-105' : 'bg-white/50 dark:bg-zinc-900/50 text-slate-700 dark:text-slate-300'}`}>{cat}</button>
                     ))}
                   </div>
                   <div className="relative"><select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-white/50 dark:border-white/10 font-bold py-2 px-4 rounded-full focus:outline-none cursor-pointer"><option value="default">✨ Rekomendasi</option><option value="price_low">💰 Termurah</option><option value="price_high">💎 Termahal</option></select></div>
                </div>

                {/* Product Grid */}
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{[1,2,3,4].map(i=><div key={i} className="h-64 bg-slate-200 dark:bg-zinc-800 rounded-3xl animate-pulse"/>)}</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                     {filteredProducts.map(product => (
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
                )}

                {/* Testimonials */}
                <div className="pt-10 border-t border-slate-200 dark:border-white/10">
                   <h3 className="text-2xl font-black mb-6 text-center">Apa Kata Mereka? 💬</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                      {testimonials.map((t, i) => (
                         <div key={i} className="bg-white/50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-white/20">
                            <div className="flex gap-1 text-yellow-400 mb-2">{[...Array(t.rating)].map((_,k)=><Star key={k} size={14} fill="currentColor"/>)}</div>
                            <p className="text-sm italic mb-2">"{t.comment}"</p>
                            <p className="text-xs font-bold text-slate-500">- {t.name}</p>
                         </div>
                      ))}
                   </div>
                </div>
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
                          {['dashboard', 'transactions', 'products', 'payments', 'contacts'].map(tab => (
                             <button key={tab} onClick={() => setActiveAdminTab(tab as any)} className={`px-5 py-2.5 rounded-full font-bold text-xs capitalize transition-all ${activeAdminTab === tab ? 'bg-white dark:bg-zinc-800 shadow text-cyan-600' : 'text-slate-500'}`}>{tab}</button>
                          ))}
                       </div>
                       <button onClick={handleLogout} className="px-4 py-2 bg-red-50 text-red-500 rounded-full font-bold text-sm hover:bg-red-100 flex items-center gap-2"><LogOut size={16}/> Logout</button>
                    </div>

                    {activeAdminTab === 'dashboard' && (
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slideIn">
                          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-6 rounded-3xl text-white shadow-lg"><h3 className="text-3xl font-black">Rp {totalRevenue.toLocaleString()}</h3><p className="opacity-80">Total Omzet</p></div>
                          <div className="bg-white/60 dark:bg-zinc-900/60 p-6 rounded-3xl border border-white/50 dark:border-white/10"><h3 className="text-3xl font-black">{transactions.length}</h3><p className="text-slate-500">Total Order</p></div>
                          <div className="bg-white/60 dark:bg-zinc-900/60 p-6 rounded-3xl border border-white/50 dark:border-white/10 flex justify-between items-center"><div><h3 className="text-3xl font-black text-red-500">{lowStockCount}</h3><p className="text-slate-500">Stok Habis</p></div><div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-2xl text-red-500"><AlertTriangle size={32}/></div></div>
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
                                   <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 dark:bg-white/5"><tr><th className="p-4 rounded-l-xl">ID</th><th className="p-4">Produk</th><th className="p-4">Kontak</th><th className="p-4">Status</th><th className="p-4 rounded-r-xl">Aksi</th></tr></thead>
                                   <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                      {filteredAdminTrx.map(t => (
                                         <tr key={t.id}>
                                            <td className="p-4"><span className="font-mono text-xs bg-slate-100 dark:bg-white/10 p-1 rounded">{t.id?.slice(0,6) || '#'}</span></td>
                                            <td className="p-4"><div className="font-bold">{t.product_name}</div></td>
                                            <td className="p-4"><div className="font-bold text-xs">{t.buyer_name}</div><div className="text-xs opacity-60">{t.buyer_email}</div></td>
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
                              <div className="flex gap-2">
                                <input type="text" placeholder="Cari..." className="bg-white dark:bg-black/30 px-3 rounded-lg text-sm outline-none" value={adminSearchProduct} onChange={(e) => setAdminSearchProduct(e.target.value)}/>
                                <button onClick={() => { setEditingProduct(null); setProductForm({ name: '', price: '', category: 'Game', image_url: '', label: '', is_ready: true }); setIsProductModalOpen(true); }} className="px-6 py-3 bg-cyan-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2"><Plus size={20}/> Tambah</button>
                              </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             {/* Uses filteredAdminProducts for search */}
                             {(products || []).filter(p => (p.name || '').toLowerCase().includes(adminSearchProduct.toLowerCase())).map(p => (
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

        {/* Detail Modal */}
        {selectedTrxDetail && (
           <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={(e) => e.target === e.currentTarget && setSelectedTrxDetail(null)}>
              <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
                 <h3 className="text-xl font-black mb-1">Detail Transaksi</h3>
                 <p className="text-sm text-slate-500 mb-6">ID: {selectedTrxDetail.id}</p>
                 <div className="space-y-4 bg-slate-50 dark:bg-black/20 p-4 rounded-2xl mb-6">
                    <div className="flex justify-between"><span className="text-sm text-slate-500">Tanggal</span><span className="font-bold text-sm">{new Date(selectedTrxDetail.created_at).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-500">Pembeli</span><span className="font-bold text-sm">{selectedTrxDetail.buyer_name}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-500">Kontak</span><span className="font-bold text-sm">{selectedTrxDetail.buyer_email}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-500">Device</span><span className="font-bold text-sm">{selectedTrxDetail.device_model}</span></div>
                    <hr className="border-dashed border-slate-300 dark:border-white/10"/>
                    <div className="flex justify-between"><span className="text-sm text-slate-500">Produk</span><span className="font-bold text-sm">{selectedTrxDetail.product_name}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-500">Harga</span><span className="font-bold text-sm text-cyan-600">Rp {selectedTrxDetail.price?.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-500">Payment</span><span className="font-bold text-sm uppercase">{selectedTrxDetail.payment_method}</span></div>
                 </div>
                 <div className="flex gap-2"><button onClick={() => handleUpdateStatus(selectedTrxDetail.id, selectedTrxDetail.status)} className={`flex-1 py-3 rounded-xl font-bold text-white transition-all ${selectedTrxDetail.status === 'Selesai' ? 'bg-green-600' : selectedTrxDetail.status === 'Gagal' ? 'bg-red-600' : 'bg-yellow-500'}`}>Ubah Status ({selectedTrxDetail.status})</button><button onClick={() => setSelectedTrxDetail(null)} className="px-4 py-3 bg-slate-100 dark:bg-white/10 rounded-xl font-bold">Tutup</button></div>
              </div>
           </div>
        )}

        {isProductModalOpen && (<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"><div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl p-6 shadow-2xl"><h3 className="text-xl font-black mb-4">{editingProduct ? 'Edit Produk' : 'Tambah Produk'}</h3><div className="space-y-4"><input type="text" placeholder="Nama Produk" className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})}/><input type="number" placeholder="Harga" className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})}/><div className="flex gap-2"><select className="flex-1 bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}><option value="Game">Game</option><option value="Akun">Akun</option><option value="TopUp">TopUp</option><option value="Software">Software</option></select><input type="text" placeholder="Label (Optional)" className="flex-1 bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={productForm.label} onChange={e => setProductForm({...productForm, label: e.target.value})}/></div><div className="flex items-center justify-between bg-slate-100 dark:bg-black/50 p-3 rounded-xl"><span className="font-bold text-sm">Status Stok: {productForm.is_ready ? 'Ready' : 'Habis'}</span><button onClick={()=>setProductForm({...productForm, is_ready: !productForm.is_ready})} className={`p-1 rounded-full w-12 flex transition-all ${productForm.is_ready ? 'bg-green-500 justify-end' : 'bg-red-500 justify-start'}`}><div className="w-5 h-5 bg-white rounded-full shadow-sm"></div></button></div><input type="text" placeholder="Image URL (Optional)" className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={productForm.image_url} onChange={e => setProductForm({...productForm, image_url: e.target.value})}/></div><div className="flex gap-3 mt-8"><button onClick={() => setIsProductModalOpen(false)} className="flex-1 py-3 font-bold bg-slate-100 dark:bg-zinc-800 rounded-xl">Batal</button><button onClick={handleSaveProduct} className="flex-1 py-3 font-bold text-white bg-cyan-600 rounded-xl">Simpan</button></div></div></div>)}

        {isPaymentModalOpen && (<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"><div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl p-6 shadow-2xl"><h3 className="text-xl font-black mb-4">Tambah Payment</h3><div className="space-y-4"><input type="text" placeholder="Nama Bank/E-Wallet" className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={paymentForm.name} onChange={e => setPaymentForm({...paymentForm, name: e.target.value})}/><input type="text" placeholder="No. Rekening / VA" className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={paymentForm.va_number} onChange={e => setPaymentForm({...paymentForm, va_number: e.target.value})}/><input type="text" placeholder="Logo Image URL" className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={paymentForm.image_url} onChange={e => setPaymentForm({...paymentForm, image_url: e.target.value})}/></div><div className="flex gap-3 mt-8"><button onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-3 font-bold bg-slate-100 dark:bg-zinc-800 rounded-xl">Batal</button><button onClick={handleSavePayment} className="flex-1 py-3 font-bold text-white bg-cyan-600 rounded-xl">Simpan</button></div></div></div>)}

        {isContactModalOpen && (<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"><div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl p-6 shadow-2xl"><h3 className="text-xl font-black mb-4">Tambah Kontak</h3><div className="space-y-4"><input type="text" placeholder="Nama Platform (WA, IG)" className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={contactForm.platform_name} onChange={e => setContactForm({...contactForm, platform_name: e.target.value})}/><input type="text" placeholder="URL Link (https://...)" className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={contactForm.url} onChange={e => setContactForm({...contactForm, url: e.target.value})}/><input type="text" placeholder="Icon URL (Optional)" className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={contactForm.image_url} onChange={e => setContactForm({...contactForm, image_url: e.target.value})}/></div><div className="flex gap-3 mt-8"><button onClick={() => setIsContactModalOpen(false)} className="flex-1 py-3 font-bold bg-slate-100 dark:bg-zinc-800 rounded-xl">Batal</button><button onClick={handleSaveContact} className="flex-1 py-3 font-bold text-white bg-cyan-600 rounded-xl">Simpan</button></div></div></div>)}

        {isContactOpen && (<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={(e) => e.target === e.currentTarget && setIsContactOpen(false)}><div className="bg-white p-6 rounded-3xl max-w-sm w-full"><h3 className="font-bold text-xl mb-4 text-center">Hubungi Admin</h3><div className="space-y-3">{contactMethods.map(c=><a key={c.id} href={c.url} target="_blank" className="flex items-center gap-3 p-4 bg-slate-100 rounded-xl font-bold transition hover:bg-slate-200">{c.image_url ? <img src={c.image_url} className="w-6 h-6"/> : <Mail size={20}/>} {c.platform_name}</a>)}</div></div></div>)}
        
        {/* CHECKOUT MODAL */}
        {selectedProduct && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
               <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-md">
                  <div><h3 className="font-black text-xl">Checkout</h3><p className="text-sm text-slate-500">{checkoutStep === 1 ? 'Data Diri' : checkoutStep === 2 ? 'Pembayaran' : 'Struk'}</p></div>
                  <button onClick={() => { setSelectedProduct(null); setCheckoutStep(1); }} className="p-2 bg-slate-100 dark:bg-white/10 rounded-full"><X size={20}/></button>
               </div>
               
               <div className="p-8 overflow-y-auto custom-scrollbar">
                  {checkoutStep === 1 ? (
                    <div className="space-y-4 animate-slideIn">
                       {/* Product Info */}
                       <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl mb-4 border border-slate-100 dark:border-white/5">
                          <div className="h-12 w-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center text-cyan-600 font-black">{selectedProduct.name.slice(0,1)}</div>
                          <div><h4 className="font-bold">{selectedProduct.name}</h4><p className="text-sm text-slate-500">{selectedProduct.category} • Rp {selectedProduct.price.toLocaleString()}</p></div>
                       </div>

                       <div><label className="text-xs font-bold text-slate-500 ml-1">NAMA LENGKAP</label><input className={`w-full bg-slate-100 dark:bg-black/50 p-4 rounded-xl font-bold mt-1 outline-none ${formErrors.name ? 'border-2 border-red-500' : ''}`} placeholder="Nama Anda" value={buyerForm.name} onChange={e=>setBuyerForm({...buyerForm, name: e.target.value})}/></div>
                       <div><label className="text-xs font-bold text-slate-500 ml-1">NO. HP / EMAIL</label><input className={`w-full bg-slate-100 dark:bg-black/50 p-4 rounded-xl font-bold mt-1 outline-none ${formErrors.email ? 'border-2 border-red-500' : ''}`} placeholder="08... atau email@..." value={buyerForm.email} onChange={e=>setBuyerForm({...buyerForm, email: e.target.value})}/></div>
                       
                       {/* Game Specific Input (New) */}
                       {selectedProduct.category === 'Game' && (
                         <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-500/30">
                            <label className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1"><Gamepad size={12}/> DATA AKUN GAME</label>
                            <div className="flex gap-2 mt-2">
                               <input className="flex-1 bg-white dark:bg-black/50 p-3 rounded-lg font-bold outline-none" placeholder="User ID" value={buyerForm.game_id} onChange={e=>setBuyerForm({...buyerForm, game_id: e.target.value})}/>
                               <input className="w-1/3 bg-white dark:bg-black/50 p-3 rounded-lg font-bold outline-none" placeholder="Zone ID" value={buyerForm.zone_id} onChange={e=>setBuyerForm({...buyerForm, zone_id: e.target.value})}/>
                            </div>
                            <button onClick={checkGameNickname} disabled={isCheckingGame} className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1">
                               {isCheckingGame ? <Loader2 size={12} className="animate-spin"/> : <Search size={12}/>} Cek Nickname
                            </button>
                            {nickname && <div className="mt-2 text-sm font-bold text-green-600 flex items-center gap-1"><CheckCircle size={14}/> Nick: {nickname}</div>}
                         </div>
                       )}

                       {/* Voucher Input (New) */}
                       <div className="relative">
                          <input className="w-full bg-slate-100 dark:bg-black/50 p-4 pr-20 rounded-xl font-bold mt-1 outline-none uppercase" placeholder="KODE PROMO" value={voucherCode} onChange={e=>setVoucherCode(e.target.value)}/>
                          <button onClick={checkVoucher} className="absolute right-2 top-2 bottom-2 bg-slate-800 text-white px-4 rounded-lg text-xs font-bold">CEK</button>
                       </div>
                       {appliedVoucher && <div className="bg-green-100 text-green-700 p-2 rounded-lg text-xs font-bold text-center">Hemat Rp {appliedVoucher.discount_amount.toLocaleString()}</div>}

                       <button onClick={handleNextStep} className="w-full bg-slate-900 dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl mt-4 flex justify-center items-center gap-2">Lanjut Pembayaran <ChevronRight size={18}/></button>
                    </div>
                  ) : checkoutStep === 2 ? (
                    <div className="space-y-4 animate-slideIn">
                       {/* Payment Selection */}
                       <div className="flex justify-between items-center mb-2">
                          <p className="text-xs font-bold text-slate-500">TOTAL TAGIHAN</p>
                          <p className="text-xl font-black text-cyan-600">Rp {(selectedProduct.price - (appliedVoucher?.discount_amount || 0)).toLocaleString()}</p>
                       </div>
                       <div className="space-y-3">
                          {paymentMethods.map(m => (
                             <div key={m.id} onClick={() => setSelectedPayment(m)} className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedPayment?.id === m.id ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 ring-1 ring-cyan-500' : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                                <div className="flex justify-between items-center">
                                   <div className="flex items-center gap-3">
                                      {m.image_url ? <img src={m.image_url} alt={m.name} className="w-8 h-8 object-contain rounded-full bg-white p-1"/> : <span className="font-bold">{m.name}</span>}
                                      <span className="font-bold">{m.name}</span>
                                   </div>
                                   {selectedPayment?.id === m.id && <CheckCircle className="text-cyan-500" size={20}/>}
                                </div>
                             </div>
                          ))}
                       </div>
                       <button disabled={!selectedPayment || isSubmitting} onClick={handleCheckoutSubmit} className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold disabled:opacity-50 mt-6">Konfirmasi & Kirim WA</button>
                    </div>
                  ) : (
                    // --- STEP 3: INVOICE DOWNLOAD ---
                    <div className="animate-slideIn text-center">
                        <div ref={invoiceRef} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 text-black">
                           <div className="text-center border-b border-dashed border-slate-300 pb-4 mb-4">
                              <h3 className="font-black text-xl">WuregStore</h3>
                              <p className="text-xs text-slate-500">Struk Pembelian Resmi</p>
                           </div>
                           <div className="space-y-2 text-sm text-left">
                              <div className="flex justify-between"><span>Produk</span><span className="font-bold">{selectedProduct.name}</span></div>
                              <div className="flex justify-between"><span>Harga</span><span>Rp {selectedProduct.price.toLocaleString()}</span></div>
                              {appliedVoucher && <div className="flex justify-between text-green-600"><span>Diskon</span><span>- Rp {appliedVoucher.discount_amount.toLocaleString()}</span></div>}
                              <div className="flex justify-between font-black text-lg border-t pt-2 mt-2"><span>Total</span><span>Rp {(selectedProduct.price - (appliedVoucher?.discount_amount || 0)).toLocaleString()}</span></div>
                           </div>
                           <div className="mt-4 pt-4 border-t border-dashed border-slate-300 text-[10px] text-slate-400 text-center">
                              ID: {lastTrxId}<br/>Terima kasih telah berbelanja!
                           </div>
                        </div>
                        <button onClick={downloadInvoice} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"><Download size={18}/> Simpan Struk</button>
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
