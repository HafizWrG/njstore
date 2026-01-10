'use client';

import React, { useState, useEffect } from 'react';
import { 
  Menu, X, Search, ShoppingCart, User, LogOut, 
  Smartphone, Monitor, Gamepad, CreditCard, CheckCircle, 
  ChevronRight, ExternalLink, ShieldCheck, Zap,
  Instagram, Twitter, Youtube, MessageCircle, Music,
  Sun, Moon
} from 'lucide-react';

// --- SUPABASE CONFIG ---
const supabaseUrl = 'https://cxcborsmpsmdocfvxdlm.supabase.co';
const supabaseKey = 'sb_publishable_xrkswUF_SmsHidnlu1ThXA_MSv3Unre';

// --- CUSTOM SUPABASE CLIENT ---
// Client ini menggunakan REST API langsung untuk menghindari error import di preview
const createSupabaseClient = (baseUrl: string, key: string) => {
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
        select: (columns = '*') => {
          url.searchParams.set('select', columns);
          return builder;
        },
        order: (column: string, { ascending = true } = {}) => {
          url.searchParams.set('order', `${column}.${ascending ? 'asc' : 'desc'}`);
          return builder;
        },
        eq: (column: string, value: any) => {
          url.searchParams.set(column, `eq.${value}`);
          return builder;
        },
        single: () => {
          isSingle = true;
          return builder;
        },
        insert: (data: any) => {
          method = 'POST';
          body = JSON.stringify(data);
          return builder;
        },
        then: (resolve: Function, reject: Function) => {
          const execute = async () => {
            try {
              const res = await fetch(url.toString(), { method, headers, body });
              if (!res.ok) {
                const text = await res.text();
                return { data: null, error: { message: text } };
              }
              const result = await res.json();
              if (isSingle && Array.isArray(result)) {
                return { data: result.length > 0 ? result[0] : null, error: null };
              }
              return { data: result, error: null };
            } catch (err: any) {
              return { data: null, error: { message: err.message } };
            }
          };
          // Memastikan return value kompatibel dengan await
          return execute().then((res) => resolve(res)).catch((err) => reject(err));
        }
      };
      return builder;
    }
  };
};

// FIX: Tambahkan tipe 'any' agar TypeScript tidak rewel saat build Vercel
const supabase: any = createSupabaseClient(supabaseUrl, supabaseKey);

const ADMIN_CONTACT = "6281528483575"; 

// --- HELPER FUNCTIONS ---
const getIconByCategory = (category: string) => {
  switch(category) {
    case 'Streaming': return 'Monitor';
    case 'Game': return 'Gamepad';
    case 'Software': return 'Monitor';
    case 'TopUp': return 'Zap'; 
    case 'Akun': return 'Monitor';
    default: return 'Smartphone';
  }
};

export default function WuregStore() {
  // State Halaman & Navigasi
  const [activePage, setActivePage] = useState('home'); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSosmedModalOpen, setIsSosmedModalOpen] = useState(false);
  
  // State Theme (Default Dark)
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // State Staff/Auth
  const [isStaffLoggedIn, setIsStaffLoggedIn] = useState(false);
  const [staffPinInput, setStaffPinInput] = useState('');
  
  // State Data 
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State Transaksi & Produk 
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<any>(null); 
  const [checkoutStep, setCheckoutStep] = useState(1); 
  const [buyerForm, setBuyerForm] = useState({ name: '', phone: '', email: '', device_model: '' });
  const [selectedPayment, setSelectedPayment] = useState('');

  // Hydration fix & Initial Fetch
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        // Line 133 FIX: TypeScript sekarang akan menganggap supabase sebagai 'any' dan tidak akan memblokir build
        const { data, error } = await supabase.from('products').select('*');
        
        if (error) {
          console.error("Supabase Error:", error);
          return; 
        }
        
        const mappedData = data?.map((item: any) => ({
          ...item,
          icon: item.icon || getIconByCategory(item.category)
        })) || [];
  
        setProducts(mappedData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  // --- LOGIC HANDLERS ---
  const isAccountProduct = (category: string) => category === 'Akun';

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('password', staffPinInput) 
        .single();

      if (data && !error) {
        setIsStaffLoggedIn(true);
        setStaffPinInput('');
        fetchTransactions(); 
      } else {
        alert("PIN Salah atau Akun tidak ditemukan di database!");
      }
    } catch (err) {
      console.error("Login Error:", err);
      alert("Terjadi kesalahan saat login.");
    }
  };

  const handleCheckoutSubmit = async () => {
    const transactionData = {
      buyer_name: buyerForm.name,
      buyer_email: buyerForm.email,
      // Removed buyer_phone because it caused a schema error and isn't collected in the form
      product_name: selectedProduct.name,
      price: selectedProduct.price,
      payment_method: selectedPayment,
      status: 'Pending',
      device_model: buyerForm.device_model || '-',
    };

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select();

      if (error) throw error;
      
      const newTrxId = data?.[0]?.id || 'TRX-NEW';
      const message = `Halo Admin WuregStore, saya mau konfirmasi pesanan:
      
📦 *Produk:* ${selectedProduct.name}
💰 *Harga:* Rp ${selectedProduct.price?.toLocaleString()}
👤 *Nama:* ${buyerForm.name}
${isAccountProduct(selectedProduct.category) ? `📱 *Device:* ${transactionData.device_model}` : ''}
💳 *Pembayaran:* ${selectedPayment}
🆔 *ID Database:* ${newTrxId}

Mohon segera diproses. Terima kasih!`;

      window.open(`https://wa.me/${ADMIN_CONTACT}?text=${encodeURIComponent(message)}`, '_blank');

      setSelectedProduct(null);
      setCheckoutStep(1);
      setBuyerForm({ name: '', phone: '', email: '', device_model: '' });
    } catch (err) {
      console.error("Error saving transaction:", err);
      alert("Gagal menyimpan transaksi.");
    }
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const getPaymentVA = (method: string) => {
    if (method === 'DANA') return '0815 2848 3575 (A/N WuregStore)';
    if (method === 'SHOPEEPAY') return '0815 2848 3575 (A/N WuregStore)';
    if (method === 'BRI') return '8881 0815 2848 3575';
    return '-';
  };

  const socialLinks = [
    { name: 'WhatsApp', url: `https://wa.me/${ADMIN_CONTACT}`, icon: MessageCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    { name: 'Instagram', url: 'https://instagram.com/hfz. wrg', icon: Instagram, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { name: 'TikTok', url: 'https://tiktok.com/@minn_edzzt ', icon: Music, color: 'text-black dark:text-white', bg: 'bg-zinc-100 dark:bg-zinc-800' },
    { name: 'Twitter', url: 'https://twitter.com/', icon: Twitter, color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { name: 'YouTube', url: 'https://youtube.com/channel/hafiwrg', icon: Youtube, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  if (!mounted) return null;

  // --- RENDER HELPERS ---

  const renderHome = () => (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-10 bg-gradient-to-b from-cyan-500/10 to-transparent rounded-2xl border border-zinc-200 dark:border-white/5">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-purple-600">
          FUTURE DIGITAL STORE
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
          Penuhi kebutuhan digitalmu dengan cepat, aman, dan futuristik. 
          Software, Akun Premium, semua ada di WuregStore.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center sticky top-20 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md p-4 rounded-xl border border-zinc-200 dark:border-white/10 shadow-sm">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400 dark:text-zinc-500" />
          <input 
            type="text" 
            placeholder="Cari produk..." 
            className="w-full bg-zinc-100 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-full pl-10 pr-4 py-2 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          {['All', 'Akun', 'Software', 'TopUp'].map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat 
                ? 'bg-cyan-500 text-white dark:text-black shadow-md shadow-cyan-500/20' 
                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="text-center py-20 text-zinc-500 animate-pulse">Memuat Produk dari Database...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
            Produk tidak ditemukan atau Database Kosong.<br/>
            <span className="text-xs text-zinc-400">Pastikan Anda telah menjalankan SQL Update untuk database.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              onClick={() => { setSelectedProduct(product); setCheckoutStep(1); }}
              className="group relative bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-xl p-5 hover:border-cyan-500/50 transition-all cursor-pointer hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] overflow-hidden flex flex-col"
            >
              <div className="absolute top-0 right-0 p-2 bg-cyan-500/10 rounded-bl-xl z-10">
                {product.icon === 'Gamepad' || getIconByCategory(product.category) === 'Gamepad' ? <Gamepad className="w-5 h-5 text-cyan-600 dark:text-cyan-400" /> :
                 product.icon === 'Monitor' || getIconByCategory(product.category) === 'Monitor' ? <Monitor className="w-5 h-5 text-purple-600 dark:text-purple-400" /> :
                 product.icon === 'Zap' || getIconByCategory(product.category) === 'Zap' ? <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" /> :
                 <Smartphone className="w-5 h-5 text-green-600 dark:text-green-400" />}
              </div>
              
              <div className="mt-4 mb-3 h-40 w-full flex items-center justify-center bg-zinc-100 dark:bg-black/20 rounded-lg overflow-hidden relative">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextSibling) {
                        (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ display: product.image_url ? 'none' : 'flex' }}
                >
                   <span className="text-4xl font-bold text-zinc-300 dark:text-zinc-700 select-none group-hover:text-cyan-600 dark:group-hover:text-cyan-800 transition-colors">
                      {product.name ? product.name.substring(0,2).toUpperCase() : '??'}
                   </span>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 line-clamp-1">{product.name}</h3>
              <p className="text-xs text-zinc-500 mb-4">{product.category}</p>
              
              <div className="flex justify-between items-center mt-auto">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold">Rp {product.price?.toLocaleString()}</span>
                <button className="bg-zinc-100 dark:bg-white/10 hover:bg-cyan-500 hover:text-white dark:hover:text-black p-2 rounded-full transition-colors text-zinc-600 dark:text-zinc-300">
                  <ShoppingCart size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStaffPage = () => {
    if (!isStaffLoggedIn) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-8 rounded-2xl w-full max-w-md shadow-xl dark:shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="bg-cyan-500/20 p-3 rounded-full">
                <User size={32} className="text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-2 text-zinc-800 dark:text-zinc-100">Staff Access</h2>
            <p className="text-zinc-500 text-center mb-6 text-sm">Masukkan PIN Staff untuk mengakses laporan.</p>
            
            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">PIN Keamanan (Password)</label>
                <input 
                  type="password" 
                  className="w-full bg-zinc-100 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-3 text-center tracking-[0.5em] text-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  placeholder="••••"
                  value={staffPinInput}
                  onChange={(e) => setStaffPinInput(e.target.value)}
                />
              </div>
              <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-all">
                LOGIN
              </button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="animate-fadeIn">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-3xl font-bold text-zinc-800 dark:text-white">Staff Dashboard</h2>
            <p className="text-zinc-500 dark:text-zinc-400">Laporan transaksi realtime (Supabase Connected).</p>
          </div>
          <button 
            onClick={() => { setIsStaffLoggedIn(false); setTransactions([]); }}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 bg-red-100 dark:bg-red-400/10 px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border-l-4 border-cyan-500 shadow-sm">
             <p className="text-zinc-500 text-sm">Total Transaksi</p>
             <h3 className="text-2xl font-bold text-zinc-800 dark:text-white">{transactions.length} Order</h3>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border-l-4 border-purple-500 shadow-sm">
             <p className="text-zinc-500 text-sm">Pendapatan</p>
             <h3 className="text-2xl font-bold text-zinc-800 dark:text-white">Rp {transactions.reduce((acc, curr) => acc + (curr.price || 0), 0).toLocaleString()}</h3>
          </div>
           <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border-l-4 border-green-500 shadow-sm">
             <p className="text-zinc-500 text-sm">Database Status</p>
             <h3 className="text-2xl font-bold text-green-500 dark:text-green-400 flex items-center gap-2"><div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"/> Connected</h3>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-white/5 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-100 dark:bg-black/40 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Produk</th>
                  <th className="p-4">Device</th>
                  <th className="p-4">Pembeli</th>
                  <th className="p-4">Metode</th>
                  <th className="p-4">Harga</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/5 text-sm text-zinc-700 dark:text-zinc-300">
                {transactions.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="p-8 text-center text-zinc-500">Belum ada data transaksi.</td>
                    </tr>
                ) : transactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 text-zinc-500">
                        {trx.created_at ? new Date(trx.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-4 font-medium text-zinc-800 dark:text-zinc-200">{trx.product_name}</td>
                    <td className="p-4 text-zinc-500 dark:text-zinc-400">{trx.device_model || '-'}</td>
                    <td className="p-4">{trx.buyer_name}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded text-xs font-bold bg-zinc-200 dark:bg-white/10 border border-zinc-300 dark:border-white/10">
                        {trx.payment_method}
                      </span>
                    </td>
                    <td className="p-4">Rp {trx.price?.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${trx.status === 'Selesai' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'}`}>
                        {trx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // --- MAIN RENDER ---

  return (
    // ROOT DIV dengan class 'dark' conditional untuk handle Theme
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-cyan-500/30 transition-colors duration-300">
        
        {/* NAVBAR */}
        <nav className="fixed w-full z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/5 transition-colors duration-300">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            
            {/* Logo */}
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => { setActivePage('home'); setIsMenuOpen(false); }}
            >
              <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center transform rotate-3">
                <span className="font-bold text-white">W</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">Wureg<span className="text-cyan-600 dark:text-cyan-400">Store</span></span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => setActivePage('home')} className={`text-sm font-medium hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors ${activePage === 'home' ? 'text-cyan-600 dark:text-cyan-400' : 'text-zinc-500 dark:text-zinc-400'}`}>Home</button>
              <button onClick={() => setActivePage('staff')} className={`text-sm font-medium hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors ${activePage === 'staff' ? 'text-cyan-600 dark:text-cyan-400' : 'text-zinc-500 dark:text-zinc-400'}`}>Staff Page</button>
              <button 
                onClick={() => setIsSosmedModalOpen(true)}
                className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors flex items-center gap-1"
              >
                Admin Sosmed <ExternalLink size={12}/>
              </button>
              
              {/* THEME TOGGLE BUTTON */}
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>

            {/* Mobile Menu Toggle & Theme */}
            <div className="flex items-center gap-4 md:hidden">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className="p-2 text-zinc-800 dark:text-zinc-300" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMenuOpen && (
            <div className="md:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-white/5 p-4 space-y-4 absolute w-full animate-slideIn shadow-lg">
              <button onClick={() => { setActivePage('home'); setIsMenuOpen(false); }} className="block w-full text-left py-2 text-zinc-700 dark:text-zinc-300 font-medium">Home</button>
              <button onClick={() => { setActivePage('staff'); setIsMenuOpen(false); }} className="block w-full text-left py-2 text-zinc-700 dark:text-zinc-300 font-medium">Staff Page</button>
              <button 
                onClick={() => { setIsSosmedModalOpen(true); setIsMenuOpen(false); }}
                className="w-full text-left py-2 text-zinc-700 dark:text-zinc-300 font-medium flex items-center gap-2"
              >
                Admin Sosmed <ExternalLink size={14}/>
              </button>
            </div>
          )}
        </nav>

        {/* CONTENT AREA */}
        <main className="container mx-auto px-4 pt-24 pb-20 min-h-screen">
          {activePage === 'home' ? renderHome() : renderStaffPage()}
        </main>

        {/* ADMIN SOSMED MODAL */}
        {isSosmedModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl relative">
              <button 
                onClick={() => setIsSosmedModalOpen(false)}
                className="absolute top-4 right-4 p-1 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-full transition-colors z-10"
              >
                <X size={20} className="text-zinc-500 dark:text-zinc-400"/>
              </button>
              
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold mb-1 text-zinc-900 dark:text-white">Hubungi Admin</h3>
                <p className="text-zinc-500 text-sm mb-6">Pilih platform media sosial kami:</p>
                
                <div className="space-y-3">
                  {socialLinks.map((social) => (
                    <a 
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center gap-4 p-3 rounded-xl border border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/20 transition-all group ${social.bg}`}
                    >
                      <div className={`p-2 rounded-lg bg-white/90 ${social.color}`}>
                        <social.icon size={20} />
                      </div>
                      <span className="font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white">{social.name}</span>
                      <ExternalLink size={16} className="ml-auto text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CHECKOUT MODAL */}
        {selectedProduct && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="p-4 border-b border-zinc-200 dark:border-white/5 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
                <h3 className="font-bold text-lg flex items-center gap-2 text-zinc-900 dark:text-white">
                  <ShoppingCart size={18} className="text-cyan-600 dark:text-cyan-400"/> Checkout
                </h3>
                <button onClick={() => setSelectedProduct(null)} className="p-1 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} className="text-zinc-500 dark:text-zinc-400"/>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar">
                
                {/* Product Summary */}
                <div className="flex gap-4 mb-6 bg-zinc-50 dark:bg-black/20 p-3 rounded-lg border border-zinc-200 dark:border-white/5">
                  <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-md flex items-center justify-center text-xl font-bold text-zinc-600 dark:text-zinc-400 overflow-hidden">
                    {/* Image Preview in Modal */}
                    {selectedProduct.image_url ? (
                      <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{selectedProduct.name ? selectedProduct.name.substring(0,2) : '??'}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-200">{selectedProduct.name}</h4>
                    <p className="text-sm text-zinc-500 mb-1">{selectedProduct.category}</p>
                    <p className="text-cyan-600 dark:text-cyan-400 font-bold">Rp {selectedProduct.price?.toLocaleString()}</p>
                  </div>
                </div>

                {/* Step 1: Data Diri */}
                {checkoutStep === 1 && (
                  <div className="space-y-4 animate-slideIn">
                    <h4 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">1. Data Pesanan</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-zinc-500 block mb-1">Nama Lengkap</label>
                        <input 
                          type="text" 
                          value={buyerForm.name}
                          onChange={(e) => setBuyerForm({...buyerForm, name: e.target.value})}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg p-3 text-sm text-zinc-900 dark:text-white focus:border-cyan-500 focus:outline-none transition-colors"
                          placeholder="Contoh: Budi Santoso"
                        />
                      </div>
                      
                      {/* CONDITIONAL INPUT: DEVICE MODEL */}
                      {isAccountProduct(selectedProduct.category) && (
                          <div className="animate-fadeIn">
                            <label className="text-xs text-cyan-600 dark:text-cyan-400 block mb-1 flex items-center gap-1">
                              <Smartphone size={12}/> Model Device (Wajib)
                            </label>
                            <input 
                              type="text" 
                              value={buyerForm.device_model}
                              onChange={(e) => setBuyerForm({...buyerForm, device_model: e.target.value})}
                              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-cyan-500/50 dark:border-cyan-900/50 rounded-lg p-3 text-sm text-zinc-900 dark:text-white focus:border-cyan-500 focus:outline-none transition-colors"
                              placeholder="Contoh: iPhone 13 / Samsung S23"
                            />
                            <p className="text-[10px] text-zinc-500 mt-1">*Diperlukan untuk garansi & login akun.</p>
                          </div>
                      )}

                      <div>
                        <label className="text-xs text-zinc-500 block mb-1">Nomor WhatsApp / Email</label>
                        <input 
                          type="text" 
                          value={buyerForm.email}
                          onChange={(e) => setBuyerForm({...buyerForm, email: e.target.value})}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg p-3 text-sm text-zinc-900 dark:text-white focus:border-cyan-500 focus:outline-none transition-colors"
                          placeholder="0812xxxx atau email@contoh.com"
                        />
                      </div>
                    </div>
                    <button 
                      disabled={
                        !buyerForm.name || 
                        !buyerForm.email || 
                        (isAccountProduct(selectedProduct.category) && !buyerForm.device_model)
                      }
                      onClick={() => setCheckoutStep(2)}
                      className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg mt-4 transition-all flex items-center justify-center gap-2"
                    >
                      Lanjut Pembayaran <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                {/* Step 2: Pembayaran */}
                {checkoutStep === 2 && (
                  <div className="space-y-4 animate-slideIn">
                    <h4 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">2. Pilih Pembayaran</h4>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {['DANA', 'SHOPEEPAY', 'BRI'].map(method => (
                        <button
                          key={method}
                          onClick={() => setSelectedPayment(method)}
                          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                            selectedPayment === method 
                            ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10' 
                            : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <CreditCard size={20} className={selectedPayment === method ? 'text-cyan-600 dark:text-cyan-400' : 'text-zinc-400 dark:text-zinc-500'} />
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{method}</span>
                          </div>
                          {selectedPayment === method && <CheckCircle size={20} className="text-cyan-600 dark:text-cyan-400" />}
                        </button>
                      ))}
                    </div>

                    {/* Show VA if payment selected */}
                    {selectedPayment && (
                      <div className="bg-gradient-to-r from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800 p-4 rounded-xl border border-dashed border-zinc-400 dark:border-zinc-600 mt-4 text-center">
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Nomor Virtual Account / Tujuan</p>
                        <p className="text-xl font-mono font-bold text-zinc-900 dark:text-white tracking-wider select-all">{getPaymentVA(selectedPayment)}</p>
                        <p className="text-[10px] text-zinc-500 mt-2">*Silakan transfer sesuai nominal: <span className="text-cyan-600 dark:text-cyan-400">Rp {selectedProduct.price?.toLocaleString()}</span></p>
                      </div>
                    )}

                    <div className="flex gap-3 mt-4">
                      <button 
                        onClick={() => setCheckoutStep(1)}
                        className="w-1/3 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold py-3 rounded-lg transition-all"
                      >
                        Kembali
                      </button>
                      <button 
                        disabled={!selectedPayment}
                        onClick={handleCheckoutSubmit}
                        className="w-2/3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        Konfirmasi WA <ShieldCheck size={18} />
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer className="border-t border-zinc-200 dark:border-white/5 py-8 bg-zinc-100 dark:bg-black transition-colors duration-300">
          <div className="container mx-auto px-4 text-center">
            <p className="text-zinc-500 text-sm">
              © 2024 WuregStore. All Digital Rights Reserved. <br/>
              <span className="text-xs text-zinc-600 dark:text-zinc-700">Powered by Next.js & Supabase</span>
            </p>
          </div>
        </footer>

        {/* Global CSS for Animations - Safe Injection */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(-10px); }
            to { opacity: 1; transform: translateX(0); }
          }
          .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
          .animate-slideIn { animation: slideIn 0.3s ease-out forwards; }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />
      </div>
    </div>
  );
}
