import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getTeacherApplications } from '@/lib/api/admin';
import AdminTeacherQueue from './AdminTeacherQueue';

export default async function Page() {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        redirect('/dashboard');
    }

    // Both lists are fetched here so switching the filter in the client is
    // instant and the "решено" tab never shows a loading state.
    const [pending, all] = await Promise.all([
        getTeacherApplications('pending'),
        getTeacherApplications('all'),
    ]);

    return (
        <AdminTeacherQueue
            pending={pending.ok ? pending.data.items : []}
            all={all.ok ? all.data.items : []}
            error={pending.ok ? null : pending.message}
        />
    );
}
