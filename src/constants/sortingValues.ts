import { SelectOption } from '@/types/selectOption';

export const SortingValues: SelectOption[] = [
    {
        title: 'Сначала дорогие',
        value: 'price-desc',
    },
    {
        title: 'Сначала дешевые',
        value: 'price-asc',
    },
    {
        title: 'По рейтингу',
        value: 'rating',
    },
];

export const SortingBySubjectValues: SelectOption[] = [
    {
        title: 'Английский',
        value: 'english',
    },
    {
        title: 'Математика',
        value: 'math',
    },
    {
        title: 'Информатика',
        value: 'IT',
    },
];
