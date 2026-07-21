import './pending.css';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getMe } from '@/lib/api/profile';
import Icon from '@/components/UI/Icon/Icon';
import { logout } from '@/lib/actions';

// The waiting room for a teacher whose registration an administrator hasn't
// confirmed yet. The account exists and the person is signed in — the teacher
// features simply stay closed until the decision is made.
export default async function Page() {
    const session = await auth();
    if (session?.user?.role !== 'teacher') {
        redirect('/dashboard');
    }

    // Read the status from the backend rather than the session: the session
    // copy is only as fresh as the last token refresh.
    const me = await getMe();
    const status = me?.teacher_status ?? session.user.teacherStatus;
    if (status === 'approved') {
        redirect('/dashboard/teacher');
    }

    const rejected = status === 'rejected';

    return (
        <div className="pending">
            <div
                className={`pending-card${rejected ? ' pending-card--rejected' : ''}`}
            >
                <div className="pending-card__icon">
                    <Icon name={rejected ? 'x' : 'clock'} size={28} />
                </div>
                <h1 className="pending-card__title">
                    {rejected
                        ? 'Заявка отклонена'
                        : 'Заявка на рассмотрении'}
                </h1>
                <p className="pending-card__text">
                    {rejected
                        ? 'Администратор отклонил заявку на роль преподавателя. Если это ошибка, свяжитесь с администратором портала — решение можно изменить.'
                        : 'Ваш аккаунт преподавателя создан и ожидает подтверждения администратора. Как только заявку одобрят, здесь откроется портал преподавателя — страницу нужно будет просто обновить.'}
                </p>

                <dl className="pending-card__facts">
                    <div className="pending-fact">
                        <dt>Имя</dt>
                        <dd>{me?.full_name ?? session.user.fullName}</dd>
                    </div>
                    <div className="pending-fact">
                        <dt>Email</dt>
                        <dd>{me?.email ?? session.user.email}</dd>
                    </div>
                    <div className="pending-fact">
                        <dt>Статус</dt>
                        <dd>
                            <span
                                className={`pending-badge pending-badge--${rejected ? 'rejected' : 'pending'}`}
                            >
                                {rejected ? 'Отклонена' : 'На проверке'}
                            </span>
                        </dd>
                    </div>
                </dl>

                <form action={logout} className="pending-card__actions">
                    <button type="submit" className="pending-logout">
                        Выйти из аккаунта
                    </button>
                </form>
            </div>
        </div>
    );
}
