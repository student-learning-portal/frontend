export type UserRole = 'teacher' | 'student' | 'admin';

// Approval state of a teacher account: a freshly registered teacher waits in
// the administrator's queue ('pending') and only gets the teacher features once
// it is 'approved'. Absent for students and admins, which need no review.
export type TeacherStatus = 'pending' | 'approved' | 'rejected';

export interface User {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    teacherStatus?: TeacherStatus;
    token: string;
}
