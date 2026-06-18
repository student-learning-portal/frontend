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

export async function registerUser(
    email: string | undefined,
    password: string | undefined,
) {
    if (!email || !password) {
        return null;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
        user: {
            id: crypto.randomUUID(),
            email,
            name: email.split('@')[0],
        },
    };
}
