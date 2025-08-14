import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../sockets/socket';
import './GameBoard.css';

type Player = {
  id: string;
  username: string;
  role: string | null;
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

    // 1) Гарантовано заходимо в кімнату сесії (на випадок переходу з лоббі на гру)
    if (sessionName && username) {
      socket.emit('joinLobby', { sessionName, username });
    }

    // 2) Функція запиту поточного стану
    const requestState = () => {
      if (sessionName) {
        socket.emit('getSessionState', { sessionName });
      }
    };

    // Якщо сокет уже підключений (частий кейс — ми прийшли з лоббі)
    if (socket.connected) {
      requestState();
    } else {
      socket.once('connect', requestState);
    }

    // ---- Лістенери ----
    const onConnect = () => setMyId(socket.id);

    const onLobbyStateUpdated = (session: any) => {
      if (!session || session.name !== sessionName) return;

      // session.players з сервера — масив юзернеймів (string[])
      // Уніфікуємо до Player[]
      const mapped: Player[] = (session.players || []).map((u: any) => {
        // якщо прийде об'єкт — підтримаємо і його
        const username = typeof u === 'string' ? u : (u.username ?? '');
        const role = typeof u === 'string' ? null : (u.role ?? null);
        return {
          id: username, // id тимчасово = username
          username,
          role,
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
      setAvailableRoles(availableRoles || []);
      setPlayers(players || []);
      setPhase(1);
      setCurrentPickerId(players && players.length > 0 ? players[0].id : '');
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
      setPlayers(updatedPlayers || []);
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

    // cleanup
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
      {/* Фіксована панель гравців зверху-зліва */}
      <div className="player-list-overlay">
        <strong>Гравці:</strong>
        <ul>
          {players.length === 0 ? (
            <li>Очікуємо гравців…</li>
          ) : (
            players.map((p) => (
              <li key={p.id}>
                {p.username} {p.role ? `— ${p.role}` : ''}
              </li>
            ))
          )}
        </ul>
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

      <h3>Гравці та їх ролі:</h3>
      <ul>
        {players.map((player) => (
          <li key={player.id}>
            {player.username} — {player.role || 'Ще не вибрано'}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GameBoard;
