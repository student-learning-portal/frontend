import { TeacherStatus, UserRole } from '@/models/User';

// Kept dependency-free on purpose: this module is imported both by the edge
// middleware config (auth.config.ts) and by server components, so it must not
// pull in `next/navigation` or the NextAuth instance — importing auth.ts from
// here would also close an import cycle.

// Where each role starts once signed in. The administrator only ever needs the
// moderation queue, so that is its home.
export function roleHome(role: UserRole | undefined): string {
    if (role === 'admin') return '/dashboard/admin';
    if (role === 'teacher') return '/dashboard/teacher';
    return '/dashboard';
}

// A teacher counts as awaiting approval until an administrator has confirmed
// the account — including after a rejection, which also leaves the teacher
// features closed.
export function isAwaitingApproval(
    role: UserRole | undefined,
    status: TeacherStatus | undefined,
): boolean {
    return role === 'teacher' && status !== 'approved';
}
