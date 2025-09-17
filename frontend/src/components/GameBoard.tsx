import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../sockets/socket';
import './GameBoard.css';

type Player = {
  id: string;
  username: string;
  role: string | null;
  avatar?: string | null;
  coins?: number;
  hand?: string[];
  built?: string[];
};

const GameBoard = () => {
  const { sessionName } = useParams();
  const myUsername = useMemo(() => sessionStorage.getItem('username') || '', []);

  const [players, setPlayers] = useState<Player[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [myId, setMyId] = useState<string | undefined>(undefined);
  const [currentPickerId, setCurrentPickerId] = useState<string>('');
  const [phase, setPhase] = useState<number>(1);

  const [myHand, setMyHand] = useState<string[]>([]);
  const [builtDistricts, setBuiltDistricts] = useState<string[]>([]);
  const [coins, setCoins] = useState<number>(2);
  const [myRole, setMyRole] = useState<string>('Невідомо');
  const [roleDescription, setRoleDescription] = useState<string>(
    'Виберіть роль, щоб побачити її опис'
  );
  const [showHand, setShowHand] = useState(false);
  const [cardChoices, setCardChoices] = useState<string[]>([]);
  const [buttonsDisabled, setButtonsDisabled] = useState(false);
  const [showBuildOverlay, setShowBuildOverlay] = useState(false);

  const mapPlayers = (arr: any[]): Player[] =>
    (arr || [])
      .map((u: any): Player | null => {
        if (!u) return null;
        const id = u.id ?? u.username;
        const username = u.username ?? '';
        if (!id && !username) return null;
        const role = u.role ?? null;
        const avatar = localStorage.getItem(`profileImage_${username}`) || null;
        const coins = u.coins ?? (u.coins === 0 ? 0 : 2);
        const hand = u.hand ?? [];
        const built = u.built ?? [];
        return { id, username, role, avatar, coins, hand, built };
      })
      .filter((p): p is Player => p !== null);

  const mergePlayers = (updated: Player[]) => {
    setPlayers(prev => {
      const merged = [...prev];
      updated.forEach(u => {
        const idx = merged.findIndex(p => p.username === u.username || p.id === u.id);
        if (idx !== -1) merged[idx] = { ...merged[idx], ...u };
        else merged.push(u);
      });
      return merged.filter(
        p => (p.id && p.id.toString().trim()) || (p.username && p.username.trim())
      );
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
      const roles: string[] = payload?.availableRoles ?? [];
      const rawPlayers: any[] = payload?.players ?? [];
      mergePlayers(mapPlayers(rawPlayers));
      setAvailableRoles(roles);
      setPhase(1);
      const rawPicker = payload?.currentPickerId ?? payload?.currentPicker ?? '';
      setCurrentPickerId(rawPicker);
    };

    const onNextPicker = (payload: any) => {
      const roles: string[] = payload?.availableRoles ?? [];
      if (roles && roles.length > 0) setAvailableRoles(roles);
      const rawPicker = payload?.currentPickerId ?? payload?.currentPicker ?? '';
      if (rawPicker) setCurrentPickerId(rawPicker);
    };

    const onRolesSelected = (updated: any[]) => {
      mergePlayers(mapPlayers(updated));
      const me = updated.find(u => u.username === myUsername || u.id === myId);
      if (me?.role) {
        setMyRole(me.role);
        setRoleDescription(`${me.role} — спеціальні властивості...`);
      }
    };

    const onStartGamePhase = ({ phase }: { phase: number }) => {
      setPhase(phase);
    };

    const onOfferCards = ({ cards }: { cards: string[] }) => {
      setCardChoices(cards || []);
      setButtonsDisabled(true);
    };

    const onCardsUpdated = (updated: any[]) => {
      mergePlayers(mapPlayers(updated));
      const me = updated.find(u => u.username === myUsername || u.id === myId);
      if (me?.hand) setMyHand(me.hand);
      if (me?.built) setBuiltDistricts(me.built);
      if (me?.coins !== undefined) setCoins(me.coins);
      setButtonsDisabled(false);
      setCardChoices([]);
      setShowBuildOverlay(false);
    };

    const onCoinsUpdated = (updated: any[]) => {
      mergePlayers(mapPlayers(updated));
      const me = updated.find(u => u.username === myUsername || u.id === myId);
      if (me?.coins !== undefined) setCoins(me.coins);
      setButtonsDisabled(false);
    };

    socket.on('connect', onConnect);
    socket.on('lobbyStateUpdated', onLobbyStateUpdated);
    socket.on('startRoleSelection', onStartRoleSelection);
    socket.on('nextPicker', onNextPicker);
    socket.on('rolesSelected', onRolesSelected);
    socket.on('startGamePhase', onStartGamePhase);
    socket.on('offerCards', onOfferCards);
    socket.on('cardsUpdated', onCardsUpdated);
    socket.on('coinsUpdated', onCoinsUpdated);

    return () => {
      socket.off('connect', onConnect);
      socket.off('lobbyStateUpdated', onLobbyStateUpdated);
      socket.off('startRoleSelection', onStartRoleSelection);
      socket.off('nextPicker', onNextPicker);
      socket.off('rolesSelected', onRolesSelected);
      socket.off('startGamePhase', onStartGamePhase);
      socket.off('offerCards', onOfferCards);
      socket.off('cardsUpdated', onCardsUpdated);
      socket.off('coinsUpdated', onCoinsUpdated);
    };
  }, [sessionName, myUsername, myId]);

  const amIPicker = useMemo(() => {
    if (!currentPickerId) return false;
    if (myId && currentPickerId === myId) return true;
    if (currentPickerId === myUsername) return true;
    const picker = players.find(p => p.id === currentPickerId || p.username === currentPickerId);
    return picker ? picker.id === myId || picker.username === myUsername : false;
  }, [currentPickerId, myId, myUsername, players]);

  const takeCoins = () => {
    if (!sessionName || buttonsDisabled) return;
    setButtonsDisabled(true);
    socket.emit('takeCoins', { sessionName });
  };

  const requestCards = () => {
    if (!sessionName || buttonsDisabled) return;
    setButtonsDisabled(true);
    socket.emit('requestCards', { sessionName });
  };

  const pickCard = (card: string) => {
    if (!sessionName) return;
    socket.emit('pickCard', { sessionName, card });
    setCardChoices([]);
  };

  const buildDistrict = (card: string) => {
    if (!sessionName) return;
    setButtonsDisabled(true);
    socket.emit('buildDistrict', { sessionName, card });
  };

  const isActivePlayer = (p: Player) =>
    !!currentPickerId && (p.id === currentPickerId || p.username === currentPickerId);

  const currentTurnName = useMemo(() => {
    const picker =
      players.find(p => p.id === currentPickerId) ||
      players.find(p => p.username === currentPickerId);
    return picker?.username || '';
  }, [players, currentPickerId]);

  return (
    <div className="game-board">
      {/* Список гравців */}
      <div className="player-list-overlay">
        <strong>Гравці:</strong>
        <ul>
          {players.length === 0 ? (
            <li>Очікуємо гравців…</li>
          ) : (
            players.map(p => {
              const active = isActivePlayer(p);
              return (
                <li key={`${p.id}-${p.username}`} className={active ? 'active-player' : ''}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img
                      src={p.avatar || '/icons/default-avatar.png'}
                      alt={p.username}
                      className="small-avatar"
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>
                        {p.username} {p.role && <>— {p.role}</>}
                      </span>
                      {typeof p.coins === 'number' && (
                        <span className="player-coins" title={`${p.username} монети`}>
                          <img src="/icons/coin.png" alt="Coin" className="coin-icon-small" />
                          {p.coins}
                        </span>
                      )}
                    </div>
                  </div>

                  {p.built && p.built.length > 0 && (
                    <div className="player-built-list" style={{ marginTop: 6 }}>
                      {p.built.map((card, i) => (
                        <img
                          key={`${p.username}-built-${i}`}
                          src={`/districts/${card}.png`}
                          alt={card}
                          className="built-card-small"
                        />
                      ))}
                    </div>
                  )}
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* Коло гравців на полі */}
      <div className="circle-container" aria-hidden>
        {players.map((p, index) => {
          const angle = players.length ? (index / players.length) * 2 * Math.PI : 0;
          const x = 200 * Math.cos(angle);
          const y = 200 * Math.sin(angle);
          const active = isActivePlayer(p);

          return (
            <div
              key={`${p.id}-${index}`}
              className="player-avatar"
              style={{ transform: `translate(${x}px, ${y}px)` }}
              title={p.username}
            >
              <div style={{ position: 'relative' }}>
                {p.avatar ? (
                  <img src={p.avatar} alt={p.username} />
                ) : (
                  <div className="avatar-placeholder">{p.username.charAt(0).toUpperCase()}</div>
                )}
                {active && <span className="turn-icon" aria-hidden>⏳</span>}
              </div>
              <span className="player-name">{p.username}</span>
            </div>
          );
        })}
      </div>

      <h1 className="game-title">🎮 Гра: {sessionName}</h1>

      <div className="game-phase">
        <div>Фаза: {phase === 1 ? 'Вибір ролей' : 'Гра у процесі'}</div>
        {currentTurnName && <div style={{ marginTop: 6 }}>Хід: <strong>{currentTurnName}</strong></div>}
      </div>

      {/* Вибір ролей */}
      {phase === 1 && amIPicker && availableRoles.length > 0 && (
        <div className="overlay">
          <div className="overlay-content">
            <h3>Ваш хід! Оберіть роль:</h3>
            <div className="role-card-grid">
              {availableRoles.map(role => (
                <button
                  key={role}
                  onClick={() => {
                    socket.emit('pickRole', { sessionName, role });
                    setAvailableRoles([]);
                  }}
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
        <p className="waiting-text" style={{ color: 'white', textAlign: 'center' }}>
          Очікування вибору ролі гравцем:{' '}
          {(() => {
            const picker =
              players.find(p => p.id === currentPickerId) ||
              players.find(p => p.username === currentPickerId);
            return picker?.username || '...';
          })()}
        </p>
      )}

      {/* Панель дій */}
      {phase !== 1 && amIPicker && (
        <div className="actions-panel">
          <button onClick={takeCoins} disabled={buttonsDisabled}>💰 Взяти 2 монети</button>
          <button onClick={requestCards} disabled={buttonsDisabled}>📜 Взяти креслення кварталу</button>
          <button
            onClick={() => setShowBuildOverlay(true)}
            disabled={buttonsDisabled || myHand.length === 0}
          >
            🏗 Побудувати квартал
          </button>
        </div>
      )}

      {/* Overlay для побудови кварталу */}
      {showBuildOverlay && (
        <div className="overlay" onClick={() => setShowBuildOverlay(false)}>
          <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: 'gold' }}>Оберіть карту у вашій руці для побудови</h3>
            <p>Клацніть по карті, щоб побудувати її.</p>
            <div className="card-choice-grid" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {myHand.map((card, i) => (
                <img
                  key={`${card}-${i}`}
                  src={`/districts/${card}.png`}
                  alt={card}
                  className="card-choice"
                  style={{ width: 120, height: 170, cursor: 'pointer' }}
                  onClick={() => buildDistrict(card)}
                />
              ))}
            </div>
            <button onClick={() => setShowBuildOverlay(false)}>Скасувати</button>
          </div>
        </div>
      )}

      {/* Вибір карт (offerCards) */}
      {cardChoices.length > 0 && (
        <div className="overlay" onClick={() => setCardChoices([])}>
          <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
            <h3>Оберіть карту:</h3>
            <div className="card-choice-grid" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {cardChoices.map((card, i) => (
                <img
                  key={`${card}-${i}`}
                  src={`/districts/${card}.png`}
                  alt={card}
                  className="card-choice"
                  style={{ width: 120, height: 170, cursor: 'pointer' }}
                  onClick={() => pickCard(card)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Побудовані квартали власного гравця */}
      <div className="built-districts">
        {builtDistricts.length ? (
          builtDistricts.map((card, i) => (
            <img key={`${card}-built-${i}`} src={`/districts/${card}.png`} alt={card} />
          ))
        ) : (
          <p style={{ color: 'white', margin: 0 }}>Ще немає побудованих</p>
        )}
      </div>

      {/* Монети */}
      <div className="coins">
        <img src="/icons/coin.png" alt="Coin" className="coin-icon" />
        <span className="coin-count">{coins}</span>
      </div>

      {/* Інфо про роль */}
      <div className="role-info-box">
        <h3>{myRole}</h3>
        <p>{roleDescription}</p>
      </div>

      {/* Кнопка toggle руки */}
      <div className="hand-toggle" onClick={() => setShowHand(true)}>
        <img
          src="/icons/arrow-down.png"
          alt="Показати руку"
          style={{ width: 40, height: 40, cursor: 'pointer' }}
        />
      </div>

      {/* Віконце з рукою */}
      {showHand && (
        <div className="overlay" onClick={() => setShowHand(false)}>
          <div
            className="overlay-content"
            style={{ background: '#222', borderRadius: 12, padding: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: 'gold' }}>Ваша рука</h3>
            {myHand.length === 0 ? (
              <p style={{ color: 'white' }}>Рука порожня</p>
            ) : (
              <div
                className="hand-cards-grid"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: 12,
                }}
              >
                {myHand.map((card, i) => (
                  <img
                    key={`${card}-${i}`}
                    src={`/districts/${card}.png`}
                    alt={card}
                    className="card-hand"
                    style={{ width: 120, height: 170 }}
                  />
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
              <button onClick={() => setShowHand(false)}>Закрити</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
