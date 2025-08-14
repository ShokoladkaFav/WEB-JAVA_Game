import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './RegisterPage.css';

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://kursachgame.atwebpages.com/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(t('register_success'));
        setUsername('');
        setPassword('');
      } else {
        setMessage(data.message || t('register_failed'));
      }
    } catch (error) {
      console.error('Register error:', error);
      setMessage(t('error.network'));
    }

    setLoading(false);
  };

  return (
    <div className="register-page">
      <div className="register-form">
        <h2>{t('register_title')}</h2>
        <form className="auth-form" onSubmit={handleRegister}>
          <input
            type="text"
            placeholder={t('username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder={t('password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? t('register_loading') : t('register_button')}
          </button>
          {message && <div className="message">{message}</div>}
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
