import { mockUser } from '@/lib/mocks/user';

export async function authorizeUser(
    email: string | undefined,
    password: string | undefined,
) {
    if (!email || !password) {
        return null;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockUser;
}
