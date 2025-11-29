import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './css/Blog.css';

function Blog() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const categories = [
    { id: 'all', name: 'Tất cả' },
    { id: 'tips', name: 'Mẹo' },
    { id: 'guides', name: 'Hướng dẫn' },
    { id: 'news', name: 'Tin tức' },
    { id: 'stories', name: 'Câu chuyện' }
  ];

  const blogPosts = [
    {
      id: 1,
      title: '5 mẹo tìm thành viên ủy thac uy tín',
      excerpt: 'Hướng dẫn chi tiết cách nhận biết và chọn lựa thành viên ủy thac chất lượng cao cho dịch vụ của bạn.',
      category: 'tips',
      author: 'F-Service Team',
      date: '2024-01-15',
      readTime: '5 phút',
      image: '/images/blog-tips-1.jpg'
    },
    {
      id: 2,
      title: 'Cách tạo yêu cầu dịch vụ hiệu quả',
      excerpt: 'Bí quyết viết yêu cầu dịch vụ rõ ràng, chi tiết để thu hút thành viên phù hợp nhất.',
      category: 'guides',
      author: 'F-Service Team',
      date: '2024-01-12',
      readTime: '7 phút',
      image: '/images/blog-guide-1.jpg'
    },
    {
      id: 3,
      title: 'F-Service ra mắt tính năng đánh giá mới',
      excerpt: 'Cập nhật quan trọng giúp người dùng dễ dàng hơn trong việc đánh giá chất lượng dịch vụ.',
      category: 'news',
      author: 'F-Service Team',
      date: '2024-01-10',
      readTime: '3 phút',
      image: '/images/blog-news-1.jpg'
    },
    {
      ID: 4,
      title: 'Câu chuyện thành công: Dự án thiết kế website',
      excerpt: 'Khách hàng chia sẻ trải nghiệm khi tìm được thành viên thiết kế website chuyên nghiệp qua F-Service.',
      category: 'stories',
      author: 'Nguyễn Văn A',
      date: '2024-01-08',
      readTime: '10 phút',
      image: '/images/blog-story-1.jpg'
    },
    {
      id: 5,
      title: 'Quy trình bảo vệ giao dịch trên F-Service',
      excerpt: 'Tìm hiểu cách chúng tôi đảm bảo an toàn cho mọi giao dịch dịch vụ trên nền tảng.',
      category: 'guides',
      author: 'F-Service Team',
      date: '2024-01-05',
      readTime: '8 phút',
      image: '/images/blog-guide-2.jpg'
    },
    {
      id: 6,
      title: 'Top 10 dịch vụ được tìm kiếm nhiều nhất',
      excerpt: 'Thống kê các loại dịch vụ phổ biến nhất trên F-Service trong quý 4/2023.',
      category: 'news',
      author: 'F-Service Team',
      date: '2024-01-03',
      readTime: '6 phút',
      image: '/images/blog-news-2.jpg'
    }
  ];

  const filteredPosts = selectedCategory === 'all' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="blog">
      <div className="blog__container">
        <div className="blog__header">
          <h1 className="blog__title">Blog F-Service</h1>
          <p className="blog__subtitle">Cập nhật kiến thức, mẹo và tin tức về dịch vụ ủy thac</p>
        </div>

        <div className="blog__content">
          <div className="blog__sidebar">
            <div className="blog__categories">
              <h3>Danh mục</h3>
              <div className="blog__category-list">
                {categories.map(category => (
                  <button
                    key={category.id}
                    className={`blog__category ${selectedCategory === category.id ? 'blog__category--active' : ''}`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="blog__popular">
              <h3>Bài viết phổ biến</h3>
              <div className="blog__popular-list">
                {blogPosts.slice(0, 3).map(post => (
                  <Link key={post.id} to={`/blog/${post.id}`} className="blog__popular-item">
                    <h4>{post.title}</h4>
                    <span className="blog__popular-date">{formatDate(post.date)}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="blog__newsletter">
              <h3>Đăng ký nhận tin</h3>
              <p>Nhận bài viết mới nhất qua email</p>
              <form className="blog__newsletter-form">
                <input 
                  type="email" 
                  placeholder="Email của bạn" 
                  className="blog__newsletter-input"
                />
                <button type="submit" className="blog__newsletter-btn">Đăng ký</button>
              </form>
            </div>
          </div>

          <div className="blog__main">
            <div className="blog__posts">
              {filteredPosts.map(post => (
                <article key={post.id} className="blog__post">
                  <div className="blog__post-image">
                    <img src={post.image} alt={post.title} />
                  </div>
                  <div className="blog__post-content">
                    <div className="blog__post-meta">
                      <span className="blog__post-category">
                        {categories.find(cat => cat.id === post.category)?.name}
                      </span>
                      <span className="blog__post-date">{formatDate(post.date)}</span>
                      <span className="blog__post-read-time">{post.readTime} đọc</span>
                    </div>
                    <h2 className="blog__post-title">
                      <Link to={`/blog/${post.id}`}>{post.title}</Link>
                    </h2>
                    <p className="blog__post-excerpt">{post.excerpt}</p>
                    <div className="blog__post-footer">
                      <span className="blog__post-author">Bởi {post.author}</span>
                      <Link to={`/blog/${post.id}`} className="blog__post-read-more">
                        Đọc thêm →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="blog__pagination">
              <button className="blog__pagination-btn blog__pagination-btn--prev">
                ← Trang trước
              </button>
              <div className="blog__pagination-numbers">
                <button className="blog__pagination-number blog__pagination-number--active">1</button>
                <button className="blog__pagination-number">2</button>
                <button className="blog__pagination-number">3</button>
              </div>
              <button className="blog__pagination-btn blog__pagination-btn--next">
                Trang sau →
              </button>
            </div>
          </div>
        </div>

        <div className="blog__cta">
          <h2>Bạn có câu chuyện muốn chia sẻ?</h2>
          <p>Gửi bài viết của bạn cho cộng đồng F-Service</p>
          <button className="blog__cta-btn">Gửi bài viết</button>
        </div>
      </div>
    </div>
  );
}

export default Blog;
