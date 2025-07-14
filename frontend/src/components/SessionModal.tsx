import { useEffect, useState } from 'react'
import './SessionModal.css'

interface Props {
  onClose: () => void
}

type GameSession = {
  name: string
  host: string
  players: string[]
  password?: string
  maxPlayers?: number
}

function SessionModal({ onClose }: Props) {
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [sessionName, setSessionName] = useState('')
  const [sessionPassword, setSessionPassword] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(4)
  const username = sessionStorage.getItem('username')

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('sessions') || '[]')
    setSessions(data)
  }, [])

  const saveSessions = (updated: GameSession[]) => {
    setSessions(updated)
    localStorage.setItem('sessions', JSON.stringify(updated))
  }

  const createSession = () => {
    if (!sessionName.trim() || !username) return
    if (sessionPassword.length < 6 || sessionPassword.length > 12) {
      alert('Пароль повинен містити від 6 до 12 символів.')
      return
    }

    const newSession: GameSession = {
      name: sessionName,
      host: username,
      players: [username], // хост додається в список гравців
      password: sessionPassword,
      maxPlayers: maxPlayers
    }

    const updated = [...sessions, newSession]
    saveSessions(updated)
    localStorage.setItem('activeSession', JSON.stringify(newSession))
    setSessionName('')
    setSessionPassword('')

    // Переходимо в лоббі
    window.location.href = `/lobby/${newSession.name}`
  }

  const joinSession = (name: string) => {
    const target = sessions.find(s => s.name === name)
    if (!target || !username) return

    if (target.players.includes(username)) {
      // вже в лоббі
      localStorage.setItem('activeSession', JSON.stringify(target))
      window.location.href = `/lobby/${target.name}`
      return
    }

    const enteredPassword = prompt('Введіть пароль сесії:')
    if (target.password && enteredPassword !== target.password) {
      alert('Невірний пароль!')
      return
    }

    if (target.players.length >= (target.maxPlayers || 4)) {
      alert('Лоббі заповнене!')
      return
    }

    const updatedSession = {
      ...target,
      players: [...target.players, username]
    }

    const all = sessions.map(s => s.name === name ? updatedSession : s)
    saveSessions(all)
    localStorage.setItem('activeSession', JSON.stringify(updatedSession))
    window.location.href = `/lobby/${updatedSession.name}`
  }

  const removeSession = (name: string) => {
    const updated = sessions.filter(s => s.name !== name)
    saveSessions(updated)
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Сесії гри</h2>

        <input
          type="text"
          placeholder="Назва нової сесії"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
        />
        <input
          type="password"
          placeholder="Пароль (6–12 символів)"
          value={sessionPassword}
          onChange={(e) => setSessionPassword(e.target.value)}
        />
        <select value={maxPlayers} onChange={(e) => setMaxPlayers(Number(e.target.value))}>
          {[2,3,4,5,6,7,8,9,10].map(n => (
            <option key={n} value={n}>{n} гравців</option>
          ))}
        </select>

        <button onClick={createSession}>Створити сесію</button>

        <h4>Активні сесії:</h4>
        {sessions.length === 0 ? (
          <p>Поки що немає сесій</p>
        ) : (
          <ul>
            {sessions.map((s, i) => (
              <li key={i}>
                <strong>{s.name}</strong> (хост: {s.host}, гравців: {s.players.length}/{s.maxPlayers || 4})
                <button onClick={() => joinSession(s.name)}>Грати</button>
                {s.host === username && (
                  <button onClick={() => removeSession(s.name)}>🗑 Закрити</button>
                )}
              </li>
            ))}
          </ul>
        )}

        <button onClick={onClose}>Закрити</button>
      </div>
    </div>
  )
}

export default SessionModal
