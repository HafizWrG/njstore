'use client';

import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Search, ShoppingCart, Lock, MessageCircle, LogOut,
  Trash2, Edit3, Eye, CheckCircle, AlertCircle, RefreshCw, 
  Plus, Monitor, FileSpreadsheet, Gamepad2, Home, User, X, Zap, 
  Settings, ToggleLeft, ToggleRight, Download, Printer, Copy
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

// --- 2. COMPONENTS ---

const Background = () => (
  <div className="fixed inset-0 -z-50 bg-[#F4F4F5]">
    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-200/30 blur-[120px]" />
    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-200/30 blur-[120px]" />
  </div>
);

const KodesetInput = ({ icon: Icon, ...props }: any) => (
  <div className="group relative w-full">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-600 transition-colors duration-300">
      {Icon && <Icon size={20} />}
    </div>
    <input 
      {...props}
      className={`w-full bg-white border border-zinc-200 rounded-2xl py-4 ${Icon ? 'pl-12' : 'pl-4'} pr-4 font-medium text-zinc-800 outline-none transition-all duration-300 placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm hover:border-zinc-300`}
    />
  </div>
);

const KodesetProductCard = ({ product, onClick }: any) => {
    const isReady = product.is_ready;
    return (
        <div 
            onClick={() => isReady && onClick(product)}
            className={`group relative flex flex-col bg-white rounded-[24px] p-3 border border-zinc-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 cursor-pointer overflow-hidden ${!isReady ? 'opacity-60 grayscale' : ''}`}
        >
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[20px] bg-zinc-100">
                {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-zinc-300">{product.name[0]}</div>
                )}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                   {product.label && (
                       <span className="inline-flex items-center rounded-lg bg-white/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-900 shadow-sm">
                           {product.label}
                       </span>
                   )}
                </div>
                {!isReady && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
                       <span className="rotate-[-12deg] rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white shadow-lg">SOLD OUT</span>
                   </div>
                )}
            </div>
            <div className="flex flex-col gap-2 px-1 pt-4 pb-2">
                <h3 className="line-clamp-2 text-sm font-semibold text-zinc-800 leading-snug min-h-[2.5em] group-hover:text-indigo-600 transition-colors">
                    {product.name}
                </h3>
                <div className="flex items-center justify-between mt-1">
                    <p className="text-base font-bold text-zinc-900">
                       Rp {product.price.toLocaleString()}
                    </p>
                    <button className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white">
                        <Plus size={18} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border backdrop-blur-md animate-in slide-in-from-top-5 duration-300 ${
    type === 'success' ? 'bg-white/80 border-green-200 text-green-700' : 'bg-white/80 border-red-200 text-red-700'
  }`}>
    {type === 'success' ? <CheckCircle size={18} className="text-green-500" /> : <AlertCircle size={18} className="text-red-500" />}
    <span className="font-semibold text-sm">{message}</span>
  </div>
);

// --- 3. MAIN APP ---
export default function WuregStore() {
  const [activePage, setActivePage] = useState('home');
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Data State
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [contactMethods, setContactMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

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
  const [settingSubTab, setSettingSubTab] = useState<'payment' | 'voucher' | 'social'>('payment');
  
  // CRUD
  const [modalType, setModalType] = useState<'product' | 'payment' | 'voucher' | 'contact' | 'invoice' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null); 
  const [detailTrx, setDetailTrx] = useState<any>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<any>({});

  // Helper
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

  // --- Handlers ---

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsAuthLoading(true);
      const { error } = await supabase.auth.signInWithPassword(loginForm);
      if(error) showToast(error.message, 'error');
      else { setIsStaffLoggedIn(true); showToast("Welcome!", "success"); setLoginForm({email:'', password:''}); }
      setIsAuthLoading(false);
  };

  const handleSaveItem = async (table: string, payload: any) => {
    try {
      const res = editingItem?.id 
        ? await supabase.from(table).update(payload).eq('id', editingItem.id)
        : await supabase.from(table).insert([payload]);
      if (res.error) throw new Error(res.error.message);
      showToast("Tersimpan", "success"); setModalType(null); setEditingItem(null); refreshAdminData(); fetchPublicData();
    } catch (err: any) { showToast(err.message, "error"); }
  };

  const handleDelete = async (table: string, id: string) => {
    if(!confirm("Hapus item ini?")) return;
    await supabase.from(table).delete().eq('id', id);
    refreshAdminData(); fetchPublicData(); showToast("Terhapus", "success");
  };

  const handleToggleActive = async (table: string, item: any) => {
      const newVal = !item.is_active;
      await supabase.from(table).update({ is_active: newVal }).eq('id', item.id);
      refreshAdminData(); fetchPublicData();
      showToast(newVal ? "Diaktifkan" : "Dinonaktifkan", "success");
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
      await supabase.from('transactions').update({status: newStatus}).eq('id', id);
      refreshAdminData();
  };

  const handlePrintPDF = async () => {
    if (!invoiceRef.current) return;
    try {
        const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a6' // Invoice size
        });
        
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Invoice-${detailTrx.id}.pdf`);
    } catch (err) {
        showToast("Gagal membuat PDF", "error");
    }
  };

  const handleCheckout = async () => {
    if(!selectedPayment) return showToast("Pilih pembayaran", "error");
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
       const msg = `Halo Admin, Order Baru!\nID: ${newId}\nItem: ${selectedProduct.name}\nTotal: Rp ${finalPrice.toLocaleString()}\nVia: ${selectedPayment.name}\nDevice: ${trxData.device_model}`;
       window.open(`${wa}?text=${encodeURIComponent(msg)}`, '_blank');
       showToast("Order Berhasil!", "success"); setSelectedProduct(null); setCheckoutStep(1); setBuyerForm({ name: '', email: '', device_model: '' }); 
    } else showToast(error.message, "error");
    setIsSubmitting(false);
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen font-sans text-zinc-800 pb-24 md:pb-0 selection:bg-indigo-100 selection:text-indigo-600">
      <Background />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}

      {/* DESKTOP NAV */}
      <nav className="hidden md:flex fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl items-center justify-between px-6 py-3 bg-white/70 backdrop-blur-xl border border-white/40 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
         <div className="flex items-center gap-3 cursor-pointer" onClick={()=>setActivePage('home')}>
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 p-[2px]">
                <img src={STORE_LOGO} className="w-full h-full rounded-full object-cover border-[2px] border-white"/>
             </div>
             <span className="font-bold text-lg tracking-tight">WuregStore</span>
         </div>
         <div className="flex items-center gap-1 bg-zinc-100/50 p-1.5 rounded-full">
             {['home', 'staff'].map(page => (
                 <button key={page} onClick={()=>setActivePage(page)} className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activePage===page ? 'bg-white text-indigo-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}>
                     {page === 'home' ? 'Store' : 'Staff Portal'}
                 </button>
             ))}
         </div>
         <button onClick={()=>setIsContactModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-full text-sm font-semibold hover:bg-zinc-800 transition-all">
             <MessageCircle size={16}/> Support
         </button>
      </nav>

      {/* MOBILE NAV */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-50 bg-white/80 backdrop-blur-xl border border-white/50 p-2 rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.1)]">
         <div className="flex justify-between items-center px-4">
             <button onClick={()=>setActivePage('home')} className={`flex flex-col items-center justify-center w-20 h-14 rounded-2xl transition-all ${activePage==='home' ? 'bg-zinc-100 text-indigo-600' : 'text-zinc-400'}`}>
                 <Home size={22} strokeWidth={activePage==='home' ? 2.5 : 2} />
             </button>
             <button onClick={()=>setActivePage('staff')} className={`flex flex-col items-center justify-center w-20 h-14 rounded-2xl transition-all ${activePage==='staff' ? 'bg-zinc-100 text-indigo-600' : 'text-zinc-400'}`}>
                 <User size={22} strokeWidth={activePage==='staff' ? 2.5 : 2} />
             </button>
             <button onClick={()=>setIsContactModalOpen(true)} className="flex flex-col items-center justify-center w-20 h-14 rounded-2xl text-zinc-400">
                 <MessageCircle size={22} />
             </button>
         </div>
      </nav>

      <main className="max-w-6xl mx-auto px-5 pt-8 md:pt-32 pb-24 min-h-screen">
         
         {/* PAGE: HOME */}
         {activePage === 'home' && (
             <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                 <div className="md:hidden flex items-center gap-3 mb-8 mt-2">
                    <img src={STORE_LOGO} className="w-10 h-10 rounded-full bg-zinc-100"/>
                    <h1 className="font-bold text-xl text-zinc-900">WuregStore</h1>
                 </div>

                 <div className="text-center mb-12">
                     <span className="inline-block py-1.5 px-4 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-600 mb-6 tracking-wide uppercase">
                        Fastest Delivery ⚡️
                     </span>
                     <h2 className="text-4xl md:text-6xl font-black text-zinc-900 mb-6 leading-tight tracking-tight">
                        Top Up Game <br className="hidden md:block"/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">Termurah & Aman.</span>
                     </h2>
                     <div className="max-w-lg mx-auto relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400"><Search size={20}/></div>
                        <input className="w-full py-4 pl-12 pr-4 bg-white border border-zinc-200 rounded-2xl font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm" placeholder="Cari game favoritmu..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
                     </div>
                 </div>

                 <div className="flex justify-center flex-wrap gap-2 mb-10">
                     {['All', 'Game', 'TopUp', 'Akun', 'Software'].map(c => (
                         <button key={c} onClick={()=>setSelectedCategory(c)} className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${selectedCategory===c ? 'bg-zinc-900 text-white shadow-lg' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}>{c}</button>
                     ))}
                 </div>

                 {isLoading ? (
                     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                         {[1,2,3,4,5].map(i => <div key={i} className="aspect-[4/5] bg-zinc-200/50 rounded-[24px] animate-pulse"/>)}
                     </div>
                 ) : (
                     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                         {products.filter(p => (selectedCategory === 'All' || p.category === selectedCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                             <KodesetProductCard key={p.id} product={p} onClick={(prod: any) => { setSelectedProduct(prod); setCheckoutStep(1); }} />
                         ))}
                     </div>
                 )}
             </div>
         )}

         {/* PAGE: STAFF */}
         {activePage === 'staff' && (
             <div className="animate-in fade-in">
                 {!isStaffLoggedIn ? (
                     <div className="max-w-sm mx-auto pt-10">
                         <div className="bg-white p-8 rounded-[32px] shadow-xl border border-zinc-100 text-center">
                             <div className="w-16 h-16 bg-zinc-100 text-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6"><User size={32}/></div>
                             <h2 className="text-2xl font-bold mb-6 text-zinc-900">Staff Portal</h2>
                             <form onSubmit={handleLogin} className="space-y-4">
                                 <KodesetInput type="email" placeholder="Email Address" value={loginForm.email} onChange={(e:any)=>setLoginForm({...loginForm, email: e.target.value})} icon={User} />
                                 <KodesetInput type="password" placeholder="Password" value={loginForm.password} onChange={(e:any)=>setLoginForm({...loginForm, password: e.target.value})} icon={Lock} />
                                 <button disabled={isAuthLoading} className="w-full py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:scale-[1.02] transition-transform shadow-lg">{isAuthLoading ? 'Loading...' : 'Login Access'}</button>
                             </form>
                         </div>
                     </div>
                 ) : (
                     <div className="space-y-6">
                         <div className="bg-white p-2 rounded-[20px] border border-zinc-200 shadow-sm flex flex-wrap gap-2 justify-between items-center">
                             <div className="flex gap-1 overflow-x-auto no-scrollbar">
                                 {[{id:'dash',l:'Dash',i:Monitor}, {id:'trx',l:'Order',i:FileSpreadsheet}, {id:'prod',l:'Produk',i:Gamepad2}, {id:'setting',l:'Set',i:Settings}].map(m => (
                                     <button key={m.id} onClick={()=>setAdminTab(m.id as any)} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${adminTab===m.id ? 'bg-zinc-900 text-white shadow-md' : 'hover:bg-zinc-50 text-zinc-500'}`}><m.i size={14}/> {m.l}</button>
                                 ))}
                             </div>
                             <button onClick={async()=>{await supabase.auth.signOut(); setIsStaffLoggedIn(false)}} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><LogOut size={18}/></button>
                         </div>

                         {adminTab === 'dash' && (
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                 <div className="bg-zinc-900 p-6 rounded-[24px] text-white shadow-xl">
                                     <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Total Revenue</p>
                                     <h3 className="text-3xl font-bold">Rp {transactions.reduce((a,b)=>a+(b.price||0),0).toLocaleString()}</h3>
                                 </div>
                                 <div className="bg-white p-6 rounded-[24px] border border-zinc-100 shadow-sm flex justify-between items-center">
                                     <div><p className="text-zinc-400 text-xs font-bold uppercase">Total Orders</p><h3 className="text-3xl font-bold text-zinc-900">{transactions.length}</h3></div>
                                     <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><FileSpreadsheet size={24}/></div>
                                 </div>
                                 <div className="bg-white p-6 rounded-[24px] border border-zinc-100 shadow-sm flex justify-between items-center">
                                     <div><p className="text-zinc-400 text-xs font-bold uppercase">Products</p><h3 className="text-3xl font-bold text-zinc-900">{products.length}</h3></div>
                                     <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><Gamepad2 size={24}/></div>
                                 </div>
                             </div>
                         )}

                         {/* DETAILED TRANSACTION TABLE */}
                         {adminTab === 'trx' && (
                             <div className="bg-white rounded-[24px] border border-zinc-200 shadow-sm overflow-hidden">
                                 <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                                     <h3 className="font-bold text-zinc-900">Transaction Report</h3>
                                     <button onClick={refreshAdminData}><RefreshCw size={16} className="text-zinc-400 hover:text-indigo-600"/></button>
                                 </div>
                                 <div className="overflow-x-auto">
                                     <table className="w-full text-xs text-left whitespace-nowrap">
                                         <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider">
                                             <tr>
                                                 <th className="p-4">ID / Date</th>
                                                 <th className="p-4">Buyer Info</th>
                                                 <th className="p-4">Item & Price</th>
                                                 <th className="p-4">Device / Zone</th>
                                                 <th className="p-4">Method</th>
                                                 <th className="p-4">Status</th>
                                                 <th className="p-4 text-right">Action</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-zinc-100">
                                             {transactions.map(t => (
                                                 <tr key={t.id} className="hover:bg-zinc-50 transition-colors">
                                                     <td className="p-4 font-mono">
                                                         <div className="font-bold text-zinc-900">#{t.id.slice(0,6)}</div>
                                                         <div className="text-[10px] text-zinc-400">{new Date(t.created_at).toLocaleString()}</div>
                                                     </td>
                                                     <td className="p-4">
                                                         <div className="font-bold text-zinc-800">{t.buyer_name}</div>
                                                         <div className="text-zinc-500">{t.buyer_email}</div>
                                                     </td>
                                                     <td className="p-4">
                                                         <div className="font-bold text-zinc-800">{t.product_name}</div>
                                                         <div className="text-indigo-600 font-bold">Rp {t.price.toLocaleString()}</div>
                                                     </td>
                                                     <td className="p-4 text-zinc-600">{t.device_model || '-'}</td>
                                                     <td className="p-4 uppercase text-xs font-bold text-zinc-500">{t.payment_method}</td>
                                                     <td className="p-4">
                                                         <select value={t.status} onChange={(e)=>handleStatusChange(t.id, e.target.value)} className={`text-[10px] font-bold uppercase py-1 px-2 rounded-lg border-none outline-none cursor-pointer ${t.status==='Selesai'?'bg-green-100 text-green-700':t.status==='Pending'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>
                                                             <option value="Pending">PENDING</option><option value="Proses">PROSES</option><option value="Selesai">SELESAI</option><option value="Gagal">GAGAL</option>
                                                         </select>
                                                     </td>
                                                     <td className="p-4 text-right space-x-2">
                                                         <button onClick={()=>{setDetailTrx(t); setModalType('invoice');}} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg"><Eye size={14}/></button>
                                                         <button onClick={()=>handleDelete('transactions', t.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"><Trash2 size={14}/></button>
                                                     </td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 </div>
                             </div>
                         )}
                         
                         {adminTab === 'prod' && (
                             <div className="space-y-4">
                                 <button onClick={()=>{setEditingItem(null); setFormData({}); setModalType('product');}} className="w-full py-4 border-2 border-dashed border-zinc-300 rounded-[24px] text-zinc-400 font-bold hover:border-indigo-500 hover:text-indigo-500 transition-colors bg-zinc-50">+ Tambah Produk</button>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                     {products.map(p => (
                                         <div key={p.id} className="flex gap-4 p-3 bg-white border border-zinc-100 rounded-[24px] shadow-sm hover:shadow-md transition-all items-center">
                                             <img src={p.image_url} className="w-14 h-14 rounded-2xl object-cover bg-zinc-100"/>
                                             <div className="flex-1 min-w-0">
                                                 <h4 className="font-bold text-sm truncate">{p.name}</h4>
                                                 <p className="text-xs text-zinc-500">Rp {p.price.toLocaleString()}</p>
                                             </div>
                                             <div className="flex gap-1">
                                                <button onClick={()=>{setEditingItem(p); setFormData(p); setModalType('product');}} className="p-2.5 bg-zinc-50 rounded-xl text-zinc-600 hover:bg-zinc-200"><Edit3 size={14}/></button>
                                                <button onClick={()=>handleDelete('products', p.id)} className="p-2.5 bg-red-50 rounded-xl text-red-500 hover:bg-red-100"><Trash2 size={14}/></button>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         )}

                         {/* FULL SETTINGS CRUD TAB */}
                         {adminTab === 'setting' && (
                             <div className="bg-white rounded-[24px] border border-zinc-200 shadow-sm p-6">
                                 <div className="flex gap-2 mb-6 border-b border-zinc-100 pb-4">
                                    <button onClick={()=>setSettingSubTab('payment')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${settingSubTab==='payment' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'}`}>Payment Methods</button>
                                    <button onClick={()=>setSettingSubTab('voucher')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${settingSubTab==='voucher' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'}`}>Vouchers</button>
                                    <button onClick={()=>setSettingSubTab('social')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${settingSubTab==='social' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'}`}>Social / Contact</button>
                                 </div>

                                 {/* 1. PAYMENT SETTINGS */}
                                 {settingSubTab === 'payment' && (
                                    <div className="space-y-4 animate-in fade-in">
                                        <button onClick={()=>{setEditingItem(null); setFormData({}); setModalType('payment');}} className="w-full py-3 border-dashed border-2 border-zinc-200 rounded-xl text-xs font-bold text-zinc-400 hover:border-indigo-500 hover:text-indigo-500">+ Add Payment</button>
                                        {paymentMethods.map(pm => (
                                            <div key={pm.id} className="flex justify-between items-center p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                                                <div>
                                                    <div className="font-bold text-sm text-zinc-900">{pm.name}</div>
                                                    <div className="text-xs text-zinc-500 font-mono">{pm.va_number}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={()=>handleToggleActive('payment_methods', pm)} className={`p-1.5 rounded-lg ${pm.is_active ? 'bg-green-100 text-green-600' : 'bg-zinc-200 text-zinc-400'}`}>
                                                        {pm.is_active ? <ToggleRight size={20}/> : <ToggleLeft size={20}/>}
                                                    </button>
                                                    <button onClick={()=>{setEditingItem(pm); setFormData(pm); setModalType('payment');}} className="p-1.5 bg-white border border-zinc-200 rounded-lg text-zinc-600"><Edit3 size={16}/></button>
                                                    <button onClick={()=>handleDelete('payment_methods', pm.id)} className="p-1.5 bg-white border border-red-200 rounded-lg text-red-500"><Trash2 size={16}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                 )}

                                 {/* 2. VOUCHER SETTINGS */}
                                 {settingSubTab === 'voucher' && (
                                     <div className="space-y-4 animate-in fade-in">
                                         <button onClick={()=>{setEditingItem(null); setFormData({}); setModalType('voucher');}} className="w-full py-3 border-dashed border-2 border-zinc-200 rounded-xl text-xs font-bold text-zinc-400 hover:border-indigo-500 hover:text-indigo-500">+ Add Voucher</button>
                                         {vouchers.map(v => (
                                            <div key={v.id} className="flex justify-between items-center p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                                                <div>
                                                    <div className="font-bold text-sm text-zinc-900 bg-zinc-200 inline-block px-2 py-0.5 rounded text-xs tracking-wider mb-1">{v.code}</div>
                                                    <div className="text-xs text-green-600 font-bold">Disc: Rp {v.amount.toLocaleString()}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={()=>handleToggleActive('vouchers', v)} className={`p-1.5 rounded-lg ${v.is_active ? 'bg-green-100 text-green-600' : 'bg-zinc-200 text-zinc-400'}`}>
                                                        {v.is_active ? <ToggleRight size={20}/> : <ToggleLeft size={20}/>}
                                                    </button>
                                                    <button onClick={()=>{setEditingItem(v); setFormData(v); setModalType('voucher');}} className="p-1.5 bg-white border border-zinc-200 rounded-lg text-zinc-600"><Edit3 size={16}/></button>
                                                    <button onClick={()=>handleDelete('vouchers', v.id)} className="p-1.5 bg-white border border-red-200 rounded-lg text-red-500"><Trash2 size={16}/></button>
                                                </div>
                                            </div>
                                         ))}
                                     </div>
                                 )}

                                 {/* 3. SOCIAL/CONTACT SETTINGS */}
                                 {settingSubTab === 'social' && (
                                     <div className="space-y-4 animate-in fade-in">
                                         <button onClick={()=>{setEditingItem(null); setFormData({}); setModalType('contact');}} className="w-full py-3 border-dashed border-2 border-zinc-200 rounded-xl text-xs font-bold text-zinc-400 hover:border-indigo-500 hover:text-indigo-500">+ Add Contact</button>
                                         {contactMethods.map(c => (
                                            <div key={c.id} className="flex justify-between items-center p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                                                <div className="overflow-hidden">
                                                    <div className="font-bold text-sm text-zinc-900">{c.platform_name}</div>
                                                    <div className="text-xs text-zinc-400 truncate w-32 md:w-64">{c.url}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={()=>handleToggleActive('contact_methods', c)} className={`p-1.5 rounded-lg ${c.is_active ? 'bg-green-100 text-green-600' : 'bg-zinc-200 text-zinc-400'}`}>
                                                        {c.is_active ? <ToggleRight size={20}/> : <ToggleLeft size={20}/>}
                                                    </button>
                                                    <button onClick={()=>{setEditingItem(c); setFormData(c); setModalType('contact');}} className="p-1.5 bg-white border border-zinc-200 rounded-lg text-zinc-600"><Edit3 size={16}/></button>
                                                    <button onClick={()=>handleDelete('contact_methods', c.id)} className="p-1.5 bg-white border border-red-200 rounded-lg text-red-500"><Trash2 size={16}/></button>
                                                </div>
                                            </div>
                                         ))}
                                     </div>
                                 )}
                             </div>
                         )}
                     </div>
                 )}
             </div>
         )}
      </main>

      {/* --- MODALS --- */}
      {selectedProduct && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-md p-0 md:p-4 animate-in fade-in">
              <div className="bg-white w-full md:max-w-md rounded-t-[32px] md:rounded-[32px] p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10">
                  <div className="flex gap-4 items-center mb-6 border-b border-zinc-100 pb-4">
                      <div className="w-16 h-16 rounded-[18px] overflow-hidden bg-zinc-100">
                        <img src={selectedProduct.image_url} className="w-full h-full object-cover"/>
                      </div>
                      <div>
                          <h3 className="font-bold text-zinc-900 leading-tight text-lg">{selectedProduct.name}</h3>
                          <p className="text-indigo-600 font-bold">Rp {selectedProduct.price.toLocaleString()}</p>
                      </div>
                      <button onClick={()=>setSelectedProduct(null)} className="ml-auto p-2 bg-zinc-100 rounded-full text-zinc-500"><X size={18}/></button>
                  </div>

                  {checkoutStep === 1 ? (
                      <div className="space-y-4">
                          <KodesetInput placeholder="Nama Lengkap" value={buyerForm.name} onChange={(e:any)=>setBuyerForm({...buyerForm, name: e.target.value})} />
                          <KodesetInput placeholder="Email / WhatsApp" value={buyerForm.email} onChange={(e:any)=>setBuyerForm({...buyerForm, email: e.target.value})} />
                          
                          {selectedProduct.category === 'TopUp' ? (
                              <div className="flex gap-3">
                                  <div className="flex-1"><KodesetInput placeholder="User ID" value={topUpForm.userId} onChange={(e:any)=>setTopUpForm({...topUpForm, userId: e.target.value})} /></div>
                                  <div className="w-28"><KodesetInput placeholder="Zone" value={topUpForm.zoneId} onChange={(e:any)=>setTopUpForm({...topUpForm, zoneId: e.target.value})} /></div>
                              </div>
                          ) : selectedProduct.category === 'Akun' && (
                              <KodesetInput placeholder="Device (Android/iOS)" value={buyerForm.device_model} onChange={(e:any)=>setBuyerForm({...buyerForm, device_model: e.target.value})} />
                          )}
                          <button onClick={()=>setCheckoutStep(2)} className="w-full py-4 mt-2 bg-zinc-900 text-white font-bold rounded-[20px] shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">Lanjut Pembayaran</button>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          <div className="flex gap-2">
                             <input className="flex-1 p-4 bg-zinc-50 rounded-[20px] font-bold text-sm uppercase outline-none border border-zinc-200 focus:border-indigo-500 transition-all" placeholder="VOUCHER CODE" value={voucherCode} onChange={e=>setVoucherCode(e.target.value)}/>
                             <button onClick={()=>{const v=vouchers.find(x=>x.code===voucherCode&&x.is_active); if(v){setAppliedVoucher(v); showToast("Applied","success");}else showToast("Invalid","error")}} className="px-5 bg-indigo-600 text-white rounded-[20px] font-bold text-xs shadow-md">APPLY</button>
                          </div>
                          
                          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1 mt-4">Metode Pembayaran</p>
                          <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                              {paymentMethods.map(pm => (
                                  <div key={pm.id} onClick={()=>setSelectedPayment(pm)} className={`p-4 rounded-[20px] border cursor-pointer transition-all ${selectedPayment?.id===pm.id ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20' : 'border-zinc-200 hover:border-zinc-300'}`}>
                                      <div className="font-bold text-xs text-zinc-800 mb-1">{pm.name}</div>
                                      {selectedPayment?.id===pm.id && <div className="text-[10px] font-mono bg-white p-1 rounded border border-indigo-100 text-zinc-500 inline-block">{pm.va_number}</div>}
                                  </div>
                              ))}
                          </div>

                          <div className="p-5 bg-zinc-50 rounded-[24px] border border-zinc-100">
                               <div className="flex justify-between text-sm mb-2 text-zinc-500"><span>Subtotal</span><span>Rp {selectedProduct.price.toLocaleString()}</span></div>
                               {appliedVoucher && <div className="flex justify-between text-sm text-green-600 mb-2"><span>Diskon</span><span>- Rp {appliedVoucher.amount.toLocaleString()}</span></div>}
                               <div className="flex justify-between text-xl font-black mt-2 pt-3 border-t border-dashed border-zinc-200"><span>Total</span><span className="text-indigo-600">Rp {(selectedProduct.price - (appliedVoucher?.amount||0)).toLocaleString()}</span></div>
                          </div>

                          <div className="flex gap-3 pt-2">
                              <button onClick={()=>setCheckoutStep(1)} className="flex-1 py-4 bg-white border border-zinc-200 font-bold rounded-[20px] text-zinc-600 hover:bg-zinc-50">Kembali</button>
                              <button disabled={isSubmitting} onClick={handleCheckout} className="flex-[2] py-4 bg-zinc-900 text-white font-bold rounded-[20px] shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">{isSubmitting ? '...' : 'Bayar Sekarang'}</button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* GLOBAL CRUD MODAL */}
      {modalType && modalType !== 'invoice' && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
              <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                  <h3 className="font-bold text-xl mb-6 capitalize text-zinc-900">{editingItem ? 'Edit' : 'Tambah'} {modalType}</h3>
                  <div className="space-y-4 mb-6">
                      
                      {/* Product Fields */}
                      {modalType === 'product' && (
                          <>
                             <KodesetInput placeholder="Nama Produk" value={formData.name||''} onChange={(e:any)=>setFormData({...formData, name:e.target.value})} />
                             <KodesetInput type="number" placeholder="Harga" value={formData.price||''} onChange={(e:any)=>setFormData({...formData, price:e.target.value})} />
                             <select className="w-full bg-white border border-zinc-200 rounded-2xl py-4 px-4 font-medium text-zinc-800 outline-none focus:border-indigo-500" value={formData.category||'Game'} onChange={e=>setFormData({...formData, category:e.target.value})}><option>Game</option><option>TopUp</option><option>Akun</option><option>Software</option></select>
                             <KodesetInput placeholder="Image URL" value={formData.image_url||''} onChange={(e:any)=>setFormData({...formData, image_url:e.target.value})} />
                             <button onClick={()=>handleSaveItem('products', formData)} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-[20px] shadow-lg mt-2">Simpan Produk</button>
                          </>
                      )}

                      {/* Payment Fields */}
                      {modalType === 'payment' && (
                          <>
                             <KodesetInput placeholder="Nama Bank / E-Wallet" value={formData.name||''} onChange={(e:any)=>setFormData({...formData, name:e.target.value})} />
                             <KodesetInput placeholder="Nomor VA / Rekening" value={formData.va_number||''} onChange={(e:any)=>setFormData({...formData, va_number:e.target.value})} />
                             <div className="flex items-center gap-2 mt-2 px-2">
                                <span className="text-sm font-bold text-zinc-500">Status Aktif:</span>
                                <input type="checkbox" className="w-5 h-5" checked={formData.is_active ?? true} onChange={(e)=>setFormData({...formData, is_active:e.target.checked})}/>
                             </div>
                             <button onClick={()=>handleSaveItem('payment_methods', formData)} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-[20px] shadow-lg mt-2">Simpan Metode</button>
                          </>
                      )}

                      {/* Voucher Fields */}
                      {modalType === 'voucher' && (
                          <>
                             <KodesetInput placeholder="Kode Voucher (ex: PROMO10)" value={formData.code||''} onChange={(e:any)=>setFormData({...formData, code:e.target.value.toUpperCase()})} />
                             <KodesetInput type="number" placeholder="Nominal Diskon (Rp)" value={formData.amount||''} onChange={(e:any)=>setFormData({...formData, amount:e.target.value})} />
                             <div className="flex items-center gap-2 mt-2 px-2">
                                <span className="text-sm font-bold text-zinc-500">Status Aktif:</span>
                                <input type="checkbox" className="w-5 h-5" checked={formData.is_active ?? true} onChange={(e)=>setFormData({...formData, is_active:e.target.checked})}/>
                             </div>
                             <button onClick={()=>handleSaveItem('vouchers', formData)} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-[20px] shadow-lg mt-2">Simpan Voucher</button>
                          </>
                      )}

                      {/* Contact Fields */}
                      {modalType === 'contact' && (
                          <>
                             <KodesetInput placeholder="Platform (WA, IG, Email)" value={formData.platform_name||''} onChange={(e:any)=>setFormData({...formData, platform_name:e.target.value})} />
                             <KodesetInput placeholder="URL / Link" value={formData.url||''} onChange={(e:any)=>setFormData({...formData, url:e.target.value})} />
                             <div className="flex items-center gap-2 mt-2 px-2">
                                <span className="text-sm font-bold text-zinc-500">Status Aktif:</span>
                                <input type="checkbox" className="w-5 h-5" checked={formData.is_active ?? true} onChange={(e)=>setFormData({...formData, is_active:e.target.checked})}/>
                             </div>
                             <button onClick={()=>handleSaveItem('contact_methods', formData)} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-[20px] shadow-lg mt-2">Simpan Kontak</button>
                          </>
                      )}

                  </div>
                  <button onClick={()=>{setModalType(null); setEditingItem(null);}} className="text-zinc-400 font-bold w-full hover:text-zinc-600">Batal</button>
              </div>
          </div>
      )}

      {/* INVOICE MODAL with PDF */}
      {modalType === 'invoice' && detailTrx && (
         <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
             <div className="bg-white w-full max-w-[320px] relative shadow-2xl rounded-none">
                 <div ref={invoiceRef} className="p-8 bg-white text-zinc-900 font-mono text-xs leading-relaxed">
                     <div className="text-center border-b-2 border-dashed border-zinc-300 pb-6 mb-6">
                         <div className="w-12 h-12 bg-zinc-900 rounded-full mx-auto mb-3 flex items-center justify-center"><Zap className="text-white" size={20}/></div>
                         <h2 className="text-lg font-black uppercase tracking-[0.2em] mb-1">RECEIPT</h2>
                         <p className="font-bold">WuregStore Official</p>
                         <p className="text-[10px] text-zinc-400 mt-1">{new Date(detailTrx.created_at).toLocaleString()}</p>
                     </div>
                     <div className="space-y-2 mb-6">
                         <div className="flex justify-between"><span>ORDER ID</span><span className="font-bold">#{detailTrx.id.slice(0,6)}</span></div>
                         <div className="flex justify-between"><span>METHOD</span><span className="font-bold uppercase">{detailTrx.payment_method}</span></div>
                         <div className="flex justify-between"><span>STATUS</span><span className="font-bold uppercase bg-zinc-100 px-1">{detailTrx.status}</span></div>
                         <div className="flex justify-between"><span>DEVICE</span><span className="font-bold">{detailTrx.device_model || '-'}</span></div>
                     </div>
                     <div className="border-t-2 border-dashed border-zinc-300 py-4">
                         <div className="font-bold text-sm mb-1">{detailTrx.product_name}</div>
                         <div className="flex justify-between text-zinc-500"><span>Price</span><span>{detailTrx.price.toLocaleString()}</span></div>
                     </div>
                     <div className="border-t-2 border-zinc-900 pt-3 flex justify-between text-xl font-black">
                         <span>TOTAL</span><span>{detailTrx.price.toLocaleString()}</span>
                     </div>
                     <div className="mt-8 text-center text-[10px] text-zinc-400">THANK YOU FOR YOUR ORDER</div>
                 </div>
                 <div className="p-4 bg-zinc-50 flex gap-2">
                     <button onClick={()=>setModalType(null)} className="flex-1 py-3 bg-white border border-zinc-200 font-bold rounded-xl shadow-sm hover:bg-zinc-50 text-xs">Close</button>
                     <button onClick={handlePrintPDF} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-xs">
                        <Printer size={16}/> Print PDF
                     </button>
                 </div>
             </div>
         </div>
      )}
    </div>
  );
}
