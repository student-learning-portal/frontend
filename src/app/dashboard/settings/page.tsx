import { getMe } from '@/lib/api/profile';
import SettingsClient from './SettingsClient';

export default async function Page() {
    const me = await getMe();
    return (
        <SettingsClient
            initialName={me?.full_name ?? ''}
            initialEmail={me?.email ?? ''}
            initialAvatar={me?.avatar_url ?? null}
            role={me?.role}
        />
    );
}
