import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useKencanaHandbookQuery, useSaveHandbookDraftMutation, useSubmitHandbookMutation, useKencanaDashboardQuery, useKencanaTimelineQuery } from '@/queries/useKencanaQuery';
import { ErrorPanel, KencanaShell, LoadingPanel, PrimaryButton, StatusBadge } from './components';
import { DialogModal, ModalCancelButton, ModalSaveButton } from '@/components/ui/DialogModal';

export default function KencanaHandbookPage() {
  const { data: rawData, isLoading, isError } = useKencanaHandbookQuery();
  const history = rawData?.history || [];
  const activeScope = rawData?.active_scope || 'university';
  const authorizedScopes = rawData?.authorized_scopes || [];
  const activeHandbook = rawData?.handbook || { status: 'not_started', scope_type: activeScope };

  const { data: dashboardData } = useKencanaDashboardQuery();
  const { data: timelineData } = useKencanaTimelineQuery();
  const stages = timelineData?.stages || [];
  const isPascaKencanaActive = stages.some(s => s.type === 'pasca_kencana' && s.status === 'active');

  const saveDraft = useSaveHandbookDraftMutation();
  const submit = useSubmitHandbookMutation();
  const [form, setForm] = useState({ refleksi: '', komitmen: '', rencana: '' });
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedHandbook, setSelectedHandbook] = useState(null);

  useEffect(() => {
    if (selectedHandbook?.content_json) {
      let content = {};
      try {
        content = typeof selectedHandbook.content_json === 'string' ? JSON.parse(selectedHandbook.content_json || '{}') : selectedHandbook.content_json;
      } catch {
        content = {};
      }
      setForm({ refleksi: content.refleksi || '', komitmen: content.komitmen || '', rencana: content.rencana || '' });
    } else {
      setForm({ refleksi: '', komitmen: '', rencana: '' });
    }
  }, [selectedHandbook]);

  if (isLoading) return <KencanaShell title="Handbook"><LoadingPanel /></KencanaShell>;
  if (isError) return <KencanaShell title="Handbook"><ErrorPanel message="Gagal memuat handbook." /></KencanaShell>;

  const isCompleted = activeHandbook.status === 'approved';
  const progressPercent = isCompleted ? 100 : 0;

  // List View
  if (!selectedHandbook) {
    return (
      <KencanaShell title="Daftar Handbook Mahasiswa" subtitle="Isi dan lengkapi handbook Anda pada tahapan Kencana." breadcrumbs={[]}>
        
        {/* Banner Section */}
        <div className="bg-[var(--theme-surface)]/80 backdrop-blur-xl border border-[var(--theme-border)] rounded-[1.25rem] shadow-sm p-6 mb-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-[var(--theme-primary)]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] flex items-center justify-center border border-[var(--theme-primary)]/20 shadow-sm shrink-0">
                  <span className="material-symbols-outlined text-[20px]">menu_book</span>
                </div>
                <h2 className="text-[16px] font-bold text-[var(--theme-text)] font-headline leading-tight">Jurnal Perjalanan Kencana</h2>
              </div>
              <p className="text-[13px] text-[var(--theme-text-muted)] font-medium max-w-2xl leading-relaxed">
                Handbook ini adalah wadah bagi Anda untuk merefleksikan pengalaman, menuliskan komitmen, dan merencanakan pengembangan diri selama mengikuti rangkaian program Kencana. Pastikan untuk mengisinya dengan jujur dan bersungguh-sungguh.
              </p>
            </div>
            
            <div className="bg-[var(--theme-bg)] rounded-xl p-4 border border-[var(--theme-border)] min-w-[200px] text-center shadow-sm">
              <p className="text-[11px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider mb-2">Progres Penyelesaian</p>
              <div className="flex items-end justify-center gap-1 mb-2">
                <span className="text-3xl font-black text-[var(--theme-text)] leading-none">{isCompleted ? 1 : 0}</span>
                <span className="text-[var(--theme-text-muted)] font-bold text-sm">/ 1</span>
              </div>
              <div className="w-full bg-[var(--theme-border)] rounded-full h-1.5 overflow-hidden">
                <div className="bg-[var(--theme-primary)] h-full rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-[13px] font-bold text-[var(--theme-text)] uppercase tracking-wider flex items-center gap-2">
            Tahapan Handbook
          </h3>
        </div>

        <div className="grid gap-4 md:grid-cols-1 max-w-4xl">
          {(() => {
            const hasFacultyScope = history.some(h => h.scope_type === 'faculty') || activeScope === 'faculty';
            
            return (
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { title: 'Handbook Kencana Universitas', scope: 'university', desc: 'Refleksi kegiatan tingkat universitas.', isVisible: authorizedScopes.includes('university') || history.some(h => h.scope_type === 'university') },
                  { title: 'Handbook Kencana Fakultas', scope: 'faculty', desc: 'Refleksi kegiatan pengenalan tingkat fakultas.', isVisible: authorizedScopes.includes('faculty') || hasFacultyScope },
                ].filter(h => h.isVisible).map(handbookDef => {
                  const handbookItem = history.find(h => h.scope_type === handbookDef.scope) || { status: 'not_started', scope_type: handbookDef.scope };
                  
                  let statusColor = 'bg-slate-100 text-slate-500 border-slate-200';
                  let statusText = 'Belum Dikerjakan';
                  if (handbookItem.status === 'approved') { statusColor = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'; statusText = 'Disetujui'; }
                  if (handbookItem.status === 'rejected') { statusColor = 'bg-rose-500/10 text-rose-600 border-rose-500/20'; statusText = 'Perlu Perbaikan'; }
                  if (handbookItem.status === 'submitted') { statusColor = 'bg-amber-500/10 text-amber-600 border-amber-500/20'; statusText = 'Menunggu Review'; }

                  const isActiveItem = (activeScope === handbookDef.scope) || isPascaKencanaActive;

                  return (
                    <div 
                      key={handbookDef.scope}
                      onClick={() => isActiveItem ? setSelectedHandbook({ ...handbookItem, scope_type: handbookDef.scope }) : null}
                      className={`bg-[var(--theme-surface)]/80 backdrop-blur-xl p-5 shadow-sm hover:shadow-md ${isActiveItem ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'} rounded-[1.25rem] border transition-all duration-300 relative overflow-hidden group ${isActiveItem ? 'border-[var(--theme-primary)]/40 hover:border-[var(--theme-primary)] bg-[var(--theme-primary)]/5' : 'border-[var(--theme-border)] hover:border-[var(--theme-primary)]/30'}`}
                    >
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm transition-colors ${isActiveItem ? 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] border-[var(--theme-primary)]/20' : 'bg-[var(--theme-bg)] text-[var(--theme-text-muted)] border-[var(--theme-border)]'}`}>
                          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>account_balance</span>
                        </div>
                        <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${statusColor}`}>
                          {statusText}
                        </div>
                      </div>
                      
                      <div className="relative z-10">
                        <h3 className="text-[15px] font-bold text-[var(--theme-text)] font-headline leading-tight mb-1">{handbookDef.title}</h3>
                        <p className="text-[12px] text-[var(--theme-text-muted)] font-medium leading-relaxed mb-4 line-clamp-2">
                          {handbookDef.desc}
                        </p>
                        
                        <div className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${isActiveItem ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text)]'}`}>
                          {isActiveItem 
                            ? (handbookItem.status === 'not_started' ? 'Mulai Mengerjakan' : 'Lihat / Edit Handbook') 
                            : (handbookItem.status === 'not_started' ? 'Tahap Belum Terbuka' : 'Lihat Riwayat')}
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                            {isActiveItem ? 'arrow_forward' : (handbookItem.status === 'not_started' ? 'lock' : 'history')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </KencanaShell>
    );
  }

  // Detail View
  const isReadOnly = false;
  const hasSubmitted = selectedHandbook.status === 'submitted' || selectedHandbook.status === 'approved';
  const isFormDisabled = isReadOnly || hasSubmitted;

  const actionDraft = () => {
    saveDraft.mutate({ scope_type: selectedHandbook.scope_type, payload: form }, { onSuccess: () => toast.success('Draft handbook disimpan') });
  };

  const actionSubmit = () => {
    setShowConfirm(false);
    submit.mutate({ scope_type: selectedHandbook.scope_type, payload: form }, { onSuccess: () => {
      toast.success('Handbook dikirim');
      setSelectedHandbook({...selectedHandbook, status: 'submitted'});
    }});
  };

  return (
    <KencanaShell title="Handbook Kencana" subtitle={isReadOnly ? (selectedHandbook.status === 'not_started' ? 'Tahap ini belum terbuka untuk Anda.' : 'Melihat riwayat handbook.') : 'Handbook wajib diisi dan disetujui agar bisa lulus penuh.'} breadcrumbs={[]}>
      <div className="mb-6">
        <button onClick={() => setSelectedHandbook(null)} className="h-10 px-4 rounded-xl border border-[var(--theme-border)] text-[var(--theme-text)] hover:bg-[var(--theme-bg)] font-bold text-xs flex items-center gap-2 shadow-sm transition-colors">
          <span className="material-symbols-outlined" style={{fontSize: 16}}>arrow_back</span>
          Kembali ke Daftar Handbook
        </button>
      </div>

      <DialogModal
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Konfirmasi Pengiriman"
        description="Apakah Anda yakin ingin mengirimkan handbook ini? Setelah terkirim, Anda tidak dapat mengubah isinya kecuali ditolak oleh pembimbing."
        icon="send"
        maxWidth="max-w-md"
        footer={
          <>
            <ModalCancelButton onClick={() => setShowConfirm(false)} />
            <ModalSaveButton onClick={actionSubmit} loading={submit.isPending} text="Ya, Kumpulkan!" icon="send">
              Ya, Kirimkan
            </ModalSaveButton>
          </>
        }
      >
        <div className="text-sm font-medium text-[var(--theme-text)]">
          Pastikan semua refleksi, komitmen, dan rencana pengembangan diri sudah sesuai.
        </div>
      </DialogModal>

      <section className="grid gap-6 lg:grid-cols-[1fr_300px] items-start">
        <div className="glass-card p-6 md:p-8 shadow-sm space-y-6">
          <div className="border-b border-[var(--theme-border-muted)] pb-4 flex justify-between items-start gap-4">
            <div>
              <h3 className="text-lg font-black text-[var(--theme-text)] uppercase tracking-tight flex items-center gap-2 mb-1.5">
                <span className="material-symbols-outlined text-[var(--theme-primary)]">{isReadOnly ? 'history' : 'edit_document'}</span> {isReadOnly ? 'Riwayat Pengisian' : 'Formulir Pengisian'}
              </h3>
              <p className="text-xs font-bold text-[var(--theme-text-muted)]">{isReadOnly ? 'Isian refleksi dan rencana Anda pada tahap ini.' : 'Isi poin-poin refleksi dan rencana Anda selama mengikuti program Kencana.'}</p>
            </div>
          </div>

          <div className="space-y-6">
            <Field label="Refleksi Kencana" value={form.refleksi} onChange={(v) => setForm({ ...form, refleksi: v })} disabled={isFormDisabled} />
            <Field label="Komitmen Mahasiswa" value={form.komitmen} onChange={(v) => setForm({ ...form, komitmen: v })} disabled={isFormDisabled} />
            <Field label="Rencana Pengembangan Diri" value={form.rencana} onChange={(v) => setForm({ ...form, rencana: v })} disabled={isFormDisabled} />
          </div>
          
          {!isReadOnly && (
            <div className="pt-4 flex flex-wrap items-center gap-3 border-t border-[var(--theme-border-muted)]">
              {!hasSubmitted ? (
                <>
                  <button onClick={actionDraft} disabled={saveDraft.isPending || submit.isPending} className="h-10 px-5 rounded-xl border border-[var(--theme-primary)] text-[var(--theme-primary)] hover:bg-[var(--theme-primary)] hover:text-white font-black text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    {saveDraft.isPending ? <span className="material-symbols-outlined animate-spin" style={{fontSize: 16}}>sync</span> : <span className="material-symbols-outlined" style={{fontSize: 16}}>save</span>}
                    Simpan Draft
                  </button>
                  <button onClick={() => setShowConfirm(true)} disabled={submit.isPending} className="h-10 px-5 rounded-xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-white font-black text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2 shadow-md shadow-[var(--theme-primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span className="material-symbols-outlined" style={{fontSize: 16}}>send</span>
                    Kirim Handbook
                  </button>
                </>
              ) : (
                <div className="h-10 px-5 rounded-xl bg-[var(--theme-success)]/10 text-[var(--theme-success)] border border-[var(--theme-success)]/20 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 w-full sm:w-auto">
                  <span className="material-symbols-outlined" style={{fontSize: 16}}>check_circle</span>
                  Handbook Sudah Terkirim
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className={`glass-card p-6 shadow-md relative overflow-hidden rounded-2xl border transition-all duration-300 ${
            selectedHandbook.status === 'approved' ? 'border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 to-transparent' :
            selectedHandbook.status === 'rejected' ? 'border-rose-500/30 bg-gradient-to-b from-rose-500/5 to-transparent' :
            selectedHandbook.status === 'submitted' ? 'border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent' :
            'border-slate-500/20 bg-gradient-to-b from-slate-500/5 to-transparent'
          }`}>
            <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl rounded-bl-full pointer-events-none opacity-20 ${
              selectedHandbook.status === 'approved' ? 'from-emerald-500 to-transparent' :
              selectedHandbook.status === 'rejected' ? 'from-rose-500 to-transparent' :
              selectedHandbook.status === 'submitted' ? 'from-amber-500 to-transparent' :
              'from-slate-500 to-transparent'
            }`}></div>
            <div className="relative z-10">
              <h2 className="text-sm font-black text-[var(--theme-text)] uppercase tracking-widest flex items-center gap-2 mb-4">
                <span className={`material-symbols-outlined ${
                  selectedHandbook.status === 'approved' ? 'text-emerald-500' :
                  selectedHandbook.status === 'rejected' ? 'text-rose-500' :
                  selectedHandbook.status === 'submitted' ? 'text-amber-500' :
                  'text-slate-500'
                }`} style={{fontSize: 20}}>
                  {selectedHandbook.status === 'approved' ? 'verified' : selectedHandbook.status === 'rejected' ? 'error' : selectedHandbook.status === 'submitted' ? 'pending' : 'info'}
                </span> 
                Status Evaluasi
              </h2>
              
              <div className="bg-white/40 p-5 rounded-xl border border-white/20 shadow-sm backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] mb-3">Status Saat Ini</p>
                <div className="inline-flex">
                  <div className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 border shadow-sm ${
                    selectedHandbook.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                    selectedHandbook.status === 'rejected' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                    selectedHandbook.status === 'submitted' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                    'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {selectedHandbook.status === 'approved' ? 'check_circle' : selectedHandbook.status === 'rejected' ? 'error' : selectedHandbook.status === 'submitted' ? 'pending' : 'radio_button_unchecked'}
                    </span>
                    {selectedHandbook.status === 'approved' ? 'Disetujui' : 
                     selectedHandbook.status === 'rejected' ? 'Perlu Perbaikan' : 
                     selectedHandbook.status === 'submitted' ? 'Menunggu Review' : 
                     'Belum Dikerjakan'}
                  </div>
                </div>
                
                {selectedHandbook.status === 'approved' && (
                  <p className="text-xs font-bold text-emerald-600 mt-3">Handbook ini telah disetujui oleh Mentor. Kerja bagus!</p>
                )}
                {selectedHandbook.status === 'rejected' && (
                  <p className="text-xs font-bold text-rose-600 mt-3">Handbook ini dikembalikan. Mohon periksa catatan dari Mentor dan perbaiki.</p>
                )}
                {selectedHandbook.status === 'submitted' && (
                  <p className="text-xs font-bold text-amber-600 mt-3">Handbook sedang dalam tahap review oleh Mentor Anda.</p>
                )}
                {selectedHandbook.status === 'not_started' && (
                  <p className="text-xs font-bold text-slate-500 mt-3">Anda belum mengisi atau mengirimkan handbook.</p>
                )}
              </div>

              {selectedHandbook.feedback && (
                <div className="mt-5 p-5 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2 flex items-center gap-1.5">
                     <span className="material-symbols-outlined text-[14px]">warning</span> Catatan Revisi Mentor
                   </p>
                   <p className="text-[13px] font-bold text-[var(--theme-text)] leading-relaxed">{selectedHandbook.feedback}</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </section>
    </KencanaShell>
  );
}

function Field({ label, value, onChange, disabled }) { 
  return (
    <label className="block group">
      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] group-focus-within:text-[var(--theme-primary)] transition-colors">{label}</span>
      <textarea 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        disabled={disabled}
        rows={6} 
        placeholder={`Tulis ${label.toLowerCase()} di sini...`}
        className="mt-2 w-full rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)]/50 p-4 text-sm font-bold text-[var(--theme-text)] outline-none focus:border-[var(--theme-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--theme-primary)]/10 transition-all disabled:opacity-50 disabled:bg-[var(--theme-bg)] shadow-sm resize-none custom-scrollbar" 
      />
    </label>
  ); 
}
