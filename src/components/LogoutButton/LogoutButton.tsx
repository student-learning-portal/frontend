import { signOut } from '@/auth';
import Avatar from '@/components/Avatar/Avatar';

export default function LogoutButton() {
    return (
        <form
            action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
            }}
        >
            <Avatar />
        </form>
    );
}
