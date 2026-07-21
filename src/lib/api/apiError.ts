// Единый разбор ошибок бэкенда и перевод их в понятные русские сообщения.
// Бэкенд (Go) возвращает ошибки в формате { "error": "..." } с текстом на
// английском. Здесь мы переводим конкретные сообщения на русский, а если
// точного совпадения нет — даём осмысленное сообщение по HTTP-статусу.

export type ApiError = {
    status: number;
    message: string;
};

const CYRILLIC = /[А-Яа-яЁё]/;

// Точный словарь: английское сообщение бэкенда -> русский текст.
// Ключи должны совпадать со строками из writeError(...) в internal/delivery/http.
const MESSAGE_MAP: Record<string, string> = {
    // Аутентификация / авторизация
    'missing authentication': 'Требуется вход в систему.',
    'missing bearer token': 'Требуется вход в систему.',
    'invalid or expired token': 'Сессия истекла. Войдите заново.',
    'invalid email or password': 'Неверная почта или пароль.',
    'email already registered': 'Эта почта уже зарегистрирована.',
    'current password is incorrect': 'Неверный текущий пароль.',
    'user not found': 'Пользователь не найден.',

    // Права доступа
    'student role required': 'Действие доступно только ученикам.',
    'teacher role required': 'Действие доступно только преподавателям.',
    'administrator role required': 'Действие доступно только администратору.',
    'teacher account is awaiting administrator approval':
        'Аккаунт преподавателя ещё не подтверждён администратором.',
    'this account is not a teacher': 'Этот аккаунт не является преподавателем.',
    'account no longer exists': 'Аккаунт больше не существует.',
    'approval check failed': 'Не удалось проверить статус аккаунта.',
    'access denied: no active entitlement': 'Нет доступа: курс не приобретён.',
    'you do not own this course': 'Это не ваш курс.',
    'not allowed for this course': 'Действие недоступно для этого курса.',
    'teachers cannot purchase courses':
        'Преподаватели не могут покупать курсы.',
    'teachers cannot refund courses':
        'Преподаватели не могут возвращать курсы.',
    'only students may purchase courses':
        'Покупать курсы могут только ученики.',
    'only students may review courses':
        'Оставлять отзывы могут только ученики.',
    'only students may rate courses': 'Оценивать курсы могут только ученики.',
    'only students may rate teachers':
        'Оценивать преподавателей могут только ученики.',
    'only students have course ratings':
        'Оценки курсов доступны только ученикам.',
    'only students have teacher ratings':
        'Оценки преподавателей доступны только ученикам.',
    'you must be enrolled to rate this':
        'Оценить можно только после покупки курса.',

    // Покупка / оплата
    'insufficient wallet balance': 'Недостаточно монет на балансе.',
    'course already purchased': 'Курс уже куплен.',
    'no active purchase found for this course':
        'Активная покупка этого курса не найдена.',
    'payment not found': 'Платёж не найден.',
    'checkout failed': 'Не удалось провести оплату. Попробуйте позже.',
    'refund failed': 'Не удалось оформить возврат. Попробуйте позже.',
    'failed to process payment webhook': 'Ошибка обработки платежа.',

    // Не найдено
    'course not found': 'Курс не найден.',
    'lesson not found': 'Урок не найден.',
    'material not found': 'Материал не найден.',
    'teacher not found': 'Преподаватель не найден.',
    'no saved progress': 'Сохранённый прогресс не найден.',
    'you have not rated this course yet': 'Вы ещё не оценили этот курс.',
    'you have not rated this teacher yet':
        'Вы ещё не оценили этого преподавателя.',

    // Валидация запроса
    'invalid request body': 'Некорректные данные запроса.',
    'course_id is required': 'Не указан курс.',
    'full_name is required': 'Укажите имя.',
    'avatar file is required': 'Выберите файл изображения.',
    'message body is required': 'Введите текст сообщения.',
    'progress_seconds is required': 'Не передан прогресс.',
    'progress_seconds must not be negative':
        'Прогресс не может быть отрицательным.',
    'invalid progress': 'Некорректное значение прогресса.',
    'invalid lesson_id': 'Некорректный идентификатор урока.',
    'current_password and new_email are required':
        'Укажите текущий пароль и новую почту.',
    'current_password and new_password are required':
        'Укажите текущий и новый пароль.',
    'file too large or invalid multipart form':
        'Файл слишком большой или повреждён.',
    'could not read file': 'Не удалось прочитать файл.',
    'only draft courses can be deleted; archive it instead':
        'Удалить можно только черновик — опубликованный курс переведите в архив.',

    // Внутренние ошибки сервера
    'failed to login': 'Не удалось войти. Попробуйте позже.',
    'failed to register': 'Не удалось зарегистрироваться. Попробуйте позже.',
    'failed to load courses': 'Не удалось загрузить курсы.',
    'failed to load results': 'Не удалось загрузить результаты.',
    'failed to load dashboard': 'Не удалось загрузить панель.',
    'failed to load lesson': 'Не удалось загрузить урок.',
    'failed to load progress': 'Не удалось загрузить прогресс.',
    'failed to save progress': 'Не удалось сохранить прогресс.',
    'failed to load payment history': 'Не удалось загрузить историю платежей.',
    'failed to load teacher applications':
        'Не удалось загрузить заявки преподавателей.',
    'failed to update teacher status':
        'Не удалось обновить статус преподавателя.',
    'failed to load course rating': 'Не удалось загрузить оценку курса.',
    'failed to save rating': 'Не удалось сохранить оценку.',
    'failed to create review': 'Не удалось создать отзыв.',
    'failed to update name': 'Не удалось обновить имя.',
    'failed to update email': 'Не удалось обновить почту.',
    'failed to update password': 'Не удалось обновить пароль.',
    'failed to update avatar': 'Не удалось обновить фото.',
    'failed to save file': 'Не удалось сохранить файл.',
    'failed to prepare upload directory': 'Ошибка сервера при загрузке файла.',
    'access check failed': 'Не удалось проверить доступ.',
    'internal server error': 'Внутренняя ошибка сервера. Попробуйте позже.',
};

// Пытается достать текст ошибки из тела ответа (поле error / detail / message).
function extractRawMessage(raw: string): string | undefined {
    if (!raw) return undefined;
    try {
        const data = JSON.parse(raw) as Record<string, unknown>;
        const candidate = data.error ?? data.detail ?? data.message;
        if (typeof candidate === 'string') return candidate.trim() || undefined;
        if (Array.isArray(candidate)) {
            const messages = candidate
                .map((item) =>
                    item && typeof item === 'object'
                        ? (item as { msg?: unknown }).msg
                        : undefined,
                )
                .filter(
                    (m): m is string => typeof m === 'string' && m.length > 0,
                );
            if (messages.length) return messages.join('; ');
        }
    } catch {
        const text = raw.trim();
        if (text && text.length < 300 && !text.startsWith('<')) return text;
    }
    return undefined;
}

// Русское сообщение по HTTP-статусу (запасной вариант).
function messageForStatus(status: number): string {
    switch (status) {
        case 400:
            return 'Некорректный запрос. Проверьте данные и попробуйте снова.';
        case 401:
            return 'Требуется авторизация. Войдите в систему заново.';
        case 402:
            return 'Недостаточно средств на балансе.';
        case 403:
            return 'Недостаточно прав для этого действия.';
        case 404:
            return 'Запрашиваемые данные не найдены.';
        case 408:
            return 'Время ожидания истекло. Попробуйте ещё раз.';
        case 409:
            return 'Конфликт запроса. Обновите страницу и попробуйте снова.';
        case 415:
            return 'Неподдерживаемый формат файла.';
        case 422:
            return 'Некорректные параметры запроса.';
        case 429:
            return 'Слишком много запросов. Подождите немного.';
        case 500:
            return 'Внутренняя ошибка сервера. Попробуйте позже.';
        case 502:
            return 'Сервер недоступен (неверный шлюз). Попробуйте позже.';
        case 503:
            return 'Сервис временно недоступен. Попробуйте позже.';
        case 504:
            return 'Сервер не отвечает. Попробуйте позже.';
        default:
            if (status >= 500)
                return 'Ошибка на стороне сервера. Попробуйте позже.';
            if (status >= 400)
                return 'Не удалось выполнить запрос. Попробуйте ещё раз.';
            return 'Произошла неизвестная ошибка.';
    }
}

// Переводит «сырой» текст ошибки бэкенда в русское сообщение.
// Порядок: точный словарь -> уже русский текст -> запасной по статусу.
export function translateError(status: number, raw?: string): string {
    const rawMessage = raw ? extractRawMessage(raw) : undefined;
    if (rawMessage) {
        const exact = MESSAGE_MAP[rawMessage.toLowerCase().trim()];
        if (exact) return exact;
        if (CYRILLIC.test(rawMessage)) return rawMessage;
    }
    return messageForStatus(status);
}

// Строит ApiError из неуспешного ответа fetch.
export async function buildApiError(response: Response): Promise<ApiError> {
    const raw = await response.text().catch(() => '');
    return {
        status: response.status,
        message: translateError(response.status, raw),
    };
}

// Ошибка сети / недоступного сервера (fetch выбросил исключение).
export function networkError(): ApiError {
    return {
        status: 0,
        message:
            'Не удалось связаться с сервером. Проверьте подключение к интернету.',
    };
}

// Проверка, что значение является ApiError.
export function isApiError(value: unknown): value is ApiError {
    return (
        typeof value === 'object' &&
        value !== null &&
        typeof (value as ApiError).status === 'number' &&
        typeof (value as ApiError).message === 'string'
    );
}
