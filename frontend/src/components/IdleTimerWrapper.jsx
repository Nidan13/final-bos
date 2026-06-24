import React, { useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { toast } from 'react-hot-toast';

const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

const IdleTimerWrapper = ({ children }) => {
    const logout = useAuthStore(state => state.logout);
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const navigate = useNavigate();
    const location = useLocation();
    
    // Use ref to avoid re-rendering and keep latest timestamp
    const lastActivityRef = useRef(Date.now());

    const handleLogout = useCallback(() => {
        logout();
        localStorage.removeItem('last_activity');
        toast.error("Sesi telah berakhir karena tidak ada aktivitas selama 10 menit. Silakan login kembali.", {
            duration: 5000,
            icon: '🕒'
        });
        navigate('/login', { replace: true });
    }, [logout, navigate]);

    const updateLastActivity = useCallback(() => {
        lastActivityRef.current = Date.now();
        localStorage.setItem('last_activity', Date.now().toString());
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;

        // Skip idle timeout on public/auth pages
        if (location.pathname === '/login' || location.pathname === '/' || location.pathname.startsWith('/aktivasi')) {
            return;
        }

        // On mount/refresh, check if tab was closed and 10 mins passed
        const storedLastActivity = localStorage.getItem('last_activity');
        if (storedLastActivity) {
            const timeSinceLastActivity = Date.now() - parseInt(storedLastActivity, 10);
            if (timeSinceLastActivity > IDLE_TIMEOUT_MS) {
                handleLogout();
                return;
            } else {
                lastActivityRef.current = parseInt(storedLastActivity, 10);
            }
        } else {
            // First time auth, set initial activity
            updateLastActivity();
        }

        // Periodic check every 30 seconds
        const intervalId = setInterval(() => {
            const timeSinceLastActivity = Date.now() - lastActivityRef.current;
            if (timeSinceLastActivity > IDLE_TIMEOUT_MS) {
                handleLogout();
            }
        }, 30000);

        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        
        // Use passive event listeners for performance
        events.forEach(event => {
            window.addEventListener(event, updateLastActivity, { passive: true });
        });

        return () => {
            clearInterval(intervalId);
            events.forEach(event => {
                window.removeEventListener(event, updateLastActivity, { passive: true });
            });
        };
    }, [isAuthenticated, location.pathname, handleLogout, updateLastActivity]);

    return <>{children}</>;
};

export default IdleTimerWrapper;
