import './my-courses.css';
import Link from 'next/link';
import { auth } from '@/auth';
import { getMyCourses } from '@/lib/api/courses';
import CourseList from '@/components/CoursesList/CoursesList';

export default async function Page() {
    const session = await auth();
    const isTeacher = session?.user?.role === 'teacher';
    const courses = await getMyCourses();
    const ownedCourseIds = new Set(courses.map((c) => c.id));

    return (
        <div className="my-courses">
            <div className="my-courses__head">
                <h1 className="my-courses__title">Мои курсы</h1>
                <p className="my-courses__subtitle">
                    {isTeacher
                        ? 'Курсы, которые вы ведёте.'
                        : 'Курсы, которые вы приобрели.'}
                </p>
            </div>

            {courses.length === 0 ? (
                <div className="my-courses__empty">
                    <p className="my-courses__empty-text">
                        {isTeacher
                            ? 'Вы пока не создали ни одного курса.'
                            : 'Вы пока не купили ни одного курса.'}
                    </p>
                    {!isTeacher && (
                        <Link href="/catalog" className="my-courses__empty-link">
                            Перейти в каталог
                        </Link>
                    )}
                </div>
            ) : (
                <CourseList courses={courses} ownedCourseIds={ownedCourseIds} />
            )}
        </div>
    );
}
