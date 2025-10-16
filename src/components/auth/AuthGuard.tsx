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
        if (isAuthLoading) {
            return; // Don't do anything while loading authentication state
        }

        // If user is not authenticated and is trying to access a private page
        if (!isAuthenticated && !isPublicPage) {
            router.replace('/login');
        }

        // If user is authenticated and is on a public page (except home), redirect to dashboard
        if (isAuthenticated && isPublicPage && pathname !== '/') {
            router.replace('/dashboard');
        }

    }, [isAuthenticated, isAuthLoading, isPublicPage, pathname, router]);

    // Show a loader while authentication is in progress or while redirecting
    if (isAuthLoading || (!isAuthenticated && !isPublicPage) || (isAuthenticated && isPublicPage && pathname !== '/')) {
        return <FullPageLoader />;
    }
    
    // If everything is fine, render the children
    return <>{children}</>;
};

export default AuthGuard;
