'use client';

import './CoursesList.css';
import CourseCard from '@/components/CourseCard/CourseCard';
import { Course } from '@/models/Course';

type Props = {
    courses: Course[];
    loading?: boolean;
};

export default function CourseList({ courses, loading }: Props) {
    if (loading) {
        return <div className="course-list__state">Загрузка курсов…</div>;
    }

    if (!courses.length) {
        return (
            <div className="course-list__state">
                По вашему запросу курсы не найдены
            </div>
        );
    }

    return (
        <div className="course-list">
            {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
            ))}
        </div>
    );
}
