import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, BookMarked, AlertTriangle, Target, Save, FileText } from 'lucide-react';
import {
  useMentorStudentProgressQuery,
  useMentorStudentHandbookQuery,
  useMentorReviewHandbookMutation,
} from '@/queries/useKencanaMentorQuery';
import { SelectField, SelectOption } from '@/components/ui/SelectField';
import { PageHeader } from '@/components/ui/page/PageHeader';

const KencanaMentorHandbookReviewPage = () => {
  const { id: studentId } = useParams();
  const navigate = useNavigate();

  const { data: progressData, isLoading: loadingStudent } = useMentorStudentProgressQuery(studentId);
  const student = progressData?.student || {};

  const { data: handbookData, isLoading: loadingHandbook } = useMentorStudentHandbookQuery(studentId);
  const reviewHandbookMutation = useMentorReviewHandbookMutation();

  const [reviewStatus, setReviewStatus] = useState(handbookData?.status || 'approved');
  const [reviewFeedback, setReviewFeedback] = useState(handbookData?.feedback || '');

  // Parse handbook JSON securely
  let handbookContent = null;
  if (handbookData?.content_json) {
    try {
      handbookContent = typeof handbookData.content_json === 'string'
        ? JSON.parse(handbookData.content_json)
        : handbookData.content_json;
    } catch (e) {
      handbookContent = handbookData.content_json;
    }
  }

  const handleSaveReview = (e) => {
    e.preventDefault();
    if (!handbookData || handbookData.status === 'not_started') {
      toast.error('Mahasiswa belum membuat atau mengirimkan handbook.');
      return;
    }

    reviewHandbookMutation.mutate(
      { studentId, action: reviewStatus, feedback: reviewFeedback },
      {
        onSuccess: () => {
          toast.success('Review handbook berhasil disimpan!');
        },
        onError: (err) => {
          toast.error('Gagal menyimpan review handbook: ' + (err.response?.data?.message || err.message));
        }
      }
    );
  };

  if (loadingStudent || loadingHandbook) {
    return <div className="text-center py-12 text-[var(--theme-text-muted)] font-bold">Memuat data...</div>;
  }

  return (
    <div className="bg-transparent font-body max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader 
        title="Review Handbook:"
        highlightedTitle={student.Nama || student.nama || student.NAMA || student.Name || 'Detail Mahasiswa'}
        subtitle={`NIM: ${student.NIM || student.nim || '-'} • ${student.ProgramStudi?.Nama || student.program_studi?.Nama || student.program_studi?.nama || '-'} • ${student.Fakultas?.Nama || student.fakultas?.Nama || student.fakultas?.nama || '-'}`}
        icon="menu_book"
        breadcrumbs={[
          { label: 'Kencana', path: '/app/kencana/mentor' },
          { label: 'Persetujuan Handbook', path: '/app/kencana/mentor/handbook' },
          { label: 'Review Handbook' }
        ]}
        badges={[
          { 
            label: handbookData?.status === 'approved' ? 'DISETUJUI' : 
                   handbookData?.status === 'submitted' ? 'MENUNGGU REVIEW' : 
                   handbookData?.status === 'rejected' ? 'PERLU PERBAIKAN' : 'BELUM DIKIRIM', 
            active: handbookData?.status === 'submitted' 
          }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content panel */}
        <div className="lg:col-span-2 glass-card p-6 md:p-8 rounded-2xl border border-[var(--theme-border)] shadow-sm space-y-6">
          <div className="border-b border-[var(--theme-border-muted)] pb-4 flex justify-between items-start gap-4 mb-6">
            <div>
              <h3 className="text-lg font-black text-[var(--theme-text)] uppercase tracking-tight flex items-center gap-2 mb-1.5">
                <BookMarked className="w-5 h-5 text-[var(--theme-primary)]" strokeWidth={2.5} /> Isian Handbook
              </h3>
              <p className="text-xs font-bold text-[var(--theme-text-muted)]">Review isian handbook yang telah dikumpulkan mahasiswa.</p>
            </div>
          </div>

          {handbookData?.status === 'approved' && (
            <div className="p-4 rounded-xl bg-[var(--theme-success)]/10 border border-[var(--theme-success)]/20 mb-6 flex gap-3 items-start">
              <span className="material-symbols-outlined text-[var(--theme-success)] mt-0.5">check_circle</span>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-success)] mb-1">Handbook Disetujui</p>
                <p className="text-sm font-bold text-[var(--theme-text)]">Anda telah menyetujui handbook mahasiswa ini.</p>
              </div>
            </div>
          )}

          {handbookData?.status === 'rejected' && (
            <div className="p-4 rounded-xl bg-[var(--theme-error)]/10 border border-[var(--theme-error)]/20 mb-6 flex gap-3 items-start">
              <span className="material-symbols-outlined text-[var(--theme-error)] mt-0.5">cancel</span>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-error)] mb-1">Perlu Perbaikan</p>
                <p className="text-sm font-bold text-[var(--theme-text)]">Anda telah mengembalikan handbook mahasiswa ini untuk diperbaiki.</p>
              </div>
            </div>
          )}

          {!handbookData || handbookData.status === 'not_started' ? (
            <div className="py-12 flex flex-col items-center justify-center text-[var(--theme-text-muted)] space-y-3">
              <AlertTriangle className="w-8 h-8 text-[var(--theme-warning)] opacity-50" />
              <span className="font-bold text-xs uppercase tracking-widest">Mahasiswa belum mengirimkan handbook</span>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[var(--theme-bg)]/50 rounded-xl border border-[var(--theme-border-muted)] shadow-sm gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--theme-primary)]/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[var(--theme-primary)]" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-[var(--theme-text-muted)] uppercase tracking-widest block mb-1">Status Pengiriman</span>
                    <span className="font-black text-[var(--theme-text)] uppercase text-xs tracking-wider">{handbookData.status}</span>
                  </div>
                </div>
                {handbookData.submitted_at && (
                  <div className="sm:text-right">
                    <span className="text-[9px] font-black text-[var(--theme-text-muted)] uppercase tracking-widest block mb-1">Tanggal Submit</span>
                    <span className="font-bold text-[var(--theme-text)] text-xs">{new Date(handbookData.submitted_at).toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)]">Isi Ringkasan Handbook:</h4>
                {handbookContent ? (
                  <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    {Object.entries(handbookContent).map(([section, value]) => (
                      <div key={section} className="p-5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)]/50 shadow-sm transition-colors hover:bg-[var(--theme-bg)]/80">
                        <span className="text-[10px] font-black text-[var(--theme-primary)] uppercase tracking-widest block mb-2">{section.replace(/_/g, ' ')}</span>
                        <p className="text-sm font-bold text-[var(--theme-text)] whitespace-pre-wrap leading-relaxed">{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value || '-')}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-[var(--theme-warning)]/10 text-[var(--theme-warning)] text-xs font-bold rounded-xl border border-[var(--theme-warning)]/20 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Format isian handbook kosong atau tidak valid.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Approval review Form */}
        <div className="glass-card p-6 md:p-8 rounded-2xl border border-[var(--theme-border)] shadow-sm space-y-6 self-start sticky top-24">
          <div>
            <h3 className="text-lg font-black text-[var(--theme-text)] uppercase tracking-tight flex items-center gap-2 mb-1.5">
              <Target className="w-5 h-5 text-[var(--theme-primary)]" strokeWidth={2.5} /> Keputusan Evaluasi
            </h3>
            <p className="text-xs font-bold text-[var(--theme-text-muted)]">Sebagai DP/Mentor, Anda wajib memverifikasi keabsahan handbook sebelum menyetujuinya.</p>
          </div>

          <form onSubmit={handleSaveReview} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--theme-text-muted)] uppercase tracking-widest block">Status Persetujuan</label>
              <SelectField
                value={reviewStatus}
                onValueChange={val => setReviewStatus(val)}
                className="w-full shadow-sm"
              >
                <SelectOption value="approved">Setujui (Approved)</SelectOption>
                <SelectOption value="rejected">Perlu Perbaikan (Rejected)</SelectOption>
              </SelectField>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--theme-text-muted)] uppercase tracking-widest block">Feedback / Catatan</label>
              <textarea
                rows="4"
                placeholder="Tuliskan catatan perbaikan..."
                value={reviewFeedback}
                onChange={e => setReviewFeedback(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--theme-bg)]/50 border border-[var(--theme-border)] focus:ring-4 focus:ring-[var(--theme-primary)]/10 focus:border-[var(--theme-primary)] text-sm font-bold text-[var(--theme-text)] focus:outline-none transition-all resize-none shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={reviewHandbookMutation.isPending || !handbookData || handbookData.status === 'not_started'}
              className="w-full h-11 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-white font-black uppercase tracking-widest rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all text-[10px] flex items-center justify-center gap-2.5 shadow-md shadow-[var(--theme-primary)]/20 mt-2"
            >
              {reviewHandbookMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" strokeWidth={2.5} />
              )}
              Simpan Evaluasi
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default KencanaMentorHandbookReviewPage;
