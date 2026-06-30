import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getTeacherCourses } from '@/lib/api/analytics';
import TeacherAnalytics from './TeacherAnalytics';

export default async function Page() {
    const session = await auth();
    if (session?.user?.role !== 'teacher') {
        redirect('/dashboard');
    }

    const courses = await getTeacherCourses();

    return <TeacherAnalytics courses={courses} />;
}
