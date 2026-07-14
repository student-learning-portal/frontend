import './myCourses.css';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getMyCourses } from '@/lib/api/courses';
import CourseCard from '@/components/CourseCard/CourseCard';

function pluralizeCourses(count: number): string {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return 'курс';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
        return 'курса';
    return 'курсов';
}

export default async function Page() {
    const session = await auth();
    if (session?.user?.role === 'teacher') {
        redirect('/dashboard/teacher');
    }

    const courses = await getMyCourses();

    return (
        <div className="my-courses">
            <header className="my-courses__head">
                <h1 className="my-courses__title">Мои курсы</h1>
                <p className="my-courses__subtitle">
                    {courses.length > 0
                        ? `${courses.length} ${pluralizeCourses(courses.length)}`
                        : 'Здесь появятся купленные курсы'}
                </p>
            </header>

            {courses.length > 0 ? (
                <div className="my-courses__grid">
                    {courses.map((course) => (
                        <CourseCard key={course.id} course={course} owned />
                    ))}
                </div>
            ) : (
                <div className="my-courses__empty">
                    <p>Вы ещё не приобрели ни одного курса.</p>
                    <Link href="/catalog" className="my-courses__cta">
                        Перейти в каталог
                    </Link>
                </div>
            )}
        </div>
    );
}
