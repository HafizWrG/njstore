'use client';

import React, { useState, useEffect } from 'react';
import { 
  Menu, X, Search, ShoppingCart, User, LogOut, 
  Smartphone, Monitor, Gamepad, CreditCard, CheckCircle, 
  ChevronRight, ExternalLink, ShieldCheck, Zap,
  Instagram, Twitter, Youtube, MessageCircle, Music,
  Sun, Moon, Loader2, AlertCircle, Check
} from 'lucide-react';

// --- 1. SETUP ENV & SUPABASE ---
// Mengambil key dari .env.local agar aman
const supabaseUrl = process.exports = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.exports = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

const createSupabaseClient = (baseUrl: string, key: string) => {
  if (!baseUrl || !key) return null; // Safety check
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
        single: () => { isSingle = true; return builder; },
        insert: (data: any) => { method = 'POST'; body = JSON.stringify(data); return builder; },
        then: (resolve: Function, reject: Function) => {
          const execute = async () => {
            try {
              const res = await fetch(url.toString(), { method, headers, body });
              if (!res.ok) { const text = await res.text(); return { data: null, error: { message: text } }; }
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
const ADMIN_CONTACT = "6281528483575"; 

// --- HELPER COMPONENTS ---

// 1. Toast Notification (Pengganti Alert)
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl animate-slideIn transition-all ${
    type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
  }`}>
    {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
    <span className="font-medium text-sm">{message}</span>
    <button onClick={onClose} className="ml-2 hover:bg-white/20 rounded-full p-1"><X size={14}/></button>
  </div>
);

// 2. Loading Skeleton (Agar tidak kosong saat loading)
const ProductSkeleton = () => (
  <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-xl p-5 flex flex-col gap-3 animate-pulse">
    <div className="h-40 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-full"></div>
    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
    <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>
    <div className="flex justify-between mt-2">
      <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3"></div>
      <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export default function WuregStore() {
  // UI State
  const [activePage, setActivePage] = useState('home'); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSosmedModalOpen, setIsSosmedModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Toast State
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  // Data State
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Auth State
  const [isStaffLoggedIn, setIsStaffLoggedIn] = useState(false);
  const [staffPinInput, setStaffPinInput] = useState('');

  // Transaction State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<any>(null); 
  const [checkoutStep, setCheckoutStep] = useState(1); 
  const [selectedPayment, setSelectedPayment] = useState('');
  
  // Form & Validation State
  const [buyerForm, setBuyerForm] = useState({ name: '', phone: '', email: '', device_model: '' });
  const [formErrors, setFormErrors] = useState({ name: '', email: '', device_model: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mounted, setMounted] = useState(false);

  // Show Toast Helper
  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000); // Hilang otomatis dalam 3 detik
  };

  useEffect(() => {
    setMounted(true);
    fetchProducts();
  }, []);

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
        icon: item.icon || getIconByCategory(item.category)
      })) || [];
      setProducts(mappedData);
    } catch (error) {
      console.error("Error:", error);
      // Fallback data jika database belum siap/koneksi gagal
      showToast("Gagal memuat data live, menggunakan mode offline.", "error");
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

    // Regex sederhana untuk email ATAU nomor HP (08...)
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
      
      // Kirim ke WA
      const message = `Halo Admin WuregStore, Order Baru! 🚀
      
📦 *Produk:* ${selectedProduct.name}
💰 *Harga:* Rp ${selectedProduct.price?.toLocaleString()}
👤 *Nama:* ${buyerForm.name}
${selectedProduct.category === 'Akun' ? `📱 *Device:* ${transactionData.device_model}` : ''}
💳 *Pembayaran:* ${selectedPayment}
🆔 *ID Order:* ${newTrxId}

Mohon diproses segera. Terima kasih!`;

      window.open(`https://wa.me/${ADMIN_CONTACT}?text=${encodeURIComponent(message)}`, '_blank');
      
      showToast("Pesanan berhasil dibuat!", "success");
      setSelectedProduct(null);
      setCheckoutStep(1);
      setBuyerForm({ name: '', phone: '', email: '', device_model: '' });
      setFormErrors({ name: '', email: '', device_model: '' });

    } catch (err) {
      console.error("Error:", err);
      showToast("Gagal menyimpan transaksi.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... (Staff Login & Render Helpers tetap sama, hanya update UI sedikit)
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('accounts').select('*').eq('password', staffPinInput).single();
      if (data && !error) {
        setIsStaffLoggedIn(true);
        setStaffPinInput('');
        const { data: trx } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
        setTransactions(trx || []);
        showToast("Login Berhasil", "success");
      } else {
        showToast("PIN Salah!", "error");
      }
    } catch (err) { showToast("Error login", "error"); }
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory || (selectedCategory === 'Game' && p.category === 'Games');
    return matchSearch && matchCat;
  });

  if (!mounted) return null;

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      {/* GLOBAL TRANSITION WRAPPER */}
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-cyan-500/30 transition-colors duration-300 ease-in-out">
        
        {/* TOAST COMPONENT */}
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

        {/* NAVBAR */}
        <nav className="fixed w-full z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5 transition-colors duration-300">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => { setActivePage('home'); setIsMenuOpen(false); }}>
              <div className="bg-cyan-500 rounded-lg p-1.5 text-white group-hover:rotate-12 transition-transform">
                <Zap size={20} fill="currentColor" />
              </div>
              <span className="text-xl font-bold tracking-tight">Wureg<span className="text-cyan-600 dark:text-cyan-400">Store</span></span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => setActivePage('home')} className={`text-sm font-medium transition-colors ${activePage === 'home' ? 'text-cyan-500' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}>Store</button>
              <button onClick={() => setActivePage('staff')} className={`text-sm font-medium transition-colors ${activePage === 'staff' ? 'text-cyan-500' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}>Staff</button>
              
              <div className="h-6 w-px bg-zinc-200 dark:bg-white/10"></div>

              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all hover:scale-110 active:scale-95"
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>

            {/* Mobile Toggle */}
            <div className="flex md:hidden gap-3">
               <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
          
          {/* Mobile Dropdown */}
          {isMenuOpen && (
             <div className="md:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-white/5 p-4 space-y-2 animate-fadeIn absolute w-full shadow-xl">
                <button onClick={() => {setActivePage('home'); setIsMenuOpen(false)}} className="w-full text-left p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5">Store</button>
                <button onClick={() => {setActivePage('staff'); setIsMenuOpen(false)}} className="w-full text-left p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5">Staff Area</button>
             </div>
          )}
        </nav>

        {/* MAIN CONTENT */}
        <main className="container mx-auto px-4 pt-28 pb-20 min-h-screen">
          {activePage === 'home' ? (
            <div className="space-y-8 animate-fadeIn">
               {/* Hero */}
               <div className="text-center py-10 px-4 bg-gradient-to-b from-cyan-500/5 to-transparent rounded-3xl border border-zinc-100 dark:border-white/5">
                  <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600 dark:to-purple-500">
                    Digital Needs.<br/>Solved.
                  </h1>
                  <p className="text-zinc-500 max-w-lg mx-auto mb-6">Top up game, beli software, dan akun premium dengan proses cepat dan aman.</p>
                  
                  {/* Search Bar Styled */}
                  <div className="max-w-md mx-auto relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                    <div className="relative flex items-center bg-white dark:bg-zinc-900 rounded-full p-1 border border-zinc-200 dark:border-white/10 shadow-lg">
                       <Search className="ml-3 text-zinc-400" size={20}/>
                       <input 
                         type="text" 
                         placeholder="Cari item..." 
                         className="w-full bg-transparent border-none focus:ring-0 px-3 py-2 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400"
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                       />
                    </div>
                  </div>
               </div>

               {/* Filter Pills */}
               <div className="flex gap-2 justify-center overflow-x-auto pb-4 scrollbar-hide">
                  {['All', 'Game', 'Akun', 'Software'].map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                        selectedCategory === cat 
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-black scale-105 shadow-lg' 
                        : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
               </div>

               {/* Grid */}
               {isLoading ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1,2,3,4].map(i => <ProductSkeleton key={i} />)}
                 </div>
               ) : filteredProducts.length === 0 ? (
                 <div className="text-center py-20 opacity-50">Produk tidak ditemukan</div>
               ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredProducts.map(product => (
                      <div 
                        key={product.id} 
                        onClick={() => { setSelectedProduct(product); setCheckoutStep(1); }}
                        className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-2xl p-4 cursor-pointer hover:border-cyan-500/50 hover:shadow-xl dark:hover:shadow-cyan-900/10 transition-all duration-300 hover:-translate-y-1"
                      >
                         <div className="aspect-video bg-zinc-100 dark:bg-black/40 rounded-xl mb-4 overflow-hidden relative">
                            {product.image_url ? (
                              <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-4xl font-black text-zinc-200 dark:text-zinc-800 group-hover:text-cyan-500/20 transition-colors">
                                {product.name.slice(0,2).toUpperCase()}
                              </div>
                            )}
                            <div className="absolute top-2 right-2 bg-white/90 dark:bg-black/60 backdrop-blur p-1.5 rounded-lg">
                               {product.icon === 'Gamepad' ? <Gamepad size={16} className="text-purple-500"/> :
                                product.icon === 'Zap' ? <Zap size={16} className="text-yellow-500"/> :
                                <Monitor size={16} className="text-blue-500"/>}
                            </div>
                         </div>
                         <h3 className="font-bold text-zinc-800 dark:text-zinc-100 line-clamp-1">{product.name}</h3>
                         <div className="flex justify-between items-end mt-2">
                            <div>
                               <p className="text-xs text-zinc-500">{product.category}</p>
                               <p className="font-bold text-cyan-600 dark:text-cyan-400">Rp {product.price?.toLocaleString()}</p>
                            </div>
                            <div className="bg-zinc-100 dark:bg-white/10 p-2 rounded-full group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                               <ShoppingCart size={18}/>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          ) : (
            // STAFF PAGE (Simplified for brevity, logic maintained)
            <div className="animate-fadeIn max-w-4xl mx-auto">
               {!isStaffLoggedIn ? (
                 <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl">
                    <h2 className="text-2xl font-bold text-center mb-6">Staff Access</h2>
                    <form onSubmit={handleStaffLogin} className="space-y-4">
                       <input type="password" value={staffPinInput} onChange={e=>setStaffPinInput(e.target.value)} className="w-full bg-zinc-100 dark:bg-black p-4 rounded-xl text-center text-2xl tracking-widest focus:ring-2 ring-cyan-500 outline-none transition-all" placeholder="••••"/>
                       <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-all">LOGIN</button>
                    </form>
                 </div>
               ) : (
                 <div>
                    <div className="flex justify-between items-center mb-6">
                       <h2 className="text-2xl font-bold">Dashboard</h2>
                       <button onClick={()=>setIsStaffLoggedIn(false)} className="text-red-500 flex items-center gap-2 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors"><LogOut size={16}/> Logout</button>
                    </div>
                    {/* Table Simplified */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10">
                       <table className="w-full text-sm text-left">
                          <thead className="bg-zinc-50 dark:bg-white/5 uppercase text-xs text-zinc-500">
                             <tr><th className="p-4">Date</th><th className="p-4">Item</th><th className="p-4">Buyer</th><th className="p-4">Status</th></tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                             {transactions.map(t => (
                               <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-white/5">
                                  <td className="p-4">{new Date(t.created_at).toLocaleDateString()}</td>
                                  <td className="p-4 font-medium">{t.product_name}</td>
                                  <td className="p-4">{t.buyer_name}</td>
                                  <td className="p-4"><span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">{t.status}</span></td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
               )}
            </div>
          )}
        </main>

        {/* CHECKOUT MODAL (IMPROVED) */}
        {selectedProduct && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
               
               {/* Header */}
               <div className="p-5 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-black/20">
                  <div>
                    <h3 className="font-bold text-lg">Checkout</h3>
                    <p className="text-xs text-zinc-500">Selesaikan pesananmu</p>
                  </div>
                  <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
               </div>

               {/* Body */}
               <div className="p-6 overflow-y-auto custom-scrollbar">
                  {/* Product Snippet */}
                  <div className="flex items-center gap-4 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-white/5 mb-6">
                     <div className="h-12 w-12 bg-cyan-500/10 rounded-lg flex items-center justify-center text-cyan-600 font-bold">
                        {selectedProduct.name.slice(0,1)}
                     </div>
                     <div>
                        <h4 className="font-bold text-sm">{selectedProduct.name}</h4>
                        <p className="text-cyan-600 dark:text-cyan-400 font-mono text-sm">Rp {selectedProduct.price?.toLocaleString()}</p>
                     </div>
                  </div>

                  {checkoutStep === 1 ? (
                    <div className="space-y-4 animate-slideIn">
                       <div>
                          <label className="text-xs font-bold text-zinc-500 uppercase ml-1 mb-1 block">Nama Kamu</label>
                          <input 
                            type="text" 
                            value={buyerForm.name}
                            onChange={e => setBuyerForm({...buyerForm, name: e.target.value})}
                            className={`w-full bg-zinc-50 dark:bg-black border rounded-xl p-3 outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${formErrors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200 dark:border-zinc-800'}`}
                            placeholder="Isi nama..."
                          />
                          {formErrors.name && <p className="text-red-500 text-xs mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10}/> {formErrors.name}</p>}
                       </div>

                       <div>
                          <label className="text-xs font-bold text-zinc-500 uppercase ml-1 mb-1 block">WhatsApp / Email</label>
                          <input 
                            type="text" 
                            value={buyerForm.email}
                            onChange={e => setBuyerForm({...buyerForm, email: e.target.value})}
                            className={`w-full bg-zinc-50 dark:bg-black border rounded-xl p-3 outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${formErrors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200 dark:border-zinc-800'}`}
                            placeholder="0812... atau email@..."
                          />
                           {formErrors.email && <p className="text-red-500 text-xs mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10}/> {formErrors.email}</p>}
                       </div>

                       {selectedProduct.category === 'Akun' && (
                         <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-500/20">
                            <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1 block flex items-center gap-1"><Smartphone size={12}/> Info Device (Wajib)</label>
                            <input 
                              type="text" 
                              value={buyerForm.device_model}
                              onChange={e => setBuyerForm({...buyerForm, device_model: e.target.value})}
                              className={`w-full bg-white dark:bg-zinc-900 border rounded-lg p-3 outline-none focus:border-blue-500 transition-all ${formErrors.device_model ? 'border-red-500' : 'border-blue-200 dark:border-blue-800'}`}
                              placeholder="Android / iOS (Model)"
                            />
                            {formErrors.device_model && <p className="text-red-500 text-xs mt-1">{formErrors.device_model}</p>}
                         </div>
                       )}

                       <button 
                         onClick={() => { if(validateForm()) setCheckoutStep(2); }}
                         className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl mt-4 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2"
                       >
                         Lanjut Bayar <ChevronRight size={16}/>
                       </button>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-slideIn">
                       <p className="text-sm font-bold text-zinc-500 uppercase">Pilih Metode</p>
                       <div className="grid grid-cols-1 gap-3">
                          {['DANA', 'SHOPEEPAY', 'BRI'].map(m => (
                             <div 
                               key={m} 
                               onClick={() => setSelectedPayment(m)}
                               className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center transition-all ${
                                 selectedPayment === m 
                                 ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 ring-1 ring-cyan-500' 
                                 : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                               }`}
                             >
                                <span className="font-bold">{m}</span>
                                {selectedPayment === m && <CheckCircle className="text-cyan-500" size={20}/>}
                             </div>
                          ))}
                       </div>

                       <div className="flex gap-3 mt-6">
                          <button onClick={() => setCheckoutStep(1)} className="w-1/3 py-3 rounded-xl font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">Kembali</button>
                          <button 
                            disabled={!selectedPayment || isSubmitting}
                            onClick={handleCheckoutSubmit}
                            className="w-2/3 py-3 rounded-xl font-bold bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                             {isSubmitting ? <Loader2 className="animate-spin"/> : <>Konfirmasi <ShieldCheck size={18}/></>}
                          </button>
                       </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}

        {/* CSS INJECTION */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
          .animate-fadeIn { animation: fadeIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
          .animate-slideIn { animation: slideIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #52525b; border-radius: 4px; }
        `}} />
      </div>
    </div>
  );
}
