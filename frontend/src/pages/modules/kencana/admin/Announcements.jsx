import React, { useState, useMemo } from 'react';
import { useAnnouncementsQuery, useCreateAnnouncementMutation, useDeleteAnnouncementMutation, useUpdateAnnouncementMutation } from '@/queries/useKencanaAdminQuery';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { DataTable } from '@/components/ui/DataTable';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { PageHeader } from '@/components/ui/page/PageHeader';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { DialogModal } from '@/components/ui/DialogModal';

export default function Announcements({ portal = 'admin' }) {
  const { data: announcements, isLoading } = useAnnouncementsQuery(portal);
  const createMutation = useCreateAnnouncementMutation(portal);
  const updateMutation = useUpdateAnnouncementMutation(portal);
  const deleteMutation = useDeleteAnnouncementMutation(portal);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'detail'
  const [selectedData, setSelectedData] = useState(null);
  const [filterTarget, setFilterTarget] = useState('all');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: { target_role: 'mahasiswa', judul: '', isi: '' }
  });
  
  const isiValue = watch("isi");

  const handleOpenCreate = () => {
    reset({ target_role: 'mahasiswa', judul: '', isi: '' });
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (data) => {
    setSelectedData(data);
    reset({ target_role: data.target_role, judul: data.judul, isi: data.isi });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenDetail = (data) => {
    setSelectedData(data);
    setModalMode('detail');
    setIsModalOpen(true);
  };

  const onSubmit = (data) => {
    if (!data.isi || data.isi.trim() === '' || data.isi === '<p><br></p>') {
      toast.error('Isi pengumuman wajib diisi');
      return;
    }
    
    if (modalMode === 'edit') {
      updateMutation.mutate({ id: selectedData.id, ...data }, {
        onSuccess: () => {
          toast.success('Pengumuman berhasil diperbarui');
          setIsModalOpen(false);
          reset();
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message || 'Gagal memperbarui pengumuman');
        }
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success('Pengumuman berhasil dibuat');
          setIsModalOpen(false);
          reset();
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message || 'Gagal membuat pengumuman');
        }
      });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Yakin ingin menghapus pengumuman ini?')) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast.success('Pengumuman dihapus'),
        onError: (err) => toast.error(err?.response?.data?.message || 'Gagal menghapus pengumuman')
      });
    }
  };

  const tableData = useMemo(() => {
    if (!announcements) return [];
    if (filterTarget === 'all') return announcements;
    return announcements.filter(a => a.target_role === filterTarget);
  }, [announcements, filterTarget]);

  const columns = [
    { key: 'created_at', label: 'Tanggal', render: (_, row) => new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
    { key: 'judul', label: 'Judul' },
    { key: 'isi', label: 'Isi Pengumuman', render: (_, row) => {
      let plainText = '';
      if (row.isi) {
        const tmp = document.createElement('div');
        tmp.innerHTML = row.isi;
        plainText = tmp.textContent || tmp.innerText || '';
      }
      return <span className="text-slate-500 line-clamp-1 max-w-[250px]" title={plainText}>{plainText.length > 60 ? plainText.substring(0, 60) + '...' : plainText || '-'}</span>;
    }},
    { key: 'target_role', label: 'Target', render: (_, row) => (
      <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider rounded-md">
        {row.target_role === 'both' ? 'Semua' : (row.target_role === 'mahasiswa' ? 'Mahasiswa' : 'Mentor')}
      </span>
    ) },
    { key: 'action', label: 'Aksi', render: (_, row) => (
      <div className="flex items-center gap-1">
        <button onClick={() => handleOpenDetail(row)} className="p-1.5 rounded-lg text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/10 transition-colors" title="Lihat">
          <Eye className="w-4 h-4" strokeWidth={2.5} />
        </button>
        <button onClick={() => handleOpenEdit(row)} className="p-1.5 rounded-lg text-[var(--theme-text-muted)] hover:text-amber-600 hover:bg-amber-50 transition-colors" title="Edit">
          <Pencil className="w-4 h-4" strokeWidth={2.5} />
        </button>
        <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded-lg text-[var(--theme-text-muted)] hover:text-red-600 hover:bg-red-50 transition-colors" title="Hapus">
          <Trash2 className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
    ) }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Pengumuman"
        subtitle="Kelola informasi dan pengumuman untuk mahasiswa dan dewan pembimbing."
        icon="campaign"
        breadcrumbs={[
          { label: 'Admin', path: '#' },
          { label: 'Kencana', path: '#' },
          { label: 'Pengumuman', path: '#' },
        ]}
        action={
          <Button onClick={handleOpenCreate} className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span>
            Buat Pengumuman
          </Button>
        }
      />

      <div className="mt-6">
        <DataTable 
          columns={columns} 
          data={tableData} 
          loading={isLoading}
          title="Daftar Pengumuman"
          searchPlaceholder="Cari pengumuman..."
          itemLabel="pengumuman"
          actions={
            <div className="flex items-center gap-2">
              <select
                value={filterTarget}
                onChange={(e) => setFilterTarget(e.target.value)}
                className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-700 outline-none focus:border-[var(--theme-primary)] transition-all cursor-pointer"
              >
                <option value="all">Semua Target</option>
                <option value="mahasiswa">Mahasiswa</option>
                <option value="mentor">Mentor</option>
                <option value="both">Semua (Both)</option>
              </select>
            </div>
          }
        />
      </div>

      <DialogModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={modalMode === 'create' ? 'Buat Pengumuman Baru' : modalMode === 'edit' ? 'Edit Pengumuman' : 'Detail Pengumuman'}
        subtitle={modalMode === 'detail' ? 'Informasi lengkap pengumuman.' : 'Lengkapi form di bawah untuk menyimpan pengumuman.'}
        icon={modalMode === 'detail' ? 'info' : modalMode === 'edit' ? 'edit_document' : 'campaign'}
      >
        {modalMode === 'detail' && selectedData ? (
          <div className="space-y-6 p-2">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Judul Pengumuman</p>
              <h3 className="text-lg font-black text-slate-800">{selectedData.judul}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Role</p>
                <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider rounded-md inline-block">
                  {selectedData.target_role === 'both' ? 'Semua' : (selectedData.target_role === 'mahasiswa' ? 'Mahasiswa' : 'Mentor')}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal Dibuat</p>
                <p className="text-sm font-bold text-slate-700">
                  {new Date(selectedData.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Isi Pengumuman</p>
              <div 
                className="prose prose-sm max-w-none prose-slate p-4 bg-slate-50 rounded-xl border border-slate-100 break-words overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: selectedData.isi }}
              />
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                Tutup
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-2">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Target Role</label>
              <select {...register('target_role')} className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)] outline-none transition-all">
                <option value="mahasiswa">Mahasiswa Saja</option>
                <option value="mentor">Mentor Saja</option>
                <option value="both">Mahasiswa & Mentor</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Judul Pengumuman</label>
              <input {...register('judul', { required: true })} type="text" className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)] outline-none transition-all placeholder:font-medium placeholder:text-slate-400" placeholder="Masukkan judul pengumuman..." />
              {errors.judul && <span className="text-red-500 text-[11px] font-bold mt-1 block">Judul wajib diisi</span>}
            </div>
            <div className="flex flex-col flex-1 pb-10">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Isi Pengumuman</label>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-white relative">
                <ReactQuill 
                  theme="snow" 
                  value={isiValue} 
                  onChange={(val) => setValue('isi', val)} 
                  className="h-[200px] bg-white text-slate-800"
                />
              </div>
            </div>
            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">Batal</button>
              <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-6 py-2.5 rounded-xl bg-[var(--theme-primary)] text-white text-sm font-bold shadow hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2">
                {(createMutation.isPending || updateMutation.isPending) && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
                {modalMode === 'edit' ? 'Simpan Perubahan' : 'Terbitkan'}
              </button>
            </div>
          </form>
        )}
      </DialogModal>
    </div>
  );
}
