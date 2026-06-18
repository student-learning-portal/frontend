import { ReactNode } from 'react';
import './authPages.css';
import AuthNavigation from '@/components/AuthNavigation/AuthNavigation';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="auth-container">
            <img src="/logo-navy.svg" alt="sehriyo-logo" width={126}></img>
            <AuthNavigation />
            {children}
        </div>
    );
}
