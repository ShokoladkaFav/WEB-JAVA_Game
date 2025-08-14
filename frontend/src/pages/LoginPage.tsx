import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import socket from '../sockets/socket';
import './AuthPage.css';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setMessage(t('login.fill_all_fields'));
      return;
    }

    try {
      const response = await fetch('http://kursachgame.atwebpages.com/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage(t('login_success'));
        sessionStorage.setItem('username', username);

        // Connect socket with auth details
        socket.auth = { username };
        socket.connect();

        const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]') || [];
        if (!allUsers.includes(username)) {
          localStorage.setItem('allUsers', JSON.stringify([...allUsers, username]));
        }

        setTimeout(() => {
          navigate('/'); // Перехід на головну сторінку
        }, 1000);
      } else {
        const errorKey = result.message === 'Invalid password'
          ? 'login_invalid_password'
          : result.message === 'User not found'
          ? 'login_user_not_found'
          : 'login_error';

        setMessage(t(errorKey));
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage(t('login_network_error'));
    }
  };

  return (
    <div className="login-page">
      <div className="login-form">
        <h2>{t('login_title')}</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder={t('login_username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder={t('login_password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">{t('login_button')}</button>
          {message && <div className="message">{message}</div>}
        </form>
      </div>
    </div>
  );
};

export default LoginPage;