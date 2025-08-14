import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../sockets/socket';
import './GameBoard.css';

type Player = {
  id: string;
  username: string;
  role: string | null;
  avatar?: string | null;
};

const GameBoard = () => {
  const { sessionName } = useParams();
  const [players, setPlayers] = useState<Player[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [myId, setMyId] = useState<string | undefined>(undefined);
  const [currentPickerId, setCurrentPickerId] = useState<string>('');
  const [phase, setPhase] = useState<number>(1);

  useEffect(() => {
    const username = sessionStorage.getItem('username') || '';

    if (sessionName && username) {
      socket.emit('joinLobby', { sessionName, username });
    }

    const requestState = () => {
      if (sessionName) {
        socket.emit('getSessionState', { sessionName });
      }
    };

    if (socket.connected) {
      requestState();
    } else {
      socket.once('connect', requestState);
    }

    const onConnect = () => setMyId(socket.id);

    const onLobbyStateUpdated = (session: any) => {
      if (!session || session.name !== sessionName) return;

      const mapped: Player[] = (session.players || []).map((u: any) => {
        const username = typeof u === 'string' ? u : (u.username ?? '');
        const role = typeof u === 'string' ? null : (u.role ?? null);
        const avatar = localStorage.getItem(`profileImage_${username}`);
        return {
          id: username,
          username,
          role,
          avatar: avatar || null,
        };
      });
      setPlayers(mapped);
    };

    const onStartRoleSelection = ({
      availableRoles,
      players,
    }: {
      availableRoles: string[];
      players: Player[];
    }) => {
      const withAvatars = players.map((p) => ({
        ...p,
        avatar: localStorage.getItem(`profileImage_${p.username}`) || null,
      }));
      setAvailableRoles(availableRoles || []);
      setPlayers(withAvatars);
      setPhase(1);
      setCurrentPickerId(withAvatars.length > 0 ? withAvatars[0].id : '');
    };

    const onNextPicker = ({
      currentPickerId,
      availableRoles,
    }: {
      currentPickerId: string;
      availableRoles: string[];
    }) => {
      setCurrentPickerId(currentPickerId);
      setAvailableRoles(availableRoles || []);
    };

    const onRolesSelected = (updatedPlayers: Player[]) => {
      const withAvatars = updatedPlayers.map((p) => ({
        ...p,
        avatar: localStorage.getItem(`profileImage_${p.username}`) || null,
      }));
      setPlayers(withAvatars || []);
    };

    const onStartGamePhase = ({ phase }: { phase: number }) => {
      setPhase(phase);
    };

    socket.on('connect', onConnect);
    socket.on('lobbyStateUpdated', onLobbyStateUpdated);
    socket.on('startRoleSelection', onStartRoleSelection);
    socket.on('nextPicker', onNextPicker);
    socket.on('rolesSelected', onRolesSelected);
    socket.on('startGamePhase', onStartGamePhase);

    return () => {
      socket.off('connect', onConnect);
      socket.off('lobbyStateUpdated', onLobbyStateUpdated);
      socket.off('startRoleSelection', onStartRoleSelection);
      socket.off('nextPicker', onNextPicker);
      socket.off('rolesSelected', onRolesSelected);
      socket.off('startGamePhase', onStartGamePhase);
    };
  }, [sessionName]);

  const handlePickRole = (role: string) => {
    if (myId === currentPickerId) {
      socket.emit('pickRole', { role });
    }
  };

  return (
    <div className="game-board">
      {/* 📌 Список гравців з аватарками у верхньому лівому куті */}
      <div className="player-list-overlay">
        <strong>Гравці:</strong>
        <ul>
          {players.length === 0 ? (
            <li>Очікуємо гравців…</li>
          ) : (
            players.map((p) => (
              <li key={p.id}>
                {p.avatar ? (
                  <img
                    src={p.avatar}
                    alt={p.username}
                    className="small-avatar"
                  />
                ) : (
                  <div className="small-avatar placeholder">
                    {p.username.charAt(0).toUpperCase()}
                  </div>
                )}
                {p.username} {p.role ? `— ${p.role}` : ''}
              </li>
            ))
          )}
        </ul>
      </div>

      {/* 🔄 Гравці по колу */}
      <div className="circle-container">
        {players.map((p, index) => {
          const angle = (index / players.length) * 2 * Math.PI;
          const x = 200 * Math.cos(angle);
          const y = 200 * Math.sin(angle);
          return (
            <div
              key={p.id}
              className="player-avatar"
              style={{
                transform: `translate(${x}px, ${y}px)`,
                border: myId === p.id ? '3px solid gold' : 'none',
              }}
            >
              {p.avatar ? (
                <img src={p.avatar} alt={p.username} />
              ) : (
                <div className="avatar-placeholder">
                  {p.username.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="player-name">
                {p.username}
                {p.role ? ` — ${p.role}` : ''}
              </span>
            </div>
          );
        })}
      </div>

      <h1>🎮 Гра: {sessionName}</h1>
      <h2>Фаза: {phase === 1 ? 'Вибір ролей' : 'Гра у процесі'}</h2>

      {phase === 1 && myId === currentPickerId && (
        <div>
          <h3>Ваш хід! Оберіть роль:</h3>
          <ul>
            {availableRoles.map((role) => (
              <li key={role}>
                <button onClick={() => handlePickRole(role)}>{role}</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {phase === 1 && myId !== currentPickerId && (
        <p>
          Очікування вибору ролі гравцем:{' '}
          {players.find((p) => p.id === currentPickerId)?.username || '...'}
        </p>
      )}
    </div>
  );
};

export default GameBoard;
