"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from '@/styles/search.module.css';

export default function SearchPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        query: searchParams.get('q') || '',
        min_price: searchParams.get('min_price') || '',
        max_price: searchParams.get('max_price') || '',
        category: searchParams.get('category') || '',
        sort: searchParams.get('sort') || 'relevance',
        page: parseInt(searchParams.get('page')) || 1
    });
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        page_size: 10,
        total_pages: 1
    });

    useEffect(() => {
        const fetchResults = async () => {
            try {
                setLoading(true);
                const queryParams = new URLSearchParams();
                Object.entries(filters).forEach(([key, value]) => {
                    if (value) queryParams.append(key, value);
                });

                const response = await fetch(`http://localhost:8000/api/search/?${queryParams.toString()}`);
                if (!response.ok) throw new Error('Failed to fetch search results');

                const data = await response.json();
                setProducts(data.products);
                setPagination(data.pagination);
                setError('');
            } catch (err) {
                setError(err.message);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value,
            page: 1 // Reset to first page when filters change
        }));
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    return (
        <div className={styles.searchContainer}>
            <div className={styles.filters}>
                <input
                    type="text"
                    name="query"
                    value={filters.query}
                    onChange={handleFilterChange}
                    placeholder="Search products..."
                    className={styles.searchInput}
                />
                <input
                    type="number"
                    name="min_price"
                    value={filters.min_price}
                    onChange={handleFilterChange}
                    placeholder="Min price"
                    className={styles.priceInput}
                />
                <input
                    type="number"
                    name="max_price"
                    value={filters.max_price}
                    onChange={handleFilterChange}
                    placeholder="Max price"
                    className={styles.priceInput}
                />
                <select
                    name="sort"
                    value={filters.sort}
                    onChange={handleFilterChange}
                    className={styles.sortSelect}
                >
                    <option value="relevance">Relevance</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="popularity">Popularity</option>
                    <option value="newest">Newest</option>
                </select>
            </div>

            {loading ? (
                <div className={styles.loading}>Loading...</div>
            ) : error ? (
                <div className={styles.error}>{error}</div>
            ) : products.length === 0 ? (
                <div className={styles.noResults}>No products found</div>
            ) : (
                <>
                    <div className={styles.results}>
                        {products.map(product => (
                            <div key={product.id} className={styles.productCard}>
                                <Link href={`/products/${product.id}`}>
                                    <img 
                                        src={product.image_url} 
                                        alt={product.name}
                                        className={styles.productImage}
                                    />
                                    <h3 className={styles.productName}>{product.name}</h3>
                                    <p className={styles.productPrice}>${product.price}</p>
                                </Link>
                            </div>
                        ))}
                    </div>

                    <div className={styles.pagination}>
                        {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`${styles.pageButton} ${filters.page === page ? styles.active : ''}`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
} 