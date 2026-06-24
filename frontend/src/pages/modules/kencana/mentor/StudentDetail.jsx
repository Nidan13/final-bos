import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  useMentorStudentProgressQuery,
  useMentorStudentScoreQuery,
  useMentorStudentAttendanceQuery,
  useMentorStudentHandbookQuery,
  useMentorUpsertBulkScoreItemsMutation,
  useMentorStudentAssignmentsQuery
} from '@/queries/useKencanaMentorQuery';
import { SelectField, SelectOption } from '@/components/ui/SelectField';
import { PageHeader } from '@/components/ui/page/PageHeader';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import DataTable from '@/components/ui/DataTable';
import {
  Eye, Trash2, ArrowLeft, GraduationCap, CheckCircle2, Clock, XCircle,
  TrendingUp, Edit3, BookMarked, AlertTriangle, CalendarCheck, Target,
  BookOpen, Brain, Wrench, HeartHandshake, Save, FileText
} from 'lucide-react';

const validTabs = new Set(['progress', 'form', 'assignments']);

const StudentDetail = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(validTabs.has(searchParams.get('tab')) ? searchParams.get('tab') : 'progress');
  const [scoresInput, setScoresInput] = useState({});

  // Parallel Queries
  const { data: progressData, isLoading: loadingProgress } = useMentorStudentProgressQuery(studentId);
  const { data: scoreData, isLoading: loadingScore } = useMentorStudentScoreQuery(studentId);
  const { data: attendanceData, isLoading: loadingAttendance } = useMentorStudentAttendanceQuery(studentId);
  const { data: handbookData, isLoading: loadingHandbook } = useMentorStudentHandbookQuery(studentId);
  const { data: assignmentsData, isLoading: loadingAssignments } = useMentorStudentAssignmentsQuery(studentId);

  // Mutations
  const saveScoresMutation = useMentorUpsertBulkScoreItemsMutation();

  const isLoading = loadingProgress || loadingScore || loadingAttendance || loadingHandbook || loadingAssignments;

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (validTabs.has(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Initialize scores state from existing database values
  useEffect(() => {
    if (scoreData?.items) {
      const map = {};
      scoreData.items.forEach(item => {
        map[`${item.component}__${item.item_name}`] = item.score;
      });
      setScoresInput(map);
    }
  }, [scoreData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-transparent">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--theme-primary)]"></div>
        <span className="ml-3 font-semibold text-[var(--theme-text-muted)] text-sm">Memuat detail mahasiswa...</span>
      </div>
    );
  }

  const student = progressData?.student || scoreData?.student || {};
  const score = scoreData?.score || {};
  const scoreItems = scoreData?.items || [];
  const blockers = scoreData?.blockers || [];
  const progress = progressData?.progress_total || 0;
  const attendance = attendanceData || { percentage: 0, present_count: 0, required_sessions: 0 };
  const attendancePercentage = Number(attendance.percentage || 0);
  const attendanceStatus = attendancePercentage >= 100 ? 'Lengkap' : 'Kurang';
  const handbookScoreItem = scoreItems.find(item =>
    ['cognitive', 'requirements', 'cognitive_static'].includes(String(item.component || '').toLowerCase()) &&
    String(item.item_name || '').toLowerCase() === 'handbook'
  );
  const isHandbookScored = Number(handbookScoreItem?.score || 0) > 0;
  const handbookStatusLabel = isHandbookScored
    ? 'Sudah Diisi'
    : !handbookData || handbookData.status === 'not_started' ? 'Belum Diisi' :
      handbookData.status === 'draft' ? 'Draft Mahasiswa' :
        handbookData.status === 'submitted' ? 'Menunggu Review' :
          handbookData.status === 'approved' ? 'Disetujui' : 'Perlu Perbaikan';
  const handbookStatusMeta = isHandbookScored
    ? `Nilai handbook: ${handbookScoreItem.score}`
    : handbookData?.reviewed_at ? `Direview: ${new Date(handbookData.reviewed_at).toLocaleDateString('id-ID')}` : 'Belum dievaluasi';

  const scopePrefix = scoreData?.mentor_scope === 'faculty' ? '[Fakultas]' : '[Univ]';
  const STATIC_SCORE_DEFINITIONS = {
    cognitive: scoreData?.mentor_scope === 'faculty' ? [] : [
      { key: 'Handbook', label: `${scopePrefix} Handbook`, manual: true },
    ],
    psychomotor: scoreData?.mentor_scope === 'faculty' ? [] : [
      { key: 'Taat Peraturan & Tatib (Makanan)', label: `${scopePrefix} Taat Peraturan & Tatib`, manual: true },
      { key: 'Twibon', label: `${scopePrefix} Twibon`, manual: true },
      { key: 'Video Perkenalan (Analog)', label: `${scopePrefix} Video Perkenalan`, manual: true },
      { key: 'Atribut sesuai Ketentuan', label: `${scopePrefix} Atribut Sesuai Ketentuan`, manual: true },
      { key: 'Kreativitas Individu (name tag, mind map & video rekap)', label: `${scopePrefix} Kreativitas Individu`, manual: true },
      { key: 'Kreativitas Kelompok (Tongkat & yelyel)', label: `${scopePrefix} Kreativitas Kelompok`, manual: true },
      { key: 'Memelihara Fasilitas UBK', label: `${scopePrefix} Memelihara Fasilitas UBK`, manual: true },
    ],
    affective: scoreData?.mentor_scope === 'faculty' ? [] : [
      { key: 'Etika terhadap panitia & civitas', label: `${scopePrefix} Etika terhadap Panitia & Civitas`, manual: true },
      { key: 'Empati', label: `${scopePrefix} Empati`, manual: true },
      { key: 'Tanggung Jawab', label: `${scopePrefix} Tanggung Jawab`, manual: true },
      { key: 'Disiplin', label: `${scopePrefix} Disiplin`, manual: true },
      { key: 'Adil', label: `${scopePrefix} Adil`, manual: true },
    ],
    requirements: [],
  };

  const SCORE_DEFINITIONS = {
    ...STATIC_SCORE_DEFINITIONS,
    cognitive: [
      ...(scoreData?.score_definitions?.cognitive || []),
      ...STATIC_SCORE_DEFINITIONS.cognitive,
    ],
  };
  const cognitiveDefinitions = SCORE_DEFINITIONS.cognitive || [];

  const handleScoreChange = (component, key, val) => {
    const parsed = val === '' ? '' : Math.min(100, Math.max(0, parseFloat(val) || 0));
    setScoresInput(prev => ({
      ...prev,
      [`${component}__${key}`]: parsed
    }));
  };

  const handleSaveScores = (e) => {
    e.preventDefault();
    const items = [];
    Object.entries(SCORE_DEFINITIONS).forEach(([component, list]) => {
      list.forEach(def => {
        if (def.manual) {
          const val = scoresInput[`${component}__${def.key}`];
          items.push({
            component,
            item_name: def.key,
            score: val === '' || val === undefined ? 0 : val,
            notes: `Diisi oleh Mentor/DP`
          });
        }
      });
    });

    saveScoresMutation.mutate(
      { studentId, items },
      {
        onSuccess: () => {
          alert('✅ Nilai mahasiswa bimbingan berhasil disimpan!');
        },
        onError: (err) => {
          alert('❌ Gagal menyimpan nilai: ' + (err.response?.data?.message || err.message));
        }
      }
    );
  };

  const handleSaveReview = (e) => {
    e.preventDefault();
    if (!handbookData || handbookData.status === 'not_started') {
      alert('⚠️ Mahasiswa belum membuat atau mengirimkan handbook.');
      return;
    }

    reviewHandbookMutation.mutate(
      { studentId, status: reviewStatus, feedback: reviewFeedback },
      {
        onSuccess: () => {
          alert('✅ Review handbook berhasil disimpan!');
        },
        onError: (err) => {
          alert('❌ Gagal menyimpan review handbook: ' + (err.response?.data?.message || err.message));
        }
      }
    );
  };

  // Group items by component for presentation
  const cognitiveItems = scoreItems.filter(i => i.component.toLowerCase() === 'cognitive');
  const psychomotorItems = scoreItems.filter(i => i.component.toLowerCase() === 'psychomotor');
  const affectiveItems = scoreItems.filter(i => i.component.toLowerCase() === 'affective');

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

  return (
    <div className="bg-transparent font-body max-w-7xl mx-auto space-y-6">
      {/* Breadcrumbs & Header */}
      <div className="glass-card rounded-2xl border border-[var(--theme-border)] shadow-sm p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[var(--theme-primary)]/5 to-transparent rounded-bl-full pointer-events-none"></div>
        <div className="flex items-start md:items-center gap-5 relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 shrink-0 bg-white/80 hover:bg-[var(--theme-primary)] hover:text-white rounded-xl text-[var(--theme-text-muted)] flex items-center justify-center transition-all shadow-sm border border-[var(--theme-border-muted)]"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          </button>
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

        {/* Graduation badge status inside header */}
        <div className="flex items-center gap-4 bg-white/60 p-3 rounded-2xl border border-[var(--theme-border)] shadow-sm relative z-10">
          <div className="text-right px-2">
            <span className="text-[10px] font-black text-[var(--theme-text-muted)] uppercase tracking-widest block mb-1.5">Status Kelulusan</span>
            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit ml-auto border ${score.graduation_status === 'passed' ? 'bg-[var(--theme-success)]/10 text-[var(--theme-success)] border-[var(--theme-success)]/20' :
                score.graduation_status === 'conditional_pass' ? 'bg-[var(--theme-warning)]/10 text-[var(--theme-warning)] border-[var(--theme-warning)]/20' :
                  score.graduation_status === 'remedial' ? 'bg-[var(--theme-danger)]/10 text-[var(--theme-danger)] border-[var(--theme-danger)]/20' :
                    'bg-[var(--theme-text-muted)]/10 text-[var(--theme-text-muted)] border-[var(--theme-border)]'
              }`}>
              {score.graduation_status === 'passed' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                score.graduation_status === 'conditional_pass' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                  score.graduation_status === 'remedial' ? <XCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              {score.graduation_status === 'passed' ? 'LULUS' :
                score.graduation_status === 'conditional_pass' ? 'LULUS BERSYARAT' :
                  score.graduation_status === 'remedial' ? 'REMEDIAL' : 'BELUM EVALUASI'}
            </span>
          </div>
          <div className="w-px h-10 bg-[var(--theme-border-muted)]"></div>
          <div className="bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-primary-hover)] px-5 py-2.5 rounded-xl text-center shadow-md">
            <span className="text-[9px] font-black text-white/80 uppercase tracking-widest block mb-0.5">Nilai Akhir</span>
            <span className="text-2xl font-black text-white tabular-nums">{score.final_score?.toFixed(1) || '0.0'}</span>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 glass-card rounded-2xl border border-[var(--theme-border)] shadow-sm w-fit mb-6">
        <button
          onClick={() => switchTab('progress')}
          className={`h-10 px-5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'progress'
              ? 'bg-[var(--theme-primary)] text-white shadow-md'
              : 'text-[var(--theme-text-muted)] hover:bg-white/60 hover:text-[var(--theme-text)]'
            }`}
        >
          <TrendingUp className="w-4 h-4" strokeWidth={2.5} /> Rincian Nilai
        </button>
        <button
          onClick={() => switchTab('form')}
          className={`h-10 px-5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'form'
              ? 'bg-[var(--theme-primary)] text-white shadow-md'
              : 'text-[var(--theme-text-muted)] hover:bg-white/60 hover:text-[var(--theme-text)]'
            }`}
        >
          <Edit3 className="w-4 h-4" strokeWidth={2.5} /> Input &amp; Edit Nilai
        </button>
        <button
          onClick={() => switchTab('assignments')}
          className={`h-10 px-5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'assignments'
              ? 'bg-[var(--theme-primary)] text-white shadow-md'
              : 'text-[var(--theme-text-muted)] hover:bg-white/60 hover:text-[var(--theme-text)]'
            }`}
        >
          <FileText className="w-4 h-4" strokeWidth={2.5} /> Tugas &amp; Submisi
        </button>
      </div>

      {/* TAB CONTENT: PROGRESS */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Blockers / Warnings */}
            {blockers.length > 0 && (
              <div className="md:col-span-3 p-5 bg-red-50 border border-red-200 rounded-2xl text-red-600 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                  <AlertTriangle className="w-24 h-24 text-red-600" />
                </div>
                <h4 className="text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10 text-red-700">
                  <AlertTriangle className="w-4 h-4" strokeWidth={2.5} /> Syarat Kelulusan Belum Terpenuhi
                </h4>
                <ul className="list-disc pl-5 text-sm font-bold space-y-1.5 relative z-10 text-red-600">
                  {blockers.map((b, idx) => <li key={idx}>{b}</li>)}
                </ul>
              </div>
            )}

            {/* Attendance widget */}
            <div className="glass-card p-6 rounded-2xl border border-[var(--theme-border)] shadow-sm flex items-center justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <CalendarCheck className="w-24 h-24 text-[var(--theme-primary)]" />
              </div>
              <div className="relative z-10">
                <span className="text-[10px] font-black text-[var(--theme-text-muted)] uppercase tracking-widest block">Persentase Kehadiran</span>
                <span className="text-3xl font-black text-[var(--theme-text)] mt-1.5 block tabular-nums">{attendancePercentage}%</span>
                <p className="text-[11px] font-bold text-[var(--theme-text-subtle)] mt-1 truncate">
                  Sesi: {attendance.attended_sessions || 0} / {attendance.required_sessions || 0}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-xl border font-black text-[10px] uppercase tracking-widest relative z-10 shadow-sm ${attendancePercentage >= 100 ? 'bg-[var(--theme-success)]/10 text-[var(--theme-success)] border-[var(--theme-success)]/20' : 'bg-[var(--theme-warning)]/10 text-[var(--theme-warning)] border-[var(--theme-warning)]/20'}`}>
                {attendanceStatus}
              </div>
            </div>

            {/* Progress widget */}
            <div className="glass-card p-6 rounded-2xl border border-[var(--theme-border)] shadow-sm flex items-center justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Target className="w-24 h-24 text-[var(--theme-primary)]" />
              </div>
              <div className="relative z-10">
                <span className="text-[10px] font-black text-[var(--theme-text-muted)] uppercase tracking-widest block">Progress Materi</span>
                <span className="text-3xl font-black text-[var(--theme-text)] mt-1.5 block tabular-nums">{progress}%</span>
                <span className="text-xs font-bold text-[var(--theme-text-muted)] block mt-2">Materi &amp; Tugas diselesaikan</span>
              </div>
              <div className="px-4 py-2 bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] rounded-xl border border-[var(--theme-primary)]/20 font-black text-[10px] uppercase tracking-widest relative z-10 shadow-sm">
                Aktif
              </div>
            </div>

            {/* Handbook Status widget */}
            <div className="glass-card p-6 rounded-2xl border border-[var(--theme-border)] shadow-sm flex items-center justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <BookOpen className="w-24 h-24 text-[var(--theme-primary)]" />
              </div>
              <div className="relative z-10 max-w-[60%]">
                <span className="text-[10px] font-black text-[var(--theme-text-muted)] uppercase tracking-widest block">Status Handbook</span>
                <span className="text-lg font-black text-[var(--theme-text)] mt-1.5 block uppercase tracking-tight truncate">
                  {handbookStatusLabel}
                </span>
                <span className="text-xs font-bold text-[var(--theme-text-muted)] block mt-2 truncate">
                  {handbookStatusMeta}
                </span>
              </div>
              <div className={`px-4 py-2 rounded-xl border font-black text-[10px] uppercase tracking-widest relative z-10 shadow-sm ${isHandbookScored || handbookData?.status === 'approved' ? 'bg-[var(--theme-success)]/10 text-[var(--theme-success)] border-[var(--theme-success)]/20' :
                  handbookData?.status === 'submitted' ? 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] border-[var(--theme-primary)]/20 animate-pulse' :
                    'bg-[var(--theme-text-muted)]/10 text-[var(--theme-text-muted)] border-[var(--theme-border)]'
                }`}>
                {isHandbookScored || handbookData?.status === 'approved' ? 'SUDAH' : 'PENDING'}
              </div>
            </div>
          </div>

          {/* Simplified Score Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pengetahuan */}
            <div className="glass-card rounded-2xl border border-[var(--theme-border)] shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-[var(--theme-border-muted)] bg-white/50 flex justify-between items-center">
                <h3 className="font-black text-[var(--theme-text)] text-xs uppercase tracking-widest flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[var(--theme-primary)]" strokeWidth={2.5} /> Pengetahuan
                </h3>
                <span className="bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] px-2.5 py-1 rounded-lg text-xs font-black border border-[var(--theme-primary)]/20 shadow-sm tabular-nums">{score.cognitive_average?.toFixed(1) || '0.0'}</span>
              </div>
              <div className="p-5 space-y-3 text-xs font-bold text-[var(--theme-text-muted)] flex-1 bg-white/30">
                {cognitiveDefinitions.length > 0 ? cognitiveDefinitions.map(def => {
                  const item = cognitiveItems.find(i => i.item_name === def.key);
                  return (
                    <div key={def.key} className="flex justify-between items-center group">
                      <span className="truncate pr-4 group-hover:text-[var(--theme-text)] transition-colors">{def.label || def.key}</span>
                      <span className="font-black text-[var(--theme-text)] tabular-nums px-2 py-0.5 bg-[var(--theme-bg)] rounded-md border border-[var(--theme-border-muted)] shadow-sm">{item?.score ?? '-'}</span>
                    </div>
                  );
                }) : <span className="italic text-[10px] uppercase tracking-widest text-center block w-full opacity-50 py-4">Belum ada nilai</span>}
              </div>
            </div>

            {/* Keterampilan */}
            <div className="glass-card rounded-2xl border border-[var(--theme-border)] shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-[var(--theme-border-muted)] bg-white/50 flex justify-between items-center">
                <h3 className="font-black text-[var(--theme-text)] text-xs uppercase tracking-widest flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[var(--theme-secondary)]" strokeWidth={2.5} /> Keterampilan
                </h3>
                <span className="bg-[var(--theme-secondary)]/10 text-[var(--theme-secondary)] px-2.5 py-1 rounded-lg text-xs font-black border border-[var(--theme-secondary)]/20 shadow-sm tabular-nums">{score.psychomotor_average?.toFixed(1) || '0.0'}</span>
              </div>
              <div className="p-5 space-y-3 text-xs font-bold text-[var(--theme-text-muted)] flex-1 bg-white/30">
                {SCORE_DEFINITIONS.psychomotor.length > 0 ? SCORE_DEFINITIONS.psychomotor.map(def => {
                  const item = psychomotorItems.find(i => i.item_name === def.key);
                  return (
                    <div key={def.key} className="flex justify-between items-center group">
                      <span className="truncate pr-4 group-hover:text-[var(--theme-text)] transition-colors">{def.label || def.key}</span>
                      <span className="font-black text-[var(--theme-text)] tabular-nums px-2 py-0.5 bg-[var(--theme-bg)] rounded-md border border-[var(--theme-border-muted)] shadow-sm">{item?.score ?? '-'}</span>
                    </div>
                  );
                }) : <span className="italic text-[10px] uppercase tracking-widest text-center block w-full opacity-50 py-4">Belum ada nilai</span>}
              </div>
            </div>

            {/* Sikap */}
            <div className="glass-card rounded-2xl border border-[var(--theme-border)] shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-[var(--theme-border-muted)] bg-white/50 flex justify-between items-center">
                <h3 className="font-black text-[var(--theme-text)] text-xs uppercase tracking-widest flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-[var(--theme-danger)]" strokeWidth={2.5} /> Sikap
                </h3>
                <span className="bg-[var(--theme-danger)]/10 text-[var(--theme-danger)] px-2.5 py-1 rounded-lg text-xs font-black border border-[var(--theme-danger)]/20 shadow-sm tabular-nums">{score.affective_average?.toFixed(1) || '0.0'}</span>
              </div>
              <div className="p-5 space-y-3 text-xs font-bold text-[var(--theme-text-muted)] flex-1 bg-white/30">
                {SCORE_DEFINITIONS.affective.length > 0 ? SCORE_DEFINITIONS.affective.map(def => {
                  const item = affectiveItems.find(i => i.item_name === def.key);
                  return (
                    <div key={def.key} className="flex justify-between items-center group">
                      <span className="truncate pr-4 group-hover:text-[var(--theme-text)] transition-colors">{def.label || def.key}</span>
                      <span className="font-black text-[var(--theme-text)] tabular-nums px-2 py-0.5 bg-[var(--theme-bg)] rounded-md border border-[var(--theme-border-muted)] shadow-sm">{item?.score ?? '-'}</span>
                    </div>
                  );
                }) : <span className="italic text-[10px] uppercase tracking-widest text-center block w-full opacity-50 py-4">Belum ada nilai</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: GRADE INPUT FORM */}
      {activeTab === 'form' && (
        <form onSubmit={handleSaveScores} className="glass-card p-6 md:p-8 rounded-2xl border border-[var(--theme-border)] shadow-sm space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <Edit3 className="w-48 h-48 text-[var(--theme-text)]" />
          </div>
          <div className="relative z-10">
            <h3 className="text-lg font-black text-[var(--theme-text)] uppercase tracking-tight flex items-center gap-2 mb-1.5">
              <FileText className="w-5 h-5 text-[var(--theme-primary)]" strokeWidth={2.5} /> Form Pengisian Nilai
            </h3>
            <p className="text-xs font-bold text-[var(--theme-text-muted)]">Masukkan nilai dari 0 hingga 100 untuk sub-item manual. Nilai tes otomatis ditampilkan sebagai referensi.</p>
          </div>

          <div className="space-y-6">
            {/* Cognitive */}
            <div className="space-y-5 relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-primary)] flex items-center gap-2 pb-2 border-b border-[var(--theme-border-muted)]">
                <Brain className="w-3.5 h-3.5" /> 1. Nilai Pengetahuan (Kuis &amp; Tugas)
              </h4>
              {!SCORE_DEFINITIONS.cognitive.length && (
                <div className="rounded-xl glass-card border border-[var(--theme-border-muted)] px-5 py-4 text-xs font-bold text-[var(--theme-text-muted)] flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[var(--theme-warning)] mt-0.5" />
                  Belum ada post test aktif dari Kencana University. Nilai post test akan muncul otomatis setelah kuis aktif dan dikerjakan mahasiswa.
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {SCORE_DEFINITIONS.cognitive.map(def => {
                  const key = `cognitive__${def.key}`;
                  const currentVal = scoresInput[key] ?? '';
                  return (
                    <div key={def.key} className="space-y-2">
                      <label className="text-[11px] font-black text-[var(--theme-text-muted)] block uppercase tracking-wider truncate">{def.label}</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        placeholder="0-100"
                        value={currentVal}
                        onChange={e => handleScoreChange('cognitive', def.key, e.target.value)}
                        disabled={!def.manual}
                        className={`w-full h-11 px-4 rounded-xl text-sm font-bold focus:outline-none transition-all shadow-sm ${def.manual
                            ? 'bg-white/80 border border-[var(--theme-border)] focus:border-[var(--theme-primary)] focus:ring-4 focus:ring-[var(--theme-primary)]/10'
                            : 'bg-[var(--theme-bg)]/50 border border-[var(--theme-border-muted)] text-[var(--theme-text-muted)] cursor-not-allowed'
                          }`}
                      />
                      {!def.manual && (
                        <span className="text-[9px] font-bold text-[var(--theme-text-muted)] block uppercase tracking-widest opacity-60">Dihitung Otomatis</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Psychomotor */}
            <div className="space-y-5 relative z-10 pt-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-secondary)] flex items-center gap-2 pb-2 border-b border-[var(--theme-border-muted)]">
                <Wrench className="w-3.5 h-3.5" /> 2. Nilai Keterampilan &amp; Keaktifan
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {SCORE_DEFINITIONS.psychomotor.map(def => {
                  const key = `psychomotor__${def.key}`;
                  const currentVal = scoresInput[key] ?? '';
                  return (
                    <div key={def.key} className="space-y-2">
                      <label className="text-[11px] font-black text-[var(--theme-text-muted)] block uppercase tracking-wider truncate" title={def.label}>
                        {def.label}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        placeholder="0-100"
                        value={currentVal}
                        onChange={e => handleScoreChange('psychomotor', def.key, e.target.value)}
                        className="w-full h-11 px-4 bg-white/80 border border-[var(--theme-border)] rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[var(--theme-secondary)]/10 focus:border-[var(--theme-secondary)] transition-all shadow-sm"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Affective */}
            <div className="space-y-5 relative z-10 pt-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-danger)] flex items-center gap-2 pb-2 border-b border-[var(--theme-border-muted)]">
                <HeartHandshake className="w-3.5 h-3.5" /> 3. Nilai Sikap &amp; Perilaku
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {SCORE_DEFINITIONS.affective.map(def => {
                  const key = `affective__${def.key}`;
                  const currentVal = scoresInput[key] ?? '';
                  return (
                    <div key={def.key} className="space-y-2">
                      <label className="text-[11px] font-black text-[var(--theme-text-muted)] block uppercase tracking-wider truncate" title={def.label}>{def.label}</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        placeholder="0-100"
                        value={currentVal}
                        onChange={e => handleScoreChange('affective', def.key, e.target.value)}
                        className="w-full h-11 px-4 bg-white/80 border border-[var(--theme-border)] rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[var(--theme-danger)]/10 focus:border-[var(--theme-danger)] transition-all shadow-sm"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Requirements Override */}
            {/* Requirements Override */}
            {SCORE_DEFINITIONS.requirements.length > 0 && (
              <div className="space-y-5 relative z-10 pt-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-warning)] flex items-center gap-2 pb-2 border-b border-[var(--theme-border-muted)]">
                  <Target className="w-3.5 h-3.5" /> 4. Persyaratan Kelulusan (Manual Override)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {SCORE_DEFINITIONS.requirements.map(def => {
                    const key = `requirements__${def.key}`;
                    const currentVal = scoresInput[key] ?? '';
                    return (
                      <div key={def.key} className="space-y-2">
                        <label className="text-[11px] font-black text-[var(--theme-text-muted)] block uppercase tracking-wider truncate" title={def.label}>{def.label}</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          placeholder="0-100"
                          value={currentVal}
                          onChange={e => handleScoreChange('requirements', def.key, e.target.value)}
                          className="w-full h-11 px-4 bg-white/80 border border-[var(--theme-border)] rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[var(--theme-warning)]/10 focus:border-[var(--theme-warning)] transition-all shadow-sm"
                        />
                        <span className="text-[9px] font-bold text-[var(--theme-text-muted)] block uppercase tracking-widest opacity-60">Isi 100 untuk menyatakan lengkap/lulus</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-6 border-t border-[var(--theme-border-muted)] relative z-10">
            <button
              type="submit"
              disabled={saveScoresMutation.isPending}
              className="h-11 px-8 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-white font-black uppercase tracking-widest rounded-xl disabled:opacity-50 transition-all text-[10px] flex items-center gap-2.5 shadow-md shadow-[var(--theme-primary)]/20"
            >
              {saveScoresMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" strokeWidth={2.5} />
              )}
              Simpan Semua Nilai
            </button>
          </div>
        </form>
      )}

      {/* TAB CONTENT: ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="glass-card p-6 md:p-8 rounded-2xl border border-[var(--theme-border)] shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] flex items-center justify-center">
                <FileText className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-black text-[var(--theme-text)] uppercase tracking-widest">Tugas &amp; Submisi</h3>
                <p className="text-[11px] font-bold text-[var(--theme-text-muted)] mt-1">Daftar tugas Kencana dan jawaban yang dikumpulkan mahasiswa.</p>
              </div>
            </div>

            {loadingAssignments ? (
              <div className="text-center py-10 font-bold text-[var(--theme-text-muted)] text-xs uppercase tracking-widest">Memuat data tugas...</div>
            ) : !assignmentsData || assignmentsData.length === 0 ? (
              <div className="text-center py-10 font-bold text-[var(--theme-text-muted)] text-xs uppercase tracking-widest bg-white/50 rounded-2xl border border-[var(--theme-border-muted)]">
                Belum ada tugas yang tersedia untuk mahasiswa ini.
              </div>
            ) : (
              <div className="space-y-6 relative z-10">
                {assignmentsData.map((item, index) => {
                  const { assignment, submission } = item;
                  const isSubmitted = submission?.status === 'submitted' || submission?.status === 'graded';

                  return (
                    <div key={assignment.id} className="p-6 bg-white/50 border border-[var(--theme-border-muted)] rounded-xl flex flex-col md:flex-row md:items-start justify-between gap-6 hover:bg-white/80 transition-all shadow-sm">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-sm font-black text-[var(--theme-text)] uppercase tracking-widest">{assignment.title}</h4>
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${isSubmitted
                              ? 'bg-[var(--theme-success)]/10 text-[var(--theme-success)] border-[var(--theme-success)]/20'
                              : 'bg-[var(--theme-danger)]/10 text-[var(--theme-danger)] border-[var(--theme-danger)]/20'
                            }`}>
                            {isSubmitted ? 'Terkumpul' : 'Belum Terkumpul'}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-[var(--theme-text-muted)] prose prose-sm max-w-none prose-p:my-0 mb-4" dangerouslySetInnerHTML={{ __html: assignment.description }}></div>

                        {isSubmitted ? (
                          <div className="p-5 bg-white border border-[var(--theme-border)] rounded-xl space-y-4 shadow-sm">
                            <h5 className="text-[10px] font-black text-[var(--theme-text-muted)] uppercase tracking-widest flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--theme-success)]" /> Hasil Pekerjaan
                            </h5>
                            {submission.answer_text && (
                              <div className="text-xs text-[var(--theme-text)] font-bold p-4 bg-[var(--theme-bg)] rounded-xl whitespace-pre-wrap border border-[var(--theme-border-muted)] shadow-inner">
                                {submission.answer_text}
                              </div>
                            )}
                            {submission.link_url && (
                              <div>
                                <a href={submission.link_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-black text-[var(--theme-primary)] hover:text-[var(--theme-primary-hover)] hover:underline bg-[var(--theme-primary)]/5 px-3 py-1.5 rounded-lg border border-[var(--theme-primary)]/10">
                                  <span className="material-symbols-outlined text-[16px]">link</span>
                                  {submission.link_url}
                                </a>
                              </div>
                            )}
                            {submission.file_url && (
                              <div>
                                <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[10px] font-black text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] px-5 py-2.5 rounded-xl transition-all shadow-md uppercase tracking-widest">
                                  <span className="material-symbols-outlined text-[16px]">download</span>
                                  Unduh File / Dokumen
                                </a>
                              </div>
                            )}
                            <div className="text-[10px] font-bold text-[var(--theme-text-muted)] mt-2 flex items-center gap-1.5">
                              <Clock className="w-3 h-3" /> Dikumpulkan pada: {new Date(submission.submitted_at).toLocaleString('id-ID')}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] font-bold text-[var(--theme-text-muted)] italic flex items-center gap-2 bg-[var(--theme-bg)] p-3 rounded-lg border border-[var(--theme-border-muted)]">
                            <AlertTriangle className="w-3.5 h-3.5 text-[var(--theme-warning)]" /> Mahasiswa belum mengunggah jawaban untuk tugas ini.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetail;
