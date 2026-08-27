// src/pages/HomePage.jsx

import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { baseDataService } from "../services/baseDataService.jsx";

function HomePage({ onCategorySelect }) {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const selectCategory = onCategorySelect || ((category) => navigate(`/events?category=${encodeURIComponent(category)}`));
    
    useEffect(() => {
        fetchCategories();
    }, []);
    
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await baseDataService.getAllCategories();
            
            // Lấy data từ response
            let categoryList = [];
            if (response.data && Array.isArray(response.data)) {
                categoryList = response.data;
            } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                categoryList = response.data.data;
            } else if (Array.isArray(response)) {
                categoryList = response;
            }
            
            // Map dữ liệu từ backend
            const formattedCategories = categoryList.map(cat => ({
                id: cat.id,
                name: cat.name,
                image: cat.image || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=700&q=80',
                    color: `from-[#${Math.floor(Math.random()*16777215).toString(16)}] to-[#${Math.floor(Math.random()*16777215).toString(16)}]`
            }));
            
            setCategories(formattedCategories);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
            setError('Không thể tải danh sách danh mục');
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) {
        return (
            <main className="mx-auto max-w-[1240px] px-5 py-8 lg:px-10 lg:py-12">
                <div className="flex justify-center items-center h-96">
                    <div className="text-white">Đang tải danh mục...</div>
                </div>
            </main>
        );
    }
    
    if (error) {
        return (
            <main className="mx-auto max-w-[1240px] px-5 py-8 lg:px-10 lg:py-12">
                <div className="text-red-500 text-center">{error}</div>
            </main>
        );
    }
    
    if (categories.length === 0) {
        return (
            <main className="mx-auto max-w-[1240px] px-5 py-8 lg:px-10 lg:py-12">
                <div className="text-white/50 text-center">Không có danh mục nào</div>
            </main>
        );
    }
    
    return (
        <main className="mx-auto max-w-[1240px] px-5 py-8 lg:px-10 lg:py-12">
            {/* Hero Section */}
            <section
                className="relative overflow-hidden rounded-3xl bg-cover bg-center px-6 py-16 sm:px-12"
                style={{
                    backgroundImage:
                        "linear-gradient(90deg, rgba(16,17,18,.96), rgba(16,17,18,.2)), url('https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1500&q=80')",
                }}
            >
                <div className="relative max-w-2xl">
                    <p className="mb-3 text-xs font-bold uppercase tracking-[.3em] text-[#ff985c]">
                        Nền tảng trải nghiệm sự kiện
                    </p>
                    <h1 className="font-display text-6xl font-extrabold uppercase leading-[.85] text-white sm:text-8xl">
                        Đi đâu tối nay?
                    </h1>
                    <p className="mt-5 max-w-md text-sm text-white/65">
                        Khám phá những sự kiện đáng nhớ và đặt chỗ cho khoảnh khắc tiếp theo
                        của bạn.
                    </p>
                </div>
            </section>
            
            {/* Categories Section */}
            <div className="mb-7 mt-12 flex items-end justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[.25em] text-[#ff985c]">
                        Khám phá
                    </p>
                    <h2 className="font-display text-4xl font-bold uppercase text-white">
                        Chọn thể loại
                    </h2>
                </div>
                <span className="text-xs text-white/40">{categories.length} danh mục</span>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map((category) => (
                    <button
                        key={category.id || category.name}
                        onClick={() => selectCategory(category.name)}
                        className={`group relative h-72 overflow-hidden rounded-2xl bg-gradient-to-br ${category.color} text-left transition-transform duration-300 hover:scale-[1.02]`}
                    >
                        <img
                            src={category.image}
                            alt={category.name}
                            className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-70 transition duration-500 group-hover:scale-110"
                            onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=700&q=80';
                            }}
                        />
                        <span className="absolute inset-x-5 bottom-5 font-display text-3xl font-bold uppercase leading-none text-white">
                            {category.name}
                        </span>
                    </button>
                ))}
            </div>
        </main>
    );
}

export default HomePage;