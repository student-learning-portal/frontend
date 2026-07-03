import '../teacherForms.css';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getMyCourses } from '@/lib/api/courses';
import { getCourseLessons } from '@/lib/api/player';
import Icon from '@/components/UI/Icon/Icon';
import CourseEditor from './CourseEditor';

export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const session = await auth();
    if (session?.user?.role !== 'teacher') {
        redirect('/dashboard');
    }

    const [courses, lessonsRes] = await Promise.all([
        getMyCourses(),
        getCourseLessons(id),
    ]);
    const course = courses.find((c) => c.id === id);

    if (!course) {
        return (
            <div className="tf-page">
                <Link href="/dashboard/teacher/courses" className="tf-back">
                    <Icon name="arrowLeft" size={16} />К курсам
                </Link>
                <div className="tf-empty">
                    Курс не найден — возможно, он принадлежит другому
                    преподавателю или был удалён.
                </div>
            </div>
        );
    }

    const lessons = lessonsRes.ok ? lessonsRes.data : [];

    return <CourseEditor course={course} initialLessons={lessons} />;
}
