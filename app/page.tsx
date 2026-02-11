'use client';

import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Search, MessageCircle, LogOut, Trash2, Edit3, Eye, CheckCircle, 
  AlertCircle, RefreshCw, Plus, Monitor, FileSpreadsheet, Gamepad2, 
  Home, User, X, Zap, Settings, ToggleLeft, ToggleRight, Printer, 
  Image as ImageIcon, Wallet, MinusCircle, PlusCircle, History, Receipt, Lock, ExternalLink, TrendingUp, ArrowUpCircle
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- SETUP SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
const ADMIN_PHONE_FALLBACK = "6281528483575";
const STORE_LOGO = "https://cdn.lynkid.my.id/profile/10-04-2025/1744247502273_9419383";
const CASH_OUT_PIN = "31082007"; // PIN RAHASIA

const supabase = createClient(supabaseUrl, supabaseKey);

// --- COMPONENTS ---
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

// --- MAIN APP ---
export default function WuregStore() {
  const [activePage, setActivePage] = useState('home');
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Data State
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [contactMethods, setContactMethods] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]); 
  const [shopBalance, setShopBalance] = useState(0);
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
  
  // Staff & Admin
  const [isStaffLoggedIn, setIsStaffLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [adminTab, setAdminTab] = useState<'dash' | 'trx' | 'prod' | 'setting' | 'expense'>('dash'); 
  const [settingSubTab, setSettingSubTab] = useState<'payment' | 'voucher' | 'social'>('payment');
  
  // Cash Out & Top Up Specifics
  const [isPinModalOpen, setIsPinModalOpen] = useState(false); 
  const [pinAction, setPinAction] = useState<'cashout' | 'topup'>('cashout');
  const [cashOutPinInput, setCashOutPinInput] = useState('');
  const [topUpAmount, setTopUpAmount] = useState(0);
  const [cashOutForm, setCashOutForm] = useState({
      tag: 'Anwaha Mart',
      items: [{ name: '', price: 0, qty: 1 }]
  });

  // CRUD & Modals
  const [modalType, setModalType] = useState<'product' | 'payment' | 'voucher' | 'contact' | 'invoice' | 'expense_detail' | 'topup_balance' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null); 
  const [detailTrx, setDetailTrx] = useState<any>(null);
  const [detailExpense, setDetailExpense] = useState<any>(null); 
  const invoiceRef = useRef<HTMLDivElement>(null);
  const expenseRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<any>({});

  // Helper
  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPublicData = async () => {
    setIsLoading(true);
    const [p, pm, cm, bal] = await Promise.all([
      supabase.from('products').select('*').order('created_at', {ascending: false}),
      supabase.from('payment_methods').select('*').eq('is_active', true).order('created_at', {ascending: true}),
      supabase.from('contact_methods').select('*').eq('is_active', true),
      supabase.from('shop_balance').select('*').eq('id', 1).single() 
    ]);
    if(p.data) setProducts(p.data);
    if(pm.data) setPaymentMethods(pm.data);
    if(cm.data) setContactMethods(cm.data);
    if(bal.data) setShopBalance(bal.data.current_balance);
    setIsLoading(false);
  };

  const refreshAdminData = async () => {
    if (!isStaffLoggedIn) return;
    const [t, v, pmAll, cmAll, exp] = await Promise.all([
      supabase.from('transactions').select('*').order('created_at', {ascending: false}),
      supabase.from('vouchers').select('*').order('created_at', {ascending: false}),
      supabase.from('payment_methods').select('*').order('created_at', {ascending: true}),
      supabase.from('contact_methods').select('*').order('created_at', {ascending: true}),
      supabase.from('expenses').select('*').order('created_at', {ascending: false})
    ]);
    if(t.data) setTransactions(t.data);
    if(v.data) setVouchers(v.data);
    if(pmAll.data) setPaymentMethods(pmAll.data); 
    if(cmAll.data) setContactMethods(cmAll.data);
    if(exp.data) setExpenses(exp.data);
  };

  useEffect(() => {
    fetchPublicData();
    const checkUser = async () => {
        const {data} = await supabase.auth.getUser();
        if(data?.user) setIsStaffLoggedIn(true);
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

  // --- TOP UP LOGIC ---
  const processFinalTopUp = async () => {
    if(topUpAmount <= 0) return showToast("Nominal tidak valid", "error");
    setIsSubmitting(true);
    try {
        const newBalance = shopBalance + Number(topUpAmount);
        const { error } = await supabase.from('shop_balance').update({ current_balance: newBalance }).eq('id', 1);
        if(error) throw error;
        showToast("Saldo berhasil ditambah!", "success");
        setTopUpAmount(0);
        setModalType(null);
        fetchPublicData();
    } catch(err: any) {
        showToast(err.message, "error");
    } finally {
        setIsSubmitting(false);
        setIsPinModalOpen(false);
        setCashOutPinInput('');
    }
  };

  // --- CASH OUT LOGIC ---
  const handleAddCashOutItem = () => {
      setCashOutForm({
          ...cashOutForm,
          items: [...cashOutForm.items, { name: '', price: 0, qty: 1 }]
      });
  };

  const handleCashOutChange = (index: number, field: string, value: any) => {
      const newItems = [...cashOutForm.items];
      newItems[index] = { ...newItems[index], [field]: value };
      setCashOutForm({ ...cashOutForm, items: newItems });
  };

  const handleRemoveCashOutItem = (index: number) => {
      const newItems = cashOutForm.items.filter((_, i) => i !== index);
      setCashOutForm({ ...cashOutForm, items: newItems });
  };

  const calculateTotalExpense = () => {
      return cashOutForm.items.reduce((acc, item) => acc + (Number(item.price) * Number(item.qty)), 0);
  };

  const processFinalCashOut = async () => {
      const total = calculateTotalExpense();
      if(total <= 0) return showToast("Total tidak boleh 0", "error");
      if(total > shopBalance) return showToast("Saldo Admin tidak cukup!", "error");

      setIsSubmitting(true);
      try {
          const newBalance = shopBalance - total;
          const { error: balError } = await supabase.from('shop_balance').update({ current_balance: newBalance }).eq('id', 1);
          if(balError) throw balError;
          const { error: expError } = await supabase.from('expenses').insert([{
              tag: cashOutForm.tag,
              items: cashOutForm.items,
              total_amount: total
          }]);
          if(expError) throw expError;

          showToast("Cash Out Berhasil!", "success");
          setCashOutForm({ tag: 'Anwaha Mart', items: [{ name: '', price: 0, qty: 1 }] });
          fetchPublicData(); 
          setIsPinModalOpen(false); 
          setCashOutPinInput('');
      } catch(err: any) {
          showToast(err.message, "error");
      } finally {
          setIsSubmitting(false);
      }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(cashOutPinInput === CASH_OUT_PIN) {
          if(pinAction === 'cashout') processFinalCashOut();
          else processFinalTopUp();
      } else {
          showToast("PIN SALAH!", "error");
      }
  };

  // --- CRUD & Handlers ---
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

  const handleToggleProductReady = async (product: any) => {
      const newVal = !product.is_ready;
      await supabase.from('products').update({ is_ready: newVal }).eq('id', product.id);
      refreshAdminData(); fetchPublicData();
      showToast(newVal ? "Produk Ready" : "Produk Sold Out", "success");
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
      await supabase.from('transactions').update({status: newStatus}).eq('id', id);
      refreshAdminData();
  };

  const generateFile = async (ref: any, type: 'pdf'|'jpg', filename: string) => {
      if(!ref.current) return;
      setIsGenerating(true);
      try {
          const canvas = await html2canvas(ref.current, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
          if(type === 'jpg') {
              const link = document.createElement('a');
              link.download = `${filename}.jpg`;
              link.href = canvas.toDataURL('image/jpeg', 0.9);
              link.click();
          } else {
              const imgData = canvas.toDataURL('image/png');
              const pdfWidth = 80; 
              const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
              const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfWidth, pdfHeight] });
              pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
              pdf.save(`${filename}.pdf`);
          }
          showToast("File berhasil disimpan", "success");
      } catch(err) {
          showToast("Gagal menyimpan file", "error");
      } finally {
          setIsGenerating(false);
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
                 <img src={STORE_LOGO} className="w-full h-full rounded-full object-cover border-[2px] border-white" alt="logo"/>
              </div>
              <span className="font-bold text-lg tracking-tight">WuregStore</span>
          </div>
          <div className="flex items-center gap-1 bg-zinc-100/50 p-1.5 rounded-full">
              {['home', 'cashout', 'staff'].map(page => (
                  <button key={page} onClick={()=>setActivePage(page)} className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activePage===page ? 'bg-white text-indigo-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}>
                      {page === 'home' ? 'Store' : page === 'cashout' ? 'Cash Out' : 'Staff Portal'}
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
              <button onClick={()=>setActivePage('cashout')} className={`flex flex-col items-center justify-center w-20 h-14 rounded-2xl transition-all ${activePage==='cashout' ? 'bg-zinc-100 text-indigo-600' : 'text-zinc-400'}`}>
                  <Wallet size={22} strokeWidth={activePage==='cashout' ? 2.5 : 2} />
              </button>
              <button onClick={()=>setActivePage('staff')} className={`flex flex-col items-center justify-center w-20 h-14 rounded-2xl transition-all ${activePage==='staff' ? 'bg-zinc-100 text-indigo-600' : 'text-zinc-400'}`}>
                  <User size={22} strokeWidth={activePage==='staff' ? 2.5 : 2} />
              </button>
          </div>
      </nav>

      <main className="max-w-6xl mx-auto px-5 pt-8 md:pt-32 pb-24 min-h-screen">
          {/* PAGE: HOME */}
          {activePage === 'home' && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="md:hidden flex items-center gap-3 mb-8 mt-2">
                     <img src={STORE_LOGO} className="w-10 h-10 rounded-full bg-zinc-100" alt="logo"/>
                     <h1 className="font-bold text-xl text-zinc-900">WuregStore</h1>
                  </div>
                  <div className="text-center mb-12">
                      <span className="inline-block py-1.5 px-4 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-600 mb-6 tracking-wide uppercase">Fastest Delivery ⚡️</span>
                      <h2 className="text-4xl md:text-6xl font-black text-zinc-900 mb-6 leading-tight tracking-tight">Top Up Game <br className="hidden md:block"/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">Termurah & Aman.</span></h2>
                      <div className="max-w-lg mx-auto relative group">
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400"><Search size={20}/></div>
                         <input className="w-full py-4 pl-12 pr-4 bg-white border border-zinc-200 rounded-2xl font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm" placeholder="Cari game favoritmu..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
                      </div>
                  </div>
                  <div className="flex justify-between md:justify-center overflow-x-auto gap-2 mb-10 pb-4 md:pb-0 scrollbar-hide">
                      {['All', 'Game', 'TopUp', 'Akun', 'Software', 'Jasa'].map(c => (
                          <button key={c} onClick={()=>setSelectedCategory(c)} className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap ${selectedCategory===c ? 'bg-zinc-900 text-white shadow-lg' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}>{c}</button>
                      ))}
                  </div>
                  {isLoading ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">{[1,2,3,4,5].map(i => <div key={i} className="aspect-[4/5] bg-zinc-200/50 rounded-[24px] animate-pulse"/>)}</div>
                  ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                          {products.filter(p => (selectedCategory === 'All' || p.category === selectedCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                              <KodesetProductCard key={p.id} product={p} onClick={(prod: any) => { setSelectedProduct(prod); setCheckoutStep(1); }} />
                          ))}
                      </div>
                  )}
              </div>
          )}

          {/* --- PAGE: CASH OUT (PUBLICLY ACCESSIBLE) --- */}
          {activePage === 'cashout' && (
              <div className="animate-in fade-in slide-in-from-bottom-8">
                  <div className="max-w-2xl mx-auto">
                      <div className="bg-white rounded-[24px] border border-zinc-200 shadow-sm p-6 md:p-8">
                          <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-100">
                             <div>
                                 <h3 className="font-bold text-xl">Kasir Pengeluaran</h3>
                                 <p className="text-xs text-zinc-400">Saldo saat ini: <span className="font-bold text-emerald-600">Rp {shopBalance.toLocaleString()}</span></p>
                             </div>
                             <button onClick={()=>setCashOutForm({tag:'Anwaha Mart', items:[{name:'', price:0, qty:1}]})} className="p-2 bg-zinc-50 rounded-xl hover:bg-zinc-100"><RefreshCw size={18}/></button>
                          </div>

                          <div className="space-y-6">
                              {/* Tag Selection */}
                              <div>
                                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Pilih Tag</label>
                                  <div className="flex gap-2 mt-2">
                                      {['Anwaha Mart', 'Syirkah', 'Warung', 'Idaroh'].map(tag => (
                                          <button key={tag} onClick={()=>setCashOutForm({...cashOutForm, tag})} className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${cashOutForm.tag === tag ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-zinc-100 bg-zinc-50 text-zinc-400'}`}>
                                              {tag}
                                          </button>
                                      ))}
                                  </div>
                              </div>

                              {/* Items List */}
                              <div className="space-y-3">
                                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Daftar Belanja</label>
                                  {cashOutForm.items.map((item, idx) => (
                                      <div key={idx} className="flex gap-2 items-start">
                                          <div className="flex-1 space-y-2">
                                              <input placeholder="Nama Jajanan / Barang" className="w-full p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-sm font-bold outline-none focus:border-indigo-500" value={item.name} onChange={e=>handleCashOutChange(idx, 'name', e.target.value)}/>
                                              <div className="flex gap-2">
                                                  <input type="number" placeholder="Harga" className="flex-1 p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-sm font-mono outline-none focus:border-indigo-500" value={item.price || ''} onChange={e=>handleCashOutChange(idx, 'price', e.target.value)}/>
                                                  <input type="number" placeholder="Qty" className="w-20 p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-sm font-mono outline-none focus:border-indigo-500 text-center" value={item.qty} onChange={e=>handleCashOutChange(idx, 'qty', e.target.value)}/>
                                              </div>
                                          </div>
                                          {cashOutForm.items.length > 1 && (
                                              <button onClick={()=>handleRemoveCashOutItem(idx)} className="p-3 mt-1 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><MinusCircle size={20}/></button>
                                          )}
                                      </div>
                                  ))}
                                  <button onClick={handleAddCashOutItem} className="w-full py-3 border-2 border-dashed border-zinc-300 rounded-xl text-zinc-400 font-bold hover:border-indigo-500 hover:text-indigo-500 flex items-center justify-center gap-2">
                                      <PlusCircle size={18}/> Tambah Jajanan Lain
                                  </button>
                              </div>

                              {/* Total & Pay */}
                              <div className="pt-6 border-t border-zinc-100">
                                  <div className="flex justify-between items-end mb-4">
                                      <span className="text-sm text-zinc-500 font-bold">Total Pengeluaran</span>
                                      <span className="text-2xl font-black text-zinc-900">Rp {calculateTotalExpense().toLocaleString()}</span>
                                  </div>
                                  <button disabled={isSubmitting} onClick={()=>{setPinAction('cashout'); setIsPinModalOpen(true);}} className="w-full py-4 bg-zinc-900 text-white font-bold rounded-2xl shadow-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                      {isSubmitting ? 'Memproses...' : 'PROSES CASH OUT'}
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
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
                                  {[
                                      {id:'dash',l:'Dash',i:Monitor}, 
                                      {id:'trx',l:'Order',i:FileSpreadsheet}, 
                                      {id:'prod',l:'Produk',i:Gamepad2}, 
                                      {id:'setting',l:'Set',i:Settings},
                                      {id:'expense', l:'Pengeluaran', i:Receipt} 
                                  ].map(m => (
                                      <button key={m.id} onClick={()=>{setAdminTab(m.id as any);}} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${adminTab===m.id ? 'bg-zinc-900 text-white shadow-md' : 'hover:bg-zinc-50 text-zinc-500'}`}><m.i size={14}/> {m.l}</button>
                                  ))}
                              </div>
                              <button onClick={async()=>{await supabase.auth.signOut(); setIsStaffLoggedIn(false)}} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><LogOut size={18}/></button>
                          </div>

                          {/* DASHBOARD */}
                          {adminTab === 'dash' && (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    
    {/* --- ROW 1: THE CORE FINANCIALS --- */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Liquid Balance - Primary Action Card */}
      <div className="md:col-span-2 bg-zinc-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div>
            <div className="flex justify-between items-start">
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-[0.2em]">Total Shop Capital</p>
              <Zap size={20} className="text-indigo-500 animate-pulse" />
            </div>
            <h3 className="text-4xl font-black mt-2">Rp {shopBalance.toLocaleString()}</h3>
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={() => setModalType('topup_balance')} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 py-3 rounded-2xl text-xs font-bold transition-all">
              <Plus size={16} /> Top Up
            </button>
            <button onClick={() => setActivePage('cashout')} className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 py-3 rounded-2xl text-xs font-bold transition-all backdrop-blur-md">
              <Receipt size={16} /> Cash Out
            </button>
          </div>
        </div>
        <Wallet className="absolute right-[-20px] bottom-[-20px] w-48 h-48 text-white/[0.03] group-hover:scale-110 transition-transform duration-700" />
      </div>

      {/* Revenue Metric */}
      <div className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm">
        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
          <TrendingUp size={20} />
        </div>
        <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Gross Sales</p>
        <h3 className="text-2xl font-black text-zinc-900">Rp {transactions.reduce((a, b) => a + (b.price || 0), 0).toLocaleString()}</h3>
        <div className="mt-2 text-[10px] font-bold text-emerald-500">+{transactions.filter(t => t.status === 'Selesai').length} Success Trx</div>
      </div>

      {/* Expense Metric */}
      <div className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm">
        <div className="w-10 h-10 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4">
          <History size={20} />
        </div>
        <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Total Expenses</p>
        <h3 className="text-2xl font-black text-zinc-900">Rp {expenses.reduce((a, b) => a + (b.total_amount || 0), 0).toLocaleString()}</h3>
        <div className="mt-2 text-[10px] font-bold text-red-400">{expenses.length} Anwaha/Syirkah Logs</div>
      </div>
    </div>

    {/* --- ROW 2: ADVANCED ANALYTICS --- */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Sales by Category Heatmap */}
      <div className="bg-white rounded-[32px] p-8 border border-zinc-100 shadow-sm">
        <h4 className="font-black text-zinc-900 mb-6 flex items-center gap-2">
          <Monitor size={18} className="text-indigo-600" /> Category Performance
        </h4>
        <div className="space-y-5">
          {['Game', 'TopUp', 'Akun', 'Software'].map(cat => {
            const count = transactions.filter(t => products.find(p => p.name === t.product_name)?.category === cat).length;
            const total = transactions.length || 1;
            const percentage = Math.round((count / total) * 100);
            return (
              <div key={cat} className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-zinc-600">{cat}</span>
                  <span className="text-zinc-900">{percentage}%</span>
                </div>
                <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-1000" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* System Health & Low Stock Monitor */}
      <div className="bg-white rounded-[32px] p-8 border border-zinc-100 shadow-sm">
        <h4 className="font-black text-zinc-900 mb-6 flex items-center gap-2">
          <AlertCircle size={18} className="text-amber-500" /> Inventory Health
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
            <p className="text-[10px] font-bold text-zinc-400 uppercase">Active Products</p>
            <p className="text-2xl font-black text-zinc-900">{products.filter(p => p.is_ready).length}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
            <p className="text-[10px] font-bold text-red-400 uppercase">Sold Out</p>
            <p className="text-2xl font-black text-red-600">{products.filter(p => !p.is_ready).length}</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <p className="text-[10px] font-bold text-indigo-400 uppercase">Total Vouchers</p>
            <p className="text-2xl font-black text-indigo-600">{vouchers.length}</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <p className="text-[10px] font-bold text-amber-500 uppercase">Pending Orders</p>
            <p className="text-2xl font-black text-amber-600">{transactions.filter(t => t.status === 'Pending').length}</p>
          </div>
        </div>
        
        {/* Quick Staff Task */}
        <div className="mt-6 p-4 bg-zinc-900 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white/10 rounded-xl text-white"><Printer size={16}/></div>
             <p className="text-white text-[11px] font-medium">Pending items need PDF export</p>
          </div>
          <button onClick={() => setAdminTab('trx')} className="text-indigo-400 text-[10px] font-bold hover:underline">Process Now</button>
        </div>
      </div>

    </div>

    {/* --- ROW 3: RECENT TRANSACTION LOG --- */}
    <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-zinc-50 bg-zinc-50/30">
        <h4 className="font-black text-zinc-900">Live Transaction Stream</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] text-left">
          <thead className="bg-zinc-50/50 text-zinc-400 font-bold uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {transactions.slice(0, 5).map((t, i) => (
              <tr key={i} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4 font-bold text-zinc-800">{t.buyer_name}</td>
                <td className="px-6 py-4 text-zinc-500">{t.product_name}</td>
                <td className="px-6 py-4 font-black text-zinc-900">Rp {t.price.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${
                    t.status === 'Selesai' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

                          {/* --- TAB PENGELUARAN (LAPORAN) --- */}
                          {adminTab === 'expense' && (
                              <div className="bg-white rounded-[24px] border border-zinc-200 shadow-sm overflow-hidden">
                                  <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                                      <h3 className="font-bold text-zinc-900">Laporan Pengeluaran</h3>
                                      <button onClick={refreshAdminData}><RefreshCw size={16} className="text-zinc-400 hover:text-indigo-600"/></button>
                                  </div>
                                  <div className="overflow-x-auto">
                                      <table className="w-full text-xs text-left whitespace-nowrap">
                                          <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider">
                                              <tr>
                                                  <th className="p-4">Tanggal</th>
                                                  <th className="p-4">Tag</th>
                                                  <th className="p-4">Total</th>
                                                  <th className="p-4">Item Count</th>
                                                  <th className="p-4 text-right">Action</th>
                                              </tr>
                                          </thead>
                                          <tbody className="divide-y divide-zinc-100">
                                              {expenses.map(ex => (
                                                  <tr key={ex.id} className="hover:bg-zinc-50">
                                                      <td className="p-4 font-mono text-zinc-500">{new Date(ex.created_at).toLocaleString()}</td>
                                                      <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${ex.tag==='Syirkah' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{ex.tag}</span></td>
                                                      <td className="p-4 font-bold text-red-600">- Rp {ex.total_amount.toLocaleString()}</td>
                                                      <td className="p-4 text-zinc-500">{ex.items?.length || 0} Items</td>
                                                      <td className="p-4 text-right">
                                                          <button onClick={()=>{setDetailExpense(ex); setModalType('expense_detail');}} className="p-2 bg-zinc-100 rounded-lg text-zinc-600 hover:bg-zinc-200"><Eye size={16}/></button>
                                                      </td>
                                                  </tr>
                                              ))}
                                              {expenses.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-zinc-400">Belum ada data pengeluaran.</td></tr>}
                                          </tbody>
                                      </table>
                                  </div>
                              </div>
                          )}

                          {/* Transaction Table */}
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

                          {/* Products & Settings */}
                          {adminTab === 'prod' && (
                              <div className="space-y-4">
                                  <button onClick={()=>{setEditingItem(null); setFormData({}); setModalType('product');}} className="w-full py-4 border-2 border-dashed border-zinc-300 rounded-[24px] text-zinc-400 font-bold hover:border-indigo-500 hover:text-indigo-500 transition-colors bg-zinc-50">+ Tambah Produk</button>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {products.map(p => (
                                          <div key={p.id} className="flex gap-4 p-3 bg-white border border-zinc-100 rounded-[24px] shadow-sm hover:shadow-md transition-all items-center">
                                              <img src={p.image_url} className="w-14 h-14 rounded-2xl object-cover bg-zinc-100" alt="prod"/>
                                              <div className="flex-1 min-w-0">
                                                  <h4 className="font-bold text-sm truncate">{p.name}</h4>
                                                  <p className="text-xs text-zinc-500">Rp {p.price.toLocaleString()}</p>
                                              </div>
                                              <div className="flex gap-1 items-center">
                                                 <button onClick={()=>handleToggleProductReady(p)} className={`p-2.5 rounded-xl ${p.is_ready ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{p.is_ready ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>}</button>
                                                 <button onClick={()=>{setEditingItem(p); setFormData(p); setModalType('product');}} className="p-2.5 bg-zinc-50 rounded-xl text-zinc-600 hover:bg-zinc-200"><Edit3 size={14}/></button>
                                                 <button onClick={()=>handleDelete('products', p.id)} className="p-2.5 bg-red-50 rounded-xl text-red-500 hover:bg-red-100"><Trash2 size={14}/></button>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          )}
                          {adminTab === 'setting' && (
                              <div className="bg-white rounded-[24px] border border-zinc-200 shadow-sm p-6">
                                  <div className="flex gap-2 mb-6 border-b border-zinc-100 pb-4 overflow-x-auto">
                                     <button onClick={()=>setSettingSubTab('payment')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${settingSubTab==='payment' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'}`}>Payment</button>
                                     <button onClick={()=>setSettingSubTab('voucher')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${settingSubTab==='voucher' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'}`}>Vouchers</button>
                                     <button onClick={()=>setSettingSubTab('social')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${settingSubTab==='social' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'}`}>Social</button>
                                  </div>
                                  
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
                                                     <button onClick={()=>handleToggleActive('payment_methods', pm)} className={`p-1.5 rounded-lg ${pm.is_active ? 'bg-green-100 text-green-600' : 'bg-zinc-200 text-zinc-400'}`}>{pm.is_active ? <ToggleRight size={20}/> : <ToggleLeft size={20}/>}</button>
                                                     <button onClick={()=>{setEditingItem(pm); setFormData(pm); setModalType('payment');}} className="p-1.5 bg-white border border-zinc-200 rounded-lg text-zinc-600"><Edit3 size={16}/></button>
                                                     <button onClick={()=>handleDelete('payment_methods', pm.id)} className="p-1.5 bg-white border border-red-200 rounded-lg text-red-500"><Trash2 size={16}/></button>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                  )}

                                  {settingSubTab === 'voucher' && (
                                     <div className="space-y-4 animate-in fade-in">
                                         <button onClick={()=>{setEditingItem(null); setFormData({}); setModalType('voucher');}} className="w-full py-3 border-dashed border-2 border-zinc-200 rounded-xl text-xs font-bold text-zinc-400 hover:border-indigo-500 hover:text-indigo-500">+ Add Voucher</button>
                                         {vouchers.map(v => (
                                             <div key={v.id} className="flex justify-between items-center p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                                                 <div>
                                                     <div className="font-bold text-sm text-zinc-900">{v.code}</div>
                                                     <div className="text-xs text-indigo-600 font-bold">Rp {v.amount.toLocaleString()}</div>
                                                 </div>
                                                 <div className="flex items-center gap-2">
                                                     <button onClick={()=>handleToggleActive('vouchers', v)} className={`p-1.5 rounded-lg ${v.is_active ? 'bg-green-100 text-green-600' : 'bg-zinc-200 text-zinc-400'}`}>{v.is_active ? <ToggleRight size={20}/> : <ToggleLeft size={20}/>}</button>
                                                     <button onClick={()=>{setEditingItem(v); setFormData(v); setModalType('voucher');}} className="p-1.5 bg-white border border-zinc-200 rounded-lg text-zinc-600"><Edit3 size={16}/></button>
                                                     <button onClick={()=>handleDelete('vouchers', v.id)} className="p-1.5 bg-white border border-red-200 rounded-lg text-red-500"><Trash2 size={16}/></button>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                  )}

                                  {settingSubTab === 'social' && (
                                     <div className="space-y-4 animate-in fade-in">
                                         <button onClick={()=>{setEditingItem(null); setFormData({}); setModalType('contact');}} className="w-full py-3 border-dashed border-2 border-zinc-200 rounded-xl text-xs font-bold text-zinc-400 hover:border-indigo-500 hover:text-indigo-500">+ Add Social Link</button>
                                         {contactMethods.map(c => (
                                             <div key={c.id} className="flex justify-between items-center p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                                                 <div className="flex items-center gap-3">
                                                     <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-zinc-100"><ExternalLink size={14}/></div>
                                                     <div className="font-bold text-sm text-zinc-900">{c.platform_name}</div>
                                                 </div>
                                                 <div className="flex items-center gap-2">
                                                     <button onClick={()=>handleToggleActive('contact_methods', c)} className={`p-1.5 rounded-lg ${c.is_active ? 'bg-green-100 text-green-600' : 'bg-zinc-200 text-zinc-400'}`}>{c.is_active ? <ToggleRight size={20}/> : <ToggleLeft size={20}/>}</button>
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
      
      {/* TOP UP BALANCE MODAL */}
      {modalType === 'topup_balance' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in zoom-in-95">
             <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative">
                <button onClick={()=>setModalType(null)} className="absolute top-6 right-6 p-2 bg-zinc-100 rounded-full text-zinc-500"><X size={18}/></button>
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><TrendingUp size={32}/></div>
                    <h3 className="text-xl font-bold">Top Up Saldo Admin</h3>
                    <p className="text-xs text-zinc-400">Tambah likuiditas untuk pengeluaran toko</p>
                </div>
                <div className="space-y-4">
                    <KodesetInput type="number" placeholder="Nominal Saldo (Rp)" value={topUpAmount || ''} onChange={(e:any)=>setTopUpAmount(e.target.value)} icon={Wallet} />
                    <button onClick={()=>{setPinAction('topup'); setIsPinModalOpen(true);}} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 transition-all">Lanjut Verifikasi PIN</button>
                </div>
             </div>
          </div>
      )}

      {/* 1. PIN VERIFICATION MODAL */}
      {isPinModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in zoom-in-95">
              <div className="bg-white w-full max-w-xs p-6 rounded-[24px] shadow-2xl text-center">
                  <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-900"><Lock size={20}/></div>
                  <h3 className="font-bold text-lg mb-1">Verifikasi PIN</h3>
                  <p className="text-xs text-zinc-400 mb-4">Masukkan PIN untuk mengonfirmasi {pinAction === 'topup' ? 'Top Up' : 'Cash Out'}.</p>
                  <form onSubmit={handlePinSubmit} className="space-y-3">
                      <input type="password" autoFocus className="w-full text-center text-xl tracking-[0.3em] font-bold p-3 bg-zinc-50 rounded-xl border border-zinc-200 focus:border-zinc-900 outline-none" placeholder="••••" value={cashOutPinInput} onChange={e=>setCashOutPinInput(e.target.value)}/>
                      <div className="flex gap-2">
                          <button type="button" onClick={()=>{setIsPinModalOpen(false); setCashOutPinInput('');}} className="flex-1 py-3 bg-zinc-100 text-zinc-600 font-bold rounded-xl text-xs">BATAL</button>
                          <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-zinc-900 text-white font-bold rounded-xl text-xs">{isSubmitting ? '...' : 'KONFIRMASI'}</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* 2. CHECKOUT MODAL (PRODUCT) */}
      {selectedProduct && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-md p-0 md:p-4 animate-in fade-in">
              <div className="bg-white w-full md:max-w-md rounded-t-[32px] md:rounded-[32px] p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10">
                  <div className="flex gap-4 items-center mb-6 border-b border-zinc-100 pb-4">
                      <div className="w-16 h-16 rounded-[18px] overflow-hidden bg-zinc-100">
                        <img src={selectedProduct.image_url} className="w-full h-full object-cover" alt="prod"/>
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

      {/* 3. CRUD MODAL */}
      {modalType && !['invoice', 'expense_detail', 'topup_balance'].includes(modalType) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
              <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                  <h3 className="font-bold text-xl mb-6 capitalize text-zinc-900">{editingItem ? 'Edit' : 'Tambah'} {modalType}</h3>
                  <div className="space-y-4 mb-6">
                      {modalType === 'product' && (
                          <>
                             <KodesetInput placeholder="Nama Produk" value={formData.name||''} onChange={(e:any)=>setFormData({...formData, name:e.target.value})} />
                             <KodesetInput type="number" placeholder="Harga" value={formData.price||''} onChange={(e:any)=>setFormData({...formData, price:e.target.value})} />
                             <select className="w-full bg-white border border-zinc-200 rounded-2xl py-4 px-4 font-medium text-zinc-800 outline-none focus:border-indigo-500" value={formData.category||'Game'} onChange={e=>setFormData({...formData, category:e.target.value})}><option>Game</option><option>TopUp</option><option>Akun</option><option>Software</option></select>
                             <KodesetInput placeholder="Image URL" value={formData.image_url||''} onChange={(e:any)=>setFormData({...formData, image_url:e.target.value})} />
                             <button onClick={()=>handleSaveItem('products', formData)} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-[20px] shadow-lg mt-2">Simpan Produk</button>
                          </>
                      )}
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

      {/* 4. EXPENSE DETAIL MODAL */}
      {modalType === 'expense_detail' && detailExpense && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
             <div className="bg-white w-full max-w-[340px] relative shadow-2xl rounded-none overflow-hidden">
                 <div ref={expenseRef} className="p-8 bg-white text-zinc-900 font-mono text-xs leading-relaxed">
                     <div className="text-center border-b-2 border-dashed border-zinc-300 pb-6 mb-6">
                         <h2 className="text-lg font-black uppercase tracking-[0.2em] mb-1">EXPENSE NOTE</h2>
                         <p className="font-bold text-zinc-600">WuregStore Admin</p>
                         <p className="text-[10px] text-zinc-400 mt-1">{new Date(detailExpense.created_at).toLocaleString()}</p>
                     </div>
                     <div className="space-y-2 mb-6">
                         <div className="flex justify-between"><span>TAG</span><span className="font-bold uppercase">{detailExpense.tag}</span></div>
                         <div className="flex justify-between"><span>ADMIN</span><span className="font-bold">STAFF</span></div>
                     </div>
                     <div className="border-t-2 border-dashed border-zinc-300 py-4 space-y-2">
                         {detailExpense.items?.map((item: any, i: number) => (
                             <div key={i} className="flex justify-between">
                                 <span>{item.name} <span className="text-[10px] text-zinc-400">x{item.qty}</span></span>
                                 <span>{(item.price * item.qty).toLocaleString()}</span>
                             </div>
                         ))}
                     </div>
                     <div className="border-t-2 border-zinc-900 pt-3 flex justify-between text-lg font-black">
                         <span>TOTAL</span>
                         <span>Rp {detailExpense.total_amount.toLocaleString()}</span>
                     </div>
                 </div>
                 <div className="p-4 bg-zinc-50 space-y-2 border-t border-zinc-100">
                     <div className="flex gap-2">
                         <button onClick={()=>generateFile(expenseRef, 'jpg', `Expense-${detailExpense.id}`)} disabled={isGenerating} className="flex-1 py-3 bg-zinc-900 text-white font-bold rounded-xl shadow-md text-[10px] uppercase">{isGenerating ? '...' : 'Save JPG'}</button>
                         <button onClick={()=>generateFile(expenseRef, 'pdf', `Expense-${detailExpense.id}`)} disabled={isGenerating} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-md text-[10px] uppercase">{isGenerating ? '...' : 'Print PDF'}</button>
                     </div>
                     <button onClick={()=>setModalType(null)} className="w-full py-3 bg-white border border-zinc-200 font-bold rounded-xl shadow-sm text-xs uppercase">Close</button>
                 </div>
             </div>
          </div>
      )}

      {/* 5. INVOICE MODAL (TRANSACTION) */}
      {modalType === 'invoice' && detailTrx && (
         <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
             <div className="bg-white w-full max-w-[340px] relative shadow-2xl rounded-none overflow-hidden">
                 <div ref={invoiceRef} className="p-8 bg-white text-zinc-900 font-mono text-xs leading-relaxed">
                     <div className="text-center border-b-2 border-dashed border-zinc-300 pb-6 mb-6">
                         <div className="w-16 h-16 bg-white rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden border border-zinc-200 p-1">
                             <img src={STORE_LOGO} className="w-full h-full object-cover rounded-full" alt="Logo" crossOrigin="anonymous"/>
                         </div>
                         <h2 className="text-xl font-black uppercase tracking-[0.2em] mb-1">RECEIPT</h2>
                         <p className="font-bold text-zinc-600">WuregStore Official</p>
                         <p className="text-[10px] text-zinc-400 mt-1">{new Date(detailTrx.created_at).toLocaleString()}</p>
                     </div>
                     <div className="space-y-3 mb-6">
                         <div className="flex justify-between"><span className="text-zinc-500">ORDER ID</span><span className="font-bold">#{detailTrx.id.slice(0,8)}</span></div>
                         <div className="flex justify-between"><span className="text-zinc-500">BUYER</span><span className="font-bold text-right max-w-[150px] truncate">{detailTrx.buyer_name}</span></div>
                         <div className="flex justify-between"><span className="text-zinc-500">METHOD</span><span className="font-bold uppercase">{detailTrx.payment_method}</span></div>
                         <div className="flex justify-between"><span className="text-zinc-500">STATUS</span><span className={`font-bold uppercase px-1.5 py-0.5 rounded text-[10px] ${detailTrx.status === 'Selesai' ? 'bg-green-100 text-green-700' : detailTrx.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{detailTrx.status}</span></div>
                     </div>
                     <div className="border-t-2 border-dashed border-zinc-300 py-4">
                         <div className="font-bold text-sm mb-1 text-zinc-800">{detailTrx.product_name}</div>
                         <div className="flex justify-between text-zinc-500"><span>1 x {detailTrx.price.toLocaleString()}</span><span>{detailTrx.price.toLocaleString()}</span></div>
                     </div>
                     <div className="border-t-2 border-zinc-900 pt-3 flex justify-between text-lg font-black"><span>TOTAL</span><span>Rp {detailTrx.price.toLocaleString()}</span></div>
                     <div className="mt-8 text-center space-y-1"><p className="text-[10px] text-zinc-400">TERIMA KASIH TELAH BERBELANJA</p></div>
                 </div>
                 <div className="p-4 bg-zinc-50 space-y-2 border-t border-zinc-100">
                     <div className="flex gap-2">
                         <button onClick={()=>generateFile(invoiceRef, 'jpg', `Invoice-${detailTrx.id}`)} disabled={isGenerating} className="flex-1 py-3 bg-zinc-900 text-white font-bold rounded-xl shadow-md text-[10px] uppercase">{isGenerating ? '...' : 'Save JPG'}</button>
                         <button onClick={()=>generateFile(invoiceRef, 'pdf', `Invoice-${detailTrx.id}`)} disabled={isGenerating} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-md text-[10px] uppercase">{isGenerating ? '...' : 'Print PDF'}</button>
                     </div>
                     <button onClick={()=>setModalType(null)} className="w-full py-3 bg-white border border-zinc-200 font-bold rounded-xl shadow-sm text-xs uppercase">Close</button>
                 </div>
             </div>
         </div>
      )}

      {/* Support Modal */}
      {isContactModalOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative">
                  <button onClick={()=>setIsContactModalOpen(false)} className="absolute top-4 right-4 p-2 bg-zinc-100 rounded-full text-zinc-500 hover:bg-zinc-200"><X size={18}/></button>
                  <div className="text-center mb-6 mt-2">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3"><MessageCircle size={28}/></div>
                      <h3 className="font-bold text-xl text-zinc-900">Hubungi Kami</h3>
                      <p className="text-zinc-500 text-xs">Pilih metode bantuan dibawah ini</p>
                  </div>
                  <div className="space-y-3">
                      {contactMethods.map(c => (
                          <a key={c.id} href={c.url} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl hover:bg-zinc-100 hover:border-indigo-200 transition-all group">
                              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-zinc-700 group-hover:text-indigo-600"><ExternalLink size={18}/></div>
                              <div>
                                  <div className="font-bold text-zinc-900">{c.platform_name}</div>
                                  <div className="text-xs text-zinc-400">Klik untuk membuka</div>
                              </div>
                          </a>
                      ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
