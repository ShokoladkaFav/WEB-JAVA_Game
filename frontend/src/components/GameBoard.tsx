import { useEffect, useMemo, useState } from 'react';
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
  const myUsername = useMemo(() => sessionStorage.getItem('username') || '', []);
  const [players, setPlayers] = useState<Player[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [myId, setMyId] = useState<string | undefined>(undefined);
  const [currentPickerId, setCurrentPickerId] = useState<string>('');
  const [phase, setPhase] = useState<number>(1);

  // 🎴 демо-стани
  const [myHand, setMyHand] = useState<string[]>(['district1', 'district2']);
  const [builtDistricts, setBuiltDistricts] = useState<string[]>([]);
  const [coins, setCoins] = useState<number>(2);
  const [myRole, setMyRole] = useState<string>('Невідомо');
  const [roleDescription, setRoleDescription] = useState<string>(
    'Виберіть роль, щоб побачити її опис'
  );

  // 🛠 мапер від сирих даних до Player
  const mapPlayers = (arr: any[]): Player[] =>
    (arr || [])
      .map((u: any): Player | null => {
        if (!u) return null;
        const id = u.id ?? u.socketId ?? u.sid ?? u.username;
        const username = u.username ?? u.name ?? '';

        if (!id && !username) return null;

        const role = u.role ?? null;
        const avatar = localStorage.getItem(`profileImage_${username}`) || null;
        return { id, username, role, avatar };
      })
      .filter((p): p is Player => p !== null);

  const mergePlayers = (updated: Player[]) => {
    setPlayers(prev => {
      const merged = [...prev];
      updated.forEach(u => {
        const idx = merged.findIndex(p => p.username === u.username || p.id === u.id);
        if (idx !== -1) {
          merged[idx] = { ...merged[idx], ...u };
        } else {
          merged.push(u);
        }
      });
      return merged.filter(p => (p.id && p.id.trim()) || (p.username && p.username.trim()));
    });
  };

  useEffect(() => {
    const onConnect = () => setMyId(socket.id);

    if (sessionName && myUsername) {
      socket.emit('joinLobby', { sessionName, username: myUsername });
    }

    const requestState = () => {
      if (sessionName) socket.emit('getSessionState', { sessionName });
    };
    if (socket.connected) requestState();
    else socket.once('connect', requestState);

    const onLobbyStateUpdated = (session: any) => {
      if (!session || session.name !== sessionName) return;
      mergePlayers(mapPlayers(session.players));
    };

    const onStartRoleSelection = (payload: any) => {
      const roles: string[] = payload?.availableRoles ?? payload?.roles ?? [];
      const rawPlayers: any[] = payload?.players ?? [];
      mergePlayers(mapPlayers(rawPlayers));
      setAvailableRoles(roles);
      setPhase(1);

      const rawPicker = payload?.currentPickerId ?? payload?.currentPicker ?? '';
      setCurrentPickerId(rawPicker);
    };

    const onNextPicker = (payload: any) => {
      const roles: string[] = payload?.availableRoles ?? payload?.roles ?? [];
      setAvailableRoles(roles);

      const rawPicker = payload?.currentPickerId ?? payload?.currentPicker ?? '';
      if (rawPicker) {
        setCurrentPickerId(rawPicker);
      }
    };

    const onRolesSelected = (updated: any[]) => {
      mergePlayers(mapPlayers(updated));

      const me = updated.find(u => u.username === myUsername || u.id === myId);
      if (me?.role) {
        setMyRole(me.role);
        setRoleDescription(`${me.role} — спеціальні властивості...`);
      }
    };

    const onStartGamePhase = ({ phase }: { phase: number }) => setPhase(phase);

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
  }, [sessionName, myUsername, myId]);

  const amIPicker = useMemo(() => {
    if (!currentPickerId) return false;
    if (myId && currentPickerId === myId) return true;
    if (currentPickerId === myUsername) return true;
    const picker = players.find(p => p.id === currentPickerId || p.username === currentPickerId);
    return picker ? picker.id === myId || picker.username === myUsername : false;
  }, [currentPickerId, myId, myUsername, players]);

  const handlePickRole = (role: string) => {
    if (!amIPicker) return;
    socket.emit('pickRole', { sessionName, role });
    setAvailableRoles([]); // Закриваємо overlay
  };

  const buildDistrict = (card: string) => {
    setMyHand(prev => prev.filter(c => c !== card));
    setBuiltDistricts(prev => [...prev, card]);
    setCoins(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="game-board">
      {/* 📌 Список гравців */}
      <div className="player-list-overlay">
        <strong>Гравці:</strong>
        <ul>
          {players.length === 0 ? (
            <li>Очікуємо гравців…</li>
          ) : (
            players.map(p => (
              <li key={`${p.id}-${p.username}`}>
                {p.username}{' '}
                {p.role && (
                  <>
                    — {p.role}{' '}
                    <img
                      src={`/ROLE_kard/${p.role}.png`}
                      alt={p.role}
                      className="small-role-card"
                    />
                  </>
                )}
              </li>
            ))
          )}
        </ul>
      </div>

      {/* 🔄 Коло гравців */}
      <div className="circle-container">
        {players.map((p, index) => {
          const angle = players.length ? (index / players.length) * 2 * Math.PI : 0;
          const x = 200 * Math.cos(angle);
          const y = 200 * Math.sin(angle);
          return (
            <div
              key={`${p.id}-${index}`}
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
                {p.role && (
                  <div className="role-info">
                    <img src={`/ROLE_kard/${p.role}.png`} alt={p.role} className="role-card" />
                    <span>{p.role}</span>
                  </div>
                )}
              </span>
            </div>
          );
        })}
      </div>

      <h1 className="game-title">🎮 Гра: {sessionName}</h1>
      <h2 className="game-phase">Фаза: {phase === 1 ? 'Вибір ролей' : 'Гра у процесі'}</h2>

      {/* 🃏 Overlay вибору ролей */}
      {phase === 1 && amIPicker && availableRoles.length > 0 && (
        <div className="overlay">
          <div className="overlay-content">
            <h3>Ваш хід! Оберіть роль:</h3>
            <div className="role-card-grid">
              {availableRoles.map(role => (
                <button
                  key={role}
                  onClick={() => handlePickRole(role)}
                  className="role-card-button"
                >
                  <img src={`/ROLE_kard/${role}.png`} alt={role} className="role-card" />
                  <span>{role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === 1 && !amIPicker && (
        <p className="waiting-text">
          Очікування вибору ролі гравцем:{' '}
          {(() => {
            const picker =
              players.find(p => p.id === currentPickerId) ||
              players.find(p => p.username === currentPickerId);
            return picker?.username || '...';
          })()}
        </p>
      )}

      {/* 🔴 Рука карт */}
      <div className="hand-cards">
        {myHand.map((card, i) => (
          <img
            key={`${card}-${i}`}
            src={`/districts/${card}.png`}
            alt={card}
            className="card-hand"
            onClick={() => buildDistrict(card)}
          />
        ))}
      </div>

      {/* 🔵 Побудовані квартали */}
      <div className="built-districts">
        {builtDistricts.length ? (
          builtDistricts.map((card, i) => (
            <img key={`${card}-built-${i}`} src={`/districts/${card}.png`} alt={card} />
          ))
        ) : (
          <p style={{ color: 'white', margin: 0 }}>Ще немає побудованих</p>
        )}
      </div>

      {/* 🟡 Монети */}
      <div className="coins">
        <img src="/icons/coin.png" alt="Coin" className="coin-icon" />
        <span className="coin-count">{coins}</span>
      </div>

      {/* ⚫ Інфо про роль */}
      <div className="role-info-box">
        <h3>{myRole}</h3>
        <p>{roleDescription}</p>
      </div>
    </div>
  );
};

export default GameBoard;
