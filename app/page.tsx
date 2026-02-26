{/* APP DETAIL MODAL (RESPONSIVE PC & MOBILE) */}
      {selectedApp && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md p-0 md:p-6 animate-in fade-in">
              <div className="bg-white w-full md:max-w-2xl rounded-t-[32px] md:rounded-[32px] overflow-hidden shadow-2xl max-h-[90vh] md:max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-10 relative">
                  
                  {/* Sticky Close Button (Dipindah ke luar agar tetap menempel) */}
                  <button onClick={()=> setSelectedApp(null)} className="absolute top-4 right-4 p-2.5 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors z-[70]">
                      <X size={20}/>
                  </button>

                  {/* Wrapper Scroll Baru */}
                  <div className="flex-1 overflow-y-auto w-full">
                      
                      {/* Banner Header */}
                      <div className="relative h-48 md:h-64 bg-zinc-100 w-full shrink-0">
                          {selectedApp.banner_url ? (
                              <img src={selectedApp.banner_url} className="w-full h-full object-cover" alt="Banner" />
                          ) : (
                              <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-800"></div>
                          )}
                          
                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent"></div>
                      </div>

                      {/* Body Konten (Class overflow-y-auto dihapus dari sini) */}
                      <div className="px-6 md:px-10 pb-10 pt-0 relative">
                          {/* Header Info: Ikon & Teks */}
                          <div className="flex flex-col md:flex-row gap-5 items-start md:items-end -mt-16 mb-8 relative z-10">
                              <div className="w-28 h-28 rounded-[28px] bg-white p-1 shadow-xl shrink-0">
                                  <img src={selectedApp.icon_url} className="w-full h-full rounded-[24px] object-cover bg-zinc-100" alt="Icon"/>
                              </div>
                              <div className="flex-1 w-full flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mt-2 md:mt-0 pb-1">
                                  <div>
                                      <div className="flex items-center gap-2 mb-1">
                                          <h2 className="text-2xl md:text-3xl font-black text-zinc-900 leading-tight">{selectedApp.name}</h2>
                                      </div>
                                      <p className="text-blue-600 font-bold text-sm md:text-base">{selectedApp.developer}</p>
                                  </div>
                                  <button 
                                      onClick={() => {
                                          if (selectedApp.price > 0) {
                                              setSelectedProduct(selectedApp); 
                                              setCheckoutStep(1); 
                                          } else {
                                              handleDownloadApp(selectedApp);
                                          }
                                      }} 
                                      className="w-full md:w-auto px-10 py-3.5 bg-blue-600 text-white font-black rounded-full hover:bg-blue-700 hover:scale-105 transition-all text-center shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                                  >
                                      <Download size={18}/> {selectedApp.price > 0 ? `Buy Rp ${selectedApp.price.toLocaleString()}` : 'Install'}
                                  </button>
                              </div>
                          </div>

                          {/* Info Stat Grid */}
                          <div className="flex justify-between items-center mb-8 pb-8 border-b border-zinc-100">
                              <div className="text-center flex-1">
                                  <div className="text-sm font-bold text-zinc-900 flex items-center gap-1 justify-center">{selectedApp.rating || '4.8'} <Star size={14} className="fill-zinc-900"/></div>
                                  <div className="text-[10px] text-zinc-500 uppercase font-bold mt-1">Reviews</div>
                              </div>
                              <div className="w-px h-8 bg-zinc-200"></div>
                              <div className="text-center flex-1">
                                  <div className="text-sm font-bold text-zinc-900 flex justify-center items-center gap-1"><Download size={14}/> {formatDownloads(selectedApp.download_count)}</div>
                                  <div className="text-[10px] text-zinc-500 uppercase font-bold mt-1">Downloads</div>
                              </div>
                              <div className="w-px h-8 bg-zinc-200"></div>
                              <div className="text-center flex-1">
                                  <div className="text-sm font-bold text-zinc-900 flex justify-center items-center gap-1"><HardDrive size={14}/> {selectedApp.file_size || 'N/A'}</div>
                                  <div className="text-[10px] text-zinc-500 uppercase font-bold mt-1">Size</div>
                              </div>
                              <div className="w-px h-8 bg-zinc-200 hidden md:block"></div>
                              <div className="text-center flex-1 hidden md:block">
                                  <div className="text-sm font-bold text-zinc-900 flex justify-center items-center gap-1"><Hash size={14}/> {selectedApp.version || '1.0.0'}</div>
                                  <div className="text-[10px] text-zinc-500 uppercase font-bold mt-1">Version</div>
                              </div>
                          </div>

                          {/* Screenshots Carousel */}
                          {selectedApp.screenshots && selectedApp.screenshots.length > 0 && (
                              <div className="mb-8">
                                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                                      {selectedApp.screenshots.map((url: string, idx: number) => (
                                          <div key={idx} className="w-[160px] md:w-[220px] aspect-[9/16] shrink-0 rounded-[20px] bg-zinc-100 overflow-hidden border border-zinc-200 snap-center shadow-sm">
                                              <img src={url} alt={`Screenshot ${idx}`} className="w-full h-full object-cover" />
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          )}

                          {/* Deskripsi & Spesifikasi */}
                          <div className="space-y-8">
                              <div>
                                  <h3 className="font-black text-xl text-zinc-900 mb-3">About this app</h3>
                                  <p className="text-zinc-600 text-sm leading-relaxed whitespace-pre-wrap">
                                      {selectedApp.description || 'No description provided.'}
                                  </p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Requirement Card */}
                                  {selectedApp.system_requirements && (
                                      <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex gap-4 items-start">
                                          <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Info size={20}/></div>
                                          <div>
                                              <h4 className="font-bold text-sm text-blue-900 mb-1">System Requirements</h4>
                                              <p className="text-blue-800/80 text-xs font-medium">{selectedApp.system_requirements}</p>
                                          </div>
                                      </div>
                                  )}
                                  
                                  {/* Detail Card (Versi & Kategori di Mobile) */}
                                  <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100 space-y-3">
                                      <div className="flex justify-between items-center">
                                          <span className="text-xs font-bold text-zinc-500 uppercase">Category</span>
                                          <span className="text-sm font-bold text-zinc-900 bg-white px-2 py-1 rounded-md border border-zinc-200">{selectedApp.category || 'App'}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                          <span className="text-xs font-bold text-zinc-500 uppercase">Platform</span>
                                          <span className="text-sm font-bold text-zinc-900 bg-white px-2 py-1 rounded-md border border-zinc-200 flex items-center gap-1">{getPlatformIcon(selectedApp.platform)} {selectedApp.platform || 'Cross'}</span>
                                      </div>
                                      <div className="md:hidden flex justify-between items-center">
                                          <span className="text-xs font-bold text-zinc-500 uppercase">Version</span>
                                          <span className="text-sm font-bold text-zinc-900 bg-white px-2 py-1 rounded-md border border-zinc-200">{selectedApp.version || '1.0.0'}</span>
                                      </div>
                                  </div>
                              </div>
                          </div>

                      </div>
                  </div>
              </div>
          </div>
      )}
