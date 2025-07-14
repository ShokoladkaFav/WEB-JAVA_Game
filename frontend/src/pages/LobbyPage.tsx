import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './LobbyPage.css'

type GameSession = {
  name: string
  host: string
  players: string[]
}

function LobbyPage() {
  const { sessionName } = useParams()
  const username = sessionStorage.getItem('username')
  const navigate = useNavigate()
  const [session, setSession] = useState<GameSession | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      const sessions: GameSession[] = JSON.parse(localStorage.getItem('sessions') || '[]')
      const found = sessions.find(s => s.name === sessionName)

      if (!found) {
        alert('Сесію було закрито або вона недоступна.')
        navigate('/')
        return
      }

      if (username && !found.players.includes(username)) {
        alert('Вас виключили з лоббі.')
        navigate('/')
        return
      }

      setSession(found)
    }, 1000)

    return () => clearInterval(interval)
  }, [sessionName, username, navigate])

  const leaveLobby = () => {
    if (!session || !username) return

    const updatedPlayers = session.players.filter(p => p !== username)
    const updatedSession = { ...session, players: updatedPlayers }

    const allSessions: GameSession[] = JSON.parse(localStorage.getItem('sessions') || '[]')
    const newSessions = allSessions.map(s =>
      s.name === session.name ? updatedSession : s
    )

    localStorage.setItem('sessions', JSON.stringify(newSessions))
    navigate('/')
  }

  const kickPlayer = (player: string) => {
    if (!session || !username || session.host !== username) return

    const updatedPlayers = session.players.filter(p => p !== player)
    const updatedSession = { ...session, players: updatedPlayers }

    const allSessions: GameSession[] = JSON.parse(localStorage.getItem('sessions') || '[]')
    const newSessions = allSessions.map(s =>
      s.name === session.name ? updatedSession : s
    )

    localStorage.setItem('sessions', JSON.stringify(newSessions))
    setSession(updatedSession)
  }

  if (!session || !session.players || !username) {
    return (
      <div className="lobby-page">
        <p>Сесія недоступна або сталася помилка.</p>
        <button onClick={() => navigate('/')}>Повернутись</button>
      </div>
    )
  }

  return (
    <div className="lobby-page" style={{ backgroundImage: `url('/images/lobby-background.jpg')` }}>
      <div className="lobby-content">
        <h2>Лоббі: {session.name}</h2>
        <p>Хост: {session.host}</p>

        <h4>Гравці:</h4>
        <ul>
          {session.players.map((p, i) => (
            <li key={i}>
              {p}
              {session.host === username && p !== username && (
                <button onClick={() => kickPlayer(p)}>Викинути</button>
              )}
            </li>
          ))}
        </ul>

        <button onClick={leaveLobby}>Вийти з лоббі</button>
      </div>
    </div>
  )
}

export default LobbyPage
