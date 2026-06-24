import React, { useEffect, useState } from 'react';
import useAuthStore from '@/store/useAuthStore';
import { useMentorProfileQuery, useUpdateMentorProfileMutation } from '@/queries/useKencanaMentorQuery';
import { PageContent, PageHeader, PageCard } from '@/components/ui/page';

const Settings = () => {
  const user = useAuthStore((state) => state.user);
  const { data: profile, isLoading } = useMentorProfileQuery();
  const updateProfile = useUpdateMentorProfileMutation();
  const [form, setForm] = useState({ name: '', phone: '', jenis_kelamin: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (profile) {
      setForm({ 
        name: profile.name || '', 
        phone: profile.phone || '',
        jenis_kelamin: profile.jenis_kelamin || ''
      });
    }
  }, [profile]);

  const email = profile?.email || user?.email || user?.Email || '-';
  const scope = profile?.scope_type === 'university' ? 'Kencana Universitas' : `Kencana Fakultas${profile?.fakultas?.nama ? ` - ${profile.fakultas.nama}` : ''}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await updateProfile.mutateAsync(form);
      setMessage('Profil berhasil disimpan.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Gagal menyimpan profil.');
    }
  };

  return (
    <PageContent>
      <PageHeader
        icon="settings"
        title="Pengaturan Profil"
        subtitle="Perbarui identitas dan informasi kontak Anda sebagai Dewan Pembimbing Kencana."
        breadcrumbs={[
          { label: 'Kencana Mentor', path: '/app/kencana/mentor/groups' },
          { label: 'Pengaturan Profil' }
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <PageCard className="flex flex-col justify-between h-fit !p-6" noPadding>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--theme-primary-light)] text-2xl font-bold text-[var(--theme-primary)] border border-[var(--theme-primary-light)] shadow-sm">
              {(profile?.name || email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-slate-800">{profile?.name || 'Nama belum diatur'}</h2>
              <p className="truncate text-xs font-semibold text-slate-500 mt-1">{email}</p>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-sm border-t border-slate-100 pt-6">
            <Info label="Scope" value={scope} />
            <Info label="Status" value={profile?.status || 'active'} />
          </div>
        </PageCard>

        <PageCard className="!p-6" noPadding>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800">Informasi Pribadi</h3>
              <p className="text-xs text-slate-500 mt-1">Lengkapi data diri Anda agar mahasiswa mudah mengenali dan menghubungi Anda.</p>
            </div>

            {isLoading ? (
              <p className="text-sm font-bold text-slate-400">Memuat profil...</p>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Nama Pembimbing">
                    <input 
                      required 
                      value={form.name} 
                      onChange={(e) => setForm({ ...form, name: e.target.value })} 
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary-light)] focus:border-[var(--theme-primary)] transition-all" 
                      placeholder="Nama lengkap" 
                    />
                  </Field>
                  <Field label="Jenis Kelamin">
                    <select
                      required
                      value={form.jenis_kelamin}
                      onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary-light)] focus:border-[var(--theme-primary)] transition-all"
                    >
                      <option value="" disabled>Pilih Jenis Kelamin</option>
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </Field>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Nomor Telepon / WhatsApp">
                    <input 
                      value={form.phone} 
                      onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary-light)] focus:border-[var(--theme-primary)] transition-all" 
                      placeholder="Contoh: 081234567890" 
                    />
                  </Field>
                  <Field label="Email Login">
                    <input 
                      disabled 
                      value={email} 
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed" 
                    />
                  </Field>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                  <button 
                    disabled={updateProfile.isPending} 
                    className="h-9 px-5 rounded-lg bg-[var(--theme-primary)] text-white text-xs font-bold hover:bg-[var(--theme-primary-hover)] disabled:opacity-50 transition-all shadow-sm"
                  >
                    {updateProfile.isPending ? 'Menyimpan...' : 'Simpan Profil'}
                  </button>
                  {message && <p className={`text-xs font-bold ${message.includes('Gagal') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>}
                </div>
              </div>
            )}
          </form>
        </PageCard>
      </div>
    </PageContent>
  );
};

const Field = ({ label, children }) => {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      {children}
    </label>
  );
};

const Info = ({ label, value }) => {
  return (
    <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-0.5 font-bold text-slate-700 text-xs">{value}</p>
    </div>
  );
};

export default Settings;
