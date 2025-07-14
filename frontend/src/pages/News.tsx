import './News.css'
import { useTranslation } from 'react-i18next'

function News() {
  const { t } = useTranslation()

  const newsList = [
    {
      id: 1,
      title: t('new_title_1'),
      image: '/images/news1.jpeg',
      description: t('new_title_1_description'),
    },
    {
      id: 2,
      title: t('new_title_2'),
      image: '/images/news2.jpeg',
      description: t('new_title_2_description'),
    },
        {
      id: 3,
      title: t('new_title_3'),
      image: '/images/news3.jpg',
      description: t('new_title_3_description'),
    },
  ]

  // Сортуємо за id, останню новину виводимо першою
  const sortedNews = [...newsList].sort((a, b) => b.id - a.id)
  const [highlight, ...restNews] = sortedNews

  return (
    <div className="news-page">
      <h1 className="news-title">{t('news-title_center')}</h1>

      <div className="highlight-news">
        <img src={highlight.image} alt={highlight.title} />
        <div className="highlight-content">
          <h2>{highlight.title}</h2>
          <p>{highlight.description}</p>
        </div>
      </div>

      <div className="news-container">
        {restNews.map((news) => (
          <div className="news-item" key={news.id}>
            <img src={news.image} alt={news.title} />
            <h2>{news.title}</h2>
            <p>{news.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default News
