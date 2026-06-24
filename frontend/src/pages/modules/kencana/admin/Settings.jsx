import React, { useState } from 'react';
import useAuthStore from '@/store/useAuthStore';
import { PageHeader } from '@/components/ui/page/PageHeader';
import { usePeriodsQuery } from '@/queries/useKencanaAdminQuery';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

const Settings = ({ portalType = 'admin' }) => {
  const { user } = useAuthStore();
  const { data: periods } = usePeriodsQuery();

  const isFakultasPortal = portalType === 'faculty' || portalType === 'fakultas';
  const activePeriod = (periods || []).find(p => p.is_active) || periods?.[0] || null;

  const [passwords, setPasswords] = useState({ OldPassword: '', NewPassword: '', ConfirmPassword: '' });
  const [showPwd, setShowPwd] = useState({ old: false, new: false, confirm: false });
  const [submitting, setSubmitting] = useState(false);

  const handleChangePassword = async (e) => {
      e.preventDefault();
      if (passwords.NewPassword !== passwords.ConfirmPassword) {
          toast.error('Konfirmasi password baru tidak sesuai');
          return;
      }
      setSubmitting(true);
      try {
          let res;
          if (isFakultasPortal) {
              res = await api.put('/faculty/change-password', {
                  old_password: passwords.OldPassword,
                  new_password: passwords.NewPassword,
                  confirm_password: passwords.ConfirmPassword
              });
          } else {
              res = await api.put('/admin/profile', {
                  OldPassword: passwords.OldPassword,
                  NewPassword: passwords.NewPassword
              });
          }

          if (res.data.status === 'success' || res.data.success) {
              toast.success('Password berhasil diperbarui');
              setPasswords({ OldPassword: '', NewPassword: '', ConfirmPassword: '' });
          }
      } catch (err) {
          toast.error(err.response?.data?.message || 'Gagal memperbarui password');
      } finally {
          setSubmitting(false);
      }
  };

  // Derive administrative role name
  const userRole = String(user?.role || user?.Role || '').toLowerCase();
  let roleName = 'Root Administrator';
  if (userRole === 'kencana_admin') roleName = 'Admin Universitas (Pusat)';
  if (userRole === 'kencana_fakultas' || userRole.includes('faculty') || userRole.includes('fakultas')) roleName = 'Admin Fakultas';

  // Extract faculty info if applicable
  const facultyName = user?.fakultas?.nama || user?.Fakultas?.Nama || (user?.fakultas_id ? `Fakultas ID: ${user.fakultas_id}` : '-');

  return (
    <div className="bg-transparent font-body max-w-7xl mx-auto space-y-6">
      <PageHeader
        icon="settings"
        title={
          <>
            <span className="text-[var(--theme-text)]">Pengaturan </span>
            <span className="text-[var(--theme-primary)]">Sistem Kencana</span>
          </>
        }
        subtitle="Informasi dan konfigurasi akun administratif Anda pada portal PKKMB."
        breadcrumbs={[
          { label: isFakultasPortal ? 'Kencana Fakultas' : 'Kencana Admin', path: '#' },
          { label: 'Pengaturan' }
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="rounded-2xl border border-[var(--theme-border)] bg-white p-6 shadow-sm flex flex-col justify-between h-fit">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--theme-primary-light)] text-2xl font-bold text-[var(--theme-primary)] border border-[var(--theme-primary-light)] shadow-sm">
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
                shield_person
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-[var(--theme-text)] uppercase tracking-tight">
                {isFakultasPortal ? 'Admin Fakultas' : 'Admin Pusat'}
              </h2>
              <p className="truncate text-xs font-semibold text-[var(--theme-text-muted)] mt-1">{user?.email || user?.Email || 'Email tidak tersedia'}</p>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-sm border-t border-[var(--theme-border-muted)] pt-6">
            <Info label="Level Otoritas" value={roleName} />
            {isFakultasPortal && <Info label="Lingkup Fakultas" value={facultyName} />}
            <Info label="Periode Aktif" value={activePeriod ? activePeriod.name : 'Belum Ada'} />
          </div>
        </aside>

        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--theme-border)] bg-white p-8 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-[var(--theme-primary)] pointer-events-none">
                <span className="material-symbols-outlined" style={{ fontSize: '180px' }}>admin_panel_settings</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 border-b border-[var(--theme-border-muted)] pb-6 mb-8">
                  <div className="size-10 rounded-xl bg-[var(--theme-primary-light)] flex items-center justify-center text-[var(--theme-primary)] border border-[var(--theme-primary-light)] shrink-0">
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>badge</span>
                  </div>
                  <div>
                      <h3 className="text-sm font-black font-headline uppercase tracking-tight text-[var(--theme-text)]">Detail Akses & Konfigurasi</h3>
                      <p className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest mt-1">Status dan Batasan Operasional Akun</p>
                  </div>
              </div>

              <div className="space-y-8">
                  <div className="space-y-4">
                      <label className="text-[10px] font-black text-[var(--theme-text-muted)] uppercase tracking-widest ml-1 font-headline">Manajemen Identitas & Keamanan</label>
                      
                      <form onSubmit={handleChangePassword} className="p-6 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] space-y-6">
                        <div className="flex items-center gap-3 border-b border-[var(--theme-border-muted)] pb-4">
                          <div className="size-8 rounded-lg bg-[var(--theme-primary-light)] text-[var(--theme-primary)] flex items-center justify-center">
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lock_reset</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[var(--theme-text)] uppercase tracking-tight">Ganti Password</p>
                            <p className="text-[10px] font-medium text-[var(--theme-text-muted)]">Perbarui kredensial keamanan akun Anda</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                              <Label className="text-[10px] font-black text-[var(--theme-text-muted)] uppercase tracking-widest ml-1">Password Saat Ini</Label>
                              <div className="relative group">
                                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--theme-text-muted)]" style={{ fontSize: '18px' }}>key</span>
                                  <Input 
                                      type={showPwd.old ? 'text' : 'password'}
                                      value={passwords.OldPassword}
                                      onChange={(e) => setPasswords({...passwords, OldPassword: e.target.value})}
                                      placeholder="Masukkan password saat ini..."
                                      className="h-10 pl-10 pr-10 rounded-xl border border-[var(--theme-border)] bg-white text-xs font-semibold focus:ring-2 focus:ring-[var(--theme-primary-light)]"
                                      required
                                  />
                                  <button type="button" onClick={() => setShowPwd({...showPwd, old: !showPwd.old})} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]">
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{showPwd.old ? 'visibility_off' : 'visibility'}</span>
                                  </button>
                              </div>
                          </div>

                          <div className="space-y-2">
                              <Label className="text-[10px] font-black text-[var(--theme-text-muted)] uppercase tracking-widest ml-1">Password Baru</Label>
                              <div className="relative group">
                                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--theme-text-muted)]" style={{ fontSize: '18px' }}>vpn_key</span>
                                  <Input 
                                      type={showPwd.new ? 'text' : 'password'}
                                      value={passwords.NewPassword}
                                      onChange={(e) => setPasswords({...passwords, NewPassword: e.target.value})}
                                      placeholder="Masukkan password baru..."
                                      className="h-10 pl-10 pr-10 rounded-xl border border-[var(--theme-border)] bg-white text-xs font-semibold focus:ring-2 focus:ring-[var(--theme-primary-light)]"
                                      required
                                  />
                                  <button type="button" onClick={() => setShowPwd({...showPwd, new: !showPwd.new})} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]">
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{showPwd.new ? 'visibility_off' : 'visibility'}</span>
                                  </button>
                              </div>
                          </div>

                          <div className="space-y-2">
                              <Label className="text-[10px] font-black text-[var(--theme-text-muted)] uppercase tracking-widest ml-1">Konfirmasi Password</Label>
                              <div className="relative group">
                                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--theme-text-muted)]" style={{ fontSize: '18px' }}>vpn_key</span>
                                  <Input 
                                      type={showPwd.confirm ? 'text' : 'password'}
                                      value={passwords.ConfirmPassword}
                                      onChange={(e) => setPasswords({...passwords, ConfirmPassword: e.target.value})}
                                      placeholder="Ulangi password baru..."
                                      className="h-10 pl-10 pr-10 rounded-xl border border-[var(--theme-border)] bg-white text-xs font-semibold focus:ring-2 focus:ring-[var(--theme-primary-light)]"
                                      required
                                  />
                                  <button type="button" onClick={() => setShowPwd({...showPwd, confirm: !showPwd.confirm})} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]">
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{showPwd.confirm ? 'visibility_off' : 'visibility'}</span>
                                  </button>
                              </div>
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <Button 
                                type="submit"
                                disabled={submitting}
                                className="h-10 px-6 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                            >
                                {submitting ? <span className="material-symbols-outlined animate-spin" style={{ fontSize: '16px' }}>sync</span> : <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>save</span>}
                                Simpan Password
                            </Button>
                        </div>
                      </form>
                  </div>

                  <div className="space-y-3">
                      <label className="text-[10px] font-black text-[var(--theme-text-muted)] uppercase tracking-widest ml-1 font-headline">Status Node Aktif</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50 flex items-center gap-3">
                          <div className="size-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[16px]">verified</span>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-0.5">Koneksi Database</p>
                            <p className="text-xs font-black text-emerald-800">Sinkron & Stabil</p>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl border border-blue-100 bg-blue-50 flex items-center gap-3">
                          <div className="size-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[16px]">sync</span>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-0.5">Timeline Kencana</p>
                            <p className="text-xs font-black text-blue-800">{activePeriod ? 'Sedang Berjalan' : 'Tidak Ada Periode'}</p>
                          </div>
                        </div>
                      </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Info = ({ label, value }) => {
  return (
    <div className="rounded-xl bg-[var(--theme-bg)] p-4 border border-[var(--theme-border)]">
      <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--theme-text-muted)]">{label}</p>
      <p className="mt-1 font-bold text-[var(--theme-text)] text-xs">{value}</p>
    </div>
  );
};

export default Settings;
