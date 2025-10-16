'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const FullPageLoader = () => (
    <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
);

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isAuthLoading } = useApp();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isAuthLoading) {
            return; // Don't do anything while loading authentication state
        }
        
        // This is a special admin page, allow access regardless of auth state.
        if (pathname === '/crudos') {
            return;
        }

        const publicPages = ['/', '/login', '/register'];
        const isPublicPage = publicPages.includes(pathname);

        // If user is authenticated, and trying to access a public page that is not the homepage, redirect to dashboard.
        if (isAuthenticated && isPublicPage && pathname !== '/') {
            router.replace('/dashboard');
            return;
        }
        
        // If user is not authenticated and tries to access a private page, redirect to login.
        if (!isAuthenticated && !isPublicPage) {
            router.replace('/login');
            return;
        }

    }, [isAuthenticated, isAuthLoading, pathname, router]);

    // Show a loader during auth check or redirection
    if (isAuthLoading) {
        return <FullPageLoader />;
    }
    
    // For the special case of /crudos, we always render it immediately
    if (pathname === '/crudos') {
        return <>{children}</>;
    }

    const publicPages = ['/', '/login', '/register'];
    const isPublicPage = publicPages.includes(pathname);

    // Prevent flicker: if we're about to redirect, show loader instead of content
    if (isAuthenticated && isPublicPage && pathname !== '/') {
        return <FullPageLoader />;
    }
    if (!isAuthenticated && !isPublicPage) {
        return <FullPageLoader />;
    }
    
    // If everything is fine, render the children
    return <>{children}</>;
};

export default AuthGuard;
