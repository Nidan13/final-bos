import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useKencanaAttendanceQuery, useKencanaDashboardQuery, useStudentSubmitAttendanceMutation } from '@/queries/useKencanaQuery';
import { ErrorPanel, KencanaShell, LoadingPanel, ProgressBar, StatusBadge, fmtTime, fmtLongDate, isToday } from './components';
import { PrimaryStatsCard } from '@/components/ui/StatsCard';
import AbsenceModal from './AbsenceModal';

const statusConfig = {
  present: { label: 'Hadir', icon: 'check_circle', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' },
  permission: { label: 'Izin', icon: 'mail', cls: 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm' },
  permission_requested: { label: 'Menunggu Persetujuan', icon: 'hourglass_empty', cls: 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm' },
  absent: { label: 'Tidak Hadir', icon: 'cancel', cls: 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm' },
};

const ScannerModal = ({ isOpen, onClose, onScan }) => {
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    let scanner;
    import('html5-qrcode').then(mod => {
      const Html5Qrcode = mod.Html5Qrcode;
      scanner = new Html5Qrcode('qr-reader');
      setScanning(true);
      scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 280 } },
        (decodedText) => {
          try {
            if (scanner.getState && scanner.getState() === 2) {
              scanner.stop().catch(() => {});
            }
          } catch (e) { /* ignore */ }
          setScanning(false);
          onScan(decodedText);
        },
        () => {},
      ).catch(() => setScanning(false));
    });
    return () => {
      if (scanner) {
        try {
          if (scanner.getState && scanner.getState() === 2) { // 2 = SCANNING
            scanner.stop().catch(() => {});
          } else {
            scanner.clear();
          }
        } catch (e) { /* ignore */ }
      }
    };
  }, [isOpen, onScan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--theme-surface)] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="p-5 bg-[var(--theme-primary)] flex items-center justify-between shadow-sm">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined">qr_code_scanner</span>
            Scan QR Presensi
          </h2>
          <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 bg-[var(--theme-bg)] flex flex-col items-center">
          <div className="w-full max-w-[280px] aspect-square bg-[var(--theme-surface)] rounded-2xl overflow-hidden shadow-inner border-4 border-[var(--theme-border-muted)] mb-6 relative">
             <div id="qr-reader" className="w-full h-full" />
          </div>
          {scanning ? (
            <p className="text-sm text-center text-[var(--theme-text)] font-semibold px-4">
              Arahkan kamera ke QR Code milik Pembimbing Anda untuk mencatat kehadiran.
            </p>
          ) : (
            <p className="text-sm text-center text-[var(--theme-text-muted)] font-semibold px-4 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined animate-spin text-lg">hourglass_empty</span>
              Mempersiapkan Kamera...
            </p>
          )}
        </div>
        <div className="p-5 bg-[var(--theme-surface)] border-t border-[var(--theme-border-muted)] flex justify-center">
          <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-sm text-[var(--theme-text)] bg-[var(--theme-bg)] hover:bg-[var(--theme-border-muted)] transition-colors">
            Batal Scan
          </button>
        </div>
      </div>
    </div>
  );
};

export default function KencanaAttendancePage() {
  const [absenceModalSession, setAbsenceModalSession] = useState(null);
  const { data, isLoading, isError } = useKencanaAttendanceQuery();
  const { data: dashboardData } = useKencanaDashboardQuery();
  const submitAttendance = useStudentSubmitAttendanceMutation();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState(null);

  const handleScan = useCallback(async (qrCode) => {
    setIsScannerOpen(false);
    setScanMessage({ type: 'info', text: 'Memproses presensi...' });
    try {
      await submitAttendance.mutateAsync(qrCode);
      setScanMessage({ type: 'success', text: 'Presensi berhasil dicatat! Terima kasih telah hadir.' });
    } catch (err) {
      setScanMessage({ type: 'error', text: err?.response?.data?.message || err?.message || 'Gagal memproses presensi' });
    }
    setTimeout(() => setScanMessage(null), 5000);
  }, [submitAttendance]);

  if (isLoading) return <KencanaShell title="Log Presensi" highlightedTitle="Kencana" breadcrumbs={[{ label: 'Kehadiran' }]}><LoadingPanel /></KencanaShell>;
  if (isError) return <KencanaShell title="Log Presensi" highlightedTitle="Kencana" breadcrumbs={[{ label: 'Kehadiran' }]}><ErrorPanel message="Gagal memuat kehadiran." /></KencanaShell>;

  const summary = data?.summary || {};
  const details = data?.details || [];
  
  const todaySessions = details.filter(item => isToday(item.start_date));
  const needsAttendanceToday = todaySessions.some(item => item.status === 'absent');

  const canSubmitAbsence = (item) => {
    return item.status !== 'present' && item.status !== 'permission' && item.status !== 'permission_requested';
  };

  return (
    <KencanaShell 
      title="Log Presensi" 
      highlightedTitle="Kencana"
      subtitle="Catat kehadiran Anda pada setiap sesi Kencana. Kehadiran penuh adalah syarat utama kelulusan."
      breadcrumbs={[{ label: 'Kehadiran' }]}
      badges={[
        { label: dashboardData?.period?.name || 'Kencana', active: false },
        { label: `Status: ${dashboardData?.graduation_status?.replaceAll('_', ' ') || 'Belum Mulai'}`, active: true }
      ]}
    >
      <div className={`relative overflow-hidden rounded-3xl mb-8 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg border ${needsAttendanceToday ? 'bg-[var(--theme-primary)] border-[var(--theme-primary)]/50' : 'glass-card border-[var(--theme-border-muted)]'}`}>
        {needsAttendanceToday && (
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        )}

        <div className="flex items-center gap-6 relative z-10">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${needsAttendanceToday ? 'bg-white/20 text-white' : 'bg-[var(--theme-bg)] text-[var(--theme-text-muted)]'}`}>
            <span className="material-symbols-outlined text-[32px]">{needsAttendanceToday ? 'qr_code_scanner' : 'event_available'}</span>
          </div>
          <div>
            <h2 className={`text-2xl font-black font-headline tracking-tight mb-1 ${needsAttendanceToday ? 'text-white' : 'text-[var(--theme-text)]'}`}>
              {needsAttendanceToday ? 'Sesi Hari Ini Berlangsung!' : 'Tidak Ada Sesi Hari Ini'}
            </h2>
            <p className={`text-sm font-medium ${needsAttendanceToday ? 'text-white/80' : 'text-[var(--theme-text-muted)]'}`}>
              {needsAttendanceToday 
                ? 'Segera scan QR Code dari pembimbing Anda untuk mencatat kehadiran.' 
                : 'Anda sudah mencatat kehadiran untuk hari ini atau jadwal sedang kosong.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsScannerOpen(true)}
          disabled={submitAttendance.isPending}
          className={`relative z-10 shrink-0 h-14 px-8 rounded-2xl font-bold text-sm tracking-wide transition-all flex items-center gap-3 shadow-xl ${
            needsAttendanceToday 
              ? 'bg-[var(--theme-surface)] text-[var(--theme-primary)] hover:scale-105 active:scale-95' 
              : 'bg-[var(--theme-primary)] text-white hover:opacity-90'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {submitAttendance.isPending ? 'hourglass_empty' : 'qr_code_2'}
          </span>
          {submitAttendance.isPending ? 'Memproses...' : 'Scan Presensi'}
        </button>
      </div>

      {scanMessage && (
        <div className={`mb-8 p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300 ${
          scanMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 
          scanMessage.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-600' : 
          'bg-blue-50 border-blue-200 text-blue-600'
        }`}>
          <span className="material-symbols-outlined">
            {scanMessage.type === 'success' ? 'check_circle' : scanMessage.type === 'error' ? 'error' : 'info'}
          </span>
          <p className="text-sm font-bold">{scanMessage.text}</p>
        </div>
      )}

      <section className="grid gap-5 md:grid-cols-3 mb-8">
        <PrimaryStatsCard
          title="Total Sesi Wajib"
          value={summary.required_sessions || 0}
          badgeText="Jadwal"
          icon={({ size }) => <span className="material-symbols-outlined" style={{ fontSize: size }}>event_note</span>}
          colorTheme="primary"
        />
        <PrimaryStatsCard
          title="Sesi Dihadiri"
          value={summary.attended_sessions || 0}
          badgeText="Tercatat"
          icon={({ size }) => <span className="material-symbols-outlined" style={{ fontSize: size }}>how_to_reg</span>}
          colorTheme="success"
        />
        <PrimaryStatsCard
          title="Tingkat Kehadiran"
          value={`${summary.percentage || 0}%`}
          badgeText="Progres"
          icon={({ size }) => <span className="material-symbols-outlined" style={{ fontSize: size }}>donut_large</span>}
          colorTheme={summary.percentage >= 100 ? "success" : "warning"}
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-3 items-start mb-8">
        <section className="lg:col-span-1 glass-card rounded-3xl p-6 md:p-8 border border-[var(--theme-border-muted)] shadow-sm sticky top-24">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="w-12 h-12 bg-[var(--theme-primary)]/10 rounded-2xl flex justify-center items-center text-[var(--theme-primary)]">
              <span className="material-symbols-outlined text-[24px]">trending_up</span>
            </div>
            <StatusBadge status={summary.percentage >= 100 ? 'completed' : 'not_eligible'} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest block mb-1">Status Kehadiran</span>
            <h3 className="text-xl font-black text-[var(--theme-text)] leading-tight mb-6">Pencapaian Syarat</h3>
            <ProgressBar value={summary.percentage || 0} height="h-3" className="mb-4" />
            <p className="text-sm font-medium text-[var(--theme-text-subtle)] leading-relaxed">
              {summary.percentage >= 100 
                ? 'Luar biasa! Seluruh persyaratan kehadiran sesi wajib Anda telah terpenuhi 100%.' 
                : 'Anda masih harus menghadiri sisa sesi wajib untuk memenuhi syarat minimal kelulusan Kencana.'}
            </p>
          </div>
        </section>

        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-black text-[var(--theme-text)] font-headline tracking-tight">Riwayat Sesi Kencana</h3>
            <span className="text-xs font-bold text-[var(--theme-text-muted)] bg-[var(--theme-bg)] px-3 py-1.5 rounded-full border border-[var(--theme-border-muted)]">
              {details.length} Sesi Terjadwal
            </span>
          </div>

          {details.length === 0 ? (
            <div className="glass-card border border-dashed border-[var(--theme-border-muted)] rounded-3xl p-10 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-[var(--theme-surface)] rounded-full shadow-sm flex items-center justify-center text-[var(--theme-text-subtle)] mb-4">
                 <span className="material-symbols-outlined text-3xl">calendar_month</span>
              </div>
              <h4 className="text-base font-bold text-[var(--theme-text)] mb-1">Belum Ada Sesi</h4>
              <p className="text-sm text-[var(--theme-text-muted)]">Sesi wajib belum dikonfigurasi atau belum dimulai oleh Admin.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {details.map((item, index) => {
                const cfg = statusConfig[item.status] || statusConfig.absent;
                const isItemToday = isToday(item.start_date);
                
                return (
                  <div key={item.session_id || index} className={`glass-card rounded-2xl border p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 group ${isItemToday ? 'border-[var(--theme-primary)]/50 ring-2 ring-[var(--theme-primary)]/10' : 'border-[var(--theme-border-muted)]'}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                      
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center shadow-inner ${cfg.cls}`}>
                          <span className="material-symbols-outlined text-[22px]">{cfg.icon}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-base font-bold text-[var(--theme-text)] font-headline tracking-tight">{item.title}</h4>
                            {isItemToday && (
                              <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-blue-200 ml-2">Hari Ini</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[var(--theme-text-muted)]">
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">calendar_today</span> {fmtLongDate(item.start_date)}</span>
                            {item.status === 'present' && item.checked_at && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-[var(--theme-border)]"></span>
                                <span className="flex items-center gap-1.5 text-[var(--theme-success)]"><span className="material-symbols-outlined text-[14px]">schedule</span> {fmtTime(item.checked_at)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0 border-[var(--theme-border-muted)]">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wide border ${cfg.cls}`}>
                          <span className="material-symbols-outlined text-[14px]">{cfg.icon}</span>
                          {cfg.label}
                        </span>
                        
                        {canSubmitAbsence(item) && (
                          <button
                            onClick={() => setAbsenceModalSession(item)}
                            className="h-9 px-4 bg-white border border-[var(--theme-border-muted)] text-[var(--theme-text)] shadow-sm rounded-xl text-xs font-bold hover:bg-slate-50 hover:border-[var(--theme-border)] transition-all flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit_document</span>
                            Ajukan Izin
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
      />

      {absenceModalSession && (
        <AbsenceModal
          isOpen={!!absenceModalSession}
          onClose={() => setAbsenceModalSession(null)}
          session={absenceModalSession}
        />
      )}
    </KencanaShell>
  );
}
