import './catalogPage.css';
import SearchBar from '@/components/SearchBar/SearchBar';
import Select from '@/components/UI/Select/Select';
import {
    SortingBySubjectValues,
    SortingValues,
} from '@/constants/sortingValues';
import InputRange from '@/components/UI/Input-range/InputRange';

export default function CatalogPage() {
    return (
        <div className="course-container">
            <div className="catalog-headers">
                <h1> Каталог курсов </h1>
                <p> 10 курсов по вашему запросу </p>
            </div>
            <div className="search-filter-container">
                <SearchBar></SearchBar>
                <Select selectValues={SortingValues}></Select>
                <Select selectValues={SortingBySubjectValues}></Select>
                <InputRange min={500} max={10000} step={500}></InputRange>
            </div>
            <div className="courses">fsdjlflsd</div>
        </div>
    );
}
