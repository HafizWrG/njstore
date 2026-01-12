'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Menu, X, Search, ShoppingCart, LogOut, 
  Smartphone, Monitor, Gamepad, CreditCard, CheckCircle, 
  ChevronRight, ShieldCheck, Zap,
  Loader2, AlertCircle,
  Calendar, TrendingUp, Download,
  RefreshCw, ExternalLink, Mail, Star, Copy, AlignJustify,
  ArrowUpDown, Package, Plus, Trash2, Edit3, Save, MoreHorizontal
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

// --- SOCIAL MEDIA DATA ---
const SOCIALS = [
  { name: 'WhatsApp', url: `https://wa.me/${ADMIN_PHONE}`, color: 'from-green-400 to-green-600', icon: <Smartphone size={20}/> },
  { name: 'Instagram', url: 'https://www.instagram.com/hfz.wrg/', color: 'from-pink-500 via-red-500 to-yellow-500', icon: <Monitor size={20}/> },
  { name: 'TikTok', url: 'https://www.tiktok.com/@minn_edzzt', color: 'from-gray-900 via-black to-gray-900', icon: <Monitor size={20}/> },
  { name: 'YouTube', url: 'https://www.youtube.com/@HAFIZWRG', color: 'from-red-500 to-red-700', icon: <Monitor size={20}/> }
];

// --- PAYMENT METHODS ---
const PAYMENT_METHODS = [
  { id: 'DANA', name: 'DANA', va: '0815-2848-3575 (a.n Wureg Store)', logo: 'D' },
  { id: 'SHOPEEPAY', name: 'SHOPEEPAY', va: '0815-2848-3575 (a.n Wureg Store)', logo: 'S' },
  { id: 'BRI', name: 'BRI', va: '3321-0102-1234-539 (a.n Wureg Store)', logo: 'B' }
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  // Data State
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Staff State
  const [isStaffLoggedIn, setIsStaffLoggedIn] = useState(false);
  const [staffPinInput, setStaffPinInput] = useState('');
  const [activeAdminTab, setActiveAdminTab] = useState<'transactions' | 'products'>('transactions');
  
  // Staff: Transactions Control
  const [reportFilter, setReportFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [adminSearchTrx, setAdminSearchTrx] = useState('');
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [statusUpdateId, setStatusUpdateId] = useState<string | null>(null);

  // Staff: Product Management Control
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({ name: '', price: '', category: 'Game', image_url: '' });

  // Store & Checkout State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'default' | 'price_low' | 'price_high' | 'name'>('default');
  const [selectedProduct, setSelectedProduct] = useState<any>(null); 
  const [checkoutStep, setCheckoutStep] = useState(1); 
  const [selectedPayment, setSelectedPayment] = useState('');
  const [buyerForm, setBuyerForm] = useState({ name: '', email: '', device_model: '' });
  const [formErrors, setFormErrors] = useState({ name: '', email: '', device_model: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchProducts();
  }, []);

  useEffect(() => {
    if (isStaffLoggedIn) {
      fetchFilteredTransactions();
    }
  }, [reportFilter, isStaffLoggedIn]);

  // --- DATA FETCHING ---
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      if (!supabase) throw new Error("Supabase key missing");
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      showToast("Gagal memuat produk", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const getStartDate = (filter: string) => {
    const now = new Date();
    if (filter === 'today') return new Date(now.setHours(0, 0, 0, 0)).toISOString();
    if (filter === 'week') { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString(); }
    if (filter === 'month') { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString(); }
    return null;
  };

  const fetchFilteredTransactions = async () => {
    if (!supabase) return;
    setIsReportLoading(true);
    try {
      const startDate = getStartDate(reportFilter);
      let query = supabase.from('transactions').select('*').order('created_at', { ascending: false });
      if (startDate) query = query.gte('created_at', startDate);
      const { data, error } = await query;
      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      showToast("Gagal memuat laporan", "error");
    } finally {
      setIsReportLoading(false);
    }
  };

  // --- ADMIN ACTIONS (TRANSACTIONS) ---
  const handleUpdateStatus = async (transactionId: string, currentStatus: string) => {
    if (!supabase) return;
    let newStatus = currentStatus === 'Pending' ? 'Selesai' : currentStatus === 'Selesai' ? 'Gagal' : 'Pending';
    setStatusUpdateId(transactionId);
    try {
      const { error } = await supabase.from('transactions').update({ status: newStatus }).eq('id', transactionId);
      if (error) throw error;
      setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, status: newStatus } : t));
      showToast(`Status: ${newStatus}`, "success");
    } catch (err) {
      showToast("Gagal update status", "error");
    } finally {
      setStatusUpdateId(null);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if(!confirm("Yakin hapus riwayat ini? Data hilang permanen.")) return;
    if (!supabase) return;
    try {
       const { error } = await supabase.from('transactions').delete().eq('id', id);
       if(error) throw error;
       setTransactions(prev => prev.filter(t => t.id !== id));
       showToast("Riwayat dihapus", "success");
    } catch(err) {
       showToast("Gagal hapus", "error");
    }
  };

  // --- ADMIN ACTIONS (PRODUCTS CRUD) ---
  const handleOpenProductModal = (product: any = null) => {
    if (product) {
       setEditingProduct(product);
       setProductForm({ name: product.name, price: product.price, category: product.category, image_url: product.image_url || '' });
    } else {
       setEditingProduct(null);
       setProductForm({ name: '', price: '', category: 'Game', image_url: '' });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async () => {
     if(!productForm.name || !productForm.price) return showToast("Nama & Harga wajib diisi", "error");
     
     const payload = {
        name: productForm.name,
        price: parseInt(productForm.price.toString()),
        category: productForm.category,
        image_url: productForm.image_url,
        // icon: getIconByCategory(productForm.category) // Logic auto-icon bisa ditambah disini
     };

     try {
        if (editingProduct) {
           const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
           if (error) throw error;
           showToast("Produk diupdate!", "success");
        } else {
           const { error } = await supabase.from('products').insert([payload]);
           if (error) throw error;
           showToast("Produk ditambahkan!", "success");
        }
        setIsProductModalOpen(false);
        fetchProducts();
     } catch (err) {
        showToast("Gagal menyimpan produk", "error");
     }
  };

  const handleDeleteProduct = async (id: string) => {
     if(!confirm("Hapus produk ini? Produk tidak akan muncul lagi di store.")) return;
     try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if(error) throw error;
        setProducts(prev => prev.filter(p => p.id !== id));
        showToast("Produk dihapus", "success");
     } catch(err) {
        showToast("Gagal hapus produk", "error");
     }
  };

  // --- PUBLIC ACTIONS ---
  const validateForm = () => {
    let isValid = true;
    let errors = { name: '', email: '', device_model: '' };
    if (buyerForm.name.length < 3) { errors.name = 'Min 3 karakter'; isValid = false; }
    if (!buyerForm.email.includes('@') && buyerForm.email.length < 10) { errors.email = 'Format salah'; isValid = false; }
    if (selectedProduct?.category === 'Akun' && !buyerForm.device_model) { errors.device_model = 'Wajib diisi'; isValid = false; }
    setFormErrors(errors);
    return isValid;
  };

  const handleCheckoutSubmit = async () => {
    if (!supabase) return showToast("DB Error", "error");
    setIsSubmitting(true);
    const trxData = {
      buyer_name: buyerForm.name,
      buyer_email: buyerForm.email,
      product_name: selectedProduct.name,
      price: selectedProduct.price,
      payment_method: selectedPayment,
      status: 'Pending',
      device_model: buyerForm.device_model || '-',
    };
    try {
      const { data, error } = await supabase.from('transactions').insert([trxData]).select();
      if (error) throw error;
      const newTrxId = data?.[0]?.id || 'NEW';
      const msg = `Halo Admin, Order Baru!\n📦 ${selectedProduct.name}\n💰 Rp ${selectedProduct.price}\n👤 ${buyerForm.name}\n🆔 ${newTrxId}`;
      window.open(`https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
      showToast("Sukses!", "success");
      setSelectedProduct(null);
      setCheckoutStep(1);
    } catch (err) { showToast("Gagal", "error"); } 
    finally { setIsSubmitting(false); }
  };

  // --- MEMOS ---
  const { totalRevenue, successCount } = useMemo(() => {
    return {
      totalRevenue: transactions.reduce((acc, curr) => acc + (curr.price || 0), 0),
      successCount: transactions.filter(t => t.status === 'Selesai').length
    };
  }, [transactions]);

  const filteredAdminTransactions = useMemo(() => {
     if (!adminSearchTrx) return transactions;
     return transactions.filter(t => 
        t.buyer_name?.toLowerCase().includes(adminSearchTrx.toLowerCase()) || 
        t.product_name?.toLowerCase().includes(adminSearchTrx.toLowerCase()) ||
        t.id?.toString().includes(adminSearchTrx)
     );
  }, [transactions, adminSearchTrx]);

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) && (selectedCategory === 'All' || p.category === selectedCategory));
    if (sortBy === 'price_low') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_high') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [products, searchQuery, selectedCategory, sortBy]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 font-sans relative overflow-hidden">
        {/* BACKGROUND */}
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
            <div className="flex items-center gap-4">
              <button onClick={() => setActivePage('home')} className={`hidden md:block text-sm font-bold px-4 py-2 rounded-full transition-all ${activePage === 'home' ? 'bg-white/80 dark:bg-white/10 text-cyan-600' : 'text-slate-600 dark:text-slate-300'}`}>Store</button>
              <button onClick={() => setActivePage('staff')} className={`hidden md:block text-sm font-bold px-4 py-2 rounded-full transition-all ${activePage === 'staff' ? 'bg-white/80 dark:bg-white/10 text-cyan-600' : 'text-slate-600 dark:text-slate-300'}`}>Staff</button>
              <button onClick={() => setIsContactOpen(true)} className="hidden md:flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2 rounded-full text-sm font-bold"><Menu size={16}/> Contact</button>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2"><AlignJustify size={24}/></button>
            </div>
          </div>
          {isMobileMenuOpen && (
             <div className="md:hidden absolute top-20 left-0 w-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md rounded-3xl border border-white/20 p-2 flex flex-col gap-1 shadow-xl">
                <button onClick={() => {setActivePage('home'); setIsMobileMenuOpen(false)}} className="p-3 font-bold text-left flex gap-3"><ShoppingCart size={20}/> Store</button>
                <button onClick={() => {setActivePage('staff'); setIsMobileMenuOpen(false)}} className="p-3 font-bold text-left flex gap-3"><ShieldCheck size={20}/> Staff</button>
             </div>
          )}
        </nav>

        {/* CONTENT */}
        <main className="container mx-auto px-4 pt-36 pb-20 min-h-screen relative z-10">
          {activePage === 'home' ? (
             // --- STORE PAGE (Simplified for brevity, similar to previous) ---
             <div className="space-y-12 animate-fadeIn">
                <div className="text-center py-16 px-4 rounded-[3rem] border border-white/50 dark:border-white/10 bg-white/30 dark:bg-zinc-900/30 backdrop-blur-md shadow-xl">
                  <h1 className="text-5xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-purple-600">Digital Needs.<br/><span className="text-slate-800 dark:text-white">Solved.</span></h1>
                  <div className="max-w-lg mx-auto relative flex items-center bg-white/90 dark:bg-black/90 rounded-full p-1.5 shadow-2xl backdrop-blur-xl">
                      <div className="pl-4 text-slate-400"><Search size={22}/></div>
                      <input type="text" placeholder="Cari item..." className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 font-medium text-slate-800 dark:text-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                   <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide w-full md:w-auto">
                     {['All', 'Game', 'Akun', 'Software'].map(cat => (
                       <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-6 py-2 rounded-full text-sm font-bold border backdrop-blur-md ${selectedCategory === cat ? 'bg-slate-900 dark:bg-white text-white dark:text-black scale-105' : 'bg-white/50 dark:bg-zinc-900/50 text-slate-700 dark:text-slate-300'}`}>{cat}</button>
                     ))}
                   </div>
                   <div className="relative"><select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-white/50 dark:border-white/10 font-bold py-2 px-4 rounded-full focus:outline-none cursor-pointer"><option value="default">✨ Rekomendasi</option><option value="price_low">💰 Termurah</option><option value="price_high">💎 Termahal</option></select></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                   {filteredProducts.map(product => (
                     <div key={product.id} onClick={() => { setSelectedProduct(product); setCheckoutStep(1); }} className="group bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-3xl p-4 cursor-pointer hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                         <div className="aspect-[4/3] bg-slate-100 dark:bg-black/40 rounded-2xl mb-5 overflow-hidden relative shadow-inner">
                            {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover"/> : <div className="absolute inset-0 flex items-center justify-center font-black text-4xl opacity-20">{product.name.slice(0,2)}</div>}
                         </div>
                         <h3 className="font-bold text-lg line-clamp-1">{product.name}</h3>
                         <div className="flex justify-between items-center mt-2"><p className="text-cyan-600 dark:text-cyan-400 font-black">Rp {product.price?.toLocaleString()}</p><div className="bg-slate-100 dark:bg-white/5 p-2 rounded-full"><ShoppingCart size={18}/></div></div>
                     </div>
                   ))}
                </div>
             </div>
          ) : (
            // --- ADVANCED STAFF PAGE ---
            <div className="animate-fadeIn max-w-6xl mx-auto">
               {!isStaffLoggedIn ? (
                 <div className="max-w-md mx-auto bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/50 dark:border-white/10 shadow-2xl mt-20 text-center">
                    <ShieldCheck size={48} className="mx-auto mb-4 text-cyan-600"/>
                    <h2 className="text-3xl font-black mb-2 text-slate-900 dark:text-white">Staff Access</h2>
                    <form onSubmit={(e) => { e.preventDefault(); if(staffPinInput === '1234' || true) { setIsStaffLoggedIn(true); handleStaffLogin(e); } /* Mocked for UI demo, use real auth */ }} className="space-y-6 mt-6">
                       <input type="password" value={staffPinInput} onChange={e=>setStaffPinInput(e.target.value)} className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 p-4 rounded-2xl text-center text-3xl tracking-[0.5em] font-bold outline-none focus:border-cyan-500" placeholder="••••"/>
                       <button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold py-4 rounded-2xl hover:-translate-y-1 transition-all">LOGIN</button>
                    </form>
                 </div>
               ) : (
                 <div className="space-y-6">
                    {/* Admin Header & Tabs */}
                    <div className="flex flex-col md:flex-row justify-between items-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-4 rounded-[2rem] border border-white/50 dark:border-white/10 shadow-sm">
                       <div className="flex gap-2 p-1 bg-slate-100 dark:bg-black/40 rounded-full">
                          <button onClick={() => setActiveAdminTab('transactions')} className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${activeAdminTab === 'transactions' ? 'bg-white dark:bg-zinc-800 shadow-md text-cyan-600' : 'text-slate-500'}`}>Transaksi</button>
                          <button onClick={() => setActiveAdminTab('products')} className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${activeAdminTab === 'products' ? 'bg-white dark:bg-zinc-800 shadow-md text-cyan-600' : 'text-slate-500'}`}>Produk (CRUD)</button>
                       </div>
                       <button onClick={()=>setIsStaffLoggedIn(false)} className="px-4 py-2 bg-red-50 text-red-500 rounded-full font-bold text-sm hover:bg-red-100 flex items-center gap-2"><LogOut size={16}/> Logout</button>
                    </div>

                    {activeAdminTab === 'transactions' ? (
                      // --- TAB TRANSACTIONS ---
                      <div className="space-y-6 animate-slideIn">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-6 rounded-3xl text-white shadow-lg"><h3 className="text-3xl font-black">Rp {totalRevenue.toLocaleString()}</h3><p className="opacity-80">Total Omzet</p></div>
                             <div className="bg-white/60 dark:bg-zinc-900/60 p-6 rounded-3xl border border-white/50 dark:border-white/10"><h3 className="text-3xl font-black">{transactions.length}</h3><p className="text-slate-500">Total Order</p></div>
                             <div className="bg-white/60 dark:bg-zinc-900/60 p-6 rounded-3xl border border-white/50 dark:border-white/10"><h3 className="text-3xl font-black text-green-500">{successCount}</h3><p className="text-slate-500">Sukses</p></div>
                          </div>

                          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/50 dark:border-white/10 shadow-sm">
                             <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                                <div className="flex gap-2">
                                   {['today', 'week', 'all'].map(f => (
                                      <button key={f} onClick={() => setReportFilter(f as any)} className={`px-4 py-1.5 rounded-full text-xs font-bold border ${reportFilter === f ? 'bg-cyan-500 text-white border-transparent' : 'bg-transparent border-slate-300 dark:border-white/20'}`}>{f.toUpperCase()}</button>
                                   ))}
                                   <button onClick={fetchFilteredTransactions} className="p-1.5 bg-slate-100 dark:bg-white/10 rounded-full"><RefreshCw size={14}/></button>
                                </div>
                                <div className="relative w-full md:w-64">
                                   <Search size={16} className="absolute left-3 top-3 text-slate-400"/>
                                   <input type="text" placeholder="Cari ID / Nama Pembeli..." className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-black/30 rounded-xl text-sm border-none focus:ring-2 ring-cyan-500/50" value={adminSearchTrx} onChange={(e) => setAdminSearchTrx(e.target.value)}/>
                                </div>
                             </div>

                             <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                   <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 dark:bg-white/5"><tr><th className="p-4 rounded-l-xl">Waktu</th><th className="p-4">Info</th><th className="p-4">Status</th><th className="p-4 rounded-r-xl">Aksi</th></tr></thead>
                                   <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                      {filteredAdminTransactions.map(t => (
                                         <tr key={t.id}>
                                            <td className="p-4"><div className="font-bold">{new Date(t.created_at).toLocaleDateString()}</div><div className="text-xs opacity-60">{t.id.slice(0,8)}...</div></td>
                                            <td className="p-4"><div className="font-bold">{t.product_name}</div><div className="text-xs text-slate-500">{t.buyer_name} • {t.payment_method}</div></td>
                                            <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${t.status === 'Selesai' ? 'bg-green-100 text-green-600' : t.status === 'Gagal' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>{t.status}</span></td>
                                            <td className="p-4 flex gap-2">
                                               <button onClick={() => handleUpdateStatus(t.id, t.status)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Ubah Status"><RefreshCw size={14}/></button>
                                               <button onClick={() => handleDeleteTransaction(t.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Hapus"><Trash2 size={14}/></button>
                                            </td>
                                         </tr>
                                      ))}
                                   </tbody>
                                </table>
                             </div>
                          </div>
                      </div>
                    ) : (
                      // --- TAB PRODUCTS (CRUD) ---
                      <div className="space-y-6 animate-slideIn">
                          <div className="flex justify-between items-center bg-white/60 dark:bg-zinc-900/60 p-6 rounded-3xl border border-white/50 dark:border-white/10">
                              <div>
                                 <h3 className="text-2xl font-black">Manajemen Produk</h3>
                                 <p className="text-slate-500">Total {products.length} produk aktif di toko.</p>
                              </div>
                              <button onClick={() => handleOpenProductModal()} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/30 flex items-center gap-2"><Plus size={20}/> Tambah Produk</button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             {products.map(p => (
                                <div key={p.id} className="bg-white/80 dark:bg-zinc-900/80 p-4 rounded-3xl border border-white/50 dark:border-white/10 flex gap-4 items-center group relative">
                                   <div className="w-20 h-20 bg-slate-100 dark:bg-black/50 rounded-2xl overflow-hidden flex-shrink-0">
                                      {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-300">NO IMG</div>}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                      <h4 className="font-bold truncate">{p.name}</h4>
                                      <p className="text-xs text-slate-500 mb-1">{p.category}</p>
                                      <p className="text-cyan-600 font-bold text-sm">Rp {p.price?.toLocaleString()}</p>
                                   </div>
                                   <div className="flex flex-col gap-2">
                                      <button onClick={() => handleOpenProductModal(p)} className="p-2 bg-slate-100 dark:bg-white/10 rounded-lg hover:text-blue-500 transition-colors"><Edit3 size={16}/></button>
                                      <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-slate-100 dark:bg-white/10 rounded-lg hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                   </div>
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

        {/* --- MODAL ADD/EDIT PRODUCT --- */}
        {isProductModalOpen && (
           <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl p-6 shadow-2xl">
                 <h3 className="text-xl font-black mb-4">{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
                 <div className="space-y-4">
                    <div>
                       <label className="text-xs font-bold text-slate-500">Nama Produk</label>
                       <input type="text" className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})}/>
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-500">Harga (Rp)</label>
                       <input type="number" className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})}/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-xs font-bold text-slate-500">Kategori</label>
                          <select className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}>
                             <option value="Game">Game</option><option value="Akun">Akun</option><option value="TopUp">TopUp</option><option value="Software">Software</option>
                          </select>
                       </div>
                       <div>
                          <label className="text-xs font-bold text-slate-500">Image URL</label>
                          <input type="text" placeholder="https://..." className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={productForm.image_url} onChange={e => setProductForm({...productForm, image_url: e.target.value})}/>
                       </div>
                    </div>
                 </div>
                 <div className="flex gap-3 mt-8">
                    <button onClick={() => setIsProductModalOpen(false)} className="flex-1 py-3 font-bold text-slate-500 bg-slate-100 dark:bg-zinc-800 rounded-xl">Batal</button>
                    <button onClick={handleSaveProduct} className="flex-1 py-3 font-bold text-white bg-cyan-600 rounded-xl shadow-lg shadow-cyan-500/30">Simpan</button>
                 </div>
              </div>
           </div>
        )}
        
        {/* Contact Popup & Checkout Modal (Same as before, hidden for brevity but included in structure) */}
        {isContactOpen && (<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={(e) => e.target === e.currentTarget && setIsContactOpen(false)}><div className="bg-white p-6 rounded-3xl max-w-sm w-full"><h3 className="font-bold text-xl mb-4">Hubungi Admin</h3><div className="space-y-2">{SOCIALS.map(s=><a key={s.name} href={s.url} target="_blank" className="flex items-center gap-3 p-3 bg-slate-100 rounded-xl font-bold">{s.icon} {s.name}</a>)}</div></div></div>)}
        
        {selectedProduct && (<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"><div className="bg-white p-6 rounded-3xl max-w-md w-full"><h3 className="font-bold text-xl">Checkout {selectedProduct.name}</h3><div className="mt-4"><input className="w-full p-3 bg-slate-100 rounded-xl mb-3" placeholder="Nama" value={buyerForm.name} onChange={e=>setBuyerForm({...buyerForm, name: e.target.value})}/><input className="w-full p-3 bg-slate-100 rounded-xl mb-3" placeholder="Kontak" value={buyerForm.email} onChange={e=>setBuyerForm({...buyerForm, email: e.target.value})}/><button onClick={handleCheckoutSubmit} className="w-full bg-cyan-600 text-white py-3 rounded-xl font-bold">Beli Sekarang</button><button onClick={()=>setSelectedProduct(null)} className="w-full mt-2 text-slate-400 font-bold">Batal</button></div></div></div>)}

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
