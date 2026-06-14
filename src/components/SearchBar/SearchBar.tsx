import Icon from '@/components/Icon/Icon';
import './SearchBar.css';

export default function SearchBar() {
    return (
        <div className="search-bar">
            <Icon size={20} name="search"></Icon>
            <input className="search-field" placeholder="Поиск курсов" />
        </div>
    );
}
