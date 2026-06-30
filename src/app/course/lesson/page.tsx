import { Suspense } from 'react';
import LessonViewer from './LessonViewer';

export default function Page() {
    return (
        <Suspense fallback={<div className="lesson-page">Загрузка…</div>}>
            <LessonViewer />
        </Suspense>
    );
}
