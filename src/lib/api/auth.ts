export async function authorizeUser(
    email: string | undefined,
    password: string | undefined,
) {
    if (!email || !password) {
        return null;
    }

    const response = await fetch(
        `${process.env.BACKEND_URL}/api/v1/auth/login`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        },
    );

    if (!response.ok) {
        return null;
    }
    return await response.json();
}

export async function registerUser(
    email: string | undefined,
    password: string | undefined,
    role: 'teacher' | 'student',
    fullName: string,
) {
    if (!email || !password) {
        return null;
    }

    const response = await fetch(
        `${process.env.BACKEND_URL}/api/v1/auth/register`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                role,
                full_name: fullName,
            }),
        },
    );

    if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        console.error('Registration failed:', response.status, errorBody);
        return null;
    }
    return await response.json();
}
