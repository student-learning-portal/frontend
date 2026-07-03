import '../../../teacherForms.css';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getMyCourses } from '@/lib/api/courses';
import { getLesson } from '@/lib/api/player';
import Icon from '@/components/UI/Icon/Icon';
import LessonContentEditor from './LessonContentEditor';

export default async function Page({
    params,
}: {
    params: Promise<{ id: string; lessonId: string }>;
}) {
    const { id, lessonId } = await params;

    const session = await auth();
    if (session?.user?.role !== 'teacher') {
        redirect('/dashboard');
    }

    const courses = await getMyCourses();
    const course = courses.find((c) => c.id === id);

    if (!course) {
        return (
            <div className="tf-page">
                <Link
                    href="/dashboard/teacher/courses"
                    className="tf-back"
                >
                    <Icon name="arrowLeft" size={16} />К курсам
                </Link>
                <div className="tf-empty">
                    Курс не найден — возможно, он принадлежит другому
                    преподавателю или был удалён.
                </div>
            </div>
        );
    }

    const lessonRes = await getLesson(id, lessonId);
    if (!lessonRes.ok) {
        return (
            <div className="tf-page">
                <Link
                    href={`/dashboard/teacher/courses/${id}`}
                    className="tf-back"
                >
                    <Icon name="arrowLeft" size={16} />К курсу
                </Link>
                <div className="tf-empty">{lessonRes.message}</div>
            </div>
        );
    }

    return (
        <LessonContentEditor
            courseId={id}
            courseTitle={course.title}
            lesson={lessonRes.data}
        />
    );
}
