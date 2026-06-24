import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMentorStudentsQuery, useMentorGetSessionAttendanceQuery, useMentorSubmitSessionAttendanceMutation, useMentorSessionsQuery } from '@/queries/useKencanaMentorQuery';
import { PageHeader } from '@/components/ui/page/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import toast from 'react-hot-toast';

const KencanaMentorSessionAttendancePage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const { data: students, isLoading: isLoadingStudents } = useMentorStudentsQuery();
  const { data: sessions, isLoading: isLoadingSessions } = useMentorSessionsQuery();
  const { data: attendanceData, isLoading: isLoadingAttendance } = useMentorGetSessionAttendanceQuery(sessionId);
  
  const submitMutation = useMentorSubmitSessionAttendanceMutation();

  const [attendances, setAttendances] = useState({});
  const [permissionModal, setPermissionModal] = useState(null);

  useEffect(() => {
    if (students && attendanceData) {
      const initialMap = {};
      students.forEach(s => {
        const att = attendanceData.find(a => a.student_id === s.student_id);
        // Default to 'absent' if not submitted yet, unless there's a reason to default to present
        initialMap[s.student_id] = att ? att.status : 'absent';
      });
      setAttendances(initialMap);
    }
  }, [students, attendanceData]);

  const session = sessions?.find(s => s.id === parseInt(sessionId));

  const handleStatusChange = (studentId, status) => {
    setAttendances(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSave = () => {
    const payloadArray = Object.entries(attendances).map(([studentId, status]) => ({
      student_id: parseInt(studentId),
      status
    }));

    submitMutation.mutate(
      { sessionId, attendances: payloadArray },
      {
        onSuccess: () => {
          toast.success('Kehadiran berhasil divalidasi dan disimpan');
          navigate('/app/kencana/mentor/attendance');
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message || 'Gagal menyimpan kehadiran');
        }
      }
    );
  };

  const rows = Array.isArray(students) ? students.filter(s => s.status === 'active').map(s => ({
    ...s,
    fakultas: s.student?.fakultas || '-',
    attendance_status: attendances[s.student_id] || 'absent'
  })) : [];
  
  const uniqueFakultas = React.useMemo(() => {
    const list = rows.map(r => r.fakultas).filter(f => f && f !== '-');
    return [...new Set(list)].sort();
  }, [rows]);

  const isLoading = isLoadingStudents || isLoadingSessions || isLoadingAttendance;

  return (
    <div className="bg-transparent font-body max-w-7xl mx-auto space-y-6">
      <PageHeader
        icon="fact_check"
        title={
          <>
            <span className="text-[var(--theme-text)]">Validasi </span>
            <span className="text-[var(--theme-primary)]">Kehadiran Sesi</span>
          </>
        }
        subtitle={session ? `Sesi: ${session.title}` : 'Memuat informasi sesi...'}
        breadcrumbs={[
          { label: 'Kencana Mentor', path: '#' },
          { label: 'Presensi', path: '/app/kencana/mentor/attendance' },
          { label: 'Sesi' }
        ]}
      />

      <div className="bg-white rounded-2xl border border-[var(--theme-border)] shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 md:p-8 border-b border-[var(--theme-border-muted)] bg-[var(--theme-bg)] flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-[var(--theme-text)]">Daftar Hadir Mahasiswa</h2>
            <p className="text-xs font-semibold text-[var(--theme-text-muted)] mt-1">
              Tandai kehadiran (Hadir, Izin, atau Alpha) lalu klik Simpan.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/app/kencana/mentor/attendance')}
              className="h-10 px-5 rounded-xl border border-[var(--theme-border)] text-sm font-bold text-[var(--theme-text-muted)] hover:bg-[var(--theme-bg-hover)] transition-all"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={submitMutation.isPending || isLoading}
              className="h-10 px-6 rounded-xl bg-[var(--theme-primary)] text-white text-sm font-bold hover:bg-[var(--theme-primary-hover)] transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {submitMutation.isPending && <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>sync</span>}
              Simpan Presensi
            </button>
          </div>
        </div>

        <div className="flex-1 p-0">
          {isLoading ? (
            <div className="p-12 text-center text-[var(--theme-text-muted)] font-bold">Memuat data absensi...</div>
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
              filters={[
                {
                  key: 'attendance_status',
                  placeholder: 'Pilih Status',
                  options: [
                    { value: 'present', label: 'Hadir' },
                    { value: 'permission', label: 'Izin' },
                    { value: 'absent', label: 'Alpha' }
                  ]
                },
                {
                  key: 'fakultas',
                  placeholder: 'Fakultas',
                  options: uniqueFakultas.map(f => ({ value: f, label: f }))
                }
              ]}
              emptyMessage="Belum memiliki mahasiswa bimbingan."
              emptyIcon="person_off"
              columns={[
                {
                  key: 'student.nim',
                  label: 'NIM',
                  sortable: true,
                  className: 'w-[12%]',
                  render: (v, item) => (
                    <span className="font-bold text-[var(--theme-primary)]">{item.student?.nim || '-'}</span>
                  )
                },
                {
                  key: 'student.nama',
                  label: 'Nama Mahasiswa',
                  sortable: true,
                  className: 'w-[25%]',
                  render: (v, item) => (
                    <span className="font-semibold text-[var(--theme-text)]">{item.student?.nama || '-'}</span>
                  )
                },
                {
                  key: 'student.program_studi',
                  label: 'Program Studi',
                  sortable: true,
                  className: 'w-[20%]',
                  render: (v, item) => (
                    <span className="text-[13px] font-medium text-[var(--theme-text-muted)]">{item.student?.program_studi || '-'}</span>
                  )
                },
                {
                  key: 'student.fakultas',
                  label: 'Fakultas',
                  sortable: true,
                  className: 'w-[15%]',
                  render: (v, item) => (
                    <span className="text-[13px] font-medium text-[var(--theme-text-muted)]">{item.student?.fakultas || '-'}</span>
                  )
                },
                {
                  key: 'attendance_status',
                  label: 'Status Kehadiran',
                  sortable: true,
                  className: 'w-[28%] text-right',
                  cellClassName: 'text-right',
                  render: (v, item) => {
                    const status = attendances[item.student_id] || 'absent';
                    const attRecord = attendanceData?.find(a => a.student_id === item.student_id);
                    const originalStatus = attRecord?.status;
                    
                    return (
                      <div className="flex items-center justify-end gap-3">
                        <div className="flex bg-[var(--theme-bg)] p-1 rounded-xl border border-[var(--theme-border)]">
                          <button
                            onClick={() => handleStatusChange(item.student_id, 'present')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${status === 'present' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                          >
                            Hadir
                          </button>
                          <button
                            onClick={() => handleStatusChange(item.student_id, 'permission')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${status === 'permission' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                          >
                            Izin / Sakit
                          </button>
                          <button
                            onClick={() => handleStatusChange(item.student_id, 'absent')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${status === 'absent' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                          >
                            Alpha
                          </button>
                        </div>
                        
                        {originalStatus === 'permission_requested' && (
                          <button 
                            onClick={() => setPermissionModal(attRecord)}
                            className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>visibility</span>
                            Lihat Izin
                          </button>
                        )}
                      </div>
                    );
                  }
                }
              ]}
            />
          )}
        </div>
      </div>

      {permissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPermissionModal(null)}></div>
          <div className="bg-[var(--theme-surface)] rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[var(--theme-border)] bg-[var(--theme-bg)] flex justify-between items-center">
              <h3 className="font-bold text-[var(--theme-text)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--theme-primary)]">mail</span>
                Detail Pengajuan Izin
              </h3>
              <button onClick={() => setPermissionModal(null)} className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--theme-text-muted)] uppercase tracking-wider block mb-1">Alasan</label>
                <div className="bg-[var(--theme-bg)] p-3 rounded-xl text-sm text-[var(--theme-text)] border border-[var(--theme-border)] whitespace-pre-wrap">
                  {permissionModal.permission_reason || '-'}
                </div>
              </div>
              {permissionModal.permission_file_url && (
                <div>
                  <label className="text-xs font-bold text-[var(--theme-text-muted)] uppercase tracking-wider block mb-1">Lampiran</label>
                  <a 
                    href={permissionModal.permission_file_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold rounded-xl text-sm transition-colors border border-blue-200"
                  >
                    <span className="material-symbols-outlined text-[18px]">attachment</span>
                    Lihat Dokumen Pendukung
                  </a>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-[var(--theme-border)] bg-[var(--theme-bg)] flex justify-end gap-3">
              <button 
                onClick={() => {
                  handleStatusChange(permissionModal.student_id, 'permission');
                  setPermissionModal(null);
                }} 
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
              >
                Setujui Izin
              </button>
              <button 
                onClick={() => {
                  handleStatusChange(permissionModal.student_id, 'absent');
                  setPermissionModal(null);
                }} 
                className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
              >
                Tolak (Alpha)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KencanaMentorSessionAttendancePage;
