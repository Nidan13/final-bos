import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, X } from 'lucide-react';
import { 
  useMentorSessionsQuery, 
  useMentorAbsenceRequestsQuery,
  useMentorRespondAbsenceRequestMutation 
} from '@/queries/useKencanaMentorQuery';
import { DataTable } from '@/components/ui/DataTable';

const MentorSessionList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'sessions';

  // --- SESSIONS QUERY ---
  const { data: sessions, isLoading: isLoadingSessions } = useMentorSessionsQuery();
  const formattedSessions = (sessions || []).map(s => ({
    ...s,
    stage_name: s.stage?.name || '-'
  }));
  const uniqueCategories = Array.from(new Set((sessions || []).map(s => s.stage?.name).filter(Boolean)));

  // --- ABSENCE REQUESTS QUERY ---
  const { data: absenceRequests, isLoading: isLoadingAbsence } = useMentorAbsenceRequestsQuery();
  const respondMutation = useMentorRespondAbsenceRequestMutation();

  const handleRespondAbsence = (id, action) => {
    respondMutation.mutate(
      { id, action },
      {
        onSuccess: (msg) => {
          toast.success(msg?.message || `Permohonan berhasil ${action === 'approved' ? 'disetujui' : 'ditolak'}`);
        },
        onError: () => toast.error('Gagal memproses permohonan'),
      }
    );
  };

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  const pendingAbsenceCount = (absenceRequests || []).filter(r => r.status === 'permission_requested').length;

  return (
    <div className="bg-white rounded-2xl border border-[var(--theme-border)] shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 md:p-8 border-b border-[var(--theme-border-muted)] bg-[var(--theme-bg)] flex-shrink-0">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[var(--theme-text)]">Kelola Kehadiran & Izin</h2>
            <p className="text-xs font-semibold text-[var(--theme-text-muted)] mt-1">
              Pilih sesi untuk absensi, atau kelola permohonan izin mahasiswa.
            </p>
          </div>

          <div className="flex bg-[var(--theme-surface)] p-1 rounded-xl border border-[var(--theme-border-muted)] shadow-sm overflow-x-auto shrink-0">
            <button
              onClick={() => handleTabChange('sessions')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'sessions' 
                  ? 'bg-[var(--theme-primary)] text-white shadow-sm' 
                  : 'text-[var(--theme-text-muted)] hover:bg-[var(--theme-bg-hover)]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">event_available</span>
              Daftar Sesi
            </button>
            <button
              onClick={() => handleTabChange('absence')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 relative whitespace-nowrap ${
                activeTab === 'absence' 
                  ? 'bg-[var(--theme-primary)] text-white shadow-sm' 
                  : 'text-[var(--theme-text-muted)] hover:bg-[var(--theme-bg-hover)]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">edit_document</span>
              Permohonan Izin
              {pendingAbsenceCount > 0 && (
                <span className={`absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold ring-2 ring-white shadow-sm ${activeTab === 'absence' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'}`}>
                  {pendingAbsenceCount}
                </span>
              )}
            </button>
          </div>
        </div>

      </div>

      <div className="flex-1 p-0">
        {activeTab === 'sessions' ? (
          isLoadingSessions ? (
            <div className="p-12 text-center text-[var(--theme-text-muted)] font-bold">Memuat daftar sesi...</div>
          ) : (
            <DataTable
              data={formattedSessions}
              searchable={true}
              searchPlaceholder="Cari nama sesi..."
              onSearch={(data, searchStr) => {
                const q = searchStr.toLowerCase();
                return data.filter(s => (s.title || '').toLowerCase().includes(q) || (s.stage_name || '').toLowerCase().includes(q));
              }}
              filters={[
                {
                  key: 'stage_name',
                  placeholder: 'Kategori Sesi',
                  options: uniqueCategories.map(cat => ({ value: cat, label: cat }))
                }
              ]}
              emptyMessage="Belum ada sesi pembekalan yang tersedia."
              emptyIcon="event_busy"
              columns={[
                {
                  key: 'title',
                  label: 'Sesi / Materi',
                  className: 'w-[40%]',
                  render: (v, item) => (
                    <div className="flex flex-col">
                      <span className="font-bold text-[var(--theme-text)] text-sm">{item.title}</span>
                      {item.stage && (
                        <span className="text-[11px] font-bold text-[var(--theme-primary)] uppercase tracking-wider mt-0.5">{item.stage.name}</span>
                      )}
                    </div>
                  )
                },
                {
                  key: 'date',
                  label: 'Tanggal Pelaksanaan',
                  className: 'w-[25%]',
                  render: (v, item) => (
                    <span className="text-[13px] font-medium text-[var(--theme-text-muted)]">
                      {item.start_time ? new Date(item.start_time).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) : '-'}
                    </span>
                  )
                },
                {
                  key: 'actions',
                  label: 'Aksi',
                  className: 'w-[25%] text-right',
                  cellClassName: 'text-right',
                  sortable: false,
                  render: (v, item) => (
                    <div className="flex justify-end">
                      <Link 
                        to={`/app/kencana/mentor/attendance/session/${item.id}`}
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-[var(--theme-primary-light)] text-[var(--theme-primary)] hover:bg-[var(--theme-primary)] hover:text-white transition-all border border-[var(--theme-primary-light)] text-xs font-bold shadow-sm"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>how_to_reg</span>
                        <span className="hidden sm:inline">Validasi Absensi</span>
                        <span className="sm:hidden">Pilih</span>
                      </Link>
                    </div>
                  )
                }
              ]}
            />
          )
        ) : (
          isLoadingAbsence ? (
            <div className="p-12 text-center text-[var(--theme-text-muted)] font-bold">Memuat data permohonan izin...</div>
          ) : (
            <DataTable
              data={absenceRequests || []}
              searchable={true}
              searchPlaceholder="Cari Mahasiswa, Sesi..."
              onSearch={(data, searchStr) => {
                  const q = searchStr.toLowerCase();
                  return data.filter(r => 
                    (r.student_name || '').toLowerCase().includes(q) || 
                    (r.session_title || '').toLowerCase().includes(q) ||
                    (r.reason || '').toLowerCase().includes(q)
                  );
              }}
              filters={[
                {
                  key: 'status',
                  placeholder: 'Semua Status',
                  options: [
                    { label: 'Menunggu', value: 'permission_requested' },
                    { label: 'Disetujui', value: 'permission' },
                    { label: 'Ditolak', value: 'absent' }
                  ]
                }
              ]}
              emptyMessage="Tidak ada permohonan izin yang ditemukan."
              emptyIcon="edit_document"
              columns={[
                { key: 'student_name', label: 'Mahasiswa', sortable: true, className: 'w-[20%]', render: (val) => <span className="font-bold text-[var(--theme-text)] text-sm">{val}</span> },
                { key: 'session_title', label: 'Sesi', sortable: true, className: 'w-[20%]', render: (val) => <span className="font-semibold text-[var(--theme-text-muted)] text-sm">{val}</span> },
                { key: 'reason', label: 'Alasan', sortable: true, className: 'w-[20%]', render: (val) => <span className="text-[13px] text-[var(--theme-text-muted)] line-clamp-2">{val}</span> },
                { key: 'checked_at', label: 'Tanggal', sortable: true, className: 'w-[15%]', render: (val) => <span className="text-[13px] font-medium text-[var(--theme-text-muted)]">{val ? new Date(val).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}</span> },
                {
                  key: 'status', label: 'Status', sortable: true, className: 'w-[12%]', render: (val) => (
                    <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap shadow-sm border ${
                      val === 'permission_requested' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                      val === 'permission' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                      val === 'absent' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {val === 'permission_requested' ? 'Menunggu' :
                       val === 'permission' ? 'Disetujui' :
                       val === 'absent' ? 'Ditolak' : val}
                    </span>
                  )
                },
                {
                  key: 'aksi', label: 'Aksi', sortable: false, className: 'w-[13%] text-right', cellClassName: 'text-right', render: (_, row) => (
                    <div className="flex items-center justify-end gap-2">
                      {row.status === 'permission_requested' ? (
                        <>
                          <button
                            onClick={() => handleRespondAbsence(row.id, 'approved')}
                            disabled={respondMutation.isPending}
                            className="w-8 h-8 rounded-xl bg-[var(--theme-success)]/10 text-[var(--theme-success)] hover:bg-[var(--theme-success)] hover:text-white flex items-center justify-center transition-all disabled:opacity-50"
                            title="Setujui Izin"
                          >
                            <Check className="w-4 h-4" strokeWidth={3} />
                          </button>
                          <button
                            onClick={() => handleRespondAbsence(row.id, 'rejected')}
                            disabled={respondMutation.isPending}
                            className="w-8 h-8 rounded-xl bg-[var(--theme-error)]/10 text-[var(--theme-error)] hover:bg-[var(--theme-error)] hover:text-white flex items-center justify-center transition-all disabled:opacity-50"
                            title="Tolak Izin"
                          >
                            <X className="w-4 h-4" strokeWidth={3} />
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] font-bold text-[var(--theme-text-muted)] opacity-50 px-2 py-1 border border-dashed border-[var(--theme-border)] rounded-lg">Selesai</span>
                      )}
                    </div>
                  )
                }
              ]}
            />
          )
        )}
      </div>
    </div>
  );
};

export default MentorSessionList;
