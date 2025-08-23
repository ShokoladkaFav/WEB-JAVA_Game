import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import socket from '../sockets/socket';
import './LobbyPage.css';

type GameSession = {
  name: string;
  host: string;
  players: string[];
  selectedRoles?: { [key: number]: string };
  readyPlayers?: string[];
};

const roleGroups: { [key: number]: string[] } = {
  1: ['Вбивця'],
  2: ['Шпигун'],
  3: ['Таємний агент', 'Чарівник', 'Провидець'],
  4: ['Імператор'],
  5: ['Кардинал', 'Урядовець', 'Банкір', 'Архітектор', 'Абат'],
  6: ['Купець', 'Крамар'],
  7: ['Єпископ', 'Вчена', 'Навігатор', 'Мер', 'Міністр'],
  8: ['Дипломат', 'Маршал'],
  9: ['Генерал', 'Митець'],
  10: ['Король'],
};

function LobbyPage() {
  const { t } = useTranslation();
  const { sessionName } = useParams();
  const username = sessionStorage.getItem('username');
  const navigate = useNavigate();
  const [session, setSession] = useState<GameSession | null>(null);

  // Отримання оновлень стану лоббі від сервера
  useEffect(() => {
    socket.on('lobbyStateUpdated', (updatedSession: GameSession) => {
      if (updatedSession.name === sessionName) {
        setSession(updatedSession);
      }
    });

    socket.on('lobbyClosed', () => {
      alert(t('session_closed'));
      navigate('/');
    });

    socket.on('kicked', ({ sessionName }) => {
      alert(`Вас вигнали з лоббі "${sessionName}"`);
      navigate('/');
    });

    // 🔧 Виправлений обробник gameStarted
    socket.on(
      'gameStarted',
      (payload: string | { sessionName: string; players?: string[] }) => {
        const nextSession =
          typeof payload === 'string' ? payload : payload.sessionName;
        if (nextSession === sessionName) {
          navigate(`/game/${nextSession}`);
        }
      }
    );

    return () => {
      socket.off('lobbyStateUpdated');
      socket.off('lobbyClosed');
      socket.off('kicked');
      socket.off('gameStarted');
    };
  }, [navigate, sessionName, t]);

  // Приєднання до кімнати
  useEffect(() => {
    if (sessionName && username) {
      socket.emit('joinLobby', { sessionName, username });
    }
  }, [sessionName, username]);

  const leaveLobby = () => {
    if (sessionName && username) {
      socket.emit('leaveLobby', { sessionName, username });
    }
    navigate('/');
  };

  const kickPlayer = (player: string) => {
    if (sessionName) {
      socket.emit('kickPlayer', { sessionName, playerToKick: player });
    }
  };

  const toggleReady = () => {
    if (sessionName && username) {
      socket.emit('toggleReady', { sessionName, username });
    }
  };

  const handleRoleChange = (groupNum: number, role: string) => {
    if (sessionName) {
      const updatedRoles = { ...session?.selectedRoles, [groupNum]: role };
      socket.emit('updateRoles', { sessionName, roles: updatedRoles });
    }
  };

  const startGame = () => {
    if (sessionName) {
      socket.emit('startGame', { sessionName });
    }
  };

  const maxRoleNumber = session?.players?.length || 4;
  const everyoneReady = session?.players
    ?.filter((p) => p !== session.host)
    .every((p) => session.readyPlayers?.includes(p));

  if (!session || !session.players || !username) {
    return (
      <div className="lobby-page">
        <p>{t('session_unavailable')}</p>
        <button onClick={() => navigate('/')}>{t('return')}</button>
      </div>
    );
  }

  return (
    <div
      className="lobby-page"
      style={{ backgroundImage: `url('/images/lobby-background.jpg')` }}
    >
      <div className="lobby-content">
        <h2>{t('lobby_title', { name: session.name })}</h2>
        <p>{t('host', { host: session.host })}</p>

        <h4>{t('players')}</h4>
        <ul>
          {session.players.map((p, i) => (
            <li key={i}>
              {p}
              {session.readyPlayers?.includes(p) && ' ✅'}
              {session.host === username && p !== username && (
                <button onClick={() => kickPlayer(p)}>{t('kick')}</button>
              )}
            </li>
          ))}
        </ul>

        {session.host === username ? (
          <>
            <h3>{t('select_roles')}</h3>
            {Object.entries(roleGroups)
              .filter(([group]) => Number(group) <= maxRoleNumber)
              .map(([group, roles]) => (
                <div key={group}>
                  <label>Роль {group}: </label>
                  <select
                    value={session.selectedRoles?.[Number(group)] || ''}
                    onChange={(e) =>
                      handleRoleChange(Number(group), e.target.value)
                    }
                  >
                    <option value="">—</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            <button onClick={startGame} disabled={!everyoneReady}>
              {t('start_game')}
            </button>
            {!everyoneReady && (
              <p style={{ color: 'gray' }}>{t('not_all_ready')}</p>
            )}
          </>
        ) : (
          <>
            <button onClick={toggleReady}>
              {session.readyPlayers?.includes(username)
                ? t('unready')
                : t('ready')}
            </button>
            <p>{t('waiting_for_host')}</p>
          </>
        )}

        <button onClick={leaveLobby}>{t('leave_lobby')}</button>
      </div>
    </div>
  );
}

export default LobbyPage;
