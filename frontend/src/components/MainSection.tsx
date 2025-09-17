import './MainSection.css'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom' // ✅ додали
import SessionModal from './SessionModal'

function MainSection() {
  const { t } = useTranslation()
  const [showSessions, setShowSessions] = useState(false)
  const isLoggedIn = !!sessionStorage.getItem('username')
  const navigate = useNavigate() // ✅ ініціалізуємо

  const handleClick = () => {
    if (!isLoggedIn) {
      navigate('/register') // ✅ редірект замість alert
    } else {
      setShowSessions(true)
    }
  }

  return (
    <section className="main-section">
      <h1 className="game-title">{t('game_name')}</h1>
      <p className="tagline">{t('game_description')}</p>
      <button
        className={`start-button ${!isLoggedIn ? 'disabled' : ''}`}
        onClick={handleClick}
      >
        {t('game_button')}
      </button>

      {showSessions && <SessionModal onClose={() => setShowSessions(false)} />}
    </section>
  )
}

export default MainSection
