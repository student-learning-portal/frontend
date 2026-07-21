import '../teacherForms.css';
import { requireApprovedTeacher } from '@/lib/guards';
import NewCourseForm from './NewCourseForm';

export default async function Page() {
    await requireApprovedTeacher();

    return <NewCourseForm />;
}
