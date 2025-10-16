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

    const publicPages = ['/', '/login', '/register', '/crudos'];
    const isPublicPage = publicPages.includes(pathname);

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated && !isPublicPage) {
            router.replace('/login');
        }
    }, [isAuthenticated, isAuthLoading, isPublicPage, pathname, router]);

    if (isAuthLoading) {
        return <FullPageLoader />;
    }

    if (!isAuthenticated && isPublicPage) {
        return <>{children}</>;
    }

    if (isAuthenticated && isPublicPage) {
        // Redirect authenticated users from public pages to dashboard
        // except for the home page, which has its own logic
        if (pathname !== '/') {
            router.replace('/dashboard');
            return <FullPageLoader />;
        }
    }
    
    if (!isAuthenticated && !isPublicPage) {
        return <FullPageLoader />;
    }
    
    return <>{children}</>;
};

export default AuthGuard;
