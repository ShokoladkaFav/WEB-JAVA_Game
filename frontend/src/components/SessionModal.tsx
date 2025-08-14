import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import socket from '../sockets/socket'
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const username = sessionStorage.getItem('username')
  const navigate = useNavigate()

  useEffect(() => {
    const onSessionsUpdated = (updatedSessions: GameSession[] | Record<string, any>) => {
      const normalized = Array.isArray(updatedSessions) ? updatedSessions : Object.values(updatedSessions)
      console.log('[SessionModal] sessionsUpdated:', normalized)
      setSessions(normalized as GameSession[])
    }

    const onJoinedSession = (joinedSessionName: string) => {
      console.log('[SessionModal] joinedSession:', joinedSessionName)
      setLoading(false)
      navigate(`/lobby/${joinedSessionName}`)
    }

    const onJoinSessionError = (errorMessage: string) => {
      console.warn('[SessionModal] joinSessionError:', errorMessage)
      alert(errorMessage || 'Не вдалося приєднатися до сесії.')
      setLoading(false)
    }

    socket.on('sessionsUpdated', onSessionsUpdated)
    socket.on('joinedSession', onJoinedSession)
    socket.on('joinSessionError', onJoinSessionError)

    console.log('[SessionModal] Запитуємо список сесій...')
    socket.emit('getSessions')

    return () => {
      socket.off('sessionsUpdated', onSessionsUpdated)
      socket.off('joinedSession', onJoinedSession)
      socket.off('joinSessionError', onJoinSessionError)
    }
  }, [navigate])

  const emitCreateSession = (data: any, cb: (resp: any) => void) => {
    console.log('[SessionModal] createSession ->', data)
    socket.emit('createSession', data, (response: { success: boolean; message?: string }) => {
      console.log('[SessionModal] createSession ack:', response)
      cb(response)
    })
  }

  const createSession = () => {
    if (loading) return
    setError(null)

    if (!sessionName.trim() || !username) {
      setError('Назва сесії не може бути порожньою.')
      return
    }

    if (sessionPassword.length > 0 && (sessionPassword.length < 4 || sessionPassword.length > 12)) {
      setError('Пароль повинен містити від 4 до 12 символів.')
      return
    }

    setLoading(true)

    const newSessionData = {
      name: sessionName,
      host: username,
      password: sessionPassword,
      maxPlayers: maxPlayers,
    }

    const proceedToEmit = () => {
      emitCreateSession(newSessionData, (response) => {
        if (!response?.success) {
          setLoading(false)
          setError(response?.message || 'Не вдалося створити сесію.')
          return
        }

        let finished = false

        const onJoined = (joinedName: string) => {
          if (joinedName === newSessionData.name) {
            finished = true
            socket.off('joinedSession', onJoined)
            clearTimeout(fallback)
            console.log('[SessionModal] Отримано joinedSession — перехід у лоббі.')
            setLoading(false)
            navigate(`/lobby/${joinedName}`)
          }
        }

        socket.on('joinedSession', onJoined)

        const fallback = setTimeout(() => {
          if (finished) return
          socket.off('joinedSession', onJoined)
          console.warn('[SessionModal] fallback: приєднуємось вручну.')
          socket.emit('joinSession', {
            sessionName: newSessionData.name,
            username,
            password: newSessionData.password,
          })
        }, 5000)
      })
    }

    if (!socket.connected) {
      console.log('[SessionModal] socket не підключений — підключаю...')
      socket.auth = { username }
      socket.connect()
      const onConnect = () => {
        socket.off('connect', onConnect)
        proceedToEmit()
      }
      socket.on('connect', onConnect)
    } else {
      proceedToEmit()
    }
  }

  const joinSession = (name: string) => {
    if (!username) return
    const target = sessions.find((s) => s.name === name)
    if (!target) return

    let enteredPassword = ''
    if (target.password) {
      enteredPassword = prompt('Ця сесія захищена паролем. Введіть пароль:') || ''
    }

    setLoading(true)

    let finished = false
    const onJoined = (joinedName: string) => {
      if (joinedName === name) {
        finished = true
        socket.off('joinedSession', onJoined)
        clearTimeout(fallback)
        setLoading(false)
        navigate(`/lobby/${joinedName}`)
      }
    }

    socket.on('joinedSession', onJoined)

    const fallback = setTimeout(() => {
      if (finished) return
      socket.off('joinedSession', onJoined)
      console.warn('[SessionModal] fallback: приєднуємось повторно.')
      socket.emit('joinSession', {
        sessionName: name,
        username,
        password: enteredPassword,
      })
    }, 5000)

    console.log('[SessionModal] emit joinSession', { sessionName: name, username })
    socket.emit('joinSession', { sessionName: name, username, password: enteredPassword })
  }

  const removeSession = (name: string) => {
    if (!username) return
    socket.emit('removeSession', { sessionName: name, username })
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Сесії гри</h2>

        <div className="session-form">
          <input
            type="text"
            placeholder="Назва нової сесії"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Пароль (необов'язково)"
            value={sessionPassword}
            onChange={(e) => setSessionPassword(e.target.value)}
            disabled={loading}
          />
          <select
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            disabled={loading}
          >
            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n} гравців
              </option>
            ))}
          </select>

          <button onClick={createSession} disabled={loading}>
            {loading ? 'Створення...' : 'Створити сесію'}
          </button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>

        <h4 style={{ marginTop: '2rem' }}>Активні сесії:</h4>
        {sessions.length === 0 ? (
          <p>Поки що немає сесій. Створіть першу!</p>
        ) : (
          <ul>
            {sessions.map((s, i) => (
              <li key={i}>
                <span>
                  <strong>{s.name}</strong> ({s.password ? '🔒 ' : ''}{s.players.length}/{s.maxPlayers || 'N/A'})
                  <br />
                  <small>Хост: {s.host}</small>
                </span>
                <div>
                  <button onClick={() => joinSession(s.name)} style={{ background: '#27ae60' }}>
                    Грати
                  </button>
                  {s.host === username && (
                    <button onClick={() => removeSession(s.name)} style={{ background: '#c0392b' }}>
                      Закрити
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <button onClick={onClose} disabled={loading} style={{ marginTop: '2rem', background: '#7f8c8d' }}>
          Закрити
        </button>
      </div>
    </div>
  )
}

export default SessionModal
