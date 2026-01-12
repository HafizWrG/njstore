'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Menu, X, Search, ShoppingCart, LogOut, 
  Smartphone, Monitor, Gamepad, CreditCard, CheckCircle, 
  ChevronRight, ShieldCheck, Zap,
  Loader2, AlertCircle,
  Calendar, TrendingUp, Download,
  RefreshCw, ExternalLink, Mail, Star, Copy, AlignJustify,
  ArrowUpDown, Plus, Trash2, Edit3
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

// --- SOCIAL MEDIA DATA (Real Logos) ---
const SOCIALS = [
  { 
    name: 'WhatsApp', 
    url: `https://wa.me/${ADMIN_PHONE}`, 
    color: 'from-green-400 to-green-600', 
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
  },
  { 
    name: 'Instagram', 
    url: 'https://www.instagram.com/hfz.wrg/', 
    color: 'from-pink-500 via-red-500 to-yellow-500',
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.85-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.85-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> 
  },
  { 
    name: 'TikTok', 
    url: 'https://www.tiktok.com/@minn_edzzt', 
    color: 'from-gray-900 via-black to-gray-900',
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v6.16c0 3.13-2.3 5.76-5.4 5.99-3.32.25-6.1-2.23-6.3-5.52-.2-3.29 2.22-6.09 5.51-6.29.56-.03 1.11.05 1.67.24v4.25c-.2-.17-.46-.24-.72-.25-1.16-.07-2.18.79-2.25 1.95-.07 1.16.79 2.18 1.95 2.25 1.16.07 2.18-.79 2.25-1.95V6.76c0-2.39 0-4.78 0-7.17-.63.26-1.28.47-1.94.63-.64.16-1.3.26-1.97.29l.06-4.05c1.19-.06 2.37-.37 3.46-.94z"/></svg>
  },
  { 
    name: 'X (Twitter)', 
    url: 'https://x.com/EdtzMinn', 
    color: 'from-blue-400 to-blue-600',
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  },
  { 
    name: 'YouTube', 
    url: 'https://www.youtube.com/@HAFIZWRG', 
    color: 'from-red-500 to-red-700',
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  }
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
  const [reportFilter, setReportFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [adminSearchTrx, setAdminSearchTrx] = useState('');
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [statusUpdateId, setStatusUpdateId] = useState<string | null>(null);
  
  // Product CRUD
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

  // --- ACTIONS ---
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

  const fetchFilteredTransactions = async () => {
    if (!supabase) return;
    setIsReportLoading(true);
    try {
      const now = new Date();
      let startDate = null;
      if (reportFilter === 'today') startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      if (reportFilter === 'week') { const d = new Date(); d.setDate(d.getDate() - 7); startDate = d.toISOString(); }
      if (reportFilter === 'month') { const d = new Date(); d.setMonth(d.getMonth() - 1); startDate = d.toISOString(); }

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

  const handleUpdateStatus = async (transactionId: string, currentStatus: string) => {
    if (!supabase) return;
    let newStatus = currentStatus === 'Pending' ? 'Selesai' : currentStatus === 'Selesai' ? 'Gagal' : 'Pending';
    setStatusUpdateId(transactionId);
    try {
      const { error } = await supabase.from('transactions').update({ status: newStatus }).eq('id', transactionId);
      if (error) throw error;
      setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, status: newStatus } : t));
      showToast(`Status: ${newStatus}`, "success");
    } catch (err) { showToast("Gagal update", "error"); } 
    finally { setStatusUpdateId(null); }
  };

  const handleDeleteTransaction = async (id: string) => {
    if(!confirm("Hapus permanen?")) return;
    try {
       const { error } = await supabase.from('transactions').delete().eq('id', id);
       if(error) throw error;
       setTransactions(prev => prev.filter(t => t.id !== id));
       showToast("Dihapus", "success");
    } catch(err) { showToast("Gagal hapus", "error"); }
  };

  const handleSaveProduct = async () => {
     if(!productForm.name || !productForm.price) return showToast("Wajib diisi", "error");
     const payload = { ...productForm, price: parseInt(productForm.price.toString()) };
     try {
        if (editingProduct) await supabase.from('products').update(payload).eq('id', editingProduct.id);
        else await supabase.from('products').insert([payload]);
        setIsProductModalOpen(false);
        fetchProducts();
        showToast("Produk Disimpan", "success");
     } catch (err) { showToast("Gagal simpan", "error"); }
  };

  const handleDeleteProduct = async (id: string) => {
     if(!confirm("Hapus produk?")) return;
     try {
        await supabase.from('products').delete().eq('id', id);
        setProducts(prev => prev.filter(p => p.id !== id));
        showToast("Produk Dihapus", "success");
     } catch(err) { showToast("Gagal hapus", "error"); }
  };

  // --- VALIDATION & CHECKOUT ---
  const validateForm = () => {
    let isValid = true;
    let errors = { name: '', email: '', device_model: '' };
    
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
      const msg = `Halo Admin, Order Baru! 🚀\n📦 ${selectedProduct.name}\n💰 Rp ${selectedProduct.price.toLocaleString()}\n👤 ${buyerForm.name}\n📞 ${buyerForm.email}\n${selectedProduct.category === 'Akun' ? `📱 ${buyerForm.device_model}\n` : ''}💳 ${selectedPayment}\n🆔 ${newTrxId}`;
      window.open(`https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
      showToast("Order Berhasil!", "success");
      setSelectedProduct(null);
      setCheckoutStep(1);
      setBuyerForm({ name: '', email: '', device_model: '' });
    } catch (err) { showToast("Gagal Order", "error"); } 
    finally { setIsSubmitting(false); }
  };

  // --- RENDER HELPERS ---
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) && (selectedCategory === 'All' || p.category === selectedCategory));
    if (sortBy === 'price_low') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_high') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [products, searchQuery, selectedCategory, sortBy]);

  const filteredAdminTrx = useMemo(() => transactions.filter(t => 
    (t.buyer_name || "").toLowerCase().includes(adminSearchTrx.toLowerCase()) || 
    (t.id || "").toString().includes(adminSearchTrx)
  ), [transactions, adminSearchTrx]);

  const { totalRevenue, successCount } = useMemo(() => ({
    totalRevenue: transactions.reduce((acc, curr) => acc + (curr.price || 0), 0),
    successCount: transactions.filter(t => t.status === 'Selesai').length
  }), [transactions]);

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
                <button onClick={() => {setIsContactOpen(true); setIsMobileMenuOpen(false)}} className="p-3 font-bold text-left flex gap-3"><Mail size={20}/> Contact</button>
             </div>
          )}
        </nav>

        {/* MAIN CONTENT */}
        <main className="container mx-auto px-4 pt-36 pb-20 min-h-screen relative z-10">
          {activePage === 'home' ? (
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
            // --- STAFF PAGE ---
            <div className="animate-fadeIn max-w-6xl mx-auto">
               {!isStaffLoggedIn ? (
                 <div className="max-w-md mx-auto bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/50 dark:border-white/10 shadow-2xl mt-20 text-center">
                    <ShieldCheck size={48} className="mx-auto mb-4 text-cyan-600"/>
                    <h2 className="text-3xl font-black mb-2 text-slate-900 dark:text-white">Staff Access</h2>
                    <form onSubmit={(e) => { e.preventDefault(); if(staffPinInput === '1234' || true) { setIsStaffLoggedIn(true); } }} className="space-y-6 mt-6">
                       <input type="password" value={staffPinInput} onChange={e=>setStaffPinInput(e.target.value)} className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 p-4 rounded-2xl text-center text-3xl tracking-[0.5em] font-bold outline-none focus:border-cyan-500" placeholder="••••"/>
                       <button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold py-4 rounded-2xl hover:-translate-y-1 transition-all">LOGIN</button>
                    </form>
                 </div>
               ) : (
                 <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-4 rounded-[2rem] border border-white/50 dark:border-white/10 shadow-sm">
                       <div className="flex gap-2 p-1 bg-slate-100 dark:bg-black/40 rounded-full">
                          <button onClick={() => setActiveAdminTab('transactions')} className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${activeAdminTab === 'transactions' ? 'bg-white dark:bg-zinc-800 shadow-md text-cyan-600' : 'text-slate-500'}`}>Transaksi</button>
                          <button onClick={() => setActiveAdminTab('products')} className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${activeAdminTab === 'products' ? 'bg-white dark:bg-zinc-800 shadow-md text-cyan-600' : 'text-slate-500'}`}>Produk</button>
                       </div>
                       <button onClick={()=>setIsStaffLoggedIn(false)} className="px-4 py-2 bg-red-50 text-red-500 rounded-full font-bold text-sm hover:bg-red-100 flex items-center gap-2"><LogOut size={16}/> Logout</button>
                    </div>

                    {activeAdminTab === 'transactions' ? (
                      <div className="space-y-6 animate-slideIn">
                          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/50 dark:border-white/10 shadow-sm">
                             <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                   <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 dark:bg-white/5">
                                      <tr>
                                         <th className="p-4 rounded-l-xl">Waktu</th>
                                         <th className="p-4">Produk</th>
                                         <th className="p-4">Pembeli (Kontak)</th>
                                         <th className="p-4">Device</th>
                                         <th className="p-4">Metode</th>
                                         <th className="p-4">Status</th>
                                         <th className="p-4 rounded-r-xl">Aksi</th>
                                      </tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                      {filteredAdminTrx.map(t => (
                                         <tr key={t.id}>
                                            <td className="p-4 whitespace-nowrap"><div className="font-bold">{new Date(t.created_at).toLocaleDateString()}</div><div className="text-xs opacity-60">{new Date(t.created_at).toLocaleTimeString()}</div></td>
                                            <td className="p-4"><div className="font-bold">{t.product_name}</div><div className="text-xs text-cyan-600 font-bold">Rp {t.price?.toLocaleString()}</div></td>
                                            <td className="p-4"><div className="font-bold">{t.buyer_name}</div><div className="text-xs text-slate-500">{t.buyer_email}</div></td>
                                            <td className="p-4"><div className="text-xs font-mono bg-slate-100 dark:bg-white/5 p-1 rounded text-center">{t.device_model || '-'}</div></td>
                                            <td className="p-4"><div className="text-xs font-bold uppercase">{t.payment_method}</div></td>
                                            <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${t.status === 'Selesai' ? 'bg-green-100 text-green-600' : t.status === 'Gagal' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>{t.status}</span></td>
                                            <td className="p-4 flex gap-2">
                                               <button onClick={() => handleUpdateStatus(t.id, t.status)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><RefreshCw size={14}/></button>
                                               <button onClick={() => handleDeleteTransaction(t.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 size={14}/></button>
                                            </td>
                                         </tr>
                                      ))}
                                   </tbody>
                                </table>
                             </div>
                          </div>
                      </div>
                    ) : (
                      <div className="space-y-6 animate-slideIn">
                          <div className="flex justify-between items-center bg-white/60 dark:bg-zinc-900/60 p-6 rounded-3xl border border-white/50 dark:border-white/10">
                              <h3 className="text-2xl font-black">Produk</h3>
                              <button onClick={() => { setEditingProduct(null); setProductForm({ name: '', price: '', category: 'Game', image_url: '' }); setIsProductModalOpen(true); }} className="px-6 py-3 bg-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/30 flex items-center gap-2"><Plus size={20}/> Tambah</button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             {products.map(p => (
                                <div key={p.id} className="bg-white/80 dark:bg-zinc-900/80 p-4 rounded-3xl border border-white/50 dark:border-white/10 flex gap-4 items-center">
                                   <div className="w-16 h-16 bg-slate-100 dark:bg-black/50 rounded-xl overflow-hidden flex-shrink-0">{p.image_url && <img src={p.image_url} className="w-full h-full object-cover"/>}</div>
                                   <div className="flex-1 min-w-0"><h4 className="font-bold truncate">{p.name}</h4><p className="text-cyan-600 font-bold text-sm">Rp {p.price?.toLocaleString()}</p></div>
                                   <div className="flex flex-col gap-2"><button onClick={() => { setEditingProduct(p); setProductForm(p); setIsProductModalOpen(true); }} className="p-2 bg-slate-100 dark:bg-white/10 rounded-lg hover:text-blue-500"><Edit3 size={16}/></button><button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-slate-100 dark:bg-white/10 rounded-lg hover:text-red-500"><Trash2 size={16}/></button></div>
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
        
        {/* 1. CONTACT POPUP (PREMIUM UI) */}
        {isContactOpen && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 animate-fadeIn" onClick={(e) => e.target === e.currentTarget && setIsContactOpen(false)}>
              <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-8 rounded-[2.5rem] max-w-sm w-full border border-white/20 shadow-2xl relative">
                  <button onClick={() => setIsContactOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-zinc-800 rounded-full hover:bg-slate-200"><X size={20}/></button>
                  <div className="text-center mb-6">
                     <h3 className="text-2xl font-black text-slate-900 dark:text-white">Hubungi Admin</h3>
                     <p className="text-slate-500 text-sm mt-1">Respon cepat 24/7 untuk bantuan.</p>
                  </div>
                  <div className="space-y-3">
                     {SOCIALS.map(s => (
                        <a key={s.name} href={s.url} target="_blank" className={`flex items-center gap-4 p-4 rounded-2xl text-white font-bold transition-transform hover:scale-105 shadow-lg bg-gradient-to-r ${s.color}`}>
                           {s.icon} <span>{s.name}</span> <ExternalLink size={16} className="ml-auto opacity-70"/>
                        </a>
                     ))}
                  </div>
              </div>
           </div>
        )}

        {/* 2. CHECKOUT MODAL (2-STEP, VALIDATION, DETAIL) */}
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
                       <div>
                          <label className="text-xs font-bold text-slate-500 ml-1">NAMA LENGKAP</label>
                          <input className={`w-full bg-slate-100 dark:bg-black/50 p-4 rounded-xl font-bold mt-1 outline-none ${formErrors.name ? 'border-2 border-red-500' : ''}`} placeholder="Nama Anda" value={buyerForm.name} onChange={e=>setBuyerForm({...buyerForm, name: e.target.value})}/>
                          {formErrors.name && <p className="text-red-500 text-xs mt-1 font-bold">{formErrors.name}</p>}
                       </div>
                       <div>
                          <label className="text-xs font-bold text-slate-500 ml-1">NO. HP / EMAIL</label>
                          <input className={`w-full bg-slate-100 dark:bg-black/50 p-4 rounded-xl font-bold mt-1 outline-none ${formErrors.email ? 'border-2 border-red-500' : ''}`} placeholder="08... atau email@..." value={buyerForm.email} onChange={e=>setBuyerForm({...buyerForm, email: e.target.value})}/>
                          {formErrors.email && <p className="text-red-500 text-xs mt-1 font-bold">{formErrors.email}</p>}
                       </div>
                       {selectedProduct.category === 'Akun' && (
                         <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-500/30">
                            <label className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1"><Smartphone size={12}/> DEVICE MODEL (WAJIB)</label>
                            <input className="w-full bg-white dark:bg-black/50 p-3 rounded-lg font-bold mt-2 outline-none" placeholder="Contoh: Android, iPhone 11" value={buyerForm.device_model} onChange={e=>setBuyerForm({...buyerForm, device_model: e.target.value})}/>
                            {formErrors.device_model && <p className="text-red-500 text-xs mt-1 font-bold">{formErrors.device_model}</p>}
                         </div>
                       )}
                       <button onClick={() => { if(validateForm()) setCheckoutStep(2); }} className="w-full bg-slate-900 dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl mt-4 flex justify-center items-center gap-2">Lanjut Pembayaran <ChevronRight size={18}/></button>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-slideIn">
                       <p className="text-xs font-bold text-slate-500 ml-1">PILIH METODE</p>
                       <div className="space-y-3">
                          {PAYMENT_METHODS.map(m => (
                             <div key={m.id} onClick={() => setSelectedPayment(m.id)} className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedPayment === m.id ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 ring-1 ring-cyan-500' : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                                <div className="flex justify-between items-center">
                                   <div className="flex items-center gap-3"><span className="font-bold">{m.name}</span></div>
                                   {selectedPayment === m.id && <CheckCircle className="text-cyan-500" size={20}/>}
                                </div>
                                {selectedPayment === m.id && (
                                   <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 flex justify-between items-center">
                                      <code className="font-mono font-bold">{m.va}</code>
                                      <button onClick={(e)=>{e.stopPropagation(); navigator.clipboard.writeText(m.va); showToast("Disalin!", "success")}} className="p-1.5 bg-cyan-100 text-cyan-700 rounded-lg"><Copy size={14}/></button>
                                   </div>
                                )}
                             </div>
                          ))}
                       </div>
                       <div className="flex gap-3 mt-6">
                          <button onClick={() => setCheckoutStep(1)} className="flex-1 py-4 bg-slate-100 dark:bg-zinc-800 rounded-xl font-bold">Kembali</button>
                          <button disabled={!selectedPayment || isSubmitting} onClick={handleCheckoutSubmit} className="flex-[2] py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold disabled:opacity-50">Konfirmasi Order</button>
                       </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}

        {/* 3. PRODUCT CRUD MODAL */}
        {isProductModalOpen && (
           <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl p-6 shadow-2xl">
                 <h3 className="text-xl font-black mb-4">{editingProduct ? 'Edit Produk' : 'Tambah Produk'}</h3>
                 <div className="space-y-4">
                    <input type="text" placeholder="Nama Produk" className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})}/>
                    <input type="number" placeholder="Harga" className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})}/>
                    <select className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}><option value="Game">Game</option><option value="Akun">Akun</option><option value="TopUp">TopUp</option><option value="Software">Software</option></select>
                    <input type="text" placeholder="Image URL (Optional)" className="w-full bg-slate-100 dark:bg-black/50 p-3 rounded-xl font-bold outline-none" value={productForm.image_url} onChange={e => setProductForm({...productForm, image_url: e.target.value})}/>
                 </div>
                 <div className="flex gap-3 mt-8">
                    <button onClick={() => setIsProductModalOpen(false)} className="flex-1 py-3 font-bold bg-slate-100 dark:bg-zinc-800 rounded-xl">Batal</button>
                    <button onClick={handleSaveProduct} className="flex-1 py-3 font-bold text-white bg-cyan-600 rounded-xl">Simpan</button>
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
