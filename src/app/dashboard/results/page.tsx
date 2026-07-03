import './results.css';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardCourse, getStudentDashboard } from '@/lib/api/analytics';
import Icon from '@/components/UI/Icon/Icon';

function pluralizeCourses(count: number): string {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return 'курс';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
        return 'курса';
    return 'курсов';
}

function CourseRow({ course }: { course: DashboardCourse }) {
    const atRisk = course.status === 'AT_RISK';
    const progress = Math.round(course.progress_percentage);
    const done = course.lessons_total > 0 && course.lessons_completed >= course.lessons_total;

    return (
        <Link href={`/course?id=${course.course_id}`} className="results-row">
            <div className="results-row__main">
                <span className="results-row__title">
                    {course.course_title || 'Курс удалён'}
                </span>
                <span className="results-row__meta">
                    {course.lessons_completed} из {course.lessons_total} уроков
                </span>
            </div>

            <div className="results-row__progress">
                <div className="results-progress">
                    <div
                        className={
                            'results-progress__bar' +
                            (atRisk ? ' results-progress__bar--risk' : '')
                        }
                        style={{
                            width: `${Math.min(100, Math.max(0, progress))}%`,
                        }}
                    />
                </div>
                <span className="results-progress__value">{progress}%</span>
            </div>

            <span
                className={
                    'results-badge ' +
                    (done
                        ? 'results-badge--done'
                        : atRisk
                          ? 'results-badge--risk'
                          : 'results-badge--ok')
                }
            >
                <Icon
                    size={14}
                    name={done ? 'award' : atRisk ? 'alert' : 'checkCircle'}
                />
                {done ? 'Завершён' : atRisk ? 'В зоне риска' : 'На треке'}
            </span>
        </Link>
    );
}

export default async function Page() {
    const session = await auth();
    if (session?.user?.role === 'teacher') {
        redirect('/dashboard/teacher');
    }

    const result = await getStudentDashboard();

    if (!result.ok) {
        return (
            <div className="results">
                <div className="results__head">
                    <h1 className="results__title">Результаты</h1>
                </div>
                <div className="results-state results-state--error">
                    {result.message}
                </div>
            </div>
        );
    }

    const { overall_progress, courses_completed, courses } = result.data;
    const atRiskCount = courses.filter((c) => c.status === 'AT_RISK').length;

    return (
        <div className="results">
            <div className="results__head">
                <h1 className="results__title">Результаты</h1>
                <p className="results__subtitle">
                    Прогресс по всем купленным курсам в одном месте.
                </p>
            </div>

            {courses.length === 0 ? (
                <div className="results-empty">
                    <Icon name="chart" size={28} />
                    <h2>Пока нет результатов</h2>
                    <p>
                        Купите курс и начните проходить уроки — прогресс
                        появится здесь.
                    </p>
                    <Link href="/catalog" className="results-empty__link">
                        Перейти в каталог
                    </Link>
                </div>
            ) : (
                <>
                    <section className="results-cards">
                        <div className="results-card">
                            <span className="results-card__label">
                                Общий прогресс
                            </span>
                            <span className="results-card__value">
                                {Math.round(overall_progress)}%
                            </span>
                            <span className="results-card__hint">
                                в среднем по {courses.length}{' '}
                                {pluralizeCourses(courses.length)}
                            </span>
                        </div>
                        <div className="results-card results-card--ok">
                            <span className="results-card__label">
                                Завершено
                            </span>
                            <span className="results-card__value">
                                {courses_completed}
                            </span>
                            <span className="results-card__hint">
                                из {courses.length}{' '}
                                {pluralizeCourses(courses.length)}
                            </span>
                        </div>
                        <div className="results-card results-card--risk">
                            <span className="results-card__label">
                                В зоне риска
                            </span>
                            <span className="results-card__value">
                                {atRiskCount}
                            </span>
                            <span className="results-card__hint">
                                низкий прогресс или нет активности
                            </span>
                        </div>
                    </section>

                    <section className="results-list">
                        {courses.map((c) => (
                            <CourseRow key={c.course_id} course={c} />
                        ))}
                    </section>
                </>
            )}
        </div>
    );
}
