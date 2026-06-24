import React from 'react';
import { useMentorStudentsQuery, useMentorRemoveAssignmentMutation } from '@/queries/useKencanaMentorQuery';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page/PageHeader';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import DataTable from '@/components/ui/DataTable';
import { Eye, Trash2 } from 'lucide-react';

const Students = () => {
  const { data: students, isLoading } = useMentorStudentsQuery();
  const removeMutation = useMentorRemoveAssignmentMutation();
  const rows = Array.isArray(students) ? students : [];

  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [selectedStudentId, setSelectedStudentId] = React.useState(null);

  const handleRemoveClick = (id) => {
    setSelectedStudentId(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedStudentId) {
      removeMutation.mutate(selectedStudentId, {
        onSettled: () => {
          setDeleteModalOpen(false);
          setSelectedStudentId(null);
        }
      });
    }
  };
  const formattedRows = rows.map(r => ({
    ...r,
    nim: r.student?.nim || '-',
    nama: r.student?.nama || '-',
    program_studi: r.student?.program_studi || '-',
    fakultas: r.student?.fakultas || '-'
  }));

  const uniqueFakultas = React.useMemo(() => {
    const list = formattedRows.map(r => r.fakultas).filter(f => f && f !== '-');
    return [...new Set(list)].sort();
  }, [formattedRows]);

  const columns = [
    { key: 'nim', label: 'NIM', sortable: true, render: (val) => <span className="font-bold text-[var(--theme-primary)] font-mono text-sm">{val}</span> },
    { key: 'nama', label: 'Nama Mahasiswa', sortable: true, render: (val) => <span className="font-bold text-[var(--theme-text)] text-sm">{val}</span> },
    { key: 'program_studi', label: 'Program Studi', sortable: true, render: (val) => <span className="text-sm font-medium text-[var(--theme-text-muted)]">{val}</span> },
    { key: 'fakultas', label: 'Fakultas', sortable: true, render: (val) => <span className="text-sm font-medium text-[var(--theme-text-muted)]">{val}</span> },
    {
      key: 'status', label: 'Status', sortable: true, render: (status) => (
        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${status === 'active' ? 'bg-[var(--theme-success)]/10 text-[var(--theme-success)]' :
            status === 'pending' ? 'bg-[var(--theme-warning)]/10 text-[var(--theme-warning)]' :
              'bg-[var(--theme-error)]/10 text-[var(--theme-error)]'
          }`}>
          {status === 'active' ? 'Disetujui' :
            status === 'pending' ? 'Pending' : 'Ditolak'}
        </span>
      )
    },
    {
      key: 'aksi', label: 'Aksi', sortable: false, className: 'w-[100px] text-center', cellClassName: 'text-center', render: (_, row) => (
        <div className="flex items-center justify-center gap-2">
          {row.status === 'active' ? (
            <Link
              to={`/app/kencana/mentor/students/${row.student_id}`}
              className="p-1.5 rounded-lg text-[var(--theme-primary)] hover:bg-[var(--theme-primary-light)] flex items-center justify-center transition-colors cursor-pointer"
              title="Lihat Detail"
            >
              <Eye className="w-4 h-4" strokeWidth={2.5} />
            </Link>
          ) : (
            <div className="w-7 h-7"></div>
          )}
          <button
            onClick={() => handleRemoveClick(row.id)}
            disabled={removeMutation.isPending}
            className="p-1.5 rounded-lg text-[var(--theme-error)] hover:bg-[var(--theme-error-light)] flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
            title="Hapus Bimbingan"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      )
    }
  ];

  const filters = [
    {
      key: 'status',
      placeholder: 'Semua Status',
      options: [
        { label: 'Disetujui', value: 'active' },
        { label: 'Pending', value: 'pending' },
        { label: 'Ditolak', value: 'rejected' }
      ]
    }
  ];

  return (
    <div className="bg-transparent font-body max-w-7xl mx-auto space-y-6">
      <PageHeader
        icon="group"
        title={
          <>
            <span className="text-[var(--theme-text)]">Mahasiswa </span>
            <span className="text-[var(--theme-primary)]">Bimbingan</span>
          </>
        }
        subtitle="Daftar mahasiswa yang Anda bimbing beserta rincian status bimbingannya."
        breadcrumbs={[
          { label: 'Kencana Mentor', path: '#' },
          { label: 'Daftar Bimbingan' }
        ]}
        action={
          <Link to="/app/kencana/mentor/available" className="h-10 px-5 rounded-xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-white text-xs font-bold transition-all flex items-center justify-center shadow-sm">
            + Tambah Bimbingan
          </Link>
        }
      />

      <DataTable
        title="Mahasiswa Aktif"
        subtitle="Daftar lengkap bimbingan beserta NIM, Prodi, dan status verifikasi."
        data={formattedRows}
        columns={columns}
        loading={isLoading}
        searchable={true}
        searchPlaceholder="Cari NIM, Nama..."
        onSearch={(data, searchStr) => {
            const q = searchStr.toLowerCase();
            return data.filter(s => 
              (s.nama || '').toLowerCase().includes(q) || 
              (s.nim || '').toLowerCase().includes(q) ||
              (s.program_studi || '').toLowerCase().includes(q)
            );
          }}
          filters={[
            {
              key: 'status',
              placeholder: 'Pilih Status',
              options: [
                { value: 'active', label: 'Disetujui' },
                { value: 'pending', label: 'Pending' },
                { value: 'rejected', label: 'Ditolak' },
              ]
            },
            {
              key: 'fakultas',
              placeholder: 'Fakultas',
              options: uniqueFakultas.map(f => ({ value: f, label: f }))
            }
          ]}
        pagination={true}
        pageSize={10}
        emptyMessage="Belum ada mahasiswa bimbingan yang terdaftar."
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Mahasiswa?"
        description="Mahasiswa ini akan dihapus dari daftar bimbingan Anda. Anda bisa mengundangnya kembali dari daftar mahasiswa yang tersedia jika terjadi kesalahan."
        loading={removeMutation.isPending}
      />
    </div>
  );
};

export default Students;
