import React from 'react';
import { Search } from 'lucide-react';
import { KodesetProductCard } from '../UI';

export const StorefrontView = ({
    STORE_LOGO,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    products,
    setSelectedProduct,
    setCheckoutStep
}: any) => {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="md:hidden flex items-center gap-3 mb-8 mt-2">
                <img src={STORE_LOGO} className="w-10 h-10 rounded-full bg-zinc-100 object-cover" alt="logo" />
                <h1 className="font-bold text-xl text-zinc-900">WuregStore</h1>
            </div>
            <div className="text-center mb-12">
                <span className="inline-block py-1.5 px-4 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-600 mb-6 tracking-wide uppercase">Open 14.00-17.00 Wita ⚡️</span>
                <h2 className="text-4xl md:text-6xl font-black text-zinc-900 mb-6 leading-tight tracking-tight">Terpercaya<br className="hidden md:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">murah & terbukti.</span></h2>
                <div className="max-w-lg mx-auto relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400"><Search size={20} /></div>
                    <input className="w-full py-4 pl-12 pr-4 bg-white border border-zinc-200 rounded-2xl font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm" placeholder="Cari game favoritmu..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
            </div>
            <div className="flex justify-between md:justify-center overflow-x-auto gap-2 mb-10 pb-4 md:pb-0 scrollbar-hide">
                {['All', 'Games', 'TopUp', 'Akun', 'Software', 'Jasa'].map(c => (
                    <button key={c} onClick={() => setSelectedCategory(c)} className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap ${selectedCategory === c ? 'bg-zinc-900 text-white shadow-lg' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}>{c}</button>
                ))}
            </div>
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">{[1, 2, 3, 4, 5].map(i => <div key={i} className="aspect-[4/5] bg-zinc-200/50 rounded-[24px] animate-pulse" />)}</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {products.filter((p: any) => (selectedCategory === 'All' || p.category === selectedCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((p: any) => (
                        <KodesetProductCard key={p.id} product={p} onClick={(prod: any) => { setSelectedProduct(prod); setCheckoutStep(1); }} />
                    ))}
                </div>
            )}
        </div>
    );
};
