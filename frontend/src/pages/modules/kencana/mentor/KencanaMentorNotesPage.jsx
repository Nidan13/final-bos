import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useMentorStudentScoreQuery, 
  useMentorCreateNoteMutation 
} from '@/queries/useKencanaMentorQuery';
import { PageHeader } from '@/components/ui/page/PageHeader';
import { ArrowLeft, MessageSquare, Plus, Clock, Save, User } from 'lucide-react';
import toast from 'react-hot-toast';

const KencanaMentorNotesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [newNote, setNewNote] = useState('');
  
  const { data: scoreData, isLoading } = useMentorStudentScoreQuery(id);
  const createNoteMutation = useMentorCreateNoteMutation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--theme-primary)]"></div>
      </div>
    );
  }

  const student = scoreData?.student || {};
  const scoreItems = scoreData?.items || [];
  
  // Ambil item score yang komponennya 'note'
  const notes = scoreItems.filter(item => item.component === 'note')
    .sort((a, b) => new Date(b.assessed_at || b.created_at) - new Date(a.assessed_at || a.created_at));

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) {
      toast.error('Catatan tidak boleh kosong');
      return;
    }

    try {
      await createNoteMutation.mutateAsync({
        studentId: id,
        notes: newNote
      });
      toast.success('Catatan berhasil ditambahkan');
      setNewNote('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menambahkan catatan');
    }
  };

  return (
    <div className="bg-transparent font-body max-w-7xl mx-auto space-y-6">
      <PageHeader
        icon="speaker_notes"
        title={
          <>
            <span className="text-[var(--theme-text)]">Catatan </span>
            <span className="text-[var(--theme-primary)]">Bimbingan</span>
          </>
        }
        subtitle="Tulis dan tinjau catatan bimbingan berkala untuk mahasiswa."
        breadcrumbs={[
          { label: 'Kencana Mentor', path: '/app/kencana/mentor' },
          { label: 'Catatan Bimbingan', path: '/app/kencana/mentor/notes' },
          { label: student.NIM || student.nim || 'Detail' }
        ]}
      />

      {/* Header Profile */}
      <div className="glass-card rounded-2xl border border-[var(--theme-border)] shadow-sm p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[var(--theme-primary)]/5 to-transparent rounded-bl-full pointer-events-none"></div>
        <div className="flex items-start md:items-center gap-5 relative z-10">

          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl md:text-2xl font-black text-[var(--theme-text)] tracking-tight">
                {student.Nama || student.nama || student.NAMA || student.Name || 'Detail Mahasiswa'}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[var(--theme-text-muted)]">
              <span className="bg-[var(--theme-bg)] px-2.5 py-1 rounded-md border border-[var(--theme-border-muted)] font-mono text-[var(--theme-primary)]">
                {student.NIM || student.nim || '-'}
              </span>
              <span>&bull;</span>
              <span>{student.ProgramStudi?.Nama || student.program_studi?.Nama || student.program_studi?.nama || '-'}</span>
              <span className="hidden md:inline">&bull;</span>
              <span className="hidden md:inline">{student.Fakultas?.Nama || student.fakultas?.Nama || student.fakultas?.nama || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Tambah Catatan */}
        <div className="md:col-span-1 space-y-4">
          <div className="glass-card rounded-2xl border border-[var(--theme-border)] shadow-sm p-5 relative overflow-hidden">
            <h3 className="font-black text-[var(--theme-text)] text-sm uppercase tracking-widest flex items-center gap-2 mb-4">
              <Plus className="w-4 h-4 text-[var(--theme-primary)]" strokeWidth={3} />
              Tambah Catatan
            </h3>
            
            <form onSubmit={handleSaveNote} className="space-y-4">
              <div>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Tulis progres, evaluasi, atau kendala mahasiswa disini..."
                  className="w-full bg-white/60 border border-[var(--theme-border)] rounded-xl p-4 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-[var(--theme-primary)]/10 focus:border-[var(--theme-primary)] transition-all min-h-[160px] resize-y placeholder:text-[var(--theme-text-muted)]/50 shadow-inner"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={createNoteMutation.isLoading || !newNote.trim()}
                className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-primary-hover)] text-white font-black py-3 px-5 rounded-xl hover:shadow-lg hover:shadow-[var(--theme-primary)]/20 disabled:opacity-50 disabled:hover:shadow-none transition-all text-sm tracking-wide"
              >
                {createNoteMutation.isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4" strokeWidth={3} />
                    SIMPAN CATATAN
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Daftar Catatan */}
        <div className="md:col-span-2 space-y-4">
          <div className="glass-card rounded-2xl border border-[var(--theme-border)] shadow-sm p-5 min-h-[300px]">
            <h3 className="font-black text-[var(--theme-text)] text-sm uppercase tracking-widest flex items-center gap-2 mb-6">
              <MessageSquare className="w-4 h-4 text-[var(--theme-secondary)]" strokeWidth={2.5} />
              Riwayat Catatan ({notes.length})
            </h3>

            {notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                <div className="w-16 h-16 bg-[var(--theme-bg)] rounded-full flex items-center justify-center mb-3">
                  <MessageSquare className="w-8 h-8 text-[var(--theme-text-muted)]" />
                </div>
                <span className="font-bold text-[var(--theme-text-muted)] text-sm block">Belum ada catatan bimbingan</span>
                <span className="font-medium text-[var(--theme-text-muted)] text-xs mt-1">Tambahkan catatan pertama Anda menggunakan form di samping.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {notes.map((note) => (
                  <div key={note.id} className="p-4 bg-white/60 border border-[var(--theme-border-muted)] rounded-xl hover:shadow-sm transition-all relative group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(note.assessed_at || note.created_at).toLocaleDateString('id-ID', { 
                          day: 'numeric', month: 'long', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-[var(--theme-text)] whitespace-pre-wrap leading-relaxed">
                      {note.notes}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KencanaMentorNotesPage;
