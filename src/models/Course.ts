export interface Course {
    id: string;
    teacher_id: string;
    title: string;
    description: string;
    subject: string;
    price: number;
    currency?: string;
    status?: 'draft' | 'published' | 'archived';
    created_at?: string;
    updated_at?: string;
}
