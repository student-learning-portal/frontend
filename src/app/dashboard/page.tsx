import './homePage.css';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getMe } from '@/lib/api/profile';
import { CourseResult, getMyResults } from '@/lib/api/results';
import Icon from '@/components/UI/Icon/Icon';

function firstName(fullName: string | undefined): string {
    return (fullName ?? '').trim().split(/\s+/)[0] ?? '';
}

function ContinueCard({ course }: { course: CourseResult }) {
    const progress = Math.round(course.progress_percent);
    const atRisk = course.status === 'AT_RISK';

    return (
        <Link
            href={`/course/lessons?course=${course.course_id}`}
            className="home-continue-card"
        >
            <div className="home-continue-card__head">
                <span className="home-continue-card__title">
                    {course.title || 'Курс удалён'}
                </span>
                {atRisk && (
                    <span className="home-continue-card__flag">
                        <Icon name="alert" size={13} />
                        Давно не заходили
                    </span>
                )}
            </div>
            <div className="home-progress">
                <div
                    className="home-progress__bar"
                    style={{
                        width: `${Math.min(100, Math.max(0, progress))}%`,
                    }}
                />
            </div>
            <div className="home-continue-card__footer">
                <span>
                    {course.lessons_completed} из {course.lessons_total} уроков
                </span>
                <span className="home-continue-card__cta">
                    Продолжить <Icon name="arrowRight" size={14} />
                </span>
            </div>
        </Link>
    );
}

export default async function Page() {
    const session = await auth();
    if (session?.user?.role === 'teacher') {
        redirect('/dashboard/teacher');
    }

    const [me, results] = await Promise.all([getMe(), getMyResults()]);
    const name = firstName(me?.full_name);

    const courses = results.ok ? results.data.courses : [];
    const inProgress = courses.filter(
        (c) => !(c.lessons_total > 0 && c.lessons_completed >= c.lessons_total),
    );

    return (
        <div className="home">
            <div className="home__head">
                <h1 className="home__title">
                    {name ? `Привет, ${name}!` : 'Привет!'}
                </h1>
                <p className="home__subtitle">
                    Вот как продвигается ваше обучение.
                </p>
            </div>

            {courses.length === 0 ? (
                <div className="home-empty">
                    <Icon name="graduation" size={28} />
                    <h2>Начните обучение</h2>
                    <p>
                        Вы ещё не купили ни одного курса — загляните в каталог,
                        чтобы выбрать первый.
                    </p>
                    <Link href="/catalog" className="home-empty__link">
                        Перейти в каталог
                    </Link>
                </div>
            ) : (
                <>
                    <section className="home-cards">
                        <div className="home-card">
                            <span className="home-card__label">
                                Общий прогресс
                            </span>
                            <span className="home-card__value">
                                {results.ok
                                    ? Math.round(
                                          results.data.overall_progress_percent,
                                      )
                                    : 0}
                                %
                            </span>
                        </div>
                        <div className="home-card">
                            <span className="home-card__label">
                                Курсов куплено
                            </span>
                            <span className="home-card__value">
                                {courses.length}
                            </span>
                        </div>
                        <div className="home-card home-card--ok">
                            <span className="home-card__label">Завершено</span>
                            <span className="home-card__value">
                                {results.ok
                                    ? results.data.courses_completed
                                    : 0}
                            </span>
                        </div>
                    </section>

                    <section className="home-section">
                        <div className="home-section__head">
                            <h2 className="home-section__title">
                                Продолжить обучение
                            </h2>
                            <Link
                                href="/dashboard/results"
                                className="home-section__link"
                            >
                                Все результаты
                            </Link>
                        </div>

                        {inProgress.length === 0 ? (
                            <p className="home-section__empty">
                                Все купленные курсы завершены — загляните в
                                каталог за новыми.
                            </p>
                        ) : (
                            <div className="home-continue-list">
                                {inProgress.slice(0, 3).map((c) => (
                                    <ContinueCard
                                        key={c.course_id}
                                        course={c}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
