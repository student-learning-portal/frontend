import { Suspense } from 'react';
import CourseLessons from './CourseLessons';

export default function Page() {
    return (
        <Suspense fallback={<div className="lessons-page">Загрузка…</div>}>
            <CourseLessons />
        </Suspense>
    );
}
