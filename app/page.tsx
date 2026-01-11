'use client';

import React, { useState, useEffect } from 'react';
import { 
  Menu, X, Search, ShoppingCart, LogOut, 
  Smartphone, Monitor, Gamepad, CreditCard, CheckCircle, 
  ChevronRight, ShieldCheck, Zap,
  Sun, Moon, Loader2, AlertCircle,
  Calendar, TrendingUp, BarChart3, PieChart, Download,
  RefreshCw, MoreVertical, ExternalLink, Mail, Star, Copy
} from 'lucide-react';

// --- 1. SETUP ENV & SUPABASE (Custom Client) ---
const getEnv = (key: string) => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || '';
    }
  } catch (e) {
    // Ignore error if process is not defined
  }
  return '';
};

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

// --- PAYMENT METHODS DATA ---
const PAYMENT_METHODS = [
  { id: 'DANA', name: 'DANA', va: '0815-2848-3575 (a.n Wureg Store)', logo: 'D' },
  { id: 'SHOPEEPAY', name: 'SHOPEEPAY', va: '0815-2848-3575 (a.n Wureg Store)', logo: 'S' },
  { id: 'BRI', name: 'BRI', va: '3321-0102-1234-539 (a.n Wureg Store)', logo: 'B' }
];

// --- HELPER COMPONENTS ---

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl animate-slideIn transition-all backdrop-blur-md border ${
    type === 'success' ? 'bg-green-500/80 border-green-400 text-white' : 'bg-red-500/80 border-red-400 text-white'
  }`}>
    {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
    <span className="font-medium text-sm">{message}</span>
    <button onClick={onClose} className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors"><X size={14}/></button>
  </div>
);

const ProductSkeleton = () => (
  <div className="bg-white/50 dark:bg-zinc-900/50 border border-white/20 dark:border-white/5 rounded-3xl p-5 flex flex-col gap-3 animate-pulse">
    <div className="h-40 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-2xl w-full"></div>
    <div className="h-4 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-full w-3/4"></div>
    <div className="h-3 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-full w-1/2"></div>
    <div className="flex justify-between mt-2">
      <div className="h-5 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-full w-1/3"></div>
      <div className="h-8 w-8 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-full"></div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export default function WuregStore() {
  const [activePage, setActivePage] = useState('home'); 
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  // Data State
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Staff & Report State
  const [isStaffLoggedIn, setIsStaffLoggedIn] = useState(false);
  const [staffPinInput, setStaffPinInput] = useState('');
  const [reportFilter, setReportFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [statusUpdateId, setStatusUpdateId] = useState<string | null>(null);

  // Checkout State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<any>(null); 
  const [checkoutStep, setCheckoutStep] = useState(1); 
  const [selectedPayment, setSelectedPayment] = useState('');
  
  const [buyerForm, setBuyerForm] = useState({ name: '', email: '', device_model: '' });
  const [formErrors, setFormErrors] = useState({ name: '', email: '', device_model: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    setMounted(true);
    fetchProducts();
  }, []);

  useEffect(() => {
    if (isStaffLoggedIn) {
      fetchFilteredTransactions();
    }
  }, [reportFilter, isStaffLoggedIn]);

  const getStartDate = (filter: string) => {
    const now = new Date();
    if (filter === 'today') return new Date(now.setHours(0, 0, 0, 0)).toISOString();
    if (filter === 'week') { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString(); }
    if (filter === 'month') { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString(); }
    return null; // All time
  };

  const fetchFilteredTransactions = async () => {
    if (!supabase) return;
    setIsReportLoading(true);
    try {
      const startDate = getStartDate(reportFilter);
      let query = supabase.from('transactions').select('*').order('created_at', { ascending: false });
      
      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error(err);
      showToast("Gagal memuat laporan", "error");
    } finally {
      setIsReportLoading(false);
    }
  };

  const handleUpdateStatus = async (transactionId: string, currentStatus: string) => {
    if (!supabase) return;
    
    let newStatus = 'Pending';
    if (currentStatus === 'Pending') newStatus = 'Selesai';
    else if (currentStatus === 'Selesai') newStatus = 'Gagal';
    else newStatus = 'Pending';

    setStatusUpdateId(transactionId);
    try {
      const { error } = await supabase.from('transactions').update({ status: newStatus }).eq('id', transactionId).select();
      if (error) throw error;
      setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, status: newStatus } : t));
      showToast(`Status diubah ke ${newStatus}`, "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal update status", "error");
    } finally {
      setStatusUpdateId(null);
    }
  };

  const getIconByCategory = (category: string) => {
    const cat = category ? category.trim() : '';
    if (cat === 'Streaming') return 'Monitor';
    if (cat === 'Game' || cat === 'Games') return 'Gamepad';
    if (cat === 'Software') return 'Monitor';
    if (cat === 'TopUp') return 'Zap'; 
    return 'Smartphone';
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      if (!supabase) throw new Error("Supabase key missing");
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      
      const mappedData = data?.map((item: any) => ({
        ...item,
        ...item,
        icon: item.icon || getIconByCategory(item.category)
      })) || [];
      setProducts(mappedData);
    } catch (error) {
      showToast("Mode Offline / Database Error", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    let isValid = true;
    let errors = { name: '', email: '', device_model: '' };

    if (!buyerForm.name.trim() || buyerForm.name.length < 3) {
      errors.name = 'Nama minimal 3 karakter';
      isValid = false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^08[0-9]{8,}$/;
    
    if (!buyerForm.email.trim()) {
      errors.email = 'Kontak wajib diisi';
      isValid = false;
    } else if (!emailRegex.test(buyerForm.email) && !phoneRegex.test(buyerForm.email)) {
      errors.email = 'Format Email atau No. WA salah';
      isValid = false;
    }

    if (selectedProduct?.category === 'Akun' && !buyerForm.device_model.trim()) {
      errors.device_model = 'Device model wajib diisi untuk kategori Akun';
      isValid = false;
    }
    setFormErrors(errors);
    return isValid;
  };

  const handleCheckoutSubmit = async () => {
    if (!supabase) { showToast("Konfigurasi Database Error", "error"); return; }
    setIsSubmitting(true);
    
    const transactionData = {
      buyer_name: buyerForm.name,
      buyer_email: buyerForm.email,
      product_name: selectedProduct.name,
      price: selectedProduct.price,
      payment_method: selectedPayment,
      status: 'Pending',
      device_model: buyerForm.device_model || '-',
    };

    try {
      const { data, error } = await supabase.from('transactions').insert([transactionData]).select();
      if (error) throw error;
      const newTrxId = data?.[0]?.id || 'TRX-NEW';
      
      const message = `Halo Admin WuregStore, Order Baru! 🚀\n\n📦 *Produk:* ${selectedProduct.name}\n💰 *Harga:* Rp ${selectedProduct.price?.toLocaleString()}\n👤 *Nama:* ${buyerForm.name}\n📧 *Kontak:* ${buyerForm.email}\n${selectedProduct.category === 'Akun' ? `📱 *Device:* ${transactionData.device_model}\n` : ''}💳 *Pembayaran:* ${selectedPayment}\n🆔 *ID Order:* ${newTrxId}\n\nMohon diproses segera. Terima kasih!`;

      window.open(`https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(message)}`, '_blank');
      showToast("Pesanan berhasil dibuat!", "success");
      setSelectedProduct(null);
      setCheckoutStep(1);
      setBuyerForm({ name: '', email: '', device_model: '' });
      setFormErrors({ name: '', email: '', device_model: '' });
    } catch (err) {
      showToast("Gagal menyimpan transaksi.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('accounts').select('*').eq('password', staffPinInput).single();
      if (data && !error) {
        setIsStaffLoggedIn(true);
        setStaffPinInput('');
        showToast("Login Berhasil", "success");
      } else {
        showToast("PIN Salah!", "error");
      }
    } catch (err: any) { showToast("Error login", "error"); }
  };

  const totalRevenue = transactions.reduce((acc, curr) => acc + (curr.price || 0), 0);
  const successCount = transactions.filter(t => t.status === 'Selesai').length; 
  
  const productCount = transactions.reduce((acc: any, curr) => {
    acc[curr.product_name] = (acc[curr.product_name] || 0) + 1;
    return acc;
  }, {});
  const topProducts = Object.entries(productCount).sort((a:any, b:any) => b[1] - a[1]).slice(0, 3);

  const paymentCount = transactions.reduce((acc: any, curr) => {
    acc[curr.payment_method] = (acc[curr.payment_method] || 0) + 1;
    return acc;
  }, {});

  const downloadCSV = () => {
    const headers = "ID,Date,Product,Price,Buyer Name,Buyer Contact,Device Model,Method,Status\n";
    const rows = transactions.map(t => 
      `${t.id},"${new Date(t.created_at).toLocaleDateString()}", "${t.product_name}",${t.price},"${t.buyer_name}","${t.buyer_email}","${t.device_model}",${t.payment_method},${t.status}`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_WuregStore_${reportFilter}.csv`;
    a.click();
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory || (selectedCategory === 'Game' && p.category === 'Games');
    return matchSearch && matchCat;
  });

  if (!mounted) return null;

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/30 transition-colors duration-500 ease-in-out">
        {/* Subtle Background Gradients */}
        <div className="fixed inset-0 z-0 pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        </div>
        
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

        {/* --- NAVBAR --- */}
        <nav className="fixed w-full z-50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-b border-white/20 dark:border-white/5 shadow-sm transition-colors duration-300">
          <div className="container mx-auto px-4 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setActivePage('home'); setIsContactOpen(false); }}>
              {/* Logo Update (Req #1) */}
              <img 
                src="https://cdn.lynkid.my.id/profile/10-04-2025/1744247502273_9419383" 
                alt="WuregStore Logo"
                className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-300"
              />
              <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                Wureg<span className="text-blue-600 dark:text-blue-400">Store</span>
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={() => setActivePage('home')} className={`hidden md:block text-sm font-bold px-4 py-2 rounded-full transition-all duration-300 ${activePage === 'home' ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}>Store</button>
              <button onClick={() => setActivePage('staff')} className={`hidden md:block text-sm font-bold px-4 py-2 rounded-full transition-all duration-300 ${activePage === 'staff' ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}>Staff</button>
              
              <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden md:block"></div>
              
              {/* Dark Mode Toggle (Req #3) */}
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-full bg-slate-100 dark:bg-zinc-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all hover:rotate-12 active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-zinc-700">
                {isDarkMode ? <Sun size={20} className="text-yellow-400" fill="currentColor"/> : <Moon size={20} className="text-indigo-500" fill="currentColor"/>}
              </button>

              <button onClick={() => setIsContactOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-slate-200 text-white dark:text-slate-900 px-5 py-2.5 rounded-full text-sm font-bold hover:shadow-lg hover:shadow-slate-500/20 hover:-translate-y-0.5 transition-all">
                 <Menu size={18}/> <span className="hidden sm:inline">Contact</span>
              </button>
            </div>
          </div>
        </nav>

        {/* --- ADMIN CONTACT POPUP --- */}
        {isContactOpen && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fadeIn" onClick={(e) => {if(e.target === e.currentTarget) setIsContactOpen(false)}}>
              <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2rem] border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden relative transform transition-all scale-100">
                 <button onClick={() => setIsContactOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-zinc-800 rounded-full hover:bg-slate-200 transition text-slate-500"><X size={20}/></button>
                 
                 <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 text-cyan-600 dark:text-cyan-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                       <Mail size={36} />
                    </div>
                    <h3 className="text-3xl font-black mb-2 text-slate-900 dark:text-white">Hubungi Admin</h3>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">Pilih platform di bawah untuk menghubungi kami.<br/>Fast response 24/7!</p>
                    
                    <div className="grid grid-cols-1 gap-3">
                       {SOCIALS.map((social) => (
                          <a 
                             key={social.name} 
                             href={social.url} 
                             target="_blank" 
                             rel="noreferrer"
                             className={`flex items-center gap-4 p-4 rounded-2xl text-white font-bold transition-all hover:scale-[1.03] hover:shadow-xl bg-gradient-to-r ${social.color} shadow-lg`}
                          >
                             {social.icon}
                             <span>{social.name}</span>
                             <ExternalLink size={18} className="ml-auto opacity-70"/>
                          </a>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        )}

        <main className="container mx-auto px-4 pt-32 pb-20 min-h-screen relative z-10">
          {activePage === 'home' ? (
            <div className="space-y-12 animate-fadeIn">
               {/* --- HERO & SEARCH --- */}
               <div className="text-center py-16 px-4 rounded-[3rem] border border-white/40 dark:border-white/5 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-sm shadow-xl shadow-indigo-500/5 relative overflow-hidden">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
                  
                  <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 animate-gradient">Digital Needs.</span>
                    <br/>
                    <span className="text-slate-800 dark:text-white">Solved.</span>
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-8 text-lg font-medium leading-relaxed">
                    Platform top up game, software, dan akun premium termurah dengan proses kilat dan terpercaya.
                  </p>
                  
                  <div className="max-w-lg mx-auto relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative flex items-center bg-white dark:bg-black rounded-full p-1.5 ring-1 ring-black/5 dark:ring-white/10 shadow-2xl">
                        <div className="pl-4 text-slate-400"><Search size={22}/></div>
                        <input 
                          type="text" 
                          placeholder="Cari item (e.g. Mobile Legends)..." 
                          className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 font-medium"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button className="bg-slate-900 dark:bg-white text-white dark:text-black p-3 rounded-full hover:scale-105 transition-transform">
                          <ChevronRight size={20}/>
                        </button>
                    </div>
                  </div>
               </div>

               {/* Categories */}
               <div className="flex gap-3 justify-center overflow-x-auto pb-6 scrollbar-hide">
                  {['All', 'Game', 'Akun', 'Software'].map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 border ${
                        selectedCategory === cat 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent shadow-lg shadow-cyan-500/25 scale-105' 
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
               </div>

               {isLoading ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                   {[1,2,3,4].map(i => <ProductSkeleton key={i} />)}
                 </div>
               ) : filteredProducts.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 opacity-60">
                    <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-full mb-4"><Search size={32}/></div>
                    <p className="font-bold text-lg">Produk tidak ditemukan</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                   {filteredProducts.map(product => (
                     <div 
                       key={product.id} 
                       onClick={() => { setSelectedProduct(product); setCheckoutStep(1); }}
                       className="group bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-white/40 dark:border-white/5 rounded-3xl p-4 cursor-pointer hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/10 dark:hover:shadow-cyan-900/20 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden"
                     >
                         <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-transparent to-purple-500/0 group-hover:from-cyan-500/5 group-hover:to-purple-500/5 transition-colors duration-500"></div>
                         
                         <div className="aspect-[4/3] bg-slate-100 dark:bg-black/40 rounded-2xl mb-5 overflow-hidden relative shadow-inner">
                            {product.image_url ? (
                              <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"/>
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-5xl font-black text-slate-200 dark:text-zinc-800 group-hover:text-cyan-500/20 transition-colors">
                                {product.name.slice(0,2).toUpperCase()}
                              </div>
                            )}
                            <div className="absolute top-3 right-3 bg-white/80 dark:bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/20 shadow-sm">
                               {product.icon === 'Gamepad' ? <Gamepad size={18} className="text-purple-500"/> :
                                product.icon === 'Zap' ? <Zap size={18} className="text-yellow-500"/> :
                                <Monitor size={18} className="text-blue-500"/>}
                            </div>
                         </div>
                         
                         <div className="relative px-1 pb-1">
                            <div className="flex justify-between items-start mb-2">
                               <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{product.name}</h3>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{product.category}</p>
                                   <p className="font-black text-lg bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400">
                                      Rp {product.price?.toLocaleString()}
                                   </p>
                                </div>
                                <div className="bg-slate-100 dark:bg-white/5 p-2.5 rounded-full group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300 group-hover:rotate-12 group-hover:shadow-lg group-hover:shadow-cyan-500/30">
                                   <ShoppingCart size={20}/>
                                </div>
                             </div>
                         </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          ) : (
            // --- HALAMAN STAFF / LAPORAN ---
            <div className="animate-fadeIn max-w-6xl mx-auto">
               {!isStaffLoggedIn ? (
                 <div className="max-w-md mx-auto bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/50 dark:border-white/10 shadow-2xl mt-20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                    <div className="text-center mb-8">
                       <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-700 dark:text-slate-300">
                          <ShieldCheck size={32}/>
                       </div>
                       <h2 className="text-3xl font-black text-slate-900 dark:text-white">Staff Only</h2>
                       <p className="text-slate-500 mt-2">Masukkan PIN untuk mengakses dashboard.</p>
                    </div>
                    <form onSubmit={handleStaffLogin} className="space-y-6">
                       <input type="password" value={staffPinInput} onChange={e=>setStaffPinInput(e.target.value)} className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 p-4 rounded-2xl text-center text-3xl tracking-[0.5em] font-bold focus:ring-4 ring-cyan-500/20 outline-none transition-all focus:border-cyan-500" placeholder="••••"/>
                       <button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-1">ACCESS DASHBOARD</button>
                    </form>
                 </div>
               ) : (
                 <div className="space-y-8">
                    {/* Header Dashboard */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm">
                       <div>
                          <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Laporan Penjualan</h2>
                          <p className="text-slate-500 font-medium">Ringkasan aktivitas transaksi WuregStore.</p>
                       </div>
                       <div className="flex items-center gap-3">
                          <button onClick={fetchFilteredTransactions} className="flex items-center gap-2 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-5 py-2.5 rounded-xl font-bold transition-all">
                             <RefreshCw size={18} className={isReportLoading ? 'animate-spin' : ''}/> Update
                          </button>
                          <button onClick={downloadCSV} className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all">
                             <Download size={18}/> CSV
                          </button>
                          <button onClick={()=>setIsStaffLoggedIn(false)} className="bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2">
                             <LogOut size={18}/>
                          </button>
                       </div>
                    </div>

                    {/* Filter Tanggal */}
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                       {[
                         {id: 'today', label: 'Hari Ini'},
                         {id: 'week', label: '7 Hari'},
                         {id: 'month', label: '30 Hari'},
                         {id: 'all', label: 'Semua'}
                       ].map(f => (
                         <button 
                           key={f.id}
                           onClick={() => setReportFilter(f.id as any)}
                           className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold border transition-all duration-300 ${
                             reportFilter === f.id
                             ? 'bg-gradient-to-r from-cyan-500 to-blue-500 border-transparent text-white shadow-lg shadow-blue-500/25'
                             : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
                           }`}
                         >
                            <Calendar size={16}/> {f.label}
                         </button>
                       ))}
                    </div>

                    {/* Ringkasan Cards */}
                    {isReportLoading ? (
                      <div className="h-40 w-full bg-slate-200 dark:bg-zinc-800 animate-pulse rounded-3xl"/>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-8 rounded-[2rem] text-white shadow-xl shadow-cyan-500/20 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                           <div className="flex justify-between items-start mb-6 relative">
                              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm"><TrendingUp size={28}/></div>
                              <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">GROSS REVENUE</span>
                           </div>
                           <h3 className="text-4xl font-black mb-1">Rp {totalRevenue.toLocaleString()}</h3>
                           <p className="text-cyan-100 font-medium">Total Omzet Penjualan</p>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm relative group">
                           <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl -mr-8 -mt-8 group-hover:bg-purple-500/10 transition-colors"></div>
                           <div className="flex justify-between items-start mb-6">
                              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-2xl text-purple-600 dark:text-purple-400"><ShoppingCart size={28}/></div>
                           </div>
                           <h3 className="text-4xl font-black mb-1 text-slate-900 dark:text-white">{transactions.length}</h3>
                           <p className="text-slate-500 font-medium">Total Transaksi</p>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm relative group">
                           <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-xl -mr-8 -mt-8 group-hover:bg-green-500/10 transition-colors"></div>
                           <div className="flex justify-between items-start mb-6">
                              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-2xl text-green-600 dark:text-green-400"><CheckCircle size={28}/></div>
                           </div>
                           <h3 className="text-4xl font-black mb-1 text-slate-900 dark:text-white">{successCount}</h3>
                           <p className="text-slate-500 font-medium">Transaksi Sukses</p>
                        </div>
                      </div>
                    )}

                    {/* Analisis & Tabel */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                       {/* Kiri: Statistik */}
                       <div className="lg:col-span-1 space-y-8">
                          {/* Top Products */}
                          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm">
                             <h4 className="font-bold mb-6 flex items-center gap-3 text-lg"><Star size={20} className="text-yellow-500" fill="currentColor"/> Top Produk</h4>
                             <div className="space-y-4">
                                {topProducts.length === 0 ? <p className="text-sm text-slate-500">Belum ada data.</p> : topProducts.map(([name, count]: any, idx) => (
                                  <div key={idx} className="flex justify-between items-center group">
                                     <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                          idx === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                                          idx === 1 ? 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-400' :
                                          'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                        }`}>{idx+1}</div>
                                        <span className="text-sm font-bold line-clamp-1 w-28 group-hover:text-cyan-600 transition-colors">{name}</span>
                                     </div>
                                     <span className="text-xs font-bold bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-lg">{count}x</span>
                                  </div>
                                ))}
                             </div>
                          </div>
                          
                          {/* Payment Methods */}
                          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm">
                             <h4 className="font-bold mb-6 flex items-center gap-3 text-lg"><CreditCard size={20} className="text-blue-500"/> Metode</h4>
                             <div className="space-y-4">
                                {Object.entries(paymentCount).map(([method, count]: any) => (
                                   <div key={method} className="flex flex-col gap-1.5">
                                      <div className="flex justify-between text-sm font-bold">
                                        <span className="text-slate-600 dark:text-slate-400">{method}</span>
                                        <span>{count}</span>
                                      </div>
                                      <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                         <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" style={{width: `${(count / transactions.length) * 100}%`}}></div>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          </div>
                       </div>

                       {/* Kanan: Tabel Riwayat */}
                       <div className="lg:col-span-3 bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col shadow-sm">
                          <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex justify-between items-center backdrop-blur-sm">
                             <h4 className="font-bold text-lg">Riwayat Transaksi</h4>
                             <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full">Live Data</span>
                          </div>
                          <div className="overflow-x-auto">
                             <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase border-b border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-zinc-800/50">
                                   <tr>
                                      <th className="p-5 font-bold">Waktu</th>
                                      <th className="p-5 font-bold">Produk / Buyer</th>
                                      <th className="p-5 font-bold">Detail Info</th>
                                      <th className="p-5 font-bold">Status Action</th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                   {transactions.length === 0 ? (
                                     <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-medium">Tidak ada data untuk periode ini.</td></tr>
                                   ) : transactions.map(t => (
                                     <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="p-5 text-slate-500 whitespace-nowrap">
                                           <div className="font-bold text-slate-700 dark:text-slate-300">{new Date(t.created_at).toLocaleDateString('id-ID')}</div>
                                           <div className="text-xs opacity-60 font-mono mt-0.5">{new Date(t.created_at).toLocaleTimeString('id-ID')}</div>
                                        </td>
                                        <td className="p-5">
                                           <div className="font-bold text-slate-900 dark:text-white text-base">{t.product_name}</div>
                                           <div className="text-sm text-slate-500 font-medium">{t.buyer_name}</div>
                                           <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400 mt-1 bg-cyan-50 dark:bg-cyan-900/20 px-2 py-0.5 rounded w-fit">Rp {t.price?.toLocaleString()}</div>
                                        </td>
                                        <td className="p-5">
                                           <div className="flex flex-col gap-1.5">
                                              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                                                <Mail size={12}/> {t.buyer_email || '-'}
                                              </div>
                                              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-500">
                                                <Smartphone size={12}/> {t.device_model || '-'}
                                              </div>
                                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                <CreditCard size={10}/> {t.payment_method}
                                              </div>
                                           </div>
                                        </td>
                                        <td className="p-5">
                                           <button 
                                              onClick={() => handleUpdateStatus(t.id, t.status)}
                                              disabled={statusUpdateId === t.id}
                                              className={`text-xs px-4 py-2 rounded-xl font-bold border transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-sm ${
                                                t.status === 'Selesai' ? 'bg-green-500 text-white border-green-600 hover:bg-green-600' 
                                                : t.status === 'Gagal' ? 'bg-red-500 text-white border-red-600 hover:bg-red-600'
                                                : 'bg-yellow-400 text-yellow-900 border-yellow-500 hover:bg-yellow-300'
                                              }`}
                                           >
                                              {statusUpdateId === t.id ? <Loader2 size={12} className="animate-spin"/> : 
                                               t.status === 'Selesai' ? <CheckCircle size={12}/> :
                                               t.status === 'Gagal' ? <X size={12}/> : <Loader2 size={12}/>
                                              }
                                              {t.status}
                                           </button>
                                        </td>
                                     </tr>
                                   ))}
                                </tbody>
                             </table>
                          </div>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          )}
        </main>

        {/* --- CHECKOUT MODAL --- */}
        {selectedProduct && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fadeIn">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
               <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-md z-10">
                  <div>
                    <h3 className="font-black text-xl text-slate-900 dark:text-white">Checkout</h3>
                    <p className="text-sm text-slate-500 font-medium">Selesaikan pesananmu sekarang</p>
                  </div>
                  <button onClick={() => setSelectedProduct(null)} className="p-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-full transition-colors"><X size={20}/></button>
               </div>
               
               <div className="p-8 overflow-y-auto custom-scrollbar relative">
                  <div className="flex items-center gap-5 bg-gradient-to-br from-slate-50 to-white dark:from-zinc-800 dark:to-zinc-900 p-5 rounded-3xl border border-slate-100 dark:border-white/5 mb-8 shadow-sm">
                     <div className="h-16 w-16 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/40 rounded-2xl flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-black text-xl shadow-inner">
                        {selectedProduct.name.slice(0,1)}
                     </div>
                     <div>
                        <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{selectedProduct.name}</h4>
                        <div className="flex items-center gap-2">
                           <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs px-2 py-0.5 rounded-lg font-bold">{selectedProduct.category}</span>
                           <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Rp {selectedProduct.price?.toLocaleString()}</p>
                        </div>
                     </div>
                  </div>
                  
                  {checkoutStep === 1 ? (
                    <div className="space-y-5 animate-slideIn">
                       <div>
                          <label className="text-xs font-bold text-slate-500 uppercase ml-3 mb-2 block">Nama Lengkap</label>
                          <input 
                            type="text" 
                            value={buyerForm.name}
                            onChange={e => setBuyerForm({...buyerForm, name: e.target.value})}
                            className={`w-full bg-slate-50 dark:bg-black border rounded-2xl p-4 outline-none focus:ring-4 focus:ring-cyan-500/20 transition-all font-medium ${formErrors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-zinc-800 focus:border-cyan-500'}`}
                            placeholder="Contoh: Budi Santoso"
                          />
                          {formErrors.name && <p className="text-red-500 text-xs mt-2 ml-2 flex items-center gap-1 font-bold"><AlertCircle size={12}/> {formErrors.name}</p>}
                       </div>
                       <div>
                          <label className="text-xs font-bold text-slate-500 uppercase ml-3 mb-2 block">WhatsApp / Email</label>
                          <input 
                            type="text" 
                            value={buyerForm.email}
                            onChange={e => setBuyerForm({...buyerForm, email: e.target.value})}
                            className={`w-full bg-slate-50 dark:bg-black border rounded-2xl p-4 outline-none focus:ring-4 focus:ring-cyan-500/20 transition-all font-medium ${formErrors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-zinc-800 focus:border-cyan-500'}`}
                            placeholder="0812... atau email@..."
                          />
                           {formErrors.email && <p className="text-red-500 text-xs mt-2 ml-2 flex items-center gap-1 font-bold"><AlertCircle size={12}/> {formErrors.email}</p>}
                       </div>
                       {selectedProduct.category === 'Akun' && (
                         <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-3xl border border-blue-100 dark:border-blue-500/20">
                            <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2 block flex items-center gap-2"><Smartphone size={14}/> Info Device (Wajib)</label>
                            <input 
                              type="text" 
                              value={buyerForm.device_model}
                              onChange={e => setBuyerForm({...buyerForm, device_model: e.target.value})}
                              className={`w-full bg-white dark:bg-zinc-900 border rounded-2xl p-4 outline-none focus:border-blue-500 transition-all font-medium ${formErrors.device_model ? 'border-red-500' : 'border-blue-200 dark:border-blue-800'}`}
                              placeholder="Android / iOS (Tipe HP)"
                            />
                            {formErrors.device_model && <p className="text-red-500 text-xs mt-2 font-bold">{formErrors.device_model}</p>}
                         </div>
                       )}
                       <button 
                         onClick={() => { if(validateForm()) setCheckoutStep(2); }}
                         className="w-full bg-slate-900 dark:bg-white text-white dark:text-black font-bold py-5 rounded-2xl mt-6 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2 shadow-xl"
                       >
                         Lanjut Pembayaran <ChevronRight size={18}/>
                       </button>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-slideIn">
                       <p className="text-sm font-bold text-slate-500 uppercase ml-1">Pilih Metode Pembayaran</p>
                       <div className="grid grid-cols-1 gap-4">
                          {PAYMENT_METHODS.map(m => (
                             <div 
                               key={m.id} 
                               onClick={() => setSelectedPayment(m.id)}
                               className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${
                                 selectedPayment === m.id 
                                 ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 ring-2 ring-cyan-500 shadow-lg shadow-cyan-500/10 transform scale-[1.02]' 
                                 : 'border-slate-200 dark:border-zinc-800 hover:border-cyan-300 dark:hover:border-zinc-600 hover:bg-slate-50 dark:hover:bg-white/5'
                               }`}
                             >
                                <div className="flex justify-between items-center">
                                   <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${selectedPayment === m.id ? 'bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-white/10'}`}>
                                         {m.logo}
                                      </div>
                                      <span className="font-bold text-slate-800 dark:text-white">{m.name}</span>
                                   </div>
                                   {selectedPayment === m.id && <CheckCircle className="text-cyan-500" size={24} fill="currentColor"/>}
                                </div>
                                
                                {/* VA Display Logic (Req #2) */}
                                {selectedPayment === m.id && (
                                   <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 animate-fadeIn">
                                      <p className="text-xs text-slate-500 mb-1 font-bold">Nomor Virtual Account / Tujuan:</p>
                                      <div className="flex justify-between items-center bg-white dark:bg-black/30 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                                         <code className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm break-all mr-2">{m.va}</code>
                                         <button 
                                            onClick={(e) => {
                                               e.stopPropagation();
                                               navigator.clipboard.writeText(m.va); 
                                               showToast("Disalin ke clipboard!", "success")
                                            }} 
                                            className="text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30 p-2 rounded-lg hover:bg-cyan-200 dark:hover:bg-cyan-800/50 transition-colors"
                                            title="Salin"
                                         >
                                            <Copy size={16}/>
                                         </button>
                                      </div>
                                      <p className="text-[10px] text-slate-400 mt-2 italic">*Silakan transfer sesuai nominal yang tertera.</p>
                                   </div>
                                )}
                             </div>
                          ))}
                       </div>
                       <div className="flex gap-4 mt-8">
                          <button onClick={() => setCheckoutStep(1)} className="w-1/3 py-4 rounded-2xl font-bold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors text-slate-600 dark:text-slate-300">Kembali</button>
                          <button 
                            disabled={!selectedPayment || isSubmitting}
                            onClick={handleCheckoutSubmit}
                            className="w-2/3 py-4 rounded-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-lg shadow-green-500/30 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:scale-[1.02]"
                          >
                             {isSubmitting ? <Loader2 className="animate-spin"/> : <>Konfirmasi Pesanan <ShieldCheck size={20}/></>}
                          </button>
                       </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
          .animate-fadeIn { animation: fadeIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
          .animate-slideIn { animation: slideIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
          .animate-gradient { background-size: 200% auto; animation: gradient 4s linear infinite; }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; }
        `}} />
      </div>
    </div>
  );
}
