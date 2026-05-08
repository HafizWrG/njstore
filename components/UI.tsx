import React from 'react';
import { Upload, RefreshCw, Plus, X, CheckCircle, AlertCircle } from 'lucide-react';

export const Background = () => (
    <div className="fixed inset-0 -z-50 bg-[#F4F4F5]">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-200/30 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-200/30 blur-[120px]" />
    </div>
);

export const KodesetInput = ({ icon: Icon, ...props }: any) => (
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

export const FileUploadField = ({ label, value, onChange, onUpload, isUploading, bucket = 'store_assets', accept = "image/*,.apk,.zip,.exe" }: any) => {
    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 ml-1">{label}</label>
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="URL (or upload file)"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-3 font-medium text-sm text-zinc-800 outline-none focus:border-indigo-500"
                />
                <div className="relative">
                    <button type="button" disabled={isUploading} className="h-full px-4 bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-200 flex items-center justify-center disabled:opacity-50 transition-colors">
                        {isUploading ? <RefreshCw size={18} className="animate-spin" /> : <Upload size={18} />}
                    </button>
                    <input
                        type="file"
                        accept={accept}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        onChange={(e) => onUpload(e, bucket)}
                        disabled={isUploading}
                    />
                </div>
            </div>
        </div>
    );
};

export const MultipleFileUploadField = ({ label, urls = [], onChange, onUploadMultiple, isUploading, bucket = 'store_assets' }: any) => {
    const handleRemove = (index: number) => {
        const newUrls = [...urls];
        newUrls.splice(index, 1);
        onChange(newUrls);
    };

    return (
        <div className="space-y-2 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
            <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-zinc-500 ml-1">{label}</label>
                <div className="relative overflow-hidden">
                    <button type="button" disabled={isUploading} className="px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-200 flex items-center gap-2 disabled:opacity-50 transition-colors">
                        {isUploading ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />} Add Screenshots
                    </button>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        onChange={(e) => onUploadMultiple(e, bucket)}
                        disabled={isUploading}
                    />
                </div>
            </div>

            {urls.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {urls.map((url: string, idx: number) => (
                        <div key={idx} className="relative w-24 h-40 shrink-0 rounded-xl overflow-hidden border border-zinc-200 bg-white group">
                            <img src={url} alt={`Screenshot ${idx + 1}`} className="w-full h-full object-cover" />
                            <button onClick={() => handleRemove(idx)} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-6 text-zinc-400 text-xs font-medium border-2 border-dashed border-zinc-200 rounded-xl bg-white">
                    No screenshots added yet.
                </div>
            )}
        </div>
    );
};

export const KodesetProductCard = ({ product, onClick }: any) => {
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

export const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose?: () => void }) => (
    <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border backdrop-blur-md animate-in slide-in-from-top-5 duration-300 ${type === 'success' ? 'bg-white/80 border-green-200 text-green-700' : 'bg-white/80 border-red-200 text-red-700'
        }`}>
        {type === 'success' ? <CheckCircle size={18} className="text-green-500" /> : <AlertCircle size={18} className="text-red-500" />}
        <span className="font-semibold text-sm">{message}</span>
    </div>
);
