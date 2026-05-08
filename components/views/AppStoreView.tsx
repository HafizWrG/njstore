import React from 'react';
import { Search, LayoutGrid, Star } from 'lucide-react';
import { getPlatformIcon } from '../../utils/helpers';

export const AppStoreView = ({
    appSearchQuery,
    setAppSearchQuery,
    isLoading,
    apps,
    setSelectedApp,
}: any) => {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="md:hidden flex items-center gap-3 mb-8 mt-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white">
                    <LayoutGrid size={20} />
                </div>
                <h1 className="font-bold text-xl text-zinc-900">WDA Store</h1>
            </div>
            <div className="flex flex-col md:flex-row gap-6 mb-10 items-center justify-between">
                <div>
                    <h2 className="text-3xl md:text-5xl font-black text-zinc-900 tracking-tight mb-2">Discover <span className="text-blue-600">Great Apps.</span></h2>
                    <p className="text-zinc-500 font-medium">Download the best apps directly from WDA Store.</p>
                </div>
                <div className="w-full md:w-auto relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400"><Search size={20} /></div>
                    <input className="w-full md:w-80 py-4 pl-12 pr-4 bg-white border border-zinc-200 rounded-2xl font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="Search apps, games..." value={appSearchQuery} onChange={e => setAppSearchQuery(e.target.value)} />
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[1, 2, 3].map(i => <div key={i} className="h-40 bg-zinc-200/50 rounded-[24px] animate-pulse" />)}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {apps.filter((a: any) => a.name.toLowerCase().includes(appSearchQuery.toLowerCase())).map((app: any) => (
                        <div key={app.id} onClick={() => setSelectedApp(app)} className="bg-white p-5 rounded-[24px] border border-zinc-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex gap-5 items-center group relative overflow-hidden">
                            {/* Platform Badge */}
                            <div className="absolute top-0 right-0 px-3 py-1 bg-zinc-50 border-b border-l border-zinc-100 rounded-bl-[16px] flex items-center gap-1 shadow-sm">
                                {getPlatformIcon(app.platform)}
                                <span className="text-[10px] font-bold text-zinc-500">{app.platform || 'Cross'}</span>
                            </div>

                            <div className="w-20 h-20 rounded-[20px] bg-zinc-100 overflow-hidden shadow-sm shrink-0">
                                {app.icon_url ? <img src={app.icon_url} className="w-full h-full object-cover" alt={app.name} /> : <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-500 font-bold text-2xl">{app.name[0]}</div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg text-zinc-900 truncate group-hover:text-blue-600 transition-colors pr-10">{app.name}</h3>
                                <p className="text-xs text-zinc-500 truncate mb-2">{app.developer}</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 bg-zinc-50 px-2 py-1 rounded-lg">
                                        <Star size={12} className="text-amber-400 fill-amber-400" />
                                        <span className="text-[10px] font-bold text-zinc-600">{app.rating || '4.8'}</span>
                                    </div>
                                    <button className="px-4 py-1.5 bg-zinc-100 text-blue-600 font-bold text-xs rounded-full hover:bg-blue-600 hover:text-white transition-all">
                                        {app.price > 0 ? `Rp ${app.price.toLocaleString()}` : 'Get'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
