import { Suspense } from 'react';
import CourseDetail from './CourseDetail';

export default function Page() {
    return (
        <Suspense fallback={<div className="course-page">Загрузка…</div>}>
            <CourseDetail />
        </Suspense>
    );
}
