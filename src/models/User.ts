export interface User {
    id: string;
    email: string;
    fullName: string;
    role: 'teacher' | 'student';
    token: string;
}
