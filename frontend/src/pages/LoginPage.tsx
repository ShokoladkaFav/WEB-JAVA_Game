import './AuthPage.css'
import './LoginPage.css'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

function LoginPage() {
  const { t } = useTranslation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      setMessage('Заповніть усі поля!')
      return
    }

    try {
      const response = await fetch('https://kursachgame.atwebpages.com/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const result = await response.json()

      if (result.success) {
        setMessage('Вхід успішний!')

        // ✅ Зберігаємо ім’я користувача лише на сесію
        sessionStorage.setItem('username', username)

        // Зберігаємо ім’я в загальному списку (для перевірки існування)
        const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]')
        if (!allUsers.includes(username)) {
          localStorage.setItem('allUsers', JSON.stringify([...allUsers, username]))
        }

        // Перенаправлення на сторінку акаунту
        setTimeout(() => {
          window.location.href = '/account'
        }, 1000)
      } else {
        setMessage(result.message || 'Помилка при вході')
      }
    } catch (error) {
      console.error('❌ Помилка при вході:', error)
      setMessage('Не вдалося зв’язатися з сервером')
    }
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>{t('login')}</h1>
        <input
          type="text"
          placeholder={t('username')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder={t('password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">{t('login')}</button>
        {message && <p style={{ marginTop: '10px', color: 'white' }}>{message}</p>}
      </form>
    </div>
  )
}

export default LoginPage
