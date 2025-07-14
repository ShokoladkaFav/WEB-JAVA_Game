import './Header.css'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function Header() {
  const { t, i18n } = useTranslation()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const languages = [
    { label: 'Українська', code: 'ua' },
    { label: 'English', code: 'en' },
  ]

  const [language, setLanguage] = useState(() => {
    const currentLang = i18n.language || 'ua'
    const found = languages.find((l) => l.code === currentLang)
    return found ? found.label : 'Українська'
  })

  const handleLanguageChange = (label: string, code: string) => {
    setLanguage(label)
    i18n.changeLanguage(code)
    setDropdownOpen(false)
  }

  useEffect(() => {
    const currentLang = i18n.language
    const found = languages.find((l) => l.code === currentLang)
    if (found) setLanguage(found.label)
  }, [i18n.language])

  return (
    <header className="header">
      <div className="auth-buttons">
        <div className="language-container">
          <div
            className="language-selector"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title={t('change_language')}
          >
            🌐 {language}
          </div>
          {dropdownOpen && (
            <ul className="language-dropdown">
              {languages.map((lang) => (
                <li
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.label, lang.code)}
                >
                  {lang.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link to="/account">
          <button>{t('account')}</button>
        </Link>

        <Link to="/register">
          <button>{t('register')}</button>
        </Link>
        <Link to="/login">
          <button>{t('login')}</button>
        </Link>
      </div>

      <nav className="navbar">
        <Link to="/">{t('home')}</Link>
        <Link to="/news">{t('news')}</Link>
      </nav>
    </header>
  )
}

export default Header
