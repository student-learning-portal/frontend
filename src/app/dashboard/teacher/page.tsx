import { getTeacherCourses } from '@/lib/api/analytics';
import { requireApprovedTeacher } from '@/lib/guards';
import TeacherAnalytics from './TeacherAnalytics';

export default async function Page() {
    await requireApprovedTeacher();

    const courses = await getTeacherCourses();

    return <TeacherAnalytics courses={courses} />;
}
