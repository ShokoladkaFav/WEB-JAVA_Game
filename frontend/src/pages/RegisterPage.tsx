import './AuthPage.css'
import './RegisterPage.css'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

function RegisterPage() {
  const { t } = useTranslation()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !email || !password) {
      setMessage('Заповніть усі поля!')
      return
    }

    if (password.length < 6) {
      setMessage('Пароль має містити щонайменше 6 символів.')
      return
    }

    const data = {
      username: username.trim(),
      email: email.trim(),
      password: password,
    }

    try {
      const response = await fetch('https://kursachgame.atwebpages.com/register.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        setMessage('Реєстрація успішна!')
        setUsername('')
        setEmail('')
        setPassword('')
      } else {
        setMessage(result.message || 'Помилка при реєстрації')
      }
    } catch (error) {
      console.error('❌ Помилка при fetch:', error)
      setMessage('Не вдалося зв’язатися з сервером')
    }
  }

  return (
    <div className="register-page">
      <form className="register-form auth-form" onSubmit={handleSubmit}>
        <h1>{t('register')}</h1>
        <input
          type="text"
          placeholder={t('username')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="email"
          placeholder={t('email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder={t('password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">{t('register')}</button>
        {message && <p className="message">{message}</p>}
      </form>
    </div>
  )
}

export default RegisterPage
