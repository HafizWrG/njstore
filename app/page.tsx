'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Menu, X, Search, ShoppingCart, LogOut, 
  Smartphone, Monitor, Gamepad, CreditCard, CheckCircle, 
  ChevronRight, ShieldCheck, Zap,
  Loader2, AlertCircle,
  Calendar, TrendingUp, Download,
  RefreshCw, ExternalLink, Mail, Star, Copy, AlignJustify,
  ArrowUpDown, Plus, Trash2, Edit3, Tag, HelpCircle, Eye, Wallet, AlertTriangle, User
} from 'lucide-react';
import html2canvas from 'html2canvas'; // Pastikan sudah install: npm install html2canvas

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

// --- FAQ DATA ---
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
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard');
  const [statusUpdateId, setStatusUpdateId] = useState<string | null>(null);
  
  // Checkout & Voucher & Game Checker
  const [selectedProduct, setSelectedProduct] = useState<any>(null); 
  const [checkoutStep, setCheckoutStep] = useState(1); 
  const [selectedPayment, setSelectedPayment] = useState<any>(null); 
  const [buyerForm, setBuyerForm] = useState({ name: '', email: '', device_model: '', game_id: '', zone_id: '' });
  const [formErrors, setFormErrors] = useState<any>({});
  
  // Voucher State
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  
  // Game Checker State
  const [nickname, setNickname] = useState('');
  const [isCheckingGame, setIsCheckingGame] = useState(false);

  // Invoice State
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [lastTrxId, setLastTrxId] = useState('');

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchTestimonials();
    fetchPaymentMethods();
    fetchContactMethods();
    if (localStorage.getItem('isStaffLoggedIn') === 'true') setIsStaffLoggedIn(true);
  }, []);

  // --- API SIMULATION: CHECK GAME NICKNAME ---
  const checkGameNickname = async () => {
    if(!buyerForm.game_id || !buyerForm.zone_id) return showToast("Isi User ID dan Zone ID!", "error");
    setIsCheckingGame(true);
    setNickname('');
    
    // 💡 SIMULASI API (Ganti dengan API Real jika sudah punya key)
    // Di dunia nyata, Anda akan fetch ke endpoint seperti: https://api.vocagame.com/v1/merchant/game/check-profile
    setTimeout(() => {
       const mockNicknames = ["WuregPro", "SkyWalker", "IndoGamer", "ProPlayer99", "MawarHitam"];
       const randomNick = mockNicknames[Math.floor(Math.random() * mockNicknames.length)];
       setNickname(randomNick); // Set nickname simulasi
       setIsCheckingGame(false);
       showToast(`Nickname ditemukan: ${randomNick}`, "success");
    }, 1500);
  };

  // --- VOUCHER CHECKER ---
  const checkVoucher = async () => {
    if(!voucherCode) return;
    try {
      const { data, error } = await supabase.from('vouchers').select('*').eq('code', voucherCode).eq('is_active', true).single();
      if(error || !data) {
        showToast("Kode voucher tidak valid", "error");
        setAppliedVoucher(null);
      } else {
        setAppliedVoucher(data);
        showToast(`Diskon Rp ${data.discount_amount.toLocaleString()} diterapkan!`, "success");
      }
    } catch(e) { showToast("Gagal cek voucher", "error"); }
  };

  // --- ACTIONS ---
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      if (!supabase) throw new Error("Supabase missing");
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      setProducts(data || []);
    } catch (e) { console.log(e) } finally { setIsLoading(false); }
  };

  const fetchTestimonials = async () => {
    const { data } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false }).limit(6);
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

  // --- DOWNLOAD INVOICE ---
  const downloadInvoice = async () => {
    if (invoiceRef.current) {
      const canvas = await html2canvas(invoiceRef.current);
      const link = document.createElement('a');
      link.download = `Invoice-${lastTrxId || 'WuregStore'}.jpg`;
      link.href = canvas.toDataURL('image/jpeg');
      link.click();
      showToast("Struk berhasil didownload!", "success");
    }
  };

  // --- CHECKOUT LOGIC ---
  const handleNextStep = () => {
    let isValid = true;
    let errors:any = {};
    if (buyerForm.name.length < 3) { errors.name = 'Min 3 karakter'; isValid = false; }
    if (!buyerForm.email.includes('@') && buyerForm.email.length < 10) { errors.email = 'Kontak tidak valid'; isValid = false; }
    
    // Logic khusus kategori Game
    if (selectedProduct?.category === 'Game') {
       if(!buyerForm.game_id) { errors.game_id = 'User ID wajib diisi'; isValid = false; }
       if(!buyerForm.zone_id) { errors.zone_id = 'Zone ID wajib diisi'; isValid = false; }
    }
    
    setFormErrors(errors);
    if(isValid) setCheckoutStep(2);
    else showToast("Lengkapi data formulir", "error");
  };

  const handleCheckoutSubmit = async () => {
    if (!selectedPayment) return showToast("Pilih metode pembayaran!", "error");
    
    // Hitung harga akhir
    const finalPrice = selectedProduct.price - (appliedVoucher?.discount_amount || 0);
    
    const trxData = {
      buyer_name: buyerForm.name,
      buyer_email: buyerForm.email,
      product_name: selectedProduct.name,
      price: finalPrice, // Harga setelah diskon
      payment_method: selectedPayment.name,
      status: 'Pending',
      device_model: selectedProduct.category === 'Game' ? `ID: ${buyerForm.game_id} (${buyerForm.zone_id})` : buyerForm.device_model || '-',
    };

    try {
      const { data, error } = await supabase.from('transactions').insert([trxData]).select();
      if (error) throw error;
      const newTrxId = data?.[0]?.id || 'NEW';
      setLastTrxId(newTrxId); // Simpan ID untuk invoice
      
      const waLink = contactMethods.find(c => (c.platform_name || '').toLowerCase().includes('whatsapp'))?.url || `https://wa.me/${ADMIN_PHONE}`;
      const msg = `Halo Admin, Order Baru! 🚀\n📦 ${selectedProduct.name}\n💰 Rp ${finalPrice.toLocaleString()}\n👤 ${buyerForm.name}\n📞 ${buyerForm.email}\n${selectedProduct.category === 'Game' ? `🎮 ID: ${buyerForm.game_id} (${buyerForm.zone_id})\n👤 Nick: ${nickname || '-'}\n` : ''}💳 ${selectedPayment.name}\n🆔 ${newTrxId}`;
      
      // Buka WA
      window.open(`${waLink}?text=${encodeURIComponent(msg)}`, '_blank');
      
      // Pindah ke step 3 (Invoice)
      setCheckoutStep(3); 
      showToast("Order Dibuat! Silakan simpan struk.", "success");
    } catch (err) { showToast("Gagal Order", "error"); }
  };

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

                {/* Product Grid */}
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{[1,2,3,4].map(i=><div key={i} className="h-64 bg-slate-200 dark:bg-zinc-800 rounded-3xl animate-pulse"/>)}</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                     {products.filter(p => (p.name || '').toLowerCase().includes(searchQuery.toLowerCase())).map(product => (
                       <div key={product.id} onClick={() => product.is_ready ? (setSelectedProduct(product), setCheckoutStep(1)) : null} className={`group bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-3xl p-4 relative overflow-hidden transition-all duration-500 ${product.is_ready ? 'cursor-pointer hover:shadow-2xl hover:-translate-y-2' : 'opacity-60 grayscale cursor-not-allowed'}`}>
                           {product.label && <div className="absolute top-4 left-4 z-10 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-1 rounded-full uppercase shadow-md">{product.label}</div>}
                           <div className="aspect-[4/3] bg-slate-100 dark:bg-black/40 rounded-2xl mb-5 overflow-hidden relative shadow-inner">
                              {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover"/> : <div className="absolute inset-0 flex items-center justify-center font-black text-4xl opacity-20">{product.name.slice(0,2)}</div>}
                              {!product.is_ready && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-black text-xl rotate-12 border-2 border-white m-8 rounded-xl">HABIS</div>}
                           </div>
                           <h3 className="font-bold text-lg line-clamp-1">{product.name}</h3>
                           <div className="flex justify-between items-center mt-2"><p className="text-cyan-600 dark:text-cyan-400 font-black">Rp {product.price?.toLocaleString()}</p><div className={`p-2 rounded-full ${product.is_ready ? 'bg-slate-100 dark:bg-white/5' : 'bg-red-100 text-red-500'}`}><ShoppingCart size={18}/></div></div>
                       </div>
                     ))}
                  </div>
                )}

                {/* Testimonials (NEW) */}
                <div className="pt-10 border-t border-slate-200 dark:border-white/10">
                   <h3 className="text-2xl font-black mb-6 text-center">Ulasan Pembeli ⭐</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="text-center py-20 text-slate-500">Staff Page (Login Required)</div> // Placeholder
          )}
        </main>

        {/* --- MODALS --- */}
        {/* Contact Popup */}
        {isContactOpen && (<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={(e) => e.target === e.currentTarget && setIsContactOpen(false)}><div className="bg-white p-6 rounded-3xl max-w-sm w-full"><h3 className="font-bold text-xl mb-4 text-center">Hubungi Admin</h3><div className="space-y-3">{contactMethods.map(c=><a key={c.id} href={c.url} target="_blank" className="flex items-center gap-3 p-4 bg-slate-100 rounded-xl font-bold transition hover:bg-slate-200">{c.image_url ? <img src={c.image_url} className="w-6 h-6"/> : <Mail size={20}/>} {c.platform_name}</a>)}</div></div></div>)}
        
        {/* CHECKOUT MODAL (Updated) */}
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
