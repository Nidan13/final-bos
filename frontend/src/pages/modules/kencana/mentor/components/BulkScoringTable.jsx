import React, { useState, useEffect } from 'react';
import { useMentorBulkScoresQuery, useMentorSubmitBulkScoresMutation, useMentorStudentsQuery } from '@/queries/useKencanaMentorQuery';
import toast from 'react-hot-toast';

const BulkScoringTable = () => {
  const { data: studentsData, isLoading: loadingStudents } = useMentorStudentsQuery();
  const { data: scoresData, isLoading: loadingScores } = useMentorBulkScoresQuery();
  const submitMutation = useMentorSubmitBulkScoresMutation();

  const [scoresInput, setScoresInput] = useState({}); // { studentId: { "component__itemName": scoreValue } }

  const isLoading = loadingStudents || loadingScores;

  // Filter only active student assignments
  const students = Array.isArray(studentsData) ? studentsData.filter(s => s.status === 'active') : [];
  
  const mentorScope = scoresData?.mentor_scope || 'university';
  const scopePrefix = mentorScope === 'fakultas' || mentorScope === 'faculty' ? '[Fakultas]' : '[Univ]';

  // Dynamic definitions matching StudentDetail.jsx
  const DEFINITIONS = {
    university: [
      { component: 'cognitive', key: 'Handbook', label: 'Handbook', type: 'number' },
      { component: 'affective', key: 'Etika terhadap panitia & civitas', label: 'Etika terhadap Panitia', type: 'number' },
      { component: 'affective', key: 'Empati', label: 'Empati', type: 'number' },
      { component: 'affective', key: 'Tanggung Jawab', label: 'Tanggung Jawab', type: 'number' },
      { component: 'affective', key: 'Disiplin', label: 'Disiplin', type: 'number' },
      { component: 'affective', key: 'Adil', label: 'Adil', type: 'number' },

    ],
    faculty: [
    ]
  };

  const activeDefinitions = mentorScope === 'faculty' || mentorScope === 'fakultas' 
    ? DEFINITIONS.faculty 
    : DEFINITIONS.university;

  // Initialize input state from backend data
  useEffect(() => {
    if (scoresData?.items && students.length > 0) {
      const state = {};
      students.forEach(st => {
        state[st.student_id] = {};
        activeDefinitions.forEach(def => {
          // Find matching item from backend items
          const dbItem = scoresData.items.find(it => 
            it.student_id === st.student_id && 
            it.component.toLowerCase() === def.component.toLowerCase() && 
            it.item_name === def.key
          );
          state[st.student_id][`${def.component}__${def.key}`] = dbItem ? dbItem.score : '';
        });
      });
      setScoresInput(state);
    }
  }, [scoresData, studentsData]);

  const handleScoreChange = (studentId, component, key, value) => {
    const parsed = value === '' ? '' : Math.min(100, Math.max(0, parseFloat(value) || 0));
    setScoresInput(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [`${component}__${key}`]: parsed
      }
    }));
  };

  const handleSaveAll = (e) => {
    e.preventDefault();
    
    // Construct payload matching BulkScoresReq on backend
    const scoresPayload = Object.entries(scoresInput).map(([studentIdStr, itemsMap]) => {
      const studentId = parseInt(studentIdStr);
      const items = Object.entries(itemsMap).map(([compoundKey, val]) => {
        const [component, itemName] = compoundKey.split('__');
        return {
          component,
          item_name: itemName,
          score: val === '' || val === undefined ? 0 : val,
          notes: 'Diinput secara kolektif via Bulk Scoring'
        };
      });
      return {
        student_id: studentId,
        items
      };
    });

    submitMutation.mutate(
      { scores: scoresPayload },
      {
        onSuccess: () => {
          toast.success('Semua nilai mahasiswa bimbingan berhasil disimpan!');
        },
        onError: (err) => {
          toast.error('Gagal menyimpan nilai: ' + (err.response?.data?.message || err.message));
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] bg-transparent">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--theme-primary)]"></div>
        <span className="ml-3 font-semibold text-[var(--theme-text-muted)] text-sm">Memuat tabel penilaian massal...</span>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-[var(--theme-border)] shadow-sm italic font-semibold text-[var(--theme-text-muted)]">
        Anda tidak memiliki mahasiswa bimbingan yang aktif untuk dinilai.
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveAll} className="space-y-6">
      <div className="bg-white rounded-3xl border border-[var(--theme-border)] shadow-sm overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-6 md:p-8 border-b border-[var(--theme-border-muted)] bg-[var(--theme-bg)]/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-[var(--theme-text)]">Lembar Pengisian Kolektif</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[var(--theme-primary-light)] text-[var(--theme-primary)] border border-[var(--theme-primary-light)]">
                {mentorScope === 'faculty' || mentorScope === 'fakultas' ? 'Fakultas' : 'Universitas'} Scope
              </span>
            </div>
            <p className="text-xs font-semibold text-[var(--theme-text-muted)] mt-1">Masukkan nilai (0-100) langsung ke grid di bawah. Perubahan otomatis tervalidasi.</p>
          </div>
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="h-10 px-6 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {submitMutation.isPending && (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            )}
            Simpan Semua Nilai ({students.length} Mahasiswa)
          </button>
        </div>

        {/* Spreadsheet-like Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-[var(--theme-border)] text-[10px] font-black text-[var(--theme-text-muted)] uppercase tracking-wider bg-[var(--theme-bg)]/80">
                <th className="px-6 py-4 font-black min-w-[120px] sticky left-0 bg-slate-50/90 backdrop-blur z-10 border-r border-[var(--theme-border)]">NIM &amp; Nama</th>
                {activeDefinitions.map(def => (
                  <th key={def.key} className="px-4 py-4 font-black text-center border-r border-[var(--theme-border)] last:border-r-0 max-w-[160px]" title={def.key}>
                    <div className="truncate text-center">{def.label}</div>
                    <span className="text-[8px] opacity-60 normal-case block mt-0.5">{def.component}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--theme-border-muted)]">
              {students.map((st) => (
                <tr key={st.id} className="hover:bg-[var(--theme-bg)]/30 transition-colors text-xs font-bold text-[var(--theme-text)]">
                  {/* Student Nim & Name (Sticky Left Column) */}
                  <td className="px-6 py-4 sticky left-0 bg-white/95 backdrop-blur z-10 border-r border-[var(--theme-border)] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    <div className="font-black text-[var(--theme-primary)]">{st.student?.nim || '-'}</div>
                    <div className="text-[var(--theme-text)] mt-0.5 truncate max-w-[180px]">{st.student?.nama || '-'}</div>
                  </td>

                  {/* Dynamic Score Inputs */}
                  {activeDefinitions.map(def => {
                    const compoundKey = `${def.component}__${def.key}`;
                    const currentVal = scoresInput[st.student_id]?.[compoundKey] ?? '';
                    return (
                      <td key={def.key} className="px-3 py-3 border-r border-[var(--theme-border-muted)] last:border-r-0">
                        <div className="flex flex-col items-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            placeholder="-"
                            value={currentVal}
                            onChange={e => handleScoreChange(st.student_id, def.component, def.key, e.target.value)}
                            className="w-20 h-9 text-center bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-lg font-black focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/20 focus:border-[var(--theme-primary)] transition-all text-xs"
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </form>
  );
};

export default BulkScoringTable;
