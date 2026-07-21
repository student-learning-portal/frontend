import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';
import { auth } from '@/auth';
import { roleHome } from '@/lib/roles';

// requireApprovedTeacher guards the teacher-only pages. The middleware already
// routes these cases (see auth.config.ts), but the pages re-check server-side so
// a direct render — or a stale client cache — can never show teacher tooling to
// an account the backend would refuse anyway.
export async function requireApprovedTeacher(): Promise<Session> {
    const session = await auth();
    if (session?.user?.role !== 'teacher') {
        redirect(roleHome(session?.user?.role));
    }
    if (session.user.teacherStatus !== 'approved') {
        redirect('/dashboard/pending');
    }
    return session;
}
