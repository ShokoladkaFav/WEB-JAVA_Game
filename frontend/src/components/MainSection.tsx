import './MainSection.css'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import SessionModal from './SessionModal'

function MainSection() {
  const { t } = useTranslation()
  const [showSessions, setShowSessions] = useState(false)
  const isLoggedIn = !!sessionStorage.getItem('username')

  const handleClick = () => {
    if (!isLoggedIn) {
      alert(t('login_required'))
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
