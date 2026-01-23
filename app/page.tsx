'use client';

import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import {
  Menu, X, Search, ShoppingCart, LogOut,
  Smartphone, CreditCard, CheckCircle,
  Loader2, AlertCircle, Download, Mail, Copy, AlignJustify,
  Plus, Trash2, Edit3, Eye, Wallet,
  Gamepad2, Lock, User, Globe, Power, Monitor, FileSpreadsheet, MessageCircle,
  Truck, Receipt, RefreshCw, ChevronRight, Zap, Instagram, Facebook, Twitter
} from 'lucide-react';

// --- 1. SETUP SUPABASE CLIENT ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
const ADMIN_PHONE_FALLBACK = "6281528483575";
const STORE_LOGO = "https://cdn.lynkid.my.id/profile/10-04-2025/1744247502273_9419383";

const createSupabaseClient = (baseUrl: string, key: string) => {
  if (!baseUrl || !key) return null;
  
  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('sb_access_token') : null;
    return {
      'apikey': key,
      'Authorization': token ? `Bearer ${token}` : `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  };

  return {
    auth: {
      signInWithPassword: async ({ email, password }: any) => {
        try {
          const res = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: { 'apikey': key, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if (!res.ok) return { data: null, error: { message: data.error_description || 'Login gagal' } };
          if(data.access_token) localStorage.setItem('sb_access_token', data.access_token);
          return { data, error: null };
        } catch (err: any) { return { data: null, error: { message: err.message } }; }
      },
      signOut: async () => {
        localStorage.removeItem('sb_access_token');
        return { error: null };
      },
      getUser: async () => {
         const token = localStorage.getItem('sb_access_token');
         if(!token) return { data: null };
         try {
             const res = await fetch(`${baseUrl}/auth/v1/user`, {
                 headers: { 'apikey': key, 'Authorization': `Bearer ${token}` }
             });
             if(!res.ok) throw new Error('Expired');
             return { data: await res.json() };
         } catch { return { data: null }; }
      }
    },
    from: (table: string) => {
      const url = new URL(`${baseUrl}/rest/v1/${table}`);
      let method = 'GET';
      let body: any = null;
      const builder = {
        select: (columns = '*') => { url.searchParams.set('select', columns); return builder; },
        order: (column: string, { ascending = true } = {}) => { url.searchParams.set('order', `${column}.${ascending ? 'asc' : 'desc'}`); return builder; },
        eq: (column: string, value: any) => { url.searchParams.set(column, `eq.${value}`); return builder; },
        in: (column: string, values: any[]) => { url.searchParams.set(column, `in.(${values.join(',')})`); return builder; },
        insert: (data: any) => { method = 'POST'; body = JSON.stringify(data); return builder; },
        update: (data: any) => { method = 'PATCH'; body = JSON.stringify(data); return builder; },
        delete: () => { method = 'DELETE'; return builder; },
        then: async (resolve: Function, reject: Function) => {
          try {
            const res = await fetch(url.toString(), { method, headers: getHeaders(), body });
            if (!res.ok) return resolve({ data: null, error: { message: await res.text() } });
            if (method === 'DELETE' || res.status === 204) return resolve({ data: [], error: null });
            return resolve({ data: await res.json(), error: null });
          } catch (err: any) { return reject({ message: err.message }); }
        }
      };
      return builder;
    }
  };
};

const supabase: any = createSupabaseClient(supabaseUrl, supabaseKey);

// --- 2. UI COMPONENTS ---

const Background = () => (
  <div className="fixed inset-0 -z-50 bg-slate-50">
    {/* Static gradient mesh - No Animation for Performance */}
    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[100px] opacity-60"></div>
    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-100 rounded-full blur-[100px] opacity-60"></div>
  </div>
);

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <div className={`fixed top-24 right-4 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border bg-white ${
    type === 'success' ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'
  }`}>
    {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
    <span className="font-bold text-sm">{message}</span>
    <button onClick={onClose}><X size={16}/></button>
  </div>
);

// --- 3. MAIN APP ---
export default function WuregStore() {
  const [activePage, setActivePage] = useState('home');
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Data
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [contactMethods, setContactMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Tracking
  const [trackId, setTrackId] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);
  const [isTrackLoading, setIsTrackLoading] = useState(false);

  // Checkout
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [buyerForm, setBuyerForm] = useState({ name: '', email: '', device_model: '' });
  const [topUpForm, setTopUpForm] = useState({ userId: '', zoneId: '' });
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Staff
  const [isStaffLoggedIn, setIsStaffLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [adminTab, setAdminTab] = useState<'dash' | 'trx' | 'prod' | 'setting'>('dash');
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // For Bulk Action
  
  // CRUD
  const [modalType, setModalType] = useState<'product' | 'payment' | 'voucher' | 'contact' | 'invoice' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null); 
  const [detailTrx, setDetailTrx] = useState<any>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<any>({});

  // --- HELPER ---
  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPublicData = async () => {
    setIsLoading(true);
    const [p, pm, cm] = await Promise.all([
      supabase.from('products').select('*').order('created_at', {ascending: false}),
      supabase.from('payment_methods').select('*').eq('is_active', true).order('created_at', {ascending: true}),
      supabase.from('contact_methods').select('*').eq('is_active', true)
    ]);
    if(p.data) setProducts(p.data);
    if(pm.data) setPaymentMethods(pm.data);
    if(cm.data) setContactMethods(cm.data);
    setIsLoading(false);
  };

  const refreshAdminData = async () => {
    if (!isStaffLoggedIn) return;
    const [t, v, pmAll, cmAll] = await Promise.all([
      supabase.from('transactions').select('*').order('created_at', {ascending: false}),
      supabase.from('vouchers').select('*').order('created_at', {ascending: false}),
      supabase.from('payment_methods').select('*').order('created_at', {ascending: true}),
      supabase.from('contact_methods').select('*').order('created_at', {ascending: true})
    ]);
    if(t.data) setTransactions(t.data);
    if(v.data) setVouchers(v.data);
    if(pmAll.data) setPaymentMethods(pmAll.data); 
    if(cmAll.data) setContactMethods(cmAll.data);
  };

  // --- EFFECTS ---
  useEffect(() => {
    fetchPublicData();
    const checkUser = async () => {
        const {data} = await supabase.auth.getUser();
        if(data) setIsStaffLoggedIn(true);
    };
    checkUser();
  }, []);

  useEffect(() => {
    if(isStaffLoggedIn) refreshAdminData();
  }, [isStaffLoggedIn]);

  // --- HANDLERS ---
  const handleTrackOrder = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!trackId) return showToast("Masukkan ID Transaksi", "error");
      setIsTrackLoading(true);
      const { data } = await supabase.from('transactions').select('*').eq('id', trackId).in('id', [trackId]);
      if(data && data.length > 0) {
          setTrackResult(data[0]);
          showToast("Pesanan Ditemukan", "success");
      } else {
          setTrackResult(null);
          showToast("ID Transaksi Tidak Ditemukan", "error");
      }
      setIsTrackLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsAuthLoading(true);
      const { error } = await supabase.auth.signInWithPassword(loginForm);
      if(error) showToast("Login Gagal: " + error.message, 'error');
      else { 
          setIsStaffLoggedIn(true); 
          showToast("Selamat Datang Staff!", "success"); 
          setLoginForm({email:'', password:''}); 
      }
      setIsAuthLoading(false);
  };

  const handleSaveItem = async (table: string, payload: any) => {
    try {
      const res = editingItem?.id 
        ? await supabase.from(table).update(payload).eq('id', editingItem.id)
        : await supabase.from(table).insert([payload]);
      
      if (res.error) throw new Error(res.error.message);
      
      showToast("Berhasil Disimpan", "success"); 
      setModalType(null); 
      setEditingItem(null);
      refreshAdminData(); 
      fetchPublicData();
    } catch (err: any) { 
        showToast("Gagal: " + err.message, "error"); 
    }
  };

  const handleDelete = async (table: string, id: string) => {
    if(!confirm("Hapus data ini secara permanen?")) return;
    try {
        await supabase.from(table).delete().eq('id', id);
        refreshAdminData(); 
        fetchPublicData();
        showToast("Terhapus", "success");
    } catch (err) { showToast("Gagal hapus", "error"); }
  };

  // Bulk Delete Feature Recovery
  const handleBulkDelete = async () => {
      if(selectedIds.length === 0 || !confirm(`Hapus ${selectedIds.length} item?`)) return;
      await supabase.from('transactions').delete().in('id', selectedIds);
      setSelectedIds([]);
      refreshAdminData();
      showToast("Bulk delete sukses", "success");
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
      await supabase.from('transactions').update({status: newStatus}).eq('id', id);
      refreshAdminData();
      showToast(`Status: ${newStatus}`, "success");
  };

  const handleToggleActive = async (table: string, id: string, current: boolean) => {
      await supabase.from(table).update({is_active: !current}).eq('id', id);
      refreshAdminData(); fetchPublicData();
      showToast(`Status diubah`, "success");
  };

  const handleCheckout = async () => {
    if(!selectedPayment) return showToast("Pilih metode pembayaran", "error");
    setIsSubmitting(true);
    const finalPrice = Math.max(0, selectedProduct.price - (appliedVoucher?.amount || 0));
    const trxData = {
      buyer_name: buyerForm.name,
      buyer_email: buyerForm.email,
      product_name: selectedProduct.name,
      price: finalPrice,
      payment_method: selectedPayment.name,
      status: 'Pending',
      device_model: selectedProduct.category === 'TopUp' ? `${topUpForm.userId} (${topUpForm.zoneId})` : buyerForm.device_model
    };

    const { data, error } = await supabase.from('transactions').insert([trxData]).select();
    if(!error) {
       const newId = data?.[0]?.id || 'NEW';
       const wa = contactMethods.find(c => c.platform_name.toLowerCase().includes('wa'))?.url || `https://wa.me/${ADMIN_PHONE_FALLBACK}`;
       const msg = `Halo Admin, Order Baru!\nID: ${newId}\nItem: ${selectedProduct.name}\nTotal: Rp ${finalPrice.toLocaleString()}\nVia: ${selectedPayment.name}`;
       window.open(`${wa}?text=${encodeURIComponent(msg)}`, '_blank');
       
       showToast("Order Berhasil Dibuat!", "success"); 
       setSelectedProduct(null); 
       setCheckoutStep(1);
       setBuyerForm({ name: '', email: '', device_model: '' }); 
    } else showToast("Gagal: " + error.message, "error");
    setIsSubmitting(false);
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen font-sans text-slate-800">
      <Background />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}

      {/* FLOATING NAVBAR */}
      <nav className="fixed top-0 inset-x-0 md:top-4 md:inset-x-6 z-50 bg-white/80 backdrop-blur-md border-b md:border border-slate-200 md:rounded-2xl shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={()=>setActivePage('home')}>
                <img src={STORE_LOGO} className="w-9 h-9 rounded-full border border-white shadow-sm object-cover"/>
                <div>
                    <h1 className="font-black text-xl leading-none tracking-tight text-slate-900">WuregStore</h1>
                    <p className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">Official</p>
                </div>
            </div>
            
            <div className="hidden md:flex items-center gap-1 bg-white/50 p-1 rounded-xl border border-slate-100">
                {['home', 'tracking', 'staff'].map(page => (
                    <button key={page} onClick={()=>setActivePage(page)} className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${activePage===page ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>
                        {page}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-2">
                 <button onClick={()=>setIsContactModalOpen(true)} className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md transition-all"><MessageCircle size={16}/> Bantuan</button>
                 <button onClick={()=>setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 bg-slate-100 rounded-xl text-slate-600"><AlignJustify size={20}/></button>
            </div>
        </div>
        
        {isMobileMenuOpen && (
            <div className="bg-white border-t p-4 flex flex-col gap-2 md:hidden shadow-lg">
                <button onClick={()=>{setActivePage('home'); setIsMobileMenuOpen(false)}} className="p-3 font-bold text-left rounded-xl hover:bg-slate-50 flex gap-3 text-slate-700"><ShoppingCart size={18}/> Store</button>
                <button onClick={()=>{setActivePage('tracking'); setIsMobileMenuOpen(false)}} className="p-3 font-bold text-left rounded-xl hover:bg-slate-50 flex gap-3 text-slate-700"><Truck size={18}/> Cek Pesanan</button>
                <button onClick={()=>{setActivePage('staff'); setIsMobileMenuOpen(false)}} className="p-3 font-bold text-left rounded-xl hover:bg-slate-50 flex gap-3 text-slate-700"><Lock size={18}/> Staff Area</button>
                <button onClick={()=>{setIsContactModalOpen(true); setIsMobileMenuOpen(false)}} className="p-3 font-bold text-left rounded-xl hover:bg-slate-50 flex gap-3 text-slate-700"><MessageCircle size={18}/> Bantuan & Kontak</button>
            </div>
        )}
      </nav>

      {/* CONTENT */}
      <main className="max-w-7xl mx-auto px-4 pt-24 md:pt-28 pb-10">
        
        {/* --- 1. HOME PAGE --- */}
        {activePage === 'home' && (
          <div>
             {/* Hero Banner (No Animation) */}
             <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white rounded-3xl p-8 md:p-12 mb-8 relative overflow-hidden shadow-xl">
                <div className="relative z-10 max-w-xl">
                    <span className="bg-white/20 backdrop-blur-md border border-white/20 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">Trusted by 10k+ Gamers</span>
                    <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight">Top Up Game <br/><span className="text-cyan-300">Termurah & Cepat</span></h1>
                    <div className="relative group max-w-md bg-white rounded-2xl p-1 flex items-center shadow-lg">
                        <div className="pl-3 pr-2 text-slate-400"><Search size={20}/></div>
                        <input className="w-full py-3 pr-4 rounded-xl font-bold text-slate-800 outline-none placeholder:text-slate-400" placeholder="Cari Game..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
                    </div>
                </div>
                <Gamepad2 className="absolute -right-10 -bottom-10 text-white/10 w-72 h-72 rotate-12"/>
             </div>

             {/* Categories */}
             <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
                {['All', 'Game', 'TopUp', 'Akun', 'Software'].map(c => (
                    <button key={c} onClick={()=>setSelectedCategory(c)} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${selectedCategory===c ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'}`}>{c}</button>
                ))}
             </div>

             {/* Products Grid */}
             {isLoading ? (
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                     {[1,2,3,4,5].map(i => <div key={i} className="h-64 bg-white rounded-3xl border border-slate-100"/>)}
                 </div>
             ) : (
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {products.filter(p => (selectedCategory === 'All' || p.category === selectedCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                        <div key={p.id} onClick={()=>{if(p.is_ready){setSelectedProduct(p); setCheckoutStep(1);}}} className={`group bg-white p-3 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer ${!p.is_ready && 'opacity-60 grayscale'}`}>
                            <div className="aspect-square bg-slate-50 rounded-2xl mb-3 overflow-hidden relative">
                                {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform"/> : <div className="w-full h-full flex items-center justify-center font-black text-slate-200 text-4xl">{p.name[0]}</div>}
                                {!p.is_ready && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-black text-xs rotate-12 backdrop-blur-sm rounded-xl m-2">STOK HABIS</div>}
                                {p.label && <div className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-sm uppercase">{p.label}</div>}
                            </div>
                            <div className="px-1">
                                <h3 className="font-bold text-slate-800 text-sm line-clamp-1 mb-1">{p.name}</h3>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{p.category}</p>
                                        <span className="font-black text-slate-900 text-lg">Rp {p.price.toLocaleString()}</span>
                                    </div>
                                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all"><ShoppingCart size={14}/></div>
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
             )}
          </div>
        )}

        {/* --- 2. TRACKING PAGE --- */}
        {activePage === 'tracking' && (
            <div className="max-w-xl mx-auto mt-10">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 text-center">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><Truck size={32}/></div>
                    <h2 className="text-3xl font-black text-slate-800 mb-2">Lacak Pesanan</h2>
                    <p className="text-slate-500 mb-8 font-medium">Masukkan ID Transaksi untuk melihat status terkini.</p>
                    
                    <form onSubmit={handleTrackOrder} className="flex gap-2 mb-8">
                        <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 ring-indigo-500" placeholder="Contoh: 843912..." value={trackId} onChange={e=>setTrackId(e.target.value)}/>
                        <button disabled={isTrackLoading} className="bg-slate-900 text-white px-6 rounded-2xl font-bold">{isTrackLoading ? <Loader2 className="animate-spin"/> : 'Cek'}</button>
                    </form>

                    {trackResult && (
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-cyan-500"></div>
                            <div className="flex justify-between items-start mb-4">
                                <div><p className="text-[10px] text-slate-400 font-bold uppercase">ID Transaksi</p><p className="font-mono font-bold text-xl text-slate-800">#{trackResult.id.slice(0,8)}</p></div>
                                <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${trackResult.status==='Selesai'?'bg-green-100 text-green-700':trackResult.status==='Pending'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{trackResult.status}</span>
                            </div>
                            <div className="space-y-2 text-sm border-t border-slate-200 pt-4">
                                <div className="flex justify-between"><span>Produk</span><span className="font-bold">{trackResult.product_name}</span></div>
                                <div className="flex justify-between"><span>Total</span><span className="font-black text-indigo-600">Rp {trackResult.price.toLocaleString()}</span></div>
                                <div className="text-center text-xs text-slate-400 pt-2">Dibuat pada {new Date(trackResult.created_at).toLocaleString()}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* --- 3. STAFF PAGE --- */}
        {activePage === 'staff' && (
            <div>
                {!isStaffLoggedIn ? (
                    <div className="max-w-md mx-auto bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 text-center mt-10">
                        <div className="w-16 h-16 bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6"><Lock size={32}/></div>
                        <h2 className="text-3xl font-black mb-2 text-slate-800">Staff Portal</h2>
                        <form onSubmit={handleLogin} className="space-y-4 mt-8">
                            <input type="email" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 ring-slate-900" placeholder="Email Address" value={loginForm.email} onChange={e=>setLoginForm({...loginForm, email: e.target.value})} required/>
                            <input type="password" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 ring-slate-900" placeholder="Password" value={loginForm.password} onChange={e=>setLoginForm({...loginForm, password: e.target.value})} required/>
                            <button disabled={isAuthLoading} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all">{isAuthLoading ? <Loader2 className="animate-spin mx-auto"/> : 'Access Dashboard'}</button>
                        </form>
                    </div>
                ) : (
                    <div>
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                             <div className="flex gap-2 overflow-x-auto p-1">
                                 {[{id:'dash', l:'Dashboard', i:Monitor}, {id:'trx', l:'Transaksi', i:FileSpreadsheet}, {id:'prod', l:'Produk', i:Gamepad2}, {id:'setting', l:'Setting', i:Lock}].map(m => (
                                     <button key={m.id} onClick={()=>setAdminTab(m.id as any)} className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${adminTab===m.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><m.i size={16}/> {m.l}</button>
                                 ))}
                             </div>
                             <button onClick={async()=>{await supabase.auth.signOut(); setIsStaffLoggedIn(false)}} className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 flex items-center gap-2 mr-1"><Power size={14}/> Logout</button>
                        </div>

                        {/* DASHBOARD */}
                        {adminTab === 'dash' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-[2rem] shadow-lg text-white relative overflow-hidden">
                                    <p className="text-indigo-100 font-bold text-xs uppercase tracking-wider mb-1">Total Pendapatan</p>
                                    <h3 className="text-4xl font-black">Rp {transactions.reduce((a,b)=>a+(b.price||0),0).toLocaleString()}</h3>
                                    <Wallet className="absolute -bottom-4 -right-4 text-white/20 w-32 h-32 rotate-12"/>
                                </div>
                                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">Total Pesanan</p>
                                    <h3 className="text-4xl font-black text-slate-800">{transactions.length}</h3>
                                </div>
                                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-orange-500"></div>
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">Produk Aktif</p>
                                    <h3 className="text-4xl font-black text-slate-800">{products.length}</h3>
                                </div>
                            </div>
                        )}

                        {/* TRANSACTION TABLE */}
                        {adminTab === 'trx' && (
                            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                    <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">Data Transaksi {selectedIds.length > 0 && <span className="bg-slate-200 px-2 py-1 rounded text-xs">{selectedIds.length} Selected</span>}</h3>
                                    <div className="flex gap-2">
                                        {selectedIds.length > 0 && <button onClick={handleBulkDelete} className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200"><Trash2 size={18}/></button>}
                                        <button onClick={() => refreshAdminData()} className="p-2 bg-white border border-slate-200 rounded-xl hover:rotate-180 transition shadow-sm text-slate-600"><RefreshCw size={18}/></button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wide">
                                            <tr>
                                                <th className="p-4 w-4"><input type="checkbox" onChange={(e)=>{if(e.target.checked) setSelectedIds(transactions.map(t=>t.id)); else setSelectedIds([]);}}/></th>
                                                <th className="p-4">ID/Tanggal</th>
                                                <th className="p-4">Produk</th>
                                                <th className="p-4">Pembeli</th>
                                                <th className="p-4">Status</th>
                                                <th className="p-4 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {transactions.map(t => (
                                                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-4"><input type="checkbox" checked={selectedIds.includes(t.id)} onChange={(e)=>{if(e.target.checked) setSelectedIds([...selectedIds, t.id]); else setSelectedIds(selectedIds.filter(id=>id!==t.id));}}/></td>
                                                    <td className="p-4">
                                                        <div className="font-bold font-mono text-slate-800">#{t.id.slice(0,6)}</div>
                                                        <div className="text-[10px] text-slate-400 mt-1">{new Date(t.created_at).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-bold text-slate-800 text-sm">{t.product_name}</div>
                                                        <div className="text-[10px] font-black text-indigo-600 mt-1">Rp {t.price.toLocaleString()}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-bold text-slate-800 text-sm">{t.buyer_name}</div>
                                                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Smartphone size={10}/> {t.device_model||'-'}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <select value={t.status} onChange={(e) => handleStatusChange(t.id, e.target.value)} className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border-none outline-none cursor-pointer ring-1 ring-inset ${t.status==='Selesai'?'bg-green-50 text-green-700 ring-green-200':t.status==='Pending'?'bg-yellow-50 text-yellow-700 ring-yellow-200':'bg-red-50 text-red-700 ring-red-200'}`}>
                                                            <option value="Pending">Pending</option><option value="Proses">Proses</option><option value="Selesai">Selesai</option><option value="Gagal">Gagal</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button onClick={()=>{setDetailTrx(t); setModalType('invoice');}} className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-2 hover:bg-blue-100"><Eye size={16}/></button>
                                                        <button onClick={()=>handleDelete('transactions', t.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* PRODUCT TAB */}
                        {adminTab === 'prod' && (
                            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-black text-lg">Manajemen Produk</h3>
                                    <button onClick={()=>{setEditingItem(null); setFormData({}); setModalType('product');}} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 hover:bg-slate-800 transition">+ Tambah</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {products.map(p => (
                                        <div key={p.id} className="flex gap-4 p-4 border border-slate-100 rounded-2xl items-center relative group bg-white hover:shadow-md transition-all">
                                            <div className="w-14 h-14 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200">{p.image_url && <img src={p.image_url} className="w-full h-full object-cover"/>}</div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm truncate text-slate-800">{p.name}</h4>
                                                <p className="text-xs text-slate-500 font-medium mt-0.5">Rp {p.price.toLocaleString()}</p>
                                                <span className={`text-[9px] font-black uppercase mt-1 block ${p.is_ready ? 'text-green-500':'text-red-500'}`}>{p.is_ready ? 'Ready Stock':'Stok Habis'}</span>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button onClick={()=>{setEditingItem(p); setFormData(p); setModalType('product');}} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Edit3 size={14}/></button>
                                                <button onClick={()=>handleDelete('products', p.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg"><Trash2 size={14}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SETTING TAB */}
                        {adminTab === 'setting' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 {/* Payment */}
                                 <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                     <div className="flex justify-between mb-6 items-center"><h4 className="font-bold flex items-center gap-2"><CreditCard size={18}/> Metode Pembayaran</h4><button onClick={()=>{setEditingItem(null); setFormData({is_active:true}); setModalType('payment');}} className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold">+ Add</button></div>
                                     <div className="space-y-3">
                                         {paymentMethods.map(pm => (
                                             <div key={pm.id} className={`flex justify-between items-center p-4 border rounded-2xl transition-all ${pm.is_active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                                 <div><div className="font-bold text-sm text-slate-800">{pm.name}</div><div className="text-xs text-slate-500 font-mono mt-0.5">{pm.va_number}</div></div>
                                                 <div className="flex items-center gap-3">
                                                     <button onClick={()=>handleToggleActive('payment_methods', pm.id, pm.is_active)} className={`w-9 h-5 rounded-full relative transition-colors ${pm.is_active?'bg-green-500':'bg-slate-300'}`}><div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${pm.is_active?'left-5':'left-0.5'}`}/></button>
                                                     <button onClick={()=>{setEditingItem(pm); setFormData(pm); setModalType('payment');}} className="text-blue-600"><Edit3 size={16}/></button>
                                                     <button onClick={()=>handleDelete('payment_methods', pm.id)} className="text-red-600"><Trash2 size={16}/></button>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                                 {/* Contact */}
                                 <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                     <div className="flex justify-between mb-6 items-center"><h4 className="font-bold flex items-center gap-2"><Globe size={18}/> Kontak & Sosmed</h4><button onClick={()=>{setEditingItem(null); setFormData({is_active:true}); setModalType('contact');}} className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold">+ Add</button></div>
                                     <div className="space-y-3">
                                         {contactMethods.map(cm => (
                                             <div key={cm.id} className="flex justify-between items-center p-4 border border-slate-200 rounded-2xl bg-white">
                                                 <div className="flex items-center gap-3 overflow-hidden">
                                                     <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">{cm.image_url ? <img src={cm.image_url} className="w-5"/>:<Globe size={16}/>}</div>
                                                     <div className="truncate"><div className="font-bold text-sm text-slate-800">{cm.platform_name}</div><div className="text-[10px] text-slate-400 truncate max-w-[150px]">{cm.url}</div></div>
                                                 </div>
                                                 <div className="flex gap-2"><button onClick={()=>{setEditingItem(cm); setFormData(cm); setModalType('contact');}} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Edit3 size={14}/></button><button onClick={()=>handleDelete('contact_methods', cm.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg"><Trash2 size={14}/></button></div>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             </div>
                        )}
                    </div>
                )}
            </div>
        )}
      </main>

      {/* --- MODALS --- */}
      
      {/* CONTACT/HELP MODAL (Live Data from Supabase) */}
      {isContactModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative">
                  <button onClick={()=>setIsContactModalOpen(false)} className="absolute top-5 right-5 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition"><X size={20} className="text-slate-500"/></button>
                  <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600"><MessageCircle size={32}/></div>
                      <h3 className="font-black text-2xl text-slate-800">Pusat Bantuan</h3>
                      <p className="text-slate-500 text-sm mt-1">Hubungi kami melalui media sosial berikut</p>
                  </div>
                  <div className="space-y-3">
                      {contactMethods.length > 0 ? contactMethods.map(cm => (
                          <a key={cm.id} href={cm.url} target="_blank" className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all group">
                              <div className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
                                  {cm.image_url ? <img src={cm.image_url} className="w-5 h-5 object-contain"/> : <Globe size={20} className="text-slate-400"/>}
                              </div>
                              <span className="font-bold text-slate-700 group-hover:text-indigo-700">{cm.platform_name}</span>
                              <ChevronRight className="ml-auto text-slate-300 group-hover:text-indigo-400" size={18}/>
                          </a>
                      )) : <div className="text-center text-slate-400 py-4">Belum ada kontak tersedia.</div>}
                  </div>
              </div>
          </div>
      )}

      {/* CHECKOUT */}
      {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4 backdrop-blur-sm">
              <div className="bg-white w-full md:max-w-md rounded-t-[2rem] md:rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center gap-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">{selectedProduct.image_url && <img src={selectedProduct.image_url} className="w-full h-full object-cover"/>}</div>
                      <div><h3 className="font-black text-lg text-slate-900 leading-tight">{selectedProduct.name}</h3><p className="text-indigo-600 font-bold text-base mt-1">Rp {selectedProduct.price.toLocaleString()}</p></div>
                  </div>

                  {checkoutStep === 1 ? (
                      <div className="space-y-5">
                          <div><label className="text-xs font-bold text-slate-400 uppercase ml-2 mb-1 block">Info Pembeli</label><input className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 ring-indigo-500 transition shadow-sm" placeholder="Nama Lengkap" value={buyerForm.name} onChange={e=>setBuyerForm({...buyerForm, name: e.target.value})}/></div>
                          <div><input className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 ring-indigo-500 transition shadow-sm" placeholder="Nomor WhatsApp / Email" value={buyerForm.email} onChange={e=>setBuyerForm({...buyerForm, email: e.target.value})}/></div>
                          {selectedProduct.category === 'TopUp' ? (
                              <div className="flex gap-3">
                                  <input className="flex-1 p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 ring-indigo-500 shadow-sm" placeholder="User ID" value={topUpForm.userId} onChange={e=>setTopUpForm({...topUpForm, userId: e.target.value})}/>
                                  <input className="w-28 p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 ring-indigo-500 shadow-sm" placeholder="Zone ID" value={topUpForm.zoneId} onChange={e=>setTopUpForm({...topUpForm, zoneId: e.target.value})}/>
                              </div>
                          ) : (
                              selectedProduct.category === 'Akun' && <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 ring-indigo-500 shadow-sm" placeholder="Jenis Device (Android/iOS)" value={buyerForm.device_model} onChange={e=>setBuyerForm({...buyerForm, device_model: e.target.value})}/>
                          )}
                          <div className="pt-2 flex gap-3">
                              <button onClick={()=>setSelectedProduct(null)} className="flex-1 py-4 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-2xl transition">Batal</button>
                              <button onClick={()=>setCheckoutStep(2)} className="flex-[2] py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg hover:scale-[1.02] transition-transform">Lanjut Pembayaran</button>
                          </div>
                      </div>
                  ) : (
                      <div className="space-y-6">
                          <div className="flex gap-2"><input className="flex-1 p-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm uppercase outline-none focus:border-indigo-500 shadow-sm" placeholder="KODE VOUCHER" value={voucherCode} onChange={e=>setVoucherCode(e.target.value)}/><button onClick={()=>{const v=vouchers.find(x=>x.code===voucherCode&&x.is_active); if(v){setAppliedVoucher(v); showToast("Voucher OK","success");}else showToast("Voucher Salah","error")}} className="bg-indigo-600 text-white px-6 rounded-2xl font-bold text-xs shadow-md">APPLY</button></div>
                          
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase ml-2 mb-2 block">Pilih Metode</label>
                              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                  {paymentMethods.map(pm => (
                                      <div key={pm.id} onClick={()=>setSelectedPayment(pm)} className={`p-4 border rounded-2xl cursor-pointer transition-all duration-200 ${selectedPayment?.id===pm.id ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500 shadow-md' : 'border-slate-200 hover:bg-slate-50'}`}>
                                          <div className="flex justify-between items-center"><span className="font-bold text-sm text-slate-800">{pm.name}</span>{selectedPayment?.id===pm.id && <CheckCircle size={18} className="text-indigo-600"/>}</div>
                                          {selectedPayment?.id === pm.id && <div className="mt-3 pt-3 border-t border-indigo-100 flex justify-between items-center"><code className="font-mono font-bold text-lg text-slate-800">{pm.va_number}</code><button onClick={(e)=>{e.stopPropagation(); navigator.clipboard.writeText(pm.va_number); showToast("Tersalin","success")}} className="p-1.5 bg-white text-indigo-600 rounded-lg shadow-sm border border-indigo-100"><Copy size={14}/></button></div>}
                                      </div>
                                  ))}
                              </div>
                          </div>

                          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                               <div className="flex justify-between text-sm mb-2 text-slate-500"><span>Harga</span><span>Rp {selectedProduct.price.toLocaleString()}</span></div>
                               {appliedVoucher && <div className="flex justify-between text-sm text-green-600 mb-2 font-bold"><span>Diskon</span><span>- Rp {appliedVoucher.amount.toLocaleString()}</span></div>}
                               <div className="flex justify-between text-xl font-black border-t border-slate-200 pt-3 mt-1"><span>Total</span><span className="text-indigo-600">Rp {(selectedProduct.price - (appliedVoucher?.amount||0)).toLocaleString()}</span></div>
                          </div>

                          <div className="flex gap-3 pt-2">
                              <button onClick={()=>setCheckoutStep(1)} className="flex-1 py-4 bg-white border border-slate-200 font-bold rounded-2xl text-sm hover:bg-slate-50 text-slate-600 transition">Kembali</button>
                              <button disabled={isSubmitting} onClick={handleCheckout} className="flex-[2] py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl shadow-lg hover:scale-[1.02] transition-transform">{isSubmitting ? 'Memproses...' : 'Konfirmasi & Bayar'}</button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* CRUD MODAL */}
      {modalType && modalType !== 'invoice' && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl">
                  <h3 className="font-black text-2xl mb-6 capitalize text-slate-800">{editingItem ? 'Edit' : 'Tambah'} {modalType}</h3>
                  <div className="space-y-4 mb-8">
                      {modalType === 'product' && (
                          <>
                              <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 ring-indigo-500" placeholder="Nama Produk" value={formData.name||''} onChange={e=>setFormData({...formData, name: e.target.value})}/>
                              <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 ring-indigo-500" type="number" placeholder="Harga" value={formData.price||''} onChange={e=>setFormData({...formData, price: e.target.value})}/>
                              <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 ring-indigo-500" value={formData.category||'Game'} onChange={e=>setFormData({...formData, category: e.target.value})}><option>Game</option><option>TopUp</option><option>Akun</option><option>Software</option></select>
                              <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 ring-indigo-500" placeholder="Label (New, Promo)" value={formData.label||''} onChange={e=>setFormData({...formData, label: e.target.value})}/>
                              <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 ring-indigo-500" placeholder="Image URL" value={formData.image_url||''} onChange={e=>setFormData({...formData, image_url: e.target.value})}/>
                              <div className="flex items-center gap-3 p-2"><div onClick={()=>setFormData({...formData, is_ready: !formData.is_ready})} className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${formData.is_ready!==false ? 'bg-green-500' : 'bg-slate-300'}`}><div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${formData.is_ready!==false ? 'left-6' : 'left-1'}`}/></div> <label className="font-bold text-sm text-slate-700">Stok Ready</label></div>
                              <button onClick={()=>handleSaveItem('products', formData)} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg mt-2">Simpan Produk</button>
                          </>
                      )}
                      {modalType === 'payment' && (
                          <>
                              <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" placeholder="Nama Bank/E-Wallet" value={formData.name||''} onChange={e=>setFormData({...formData, name: e.target.value})}/>
                              <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" placeholder="Nomor VA / Rekening" value={formData.va_number||''} onChange={e=>setFormData({...formData, va_number: e.target.value})}/>
                              <button onClick={()=>handleSaveItem('payment_methods', formData)} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg mt-2">Simpan Metode</button>
                          </>
                      )}
                      {modalType === 'contact' && (
                          <>
                              <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" placeholder="Nama Platform" value={formData.platform_name||''} onChange={e=>setFormData({...formData, platform_name: e.target.value})}/>
                              <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" placeholder="URL Link" value={formData.url||''} onChange={e=>setFormData({...formData, url: e.target.value})}/>
                              <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" placeholder="Icon URL (Optional)" value={formData.image_url||''} onChange={e=>setFormData({...formData, image_url: e.target.value})}/>
                              <button onClick={()=>handleSaveItem('contact_methods', formData)} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg mt-2">Simpan Kontak</button>
                          </>
                      )}
                  </div>
                  <button onClick={()=>{setModalType(null); setEditingItem(null);}} className="w-full py-3 text-slate-400 font-bold hover:text-slate-600">Batalkan</button>
              </div>
          </div>
      )}

      {/* PREMIUM INVOICE MODAL (REALISTIC THERMAL RECEIPT) */}
      {modalType === 'invoice' && detailTrx && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
               <div className="bg-white w-full max-w-sm shadow-2xl relative overflow-hidden flex flex-col" style={{boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'}}>
                   
                   {/* CONTENT */}
                   <div ref={invoiceRef} className="p-8 bg-white text-slate-800 font-mono text-xs leading-relaxed relative">
                       {/* Header Logo */}
                       <div className="text-center mb-6 pb-4 border-b-2 border-dashed border-slate-300">
                           <div className="flex justify-center mb-3">
                               <img src={STORE_LOGO} className="w-16 h-16 rounded-full border-2 border-slate-800 grayscale"/>
                           </div>
                           <h2 className="text-xl font-black uppercase tracking-widest mb-1 text-slate-900">STRUK TRANSAKSI</h2>
                           <p className="font-bold text-sm">WuregStore Official</p>
                           <p className="text-[10px] text-slate-500">{new Date(detailTrx.created_at).toLocaleString()}</p>
                       </div>
                       
                       {/* Detail */}
                       <div className="space-y-2 mb-4">
                           <div className="flex justify-between"><span>ID TRANSAKSI</span><span className="font-bold">#{detailTrx.id.slice(0,8).toUpperCase()}</span></div>
                           <div className="flex justify-between"><span>PEMBELI</span><span className="font-bold uppercase">{detailTrx.buyer_name}</span></div>
                           <div className="flex justify-between"><span>PEMBAYARAN</span><span className="font-bold uppercase">{detailTrx.payment_method}</span></div>
                           <div className="flex justify-between"><span>STATUS</span><span className="font-bold uppercase border border-slate-800 px-1">{detailTrx.status}</span></div>
                       </div>

                       {/* Item */}
                       <div className="border-t-2 border-dashed border-slate-300 py-4 mb-4">
                           <div className="flex justify-between font-bold text-sm mb-1">
                               <span>{detailTrx.product_name.toUpperCase()}</span>
                           </div>
                           <div className="flex justify-between">
                               <span>Harga Satuan</span>
                               <span>Rp {detailTrx.price.toLocaleString()}</span>
                           </div>
                           {detailTrx.device_model && <div className="mt-1">Info: {detailTrx.device_model}</div>}
                       </div>

                       {/* Total */}
                       <div className="border-t-2 border-slate-900 pt-3 flex justify-between text-xl font-black">
                           <span>TOTAL</span>
                           <span>Rp {detailTrx.price.toLocaleString()}</span>
                       </div>

                       {/* Footer */}
                       <div className="mt-8 text-center">
                           <p className="font-bold">*** TERIMA KASIH ***</p>
                           <p className="mt-1">Simpan struk ini sebagai bukti pembayaran yang sah.</p>
                       </div>
                       
                       {/* Jagged Edge Bottom Effect */}
                       <div className="absolute bottom-0 left-0 right-0 h-4 bg-white" 
                            style={{
                                maskImage: 'linear-gradient(45deg, transparent 50%, black 50%), linear-gradient(-45deg, transparent 50%, black 50%)',
                                maskSize: '20px 20px',
                                maskRepeat: 'repeat-x',
                                maskPosition: 'bottom',
                                WebkitMaskImage: 'linear-gradient(45deg, transparent 50%, black 50%), linear-gradient(-45deg, transparent 50%, black 50%)',
                                WebkitMaskSize: '16px 16px',
                                WebkitMaskRepeat: 'repeat-x',
                                WebkitMaskPosition: 'bottom'
                            }}>
                       </div>
                   </div>

                   {/* Action Buttons */}
                   <div className="p-4 bg-slate-100 flex gap-3 border-t border-slate-200">
                       <button onClick={()=>setModalType(null)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-white border rounded-lg transition">Tutup</button>
                       <button onClick={async()=>{
                           if(!invoiceRef.current) return;
                           const canvas = await html2canvas(invoiceRef.current);
                           const link = document.createElement('a');
                           link.download = `Struk-${detailTrx.id}.jpg`;
                           link.href = canvas.toDataURL();
                           link.click();
                       }} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition shadow-lg"><Download size={16}/> Simpan</button>
                   </div>
               </div>
          </div>
      )}
    </div>
  );
}
