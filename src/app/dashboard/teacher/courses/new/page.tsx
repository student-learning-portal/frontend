import '../teacherForms.css';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import NewCourseForm from './NewCourseForm';

export default async function Page() {
    const session = await auth();
    if (session?.user?.role !== 'teacher') {
        redirect('/dashboard');
    }

    return <NewCourseForm />;
}
