import './teacherCourses.css';
import Link from 'next/link';
import { getMyCourses } from '@/lib/api/courses';
import { requireApprovedTeacher } from '@/lib/guards';
import Icon from '@/components/UI/Icon/Icon';

const STATUS_LABEL: Record<string, string> = {
    draft: 'Черновик',
    published: 'Опубликован',
    archived: 'В архиве',
};

function formatPrice(price: number, currency?: string): string {
    return `${price.toLocaleString('ru-RU')} ${currency ?? 'USD'}`;
}

export default async function Page() {
    await requireApprovedTeacher();

    const courses = await getMyCourses();

    return (
        <div className="teacher-courses">
            <header className="tcl-header">
                <div>
                    <h1 className="tcl-title">Мои курсы</h1>
                    <p className="tcl-subtitle">
                        Создавайте курсы, наполняйте их уроками и публикуйте,
                        когда всё готово.
                    </p>
                </div>
                <Link
                    href="/dashboard/teacher/courses/new"
                    className="tcl-create"
                >
                    <Icon name="plus" size={16} />
                    Создать курс
                </Link>
            </header>

            {courses.length === 0 ? (
                <div className="tcl-empty">
                    <Icon name="layers" size={28} />
                    <h2>Пока нет курсов</h2>
                    <p>
                        Создайте первый курс, чтобы начать наполнять его
                        уроками.
                    </p>
                    <Link
                        href="/dashboard/teacher/courses/new"
                        className="tcl-empty__link"
                    >
                        Создать курс
                    </Link>
                </div>
            ) : (
                <div className="tcl-grid">
                    {courses.map((c) => (
                        <Link
                            key={c.id}
                            href={`/dashboard/teacher/courses/${c.id}`}
                            className="tcl-card"
                        >
                            <div className="tcl-card__tags">
                                <span className="tcl-tag">{c.subject}</span>
                                <span
                                    className={`tcl-badge tcl-badge--${c.status ?? 'draft'}`}
                                >
                                    {STATUS_LABEL[c.status ?? 'draft'] ??
                                        c.status}
                                </span>
                            </div>
                            <h3 className="tcl-card__title">{c.title}</h3>
                            {c.description && (
                                <p className="tcl-card__desc">
                                    {c.description}
                                </p>
                            )}
                            <div className="tcl-card__footer">
                                <span className="tcl-card__price">
                                    {formatPrice(c.price, c.currency)}
                                </span>
                                <span className="tcl-card__cta">
                                    Управлять
                                    <Icon name="chevronRight" size={16} />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
