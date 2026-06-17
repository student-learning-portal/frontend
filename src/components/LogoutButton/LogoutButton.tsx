// components/LogoutButton.tsx
import { signOut } from '@/auth';

export default function LogoutButton() {
    return (
        <form
            action={async () => {
                'use server';
                await signOut({ redirectTo: '/' });
            }}
        >
            <button className="avatar-part">
                <span className="avatar">АМ</span>
            </button>
        </form>
    );
}
