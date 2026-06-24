"use client"

import React, { useState, useEffect } from 'react'

import api from '@/lib/axios'
import { toast, Toaster } from 'react-hot-toast'
import useAuthStore from '@/store/useAuthStore'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import { PageContent, PageCard } from '@/components/ui/page'
import { DashboardHero } from '@/components/ui/dashboard'

// Auto-injected Material Symbol fallbacks for removed Lucide icons
const Camera = ({ size, className, ...props }) => <span className={`material-symbols-outlined ${className || ''} ${props.animate ? 'animate-spin' : ''}`} style={{ fontSize: size || 24, ...props.style }} {...props}>photo_camera</span>;
const Badge = ({ size, className, ...props }) => <span className={`material-symbols-outlined ${className || ''} ${props.animate ? 'animate-spin' : ''}`} style={{ fontSize: size || 24, ...props.style }} {...props}>verified</span>;
const Smartphone = ({ size, className, ...props }) => <span className={`material-symbols-outlined ${className || ''} ${props.animate ? 'animate-spin' : ''}`} style={{ fontSize: size || 24, ...props.style }} {...props}>smartphone</span>;



// Auto-injected Material Symbol fallbacks for removed Lucide icons
const ChevronRight = ({ size, className, ...props }) => <span className={`material-symbols-outlined ${className || ''} ${props.animate ? 'animate-spin' : ''}`} style={{ fontSize: size || 24, ...props.style }} {...props}>chevron_right</span>;
const User = ({ size, className, ...props }) => <span className={`material-symbols-outlined ${className || ''} ${props.animate ? 'animate-spin' : ''}`} style={{ fontSize: size || 24, ...props.style }} {...props}>person</span>;
const Lock = ({ size, className, ...props }) => <span className={`material-symbols-outlined ${className || ''} ${props.animate ? 'animate-spin' : ''}`} style={{ fontSize: size || 24, ...props.style }} {...props}>lock</span>;
const KeyRound = ({ size, className, ...props }) => <span className={`material-symbols-outlined ${className || ''} ${props.animate ? 'animate-spin' : ''}`} style={{ fontSize: size || 24, ...props.style }} {...props}>vpn_key</span>;
const Zap = ({ size, className, ...props }) => <span className={`material-symbols-outlined ${className || ''} ${props.animate ? 'animate-spin' : ''}`} style={{ fontSize: size || 24, ...props.style }} {...props}>bolt</span>;



// Auto-injected Material Symbol fallbacks for removed Lucide icons
const Activity = ({ size, className, ...props }) => <span className={`material-symbols-outlined ${className || ''} ${props.animate ? 'animate-spin' : ''}`} style={{ fontSize: size || 24, ...props.style }} {...props}>show_chart</span>;
const Bell = ({ size, className, ...props }) => <span className={`material-symbols-outlined ${className || ''} ${props.animate ? 'animate-spin' : ''}`} style={{ fontSize: size || 24, ...props.style }} {...props}>notifications</span>;



const AdminProfile = () => {
    const { user } = useAuthStore()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [profile, setProfile] = useState({ Email: '' })
    const [passwords, setPasswords] = useState({
        OldPassword: '',
        NewPassword: '',
        ConfirmPassword: ''
    })
    
    // UI State
    const [activeTab, setActiveTab] = useState('general')

    const TABS = [
        { id: 'general', label: 'Informasi Profil', icon: User },
        { id: 'security', label: 'Pengaturan Keamanan', icon: Lock },
    ]

    const getProfileEndpoint = () => {
        if (!user) return '/admin/profile';
        const r = user.role?.toLowerCase() || '';
        if (r.includes('faculty') || r.includes('fakultas')) return '/faculty/profile';
        if (r === 'kencana_mentor') return '/kencana-mentor/profile';
        if (r === 'psikolog') return '/psychologist/profile';
        if (r === 'tenaga_kesehatan') return '/tenaga-kesehatan/profile';
        if (r === 'ormawa') return '/ormawa/profile';
        return '/admin/profile';
    }

    const getPasswordEndpoint = () => {
        if (!user) return '/admin/profile';
        const r = user.role?.toLowerCase() || '';
        if (r.includes('faculty') || r.includes('fakultas')) return '/faculty/change-password';
        if (r === 'psikolog') return '/psychologist/change-password';
        if (r === 'tenaga_kesehatan') return '/tenaga-kesehatan/change-password';
        if (r === 'kencana_mentor') return '/kencana-mentor/profile'; // Mentor uses PUT /profile for password
        return '/admin/profile'; // Default admin uses PUT /profile for both
    }

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/auth/me')
                if (res.data.status === 'success') {
                    const userData = res.data.data.user || {};
                    setProfile({
                        Email: userData.email,
                        NamaLengkap: userData.nama,
                        ...userData
                    })
                }
            } catch (err) {
                console.error("Profile Fetch Error:", err);
                toast.error(err.response?.data?.message || err.message || 'Gagal memuat profil administratif')
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [])

    const handleUpdateProfile = async (e) => {
        if (e) e.preventDefault()
        setSubmitting(true)
        try {
            const endpoint = getProfileEndpoint()
            const res = await api.put(endpoint, { Email: profile.Email })
            if (res.data.status === 'success') {
                toast.success('Profil administratif berhasil diperbarui')
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal memperbarui profil')
        } finally {
            setSubmitting(false)
        }
    }

    const handleChangePassword = async (e) => {
        if (e) e.preventDefault()
        if (passwords.NewPassword !== passwords.ConfirmPassword) {
            toast.error('Konfirmasi password baru tidak sesuai')
            return
        }
        setSubmitting(true)
        try {
            const endpoint = getPasswordEndpoint()
            const res = await api.put(endpoint, {
                OldPassword: passwords.OldPassword,
                NewPassword: passwords.NewPassword
            })
            if (res.data.status === 'success') {
                toast.success('Kredensial keamanan berhasil diperbarui')
                setPasswords({ OldPassword: '', NewPassword: '', ConfirmPassword: '' })
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal memperbarui kredensial')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#fafafa]">
                <div className="flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined size-10 text-primary animate-spin" >sync</span>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Loading Personal Node...</span>
                </div>
            </div>
        )
    }

    return (
        <PageContent>
            <Toaster position="top-right" />
            
            <div className="max-w-[1200px] mx-auto space-y-8">
                
                {/* ── Breadcrumbs ─────────────────────────── */}
                <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 font-jakarta">
                    <span className="hover:text-bku-primary transition-colors cursor-pointer">Pengaturan Akun</span>
                    <ChevronRight size={10} className="text-slate-300" />
                    <span className="text-slate-900">Profil Saya</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                    
                    {/* ── Sidebar Navigation ────────────────────────────────────── */}
                    <aside className="lg:col-span-3 space-y-6">
                        <Card className="glass-card border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white/60 relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-bku-primary/5 to-transparent pointer-events-none" />
                            <div className="p-6 flex flex-col items-center text-center space-y-4 relative z-10">
                                <div className="relative group/avatar">
                                    <Avatar className="size-24 rounded-[2rem] border-4 border-white shadow-lg bg-gradient-to-br from-bku-primary to-indigo-700 flex items-center justify-center text-white text-3xl font-black font-headline">
                                        {profile.Email?.[0]?.toUpperCase() || <User size={30} />}
                                    </Avatar>
                                    <Button size="icon" className="absolute -bottom-2 -right-2 h-8 w-8 bg-white text-slate-800 rounded-lg shadow-md hover:bg-slate-100 transition-all opacity-0 group-hover/avatar:opacity-100 border-none">
                                        <Camera size={14} />
                                    </Button>
                                </div>
                                <div className="space-y-1 mt-2">
                                    <h3 className="text-[15px] font-black font-headline uppercase tracking-tight text-slate-800">
                                        {profile.NamaLengkap || profile.Email?.split('@')[0] || user?.nama || 'Pengguna'}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{profile.Email || user?.email}</p>
                                </div>
                                <Badge className="px-3 py-1 mt-2 bg-bku-primary/10 text-bku-primary border-none text-[9px] font-black uppercase tracking-widest rounded-lg shadow-none">
                                    {user?.role?.replace(/_/g, ' ') || 'Hak Akses'}
                                </Badge>
                            </div>
                        </Card>

                        <nav className="flex flex-col gap-1.5 p-1 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200/60">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all relative overflow-hidden",
                                        activeTab === tab.id 
                                            ? "bg-white text-bku-primary font-bold shadow-sm border border-slate-200/50" 
                                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium border border-transparent"
                                    )}
                                >
                                    {activeTab === tab.id && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-bku-primary rounded-r-full" />
                                    )}
                                    <tab.icon size={16} className={cn("shrink-0", activeTab === tab.id ? "text-bku-primary" : "text-slate-400")} />
                                    <span className="text-[11px] uppercase tracking-wider font-headline">{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* ── Main Content Area ─────────────────────────── */}
                    <div className="lg:col-span-9">
                        {activeTab === 'general' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                                    <form onSubmit={handleUpdateProfile} className="p-8 space-y-8">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-xl bg-bku-primary/10 flex items-center justify-center text-bku-primary shrink-0">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-black font-headline uppercase tracking-tight text-slate-800">Informasi Dasar</h3>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Data Utama Akun Pengguna</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 self-start md:self-auto shadow-sm">
                                                <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Status Aktif</span>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2 md:col-span-2 group/field">
                                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-headline group-focus-within/field:text-bku-primary transition-colors">Email Akses Sistem</Label>
                                                    <div className="relative group/input">
                                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within/input:text-bku-primary transition-colors" style={{ fontSize: '18px' }} >mail</span>
                                                        <Input 
                                                            type="email" 
                                                            value={profile.Email}
                                                            onChange={(e) => setProfile({...profile, Email: e.target.value})}
                                                            className="h-12 pl-12 rounded-xl border-slate-200 bg-slate-50/80 focus:bg-white font-semibold text-sm focus:ring-2 focus:ring-bku-primary/20 focus:border-bku-primary/50 transition-all"
                                                            required
                                                        />
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 font-medium ml-1">Email ini digunakan untuk masuk ke sistem dan menerima notifikasi penting.</p>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-headline">Tanggal Terdaftar</Label>
                                                    <div className="h-12 px-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center gap-3">
                                                        <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }} >schedule</span>
                                                        <span className="text-sm font-semibold text-slate-600 font-inter">{new Date(profile.CreatedAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-headline">Tingkat Akses</Label>
                                                    <div className="h-12 px-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center gap-3">
                                                        <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }} >admin_panel_settings</span>
                                                        <span className="text-sm font-semibold text-slate-600 font-inter capitalize">{user?.role?.replace(/_/g, ' ') || 'Pengguna'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 flex justify-end border-t border-slate-100">
                                            <Button 
                                                type="submit"
                                                disabled={submitting}
                                                className="h-12 px-8 bg-slate-800 text-white rounded-xl font-black font-headline text-[10px] uppercase tracking-widest hover:bg-slate-900 shadow-lg shadow-slate-900/20 transition-all active:scale-95 border-none"
                                            >
                                                {submitting ? <span className="material-symbols-outlined animate-spin mr-2" style={{ fontSize: '18px' }} >sync</span> : <span className="material-symbols-outlined mr-2" style={{ fontSize: '18px' }} >save</span>}
                                                Simpan Perubahan
                                            </Button>
                                        </div>
                                    </form>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <Card className="border border-rose-100 shadow-sm rounded-2xl overflow-hidden relative bg-white">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-rose-600 pointer-events-none">
                                        <span className="material-symbols-outlined" style={{ fontSize: '180px' }}>security</span>
                                    </div>
                                    <form onSubmit={handleChangePassword} className="p-8 space-y-8 relative z-10">
                                        <div className="flex items-center gap-4 border-b border-rose-50 pb-6">
                                            <div className="size-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 shrink-0">
                                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>key</span>
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black font-headline uppercase tracking-tight text-slate-800">Ubah Kata Sandi</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pembaruan Kredensial Akses Sistem</p>
                                            </div>
                                        </div>

                                        <div className="space-y-6 max-w-xl">
                                            <div className="space-y-2 group/field">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-headline group-focus-within/field:text-rose-500 transition-colors">Kata Sandi Saat Ini</Label>
                                                <div className="relative group/input">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within/input:text-rose-500 transition-colors" />
                                                    <Input 
                                                        type="password" 
                                                        value={passwords.OldPassword}
                                                        onChange={(e) => setPasswords({...passwords, OldPassword: e.target.value})}
                                                        placeholder="Masukkan kata sandi saat ini..."
                                                        className="h-12 pl-12 rounded-xl border-slate-200 bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="p-5 rounded-2xl bg-rose-50/40 border border-rose-100 space-y-5">
                                                <div className="space-y-2 group/field">
                                                    <Label className="text-[10px] font-black text-rose-600 uppercase tracking-widest ml-1 font-headline group-focus-within/field:text-rose-500 transition-colors">Kata Sandi Baru</Label>
                                                    <div className="relative group/input">
                                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-rose-300 group-focus-within/input:text-rose-500 transition-colors" />
                                                        <Input 
                                                            type="password" 
                                                            value={passwords.NewPassword}
                                                            onChange={(e) => setPasswords({...passwords, NewPassword: e.target.value})}
                                                            placeholder="Buat kata sandi baru..."
                                                            className="h-12 pl-12 rounded-xl border-rose-200 bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2 group/field">
                                                    <Label className="text-[10px] font-black text-rose-600 uppercase tracking-widest ml-1 font-headline group-focus-within/field:text-rose-500 transition-colors">Konfirmasi Kata Sandi Baru</Label>
                                                    <div className="relative group/input">
                                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-rose-300 group-focus-within/input:text-rose-500 transition-colors" />
                                                        <Input 
                                                            type="password" 
                                                            value={passwords.ConfirmPassword}
                                                            onChange={(e) => setPasswords({...passwords, ConfirmPassword: e.target.value})}
                                                            placeholder="Ulangi kata sandi baru..."
                                                            className="h-12 pl-12 rounded-xl border-rose-200 bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-rose-50 flex justify-start">
                                            <Button 
                                                type="submit"
                                                disabled={submitting}
                                                className="h-12 px-8 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl font-black font-headline text-[10px] uppercase tracking-widest hover:from-rose-600 hover:to-rose-700 shadow-lg shadow-rose-600/30 transition-all active:scale-95 border-none"
                                            >
                                                {submitting ? <span className="material-symbols-outlined animate-spin mr-2" style={{ fontSize: '18px' }} >sync</span> : <span className="material-symbols-outlined mr-2" style={{ fontSize: '18px' }} >security</span>}
                                                Perbarui Kata Sandi
                                            </Button>
                                        </div>
                                    </form>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </PageContent>
    )
}

export default AdminProfile
