'use client';

import './catalogPage.css';
import SearchBar from '@/components/SearchBar/SearchBar';
import Select from '@/components/UI/Select/Select';
import { SortingValues } from '@/constants/sortingValues';
import InputRange from '@/components/UI/Input-range/InputRange';
import { useEffect, useMemo, useState } from 'react';
import CourseList from '@/components/CoursesList/CoursesList';
import { getCourses, getMyCourses } from '@/lib/api/courses';
import { Course } from '@/models/Course';
import { SelectOption } from '@/types/selectOption';
import Icon from '@/components/UI/Icon/Icon';
import { useToast } from '@/components/Toast/ToastProvider';

const PAGE_SIZE = 6;
const MAX_PRICE = 10000;

function normalizeCourses(res: unknown): Course[] {
    if (!res) return [];
    if (Array.isArray(res)) return res as Course[];
    const obj = res as Record<string, unknown>;
    const list = obj.items ?? obj.courses ?? obj.data ?? obj.results;
    return Array.isArray(list) ? (list as Course[]) : [];
}

function pluralizeCourses(count: number): string {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return 'курс';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
        return 'курса';
    return 'курсов';
}

export default function CatalogPage() {
    const [q, setQ] = useState('');
    const [sort, setSort] = useState('');
    const [subject, setSubject] = useState('');
    const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
    const [page, setPage] = useState(1);

    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [ownedCourseIds, setOwnedCourseIds] = useState<Set<string>>(
        new Set(),
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const toast = useToast();

    useEffect(() => {
        let active = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const [res, myCourses] = await Promise.all([
                    getCourses({ page_size: 20 }),
                    getMyCourses(),
                ]);
                if (!active) return;
                setOwnedCourseIds(new Set(myCourses.map((c) => c.id)));
                if (res.error) {
                    setError(res.error.message);
                    toast.error(res.error.message);
                    setAllCourses([]);
                    return;
                }
                setAllCourses(normalizeCourses(res.data));
            } catch (e) {
                console.error(e);
                if (active) {
                    const msg = 'Ошибка при загрузке курсов.';
                    setError(msg);
                    toast.error(msg);
                }
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [toast]);

    const subjectOptions: SelectOption[] = useMemo(() => {
        const unique = Array.from(
            new Set(allCourses.map((c) => c.subject).filter(Boolean)),
        );
        return [
            { title: 'Все предметы', value: '' },
            ...unique.map((s) => ({ title: s, value: s })),
        ];
    }, [allCourses]);

    const sortOptions: SelectOption[] = useMemo(
        () => [{ title: 'По умолчанию', value: '' }, ...SortingValues],
        [],
    );

    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase();
        let list = allCourses.filter((c) => {
            const haystack = `${c.title} ${c.description ?? ''}`.toLowerCase();
            const matchesSearch = !query || haystack.includes(query);
            const matchesSubject = !subject || c.subject === subject;
            const matchesPrice = c.price <= maxPrice;
            return matchesSearch && matchesSubject && matchesPrice;
        });

        if (sort === 'price-asc') {
            list = [...list].sort((a, b) => a.price - b.price);
        } else if (sort === 'price-desc') {
            list = [...list].sort((a, b) => b.price - a.price);
        }

        return list;
    }, [allCourses, q, subject, maxPrice, sort]);

    const handleSearch = (value: string) => {
        setQ(value);
        setPage(1);
    };
    const handleSort = (value: string) => {
        setSort(value);
        setPage(1);
    };
    const handleSubject = (value: string) => {
        setSubject(value);
        setPage(1);
    };
    const handleMaxPrice = (value: number) => {
        setMaxPrice(Number(value));
        setPage(1);
    };

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageItems = filtered.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    );
    const pageNumbers: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    const goPrev = () => setPage(Math.max(1, currentPage - 1));
    const goNext = () => setPage(Math.min(totalPages, currentPage + 1));

    return (
        <div className="course-container">
            <div className="catalog-headers">
                <h1> Каталог курсов </h1>
                <p>
                    {loading
                        ? 'Загрузка…'
                        : `${filtered.length} ${pluralizeCourses(filtered.length)} по вашему запросу`}
                </p>
            </div>
            <div className="search-filter-container">
                <SearchBar value={q} onChange={handleSearch} />
                <Select
                    selectValues={sortOptions}
                    value={sort}
                    onChange={handleSort}
                />
                <Select
                    selectValues={subjectOptions}
                    value={subject}
                    onChange={handleSubject}
                />
                <InputRange
                    min={500}
                    max={MAX_PRICE}
                    step={500}
                    value={maxPrice}
                    onChange={handleMaxPrice}
                />
            </div>

            {error && !loading ? (
                <div className="course-list__state course-list__state--error">
                    {error}
                </div>
            ) : (
                <CourseList
                    courses={pageItems}
                    loading={loading}
                    ownedCourseIds={ownedCourseIds}
                />
            )}

            {!loading && !error && totalPages > 1 && (
                <div className="catalog-pagination">
                    <button
                        className="catalog-pagination__arrow"
                        disabled={currentPage === 1}
                        onClick={goPrev}
                        aria-label="Предыдущая страница"
                    >
                        <Icon name="chevronLeft" size={18} />
                    </button>
                    {pageNumbers.map((p) => (
                        <button
                            key={p}
                            className={
                                'catalog-pagination__page' +
                                (p === currentPage ? ' active' : '')
                            }
                            onClick={() => setPage(p)}
                        >
                            {p}
                        </button>
                    ))}
                    <button
                        className="catalog-pagination__arrow"
                        disabled={currentPage === totalPages}
                        onClick={goNext}
                        aria-label="Следующая страница"
                    >
                        <Icon name="chevronRight" size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}
