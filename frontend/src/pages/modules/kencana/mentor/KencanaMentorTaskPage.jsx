import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useMentorStudentsQuery } from '@/queries/useKencanaMentorQuery';
import { PageHeader } from '@/components/ui/page/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import BulkScoringTable from './components/BulkScoringTable';
import MentorSessionList from './components/MentorSessionList';

const KencanaMentorTaskPage = () => {
  const { pathname } = useLocation();
  const { data: students, isLoading } = useMentorStudentsQuery();
  const rows = Array.isArray(students) ? students.filter(s => s.status === 'active').map(s => ({
    ...s,
    fakultas: s.student?.fakultas || '-'
  })) : [];
  
  const uniqueFakultas = React.useMemo(() => {
    const list = rows.map(r => r.fakultas).filter(f => f && f !== '-');
    return [...new Set(list)].sort();
  }, [rows]);

  let title = '';
  let subtitle = '';
  let icon = '';
  let actionLabel = '';
  let targetTab = '';
  let tableHeader = '';

  const isScoring = pathname.includes('scoring');
  const isAttendance = pathname.includes('attendance');

  if (pathname.includes('handbook')) {
    title = 'Persetujuan Handbook';
    subtitle = 'Evaluasi dan setujui lembar handbook mahasiswa bimbingan Anda.';
    icon = 'menu_book';
    actionLabel = 'Review Handbook';
    targetTab = 'handbook';
    tableHeader = 'Handbook Mahasiswa';
  } else if (pathname.includes('attendance')) {
    title = 'Validasi Kehadiran';
    subtitle = 'Lihat dan validasi persentase kehadiran mahasiswa bimbingan Anda.';
    icon = 'how_to_reg';
    actionLabel = 'Validasi Kehadiran';
    targetTab = 'progress';
    tableHeader = 'Presensi Mahasiswa';
  } else if (pathname.includes('notes')) {
    title = 'Catatan Bimbingan';
    subtitle = 'Tulis dan tinjau catatan bimbingan berkala untuk mahasiswa.';
    icon = 'speaker_notes';
    actionLabel = 'Buka Catatan';
    targetTab = 'notes';
    tableHeader = 'Catatan Bimbingan';
  } else if (pathname.includes('scoring')) {
    title = 'Penilaian Akhir (Skoring)';
    subtitle = 'Input dan edit nilai sikap, keterampilan, serta nilai akhir mahasiswa.';
    icon = 'grade';
    actionLabel = 'Input / Edit Nilai';
    targetTab = 'form';
    tableHeader = 'Penilaian Mahasiswa';
  }

  const tableFilters = [
    {
      key: 'fakultas',
      placeholder: 'Fakultas',
      options: uniqueFakultas.map(f => ({ value: f, label: f }))
    }
  ];

  if (targetTab === 'handbook') {
    tableFilters.unshift({
      key: 'handbook_status',
      placeholder: 'Pilih Status',
      options: [
        { value: 'approved', label: 'Disetujui' },
        { value: 'rejected', label: 'Perlu Perbaikan' },
        { value: 'submitted', label: 'Menunggu Review' },
        { value: 'not_started', label: 'Belum Dikerjakan' },
      ]
    });
  }

  return (
    <div className="bg-transparent font-body max-w-7xl mx-auto space-y-6">
      <PageHeader
        icon={icon}
        title={
          <>
            <span className="text-[var(--theme-text)]">{title.split(' ')[0]} </span>
            <span className="text-[var(--theme-primary)]">{title.split(' ').slice(1).join(' ')}</span>
          </>
        }
        subtitle={subtitle}
        breadcrumbs={[
          { label: 'Kencana Mentor', path: '#' },
          { label: title }
        ]}
      />

      {isScoring ? (
        <BulkScoringTable />
      ) : isAttendance ? (
        <MentorSessionList />
      ) : (
        <div className="bg-white rounded-2xl border border-[var(--theme-border)] shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 md:p-8 border-b border-[var(--theme-border-muted)] bg-[var(--theme-bg)] flex-shrink-0">
            <h2 className="text-base font-bold text-[var(--theme-text)]">{tableHeader}</h2>
            <p className="text-xs font-semibold text-[var(--theme-text-muted)] mt-1">
              Pilih mahasiswa di bawah ini untuk memulai proses {title.toLowerCase()}.
            </p>
          </div>

          <div className="flex-1 p-0">
            {isLoading ? (
              <div className="p-12 text-center text-[var(--theme-text-muted)] font-bold">Memuat data mahasiswa...</div>
            ) : (
              <DataTable
                data={rows}
                searchable={true}
                searchPlaceholder="Cari NIM atau nama mahasiswa..."
                onSearch={(data, searchStr) => {
                  const q = searchStr.toLowerCase();
                  return data.filter(s => 
                    (s.student?.nama || '').toLowerCase().includes(q) || 
                    (s.student?.nim || '').toLowerCase().includes(q) ||
                    (s.student?.program_studi || '').toLowerCase().includes(q)
                  );
                }}
                filters={tableFilters}
                emptyMessage="Belum memiliki mahasiswa bimbingan yang aktif."
                emptyIcon="person_off"
                columns={[
                  {
                    key: 'student.nim',
                    label: 'NIM',
                    sortable: true,
                    className: targetTab === 'handbook' ? 'w-[12%]' : 'w-[15%]',
                    render: (v, item) => (
                      <span className="font-bold text-[var(--theme-primary)]">{item.student?.nim || '-'}</span>
                    )
                  },
                  {
                    key: 'student.nama',
                    label: 'Nama Mahasiswa',
                    sortable: true,
                    className: targetTab === 'handbook' ? 'w-[23%]' : 'w-[30%]',
                    render: (v, item) => (
                      <span className="font-semibold text-[var(--theme-text)] whitespace-nowrap">{item.student?.nama || '-'}</span>
                    )
                  },
                  {
                    key: 'student.program_studi',
                    label: 'Program Studi',
                    sortable: true,
                    className: targetTab === 'handbook' ? 'w-[20%]' : 'w-[25%]',
                    render: (v, item) => (
                      <span className="text-[13px] font-medium text-[var(--theme-text-muted)]">{item.student?.program_studi || '-'}</span>
                    )
                  },
                  {
                    key: 'student.fakultas',
                    label: 'Fakultas',
                    sortable: true,
                    className: targetTab === 'handbook' ? 'w-[15%]' : 'w-[20%]',
                    render: (v, item) => (
                      <span className="text-[13px] font-medium text-[var(--theme-text-muted)]">{item.student?.fakultas || '-'}</span>
                    )
                  },
                  ...(targetTab === 'handbook' ? [{
                    key: 'handbook_status',
                    label: 'Status',
                    sortable: true,
                    className: 'w-[18%]',
                    render: (v, item) => {
                      const s = item.handbook_status || 'not_started';
                      const props = s === 'approved' 
                        ? { label: 'Disetujui', icon: 'check_circle', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' }
                        : s === 'rejected' 
                        ? { label: 'Perlu Perbaikan', icon: 'error', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' }
                        : s === 'submitted' 
                        ? { label: 'Menunggu Review', icon: 'pending', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' }
                        : { label: 'Belum Dikerjakan', icon: 'radio_button_unchecked', color: 'bg-slate-100 text-slate-500 border-slate-200' };
                      return (
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider whitespace-nowrap shadow-sm ${props.color}`}>
                          <span className="material-symbols-outlined text-[14px]">{props.icon}</span>
                          {props.label}
                        </div>
                      );
                    }
                  }] : []),
                  {
                    key: 'actions',
                    label: 'Aksi',
                    className: 'w-[12%] text-right',
                    cellClassName: 'text-right',
                    sortable: false,
                    render: (v, item) => (
                      <div className="flex justify-end">
                        <Link 
                          to={targetTab === 'handbook' ? `/app/kencana/mentor/handbook/${item.student_id}` : targetTab === 'notes' ? `/app/kencana/mentor/notes/${item.student_id}` : `/app/kencana/mentor/students/${item.student_id}?tab=${targetTab}`} 
                          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-[var(--theme-primary-light)] text-[var(--theme-primary)] hover:bg-[var(--theme-primary)] hover:text-white transition-all border border-[var(--theme-primary-light)] text-xs font-bold shadow-sm"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            {targetTab === 'handbook' ? 'rate_review' : targetTab === 'form' ? 'edit_note' : 'visibility'}
                          </span>
                          <span className="hidden sm:inline">{actionLabel}</span>
                          <span className="sm:hidden">Pilih</span>
                        </Link>
                      </div>
                    )
                  }
                ]}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KencanaMentorTaskPage;
