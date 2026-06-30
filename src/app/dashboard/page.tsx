import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function Page() {
    const session = await auth();
    if (session?.user?.role === 'teacher') {
        redirect('/dashboard/teacher');
    }
    return <div></div>;
}
