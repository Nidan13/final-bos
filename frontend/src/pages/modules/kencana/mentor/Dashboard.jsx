import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMentorDashboardQuery, useMentorAnnouncementsQuery } from '@/queries/useKencanaMentorQuery';
import useAuthStore from '@/store/useAuthStore';
import { PageContent, PageCard, PageCardHeader } from '@/components/ui/page';
import { DashboardHero, DashboardQuickActions } from '@/components/ui/dashboard';
import { PrimaryStatsCard } from '@/components/ui/StatsCard';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: dashboardInfo, isLoading } = useMentorDashboardQuery();
  const { data: announcements } = useMentorAnnouncementsQuery();
  const user = useAuthStore(state => state.user);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-64 bg-transparent">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--theme-primary)]"></div>
      </div>
    );
  }

  const mentor = dashboardInfo?.mentor || {};
  const period = dashboardInfo?.period || {};
  const studentCount = dashboardInfo?.student_count || 0;
  const pendingHandbooks = dashboardInfo?.pending_handbooks || 0;
  const passedStudents = dashboardInfo?.passed_students || 0;
  const remedialStudents = dashboardInfo?.remedial_students || 0;

  const isProfileComplete = mentor.name && mentor.phone;
  const isFaculty = mentor.scope_type === 'faculty';

  const evaluatedCount = passedStudents + remedialStudents;
  const notEvaluatedCount = Math.max(0, studentCount - evaluatedCount);

  const evaluationData = [
    { name: 'Lulus', value: passedStudents, color: '#10b981' },
    { name: 'Remedial', value: remedialStudents, color: '#ef4444' },
    { name: 'Belum Dinilai', value: notEvaluatedCount, color: '#94a3b8' }
  ].filter(d => d.value > 0);

  const quickActions = [
    { label: 'Persetujuan Handbook', icon: 'menu_book', path: '/app/kencana/mentor/handbook', iconBg: 'bg-violet-100 text-violet-600 border-violet-200 shadow-sm' },
    { label: 'Penilaian & Skoring', icon: 'grade', path: '/app/kencana/mentor/scoring', iconBg: 'bg-indigo-100 text-indigo-600 border-indigo-200 shadow-sm' },
    { label: 'Validasi Presensi (Izin)', icon: 'edit_note', path: '/app/kencana/mentor/absence-requests', iconBg: 'bg-rose-100 text-rose-600 border-rose-200 shadow-sm' },
    { label: 'Kelompok Saya', icon: 'diversity_3', path: '/app/kencana/mentor/groups', iconBg: 'bg-blue-100 text-blue-600 border-blue-200 shadow-sm' },
    { label: 'Catatan Bimbingan', icon: 'speaker_notes', path: '/app/kencana/mentor/notes', iconBg: 'bg-amber-100 text-amber-600 border-amber-200 shadow-sm' },
    { label: 'Presensi Kehadiran', icon: 'how_to_reg', path: '/app/kencana/mentor/attendance', iconBg: 'bg-emerald-100 text-emerald-600 border-emerald-200 shadow-sm' },
    { label: 'Pengaturan Profil', icon: 'settings', path: '/app/kencana/mentor/settings', iconBg: 'bg-slate-100 text-slate-600 border-slate-200 shadow-sm' },
  ].filter(action => {
    if (isFaculty && action.label === 'Persetujuan Handbook') return false;
    return true;
  });

  const badges = [
    { label: 'Kencana Mentor Portal', active: false },
    { label: isFaculty ? `Fakultas: ${mentor.fakultas?.Nama || mentor.fakultas_id || '-'}` : 'Universitas', active: true }
  ];

  return (
    <PageContent>
      {/* Dashboard Hero */}
      <DashboardHero
        title="Selamat Datang,"
        highlightedTitle={mentor.name || user?.name || 'Dewan Pembimbing'}
        subtitle="Kelola bimbingan Anda, berikan evaluasi akhir, dan pantau kelengkapan berkas serta progres mahasiswa baru dalam ekosistem Kencana."
        icon="admin_panel_settings"
        badges={badges}
        breadcrumbs={[
          { label: 'Kencana Mentor', path: '#' },
          { label: 'Dashboard' }
        ]}
      />

      {/* Warning Alert if profile incomplete */}
      {!isProfileComplete && (
        <div className="bg-[var(--theme-warning-light)] border border-[var(--theme-warning)]/20 rounded-3xl p-6 flex items-start gap-4 shadow-sm mb-6">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">
            <span className="material-symbols-outlined">warning</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-800">Profil Anda Belum Lengkap</h3>
            <p className="text-xs font-semibold text-amber-700 mt-1">
              Silakan lengkapi nama lengkap dan nomor telepon Anda di halaman Pengaturan agar mahasiswa bimbingan dapat mengenali dan menghubungi Anda dengan mudah.
            </p>
            <Link to="/app/kencana/mentor/settings" className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-amber-800 uppercase tracking-wider hover:opacity-80 transition-all">
              Lengkapi Profil Sekarang &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Announcements */}
      {announcements && announcements.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[var(--theme-primary)] text-xl">campaign</span>
            <h3 className="text-sm font-bold text-[var(--theme-text)] font-headline tracking-wide">Pengumuman Kencana</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.map((a, i) => (
              <div key={i} onClick={() => setSelectedAnnouncement(a)} className="bg-[var(--theme-surface)] rounded-2xl p-5 border border-[var(--theme-border)] shadow-sm cursor-pointer hover:border-[var(--theme-primary)]/40 hover:shadow-md transition-all flex flex-col group">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-[13px] font-bold text-[var(--theme-text)] leading-tight group-hover:text-[var(--theme-primary)] transition-colors">{a.judul}</h4>
                  <span className="text-[10px] font-bold text-[var(--theme-text-muted)] whitespace-nowrap shrink-0 ml-3 bg-[var(--theme-bg)] px-2 py-0.5 rounded-full border border-[var(--theme-border)]">
                    {new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="text-[12px] text-[var(--theme-text-muted)] line-clamp-3 prose prose-sm max-w-none prose-p:my-0 prose-p:leading-snug flex-1" dangerouslySetInnerHTML={{ __html: a.isi }}></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <PrimaryStatsCard
          title="Total Bimbingan"
          value={`${studentCount} Mahasiswa`}
          icon="school"
          colorTheme="primary"
          badgeText="Aktif"
          onClick={() => navigate('/app/kencana/mentor/students')}
        />
        <PrimaryStatsCard
          title="Review Handbook"
          value={`${pendingHandbooks} Berkas`}
          icon="menu_book"
          colorTheme="warning"
          badgeText={pendingHandbooks > 0 ? "Butuh ACC" : undefined}
          onClick={() => navigate('/app/kencana/mentor/handbook')}
        />
        <PrimaryStatsCard
          title="Mahasiswa Lulus"
          value={`${passedStudents} Mahasiswa`}
          icon="verified"
          colorTheme="success"
          badgeText="Lengkap"
          onClick={() => navigate('/app/kencana/mentor/scoring')}
        />
        <PrimaryStatsCard
          title="Perlu Perbaikan / Remedial"
          value={`${remedialStudents} Mahasiswa`}
          icon="error"
          colorTheme="error"
          badgeText="Evaluasi"
          onClick={() => navigate('/app/kencana/mentor/scoring')}
        />
      </div>

      {/* Quick Actions */}
      <DashboardQuickActions
        title="Aksi Cepat &amp; Tugas Kerja"
        description="Gunakan pintasan di bawah ini untuk mengakses fitur penilaian dan evaluasi secara cepat."
        actions={quickActions}
      />

      {/* Enriched Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Status Evaluasi Mahasiswa Donut Chart */}
        <div className="lg:col-span-1 bg-[var(--theme-surface)] p-6 rounded-3xl border border-[var(--theme-border)] shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-300">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[var(--theme-primary-light)] text-[var(--theme-primary)] rounded-xl flex justify-center items-center group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 border border-[var(--theme-border)]">
                <span className="material-symbols-outlined text-[24px]">donut_small</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest block mb-0.5">Komposisi Evaluasi</span>
                <h3 className="text-sm font-bold text-[var(--theme-text)] leading-tight">Status Penilaian Mahasiswa</h3>
              </div>
            </div>

            {studentCount > 0 ? (
              <div className="h-[180px] w-full flex items-center justify-center relative">
                {isMounted && (
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <PieChart>
                      <Pie
                        data={evaluationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {evaluationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "var(--theme-surface)", border: "1px solid var(--theme-border)", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)", fontSize: "11px", fontWeight: "bold", color: "var(--theme-text)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : (
              <div className="h-[180px] w-full flex flex-col items-center justify-center text-[var(--theme-text-muted)] text-xs italic">
                Tidak ada data mahasiswa bimbingan.
              </div>
            )}
          </div>

          {studentCount > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { name: 'Lulus', value: passedStudents, color: '#10b981' },
                { name: 'Remedial', value: remedialStudents, color: '#ef4444' },
                { name: 'Belum Dinilai', value: notEvaluatedCount, color: '#94a3b8' }
              ].map((item) => (
                <div key={item.name} className="flex flex-col items-center p-2 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border-muted)]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[9px] font-bold text-[var(--theme-text-muted)] truncate">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-[var(--theme-text)] mt-1">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Group and Period Info */}
        <div className="lg:col-span-2">
          <PageCard className="h-full flex flex-col justify-between">
            <PageCardHeader
              title="Informasi Kelompok Bimbingan"
              description="Rincian informasi kelompok Kencana dan periode aktif Anda."
              icon="info"
            />
            <div className="p-6 md:p-8 flex-1 flex flex-col justify-between space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kelompok Info */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-primary)]">Data Kelompok</h4>
                  {mentor.group_id || dashboardInfo?.group?.id ? (
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest block mb-0.5">Nama Kelompok</span>
                        <span className="text-sm font-bold text-[var(--theme-text)]">{dashboardInfo.group?.name || '-'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest block mb-0.5">Kode Kelompok</span>
                        <span className="text-xs font-bold font-mono text-[var(--theme-text-muted)] bg-[var(--theme-bg)] border border-[var(--theme-border)] px-2 py-0.5 rounded-md inline-block">{dashboardInfo.group?.code || '-'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest block mb-0.5">Cakupan Wilayah</span>
                        <span className="text-xs font-bold text-[var(--theme-text)] bg-[var(--theme-primary-light)] text-[var(--theme-primary)] border border-[var(--theme-border)] px-2 py-0.5 rounded-full inline-block uppercase">
                          {dashboardInfo.group?.scope_type || mentor.scope_type || 'university'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-2xl text-center text-xs font-semibold text-[var(--theme-text-muted)] italic">
                      Anda belum di-plotting ke kelompok mana pun oleh admin.
                    </div>
                  )}
                </div>

                {/* Periode Info */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-primary)]">Periode Kencana</h4>
                  {period.id ? (
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest block mb-0.5">Nama Periode</span>
                        <span className="text-sm font-bold text-[var(--theme-text)]">{period.name} ({period.year})</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest block mb-0.5">Mulai - Selesai</span>
                        <span className="text-xs font-semibold text-[var(--theme-text-muted)]">
                          {period.start_date ? new Date(period.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'} - {period.end_date ? new Date(period.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest block mb-0.5">Minimal Nilai Kelulusan</span>
                        <span className="text-xs font-bold text-[var(--theme-warning)] bg-[var(--theme-warning-light)] border border-[var(--theme-warning)]/20 px-2 py-0.5 rounded-full inline-block">
                          {period.passing_grade} / 100
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-2xl text-center text-xs font-semibold text-[var(--theme-text-muted)] italic">
                      Tidak ada periode Kencana aktif saat ini.
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Summary Info bar */}
              {studentCount > 0 && (
                <div className="pt-4 border-t border-[var(--theme-border-muted)] space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-[var(--theme-text-muted)]">
                    <span>Kemajuan Evaluasi Kelompok</span>
                    <span className="text-[var(--theme-primary)]">{evaluatedCount} dari {studentCount} Selesai ({Math.round((evaluatedCount / studentCount) * 100)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--theme-primary)] to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((evaluatedCount / studentCount) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </PageCard>
        </div>
      </div>

      {/* Announcement Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--theme-surface)] rounded-[24px] p-6 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200 border border-[var(--theme-border)] max-h-[85vh] flex flex-col">
            <button
              onClick={() => setSelectedAnnouncement(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--theme-bg)] hover:bg-slate-100 text-[var(--theme-text-muted)] transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="flex items-center gap-2 mb-4 shrink-0">
              <div className="grid size-8 place-items-center rounded-lg bg-[var(--theme-primary-light)] text-[var(--theme-primary)]">
                <span className="material-symbols-outlined text-[16px]">campaign</span>
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-[var(--theme-primary)] uppercase tracking-wider">Pengumuman</h3>
                <p className="text-[10px] text-[var(--theme-text-muted)] font-medium">Dari Administrator Kencana</p>
              </div>
            </div>

            <div className="overflow-y-auto pr-2 pb-2 flex-1">
              <h2 className="text-xl font-black text-[var(--theme-text)] mb-2 leading-snug">{selectedAnnouncement.judul}</h2>
              <p className="text-xs font-bold text-[var(--theme-text-muted)] mb-5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                {new Date(selectedAnnouncement.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              <div
                className="prose prose-sm max-w-none prose-slate prose-p:leading-relaxed prose-headings:font-bold break-words overflow-x-auto text-[var(--theme-text-subtle)]"
                dangerouslySetInnerHTML={{ __html: selectedAnnouncement.isi }}
              />
            </div>

            <div className="pt-4 border-t border-[var(--theme-border-muted)] flex justify-end shrink-0">
              <button type="button" onClick={() => setSelectedAnnouncement(null)} className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-[var(--theme-text)] bg-[var(--theme-bg)] border border-[var(--theme-border)] hover:bg-slate-50 transition-colors">
                Tutup Pengumuman
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContent>
  );
};

export default Dashboard;
