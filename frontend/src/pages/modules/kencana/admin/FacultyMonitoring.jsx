import React, { useState, useMemo } from 'react';
import { usePeriodsQuery, useFacultyComplianceQuery } from '@/queries/useKencanaAdminQuery';
import { PageHeader } from '@/components/ui/page/PageHeader';
import { PrimaryStatsCard } from '@/components/ui/StatsCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const STATUS_CONFIG = {
  compliant: { label: 'Terpenuhi', color: 'var(--theme-success)', bg: 'var(--theme-success-light)', icon: 'verified' },
  partial:   { label: 'Sebagian',  color: 'var(--theme-warning)', bg: 'var(--theme-warning-light)', icon: 'pending' },
  behind:    { label: 'Tertinggal', color: 'var(--theme-error)',   bg: 'var(--theme-error-light)',   icon: 'warning' },
};

const ProgressRing = ({ value, size = 56, stroke = 5, color }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--theme-border-muted)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        className="font-black font-headline" style={{ fontSize: size * 0.26, fill: 'var(--theme-text)' }}>
        {value}%
      </text>
    </svg>
  );
};

const MiniBar = ({ value, max = 100, color = 'var(--theme-primary)' }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-1.5 bg-[var(--theme-border-muted)] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
};

const FacultyMonitoring = () => {
  const { data: periods } = usePeriodsQuery();
  const activePeriod = (periods || []).find(p => p.is_active || p.status === 'active') || periods?.[0] || null;
  const { data: complianceData, isLoading } = useFacultyComplianceQuery({ period_id: activePeriod?.id || '' });

  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const faculties = complianceData?.faculties || [];
  const summary = complianceData?.summary || {};

  const filteredFaculties = useMemo(() => {
    let list = faculties;
    if (filterStatus !== 'all') list = list.filter(f => f.overall_status === filterStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(f => f.fakultas_nama?.toLowerCase().includes(q));
    }
    return list;
  }, [faculties, filterStatus, searchQuery]);

  // Chart data
  const chartData = useMemo(() => faculties.map(f => ({
    name: (f.fakultas_nama || '').replace('Fakultas ', '').substring(0, 18),
    penjadwalan: f.scheduling_pct || 0,
    plotting: f.plotting_pct || 0,
    penilaian: f.grading_pct || 0,
  })), [faculties]);

  const bandingChartData = useMemo(() => {
    const withBanding = faculties.filter(f => f.banding_total > 0);
    return withBanding.map(f => ({
      name: (f.fakultas_nama || '').replace('Fakultas ', '').substring(0, 18),
      pending: f.banding_pending || 0,
      approved: f.banding_approved || 0,
      rejected: f.banding_rejected || 0,
    }));
  }, [faculties]);

  const pieData = useMemo(() => [
    { name: 'Terpenuhi', value: summary.compliant_count || 0, fill: 'var(--theme-success)' },
    { name: 'Sebagian', value: summary.partial_count || 0, fill: 'var(--theme-warning)' },
    { name: 'Tertinggal', value: summary.behind_count || 0, fill: 'var(--theme-error)' },
  ], [summary]);

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-64 bg-transparent">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[var(--theme-primary)]"></div>
      </div>
    );
  }

  const totalFaculties = summary.total_faculties || 0;
  const complianceRate = totalFaculties > 0 ? Math.round(((summary.compliant_count || 0) / totalFaculties) * 100) : 0;
  const totalBanding = faculties.reduce((s, f) => s + (f.banding_total || 0), 0);
  const pendingBanding = faculties.reduce((s, f) => s + (f.banding_pending || 0), 0);

  return (
    <div className="bg-transparent font-body max-w-7xl mx-auto space-y-8">
      <PageHeader
        icon="monitoring"
        title={<><span className="text-[var(--theme-text)]">Monitoring </span><span className="text-[var(--theme-primary)]">Kepatuhan Fakultas</span></>}
        subtitle="Pantau kesiapan dan progres pelaksanaan PKKMB di setiap fakultas secara real-time."
        breadcrumbs={[
          { label: 'Kencana Admin', path: '#' },
          { label: 'Monitoring Kepatuhan Fakultas' }
        ]}
        action={
          <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] px-4 py-2 rounded-xl text-center min-w-[140px] shrink-0">
            <p className="text-[9px] font-bold text-[var(--theme-secondary)] uppercase tracking-wider">Periode Aktif</p>
            <p className="text-xs font-semibold truncate max-w-[120px]" style={{ color: 'var(--theme-text)' }}>
              {activePeriod ? activePeriod.name : 'Belum Ada'}
            </p>
          </div>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PrimaryStatsCard title="Total Fakultas" value={totalFaculties} icon="corporate_fare" colorTheme="primary" />
        <PrimaryStatsCard title="Kepatuhan Penuh" value={summary.compliant_count || 0} icon="verified" colorTheme="success" />
        <PrimaryStatsCard title="Sebagian Terpenuhi" value={summary.partial_count || 0} icon="pending" colorTheme="warning" />
        <PrimaryStatsCard title="Tertinggal" value={summary.behind_count || 0} icon="warning" colorTheme="error" />
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Overview Ring */}
        <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--theme-primary-light)] text-[var(--theme-primary)] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>donut_large</span>
            </div>
            <div className="text-left">
              <h2 className="text-sm font-black text-[var(--theme-text)] tracking-tight font-headline uppercase">Distribusi Kepatuhan</h2>
              <p className="text-[10px] font-semibold text-[var(--theme-text-muted)] mt-0.5">Proporsi status seluruh fakultas</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 min-h-[160px]">
            <PieChart width={140} height={140}>
              <Pie data={pieData} innerRadius={42} outerRadius={62} paddingAngle={3} dataKey="value" stroke="none">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
            </PieChart>
            <div className="space-y-3">
              {pieData.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: entry.fill }} />
                  <span className="text-[11px] font-semibold text-[var(--theme-text-muted)]">{entry.name}</span>
                  <span className="text-xs font-black text-[var(--theme-text)] ml-auto">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Compliance Comparison Bar Chart */}
        <div className="lg:col-span-2 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--theme-info-light)] text-[var(--theme-info)] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>bar_chart</span>
            </div>
            <div className="text-left">
              <h2 className="text-sm font-black text-[var(--theme-text)] tracking-tight font-headline uppercase">Perbandingan Antar Fakultas</h2>
              <p className="text-[10px] font-semibold text-[var(--theme-text-muted)] mt-0.5">Penjadwalan, Plotting, dan Penilaian per fakultas</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--theme-primary)' }} /><span className="text-[10px] font-bold text-[var(--theme-text-muted)]">Penjadwalan</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--theme-info)' }} /><span className="text-[10px] font-bold text-[var(--theme-text-muted)]">Plotting</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--theme-warning)' }} /><span className="text-[10px] font-bold text-[var(--theme-text-muted)]">Penilaian</span></div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barCategoryGap="20%" barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border-muted)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--theme-text-muted)', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--theme-text-muted)' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--theme-border)', fontSize: '11px', fontWeight: 600 }} />
                <Bar dataKey="penjadwalan" fill="var(--theme-primary)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="plotting" fill="var(--theme-info)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="penilaian" fill="var(--theme-warning)" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-xs text-[var(--theme-text-muted)]">Belum ada data</div>
          )}
        </div>
      </div>

      {/* Banding Overview */}
      {bandingChartData.length > 0 && (
        <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--theme-error-light)] text-[var(--theme-error)] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>gavel</span>
              </div>
              <div className="text-left">
                <h2 className="text-sm font-black text-[var(--theme-text)] tracking-tight font-headline uppercase">Monitoring Banding & Kendala</h2>
                <p className="text-[10px] font-semibold text-[var(--theme-text-muted)] mt-0.5">Distribusi pengajuan banding per fakultas</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-right">
                <p className="text-[9px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest">Total Banding</p>
                <p className="text-lg font-black text-[var(--theme-text)] font-headline">{totalBanding}</p>
              </div>
              {pendingBanding > 0 && (
                <div className="text-right">
                  <p className="text-[9px] font-bold text-[var(--theme-warning)] uppercase tracking-widest">Menunggu</p>
                  <p className="text-lg font-black text-[var(--theme-warning)] font-headline">{pendingBanding}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--theme-warning)' }} /><span className="text-[10px] font-bold text-[var(--theme-text-muted)]">Menunggu</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--theme-success)' }} /><span className="text-[10px] font-bold text-[var(--theme-text-muted)]">Diterima</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--theme-error)' }} /><span className="text-[10px] font-bold text-[var(--theme-text-muted)]">Ditolak</span></div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={bandingChartData} barCategoryGap="20%" barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border-muted)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--theme-text-muted)', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--theme-text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--theme-border)', fontSize: '11px', fontWeight: 600 }} />
              <Bar dataKey="pending" name="Menunggu" fill="var(--theme-warning)" radius={[4, 4, 0, 0]} maxBarSize={20} />
              <Bar dataKey="approved" name="Diterima" fill="var(--theme-success)" radius={[4, 4, 0, 0]} maxBarSize={20} />
              <Bar dataKey="rejected" name="Ditolak" fill="var(--theme-error)" radius={[4, 4, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Faculty Cards List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--theme-secondary-light)] text-[var(--theme-secondary)] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>fact_check</span>
            </div>
            <div>
              <h2 className="text-sm font-black text-[var(--theme-text)] tracking-tight font-headline uppercase">Detail Per Fakultas</h2>
              <p className="text-[10px] font-semibold text-[var(--theme-text-muted)] mt-0.5">Klik untuk melihat rincian kepatuhan</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]" style={{ fontSize: '16px' }}>search</span>
              <input
                type="text" placeholder="Cari fakultas..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] text-xs font-semibold focus:ring-2 focus:ring-[var(--theme-primary-light)] focus:outline-none w-48"
              />
            </div>
            {['all', 'compliant', 'partial', 'behind'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`h-9 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
                  filterStatus === s
                    ? 'bg-[var(--theme-primary)] text-white border-[var(--theme-primary)]'
                    : 'bg-[var(--theme-surface)] text-[var(--theme-text-muted)] border-[var(--theme-border)] hover:border-[var(--theme-primary)]'
                }`}>
                {s === 'all' ? 'Semua' : STATUS_CONFIG[s]?.label}
              </button>
            ))}
          </div>
        </div>

        {filteredFaculties.length === 0 ? (
          <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-2xl p-12 text-center">
            <span className="material-symbols-outlined text-[var(--theme-text-muted)] mb-2" style={{ fontSize: '40px' }}>search_off</span>
            <p className="text-sm font-bold text-[var(--theme-text-muted)]">Tidak ada fakultas yang cocok dengan filter</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaculties.map(f => {
              const cfg = STATUS_CONFIG[f.overall_status] || STATUS_CONFIG.behind;
              const isExpanded = expandedId === f.fakultas_id;
              return (
                <div key={f.fakultas_id} className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md">
                  {/* Header Row */}
                  <button onClick={() => setExpandedId(isExpanded ? null : f.fakultas_id)}
                    className="w-full p-5 flex items-center gap-4 text-left group">
                    <ProgressRing value={f.overall_pct || 0} color={cfg.color} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-black text-[var(--theme-text)] tracking-tight font-headline truncate">{f.fakultas_nama}</h3>
                        <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg border" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.bg }}>
                          {cfg.label}
                        </span>
                        {f.is_overdue && (
                          <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg bg-[var(--theme-error-light)] text-[var(--theme-error)] border border-[var(--theme-error-light)]">
                            Overdue
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-semibold text-[var(--theme-text-muted)]">
                        <span>{f.total_students || 0} peserta</span>
                        <span>{f.mentor_count || 0} fasilitator</span>
                        <span>{f.group_count || 0} kelompok</span>
                        {f.banding_total > 0 && <span className="text-[var(--theme-warning)]">{f.banding_total} banding</span>}
                      </div>
                    </div>
                    {/* Mini progress bars */}
                    <div className="hidden md:flex items-center gap-3 shrink-0 w-[300px]">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex justify-between"><span className="text-[9px] font-bold text-[var(--theme-text-muted)] uppercase">Jadwal</span><span className="text-[9px] font-black text-[var(--theme-text)]">{f.scheduling_pct}%</span></div>
                        <MiniBar value={f.scheduling_pct} color="var(--theme-primary)" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="flex justify-between"><span className="text-[9px] font-bold text-[var(--theme-text-muted)] uppercase">Plot</span><span className="text-[9px] font-black text-[var(--theme-text)]">{f.plotting_pct}%</span></div>
                        <MiniBar value={f.plotting_pct} color="var(--theme-info)" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="flex justify-between"><span className="text-[9px] font-bold text-[var(--theme-text-muted)] uppercase">Nilai</span><span className="text-[9px] font-black text-[var(--theme-text)]">{f.grading_pct}%</span></div>
                        <MiniBar value={f.grading_pct} color="var(--theme-warning)" />
                      </div>
                    </div>
                    <span className={`material-symbols-outlined text-[var(--theme-text-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} style={{ fontSize: '20px' }}>expand_more</span>
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-[var(--theme-border-muted)] p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-200">
                      {/* Penjadwalan */}
                      <div className="p-4 rounded-xl border border-[var(--theme-border-muted)] bg-[var(--theme-bg)] space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[var(--theme-primary-light)] text-[var(--theme-primary)] flex items-center justify-center">
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>calendar_month</span>
                          </div>
                          <span className="text-[10px] font-black text-[var(--theme-text-muted)] uppercase tracking-widest">Penjadwalan & Materi</span>
                        </div>
                        <div className="space-y-2">
                          <DetailRow label="Tahapan" value={f.stage_count} />
                          <DetailRow label="Sesi" value={f.session_count} />
                          <DetailRow label="Materi Diunggah" value={f.material_count} />
                          <DetailRow label="Tugas Orientasi" value={f.assignment_count} />
                        </div>
                        <MiniBar value={f.scheduling_pct} color="var(--theme-primary)" />
                        <p className="text-[10px] font-bold text-[var(--theme-primary)] text-right">{f.scheduling_pct}% Terpenuhi</p>
                      </div>

                      {/* Plotting */}
                      <div className="p-4 rounded-xl border border-[var(--theme-border-muted)] bg-[var(--theme-bg)] space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[var(--theme-info-light)] text-[var(--theme-info)] flex items-center justify-center">
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>group_work</span>
                          </div>
                          <span className="text-[10px] font-black text-[var(--theme-text-muted)] uppercase tracking-widest">Plotting Kelompok</span>
                        </div>
                        <div className="space-y-2">
                          <DetailRow label="Kelompok" value={f.group_count} />
                          <DetailRow label="Dengan Fasilitator" value={f.groups_with_mentor} />
                          <DetailRow label="Peserta Terplot" value={`${f.members_plotted} / ${f.total_students}`} />
                          <DetailRow label="Fasilitator Aktif" value={f.mentor_count} />
                        </div>
                        <MiniBar value={f.plotting_pct} color="var(--theme-info)" />
                        <p className="text-[10px] font-bold text-[var(--theme-info)] text-right">{f.plotting_pct}% Terplot</p>
                      </div>

                      {/* Penilaian */}
                      <div className="p-4 rounded-xl border border-[var(--theme-border-muted)] bg-[var(--theme-bg)] space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[var(--theme-warning-light)] text-[var(--theme-warning)] flex items-center justify-center">
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>grade</span>
                          </div>
                          <span className="text-[10px] font-black text-[var(--theme-text-muted)] uppercase tracking-widest">Progres Penilaian</span>
                        </div>
                        <div className="space-y-2">
                          <DetailRow label="Dinilai" value={f.graded_count} />
                          <DetailRow label="Lulus" value={f.passed_count} color="var(--theme-success)" />
                          <DetailRow label="Remedial" value={f.remedial_count} color="var(--theme-error)" />
                          <DetailRow label="Rata-rata" value={f.avg_score ? f.avg_score.toFixed(1) : '0.0'} />
                        </div>
                        <MiniBar value={f.grading_pct} color="var(--theme-warning)" />
                        <p className="text-[10px] font-bold text-[var(--theme-warning)] text-right">{f.grading_pct}% Selesai Dinilai</p>
                      </div>

                      {/* Banding */}
                      <div className="p-4 rounded-xl border border-[var(--theme-border-muted)] bg-[var(--theme-bg)] space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[var(--theme-error-light)] text-[var(--theme-error)] flex items-center justify-center">
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>gavel</span>
                          </div>
                          <span className="text-[10px] font-black text-[var(--theme-text-muted)] uppercase tracking-widest">Banding & Kendala</span>
                        </div>
                        <div className="space-y-2">
                          <DetailRow label="Total Pengajuan" value={f.banding_total} />
                          <DetailRow label="Menunggu Respon" value={f.banding_pending} color="var(--theme-warning)" />
                          <DetailRow label="Diterima" value={f.banding_approved} color="var(--theme-success)" />
                          <DetailRow label="Ditolak" value={f.banding_rejected} color="var(--theme-error)" />
                        </div>
                        {f.banding_total > 0 && (
                          <>
                            <MiniBar value={f.banding_pending} max={f.banding_total} color="var(--theme-warning)" />
                            <p className="text-[10px] font-bold text-[var(--theme-text-muted)] text-right">{f.banding_pending} menunggu respon</p>
                          </>
                        )}
                        {f.banding_total === 0 && <p className="text-[10px] font-semibold text-[var(--theme-text-muted)] italic">Tidak ada banding</p>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, color }) => (
  <div className="flex items-center justify-between">
    <span className="text-[10px] font-semibold text-[var(--theme-text-muted)]">{label}</span>
    <span className="text-xs font-black tracking-tight" style={{ color: color || 'var(--theme-text)' }}>{value}</span>
  </div>
);

export default FacultyMonitoring;
