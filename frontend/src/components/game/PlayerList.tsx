import React from 'react';
import { getCardInfo } from './getCardInfo';


interface Player {
  id: string;
  username: string;
  role: string | null;
  avatar?: string | null;
  coins?: number;
  built?: string[];
}

interface Props {
  players: Player[];
  currentPickerId: string;
}

const PlayerList: React.FC<Props> = ({ players, currentPickerId }) => {
  const isActive = (p: Player) => p.id === currentPickerId || p.username === currentPickerId;

  const renderCard = (card: string, i: number) => {
    const info = getCardInfo(card);
    return (
      <div key={`${card}-${i}`} className="district-card district-card-small">
        <img src={info?.image || `/districts/${card}.png`} alt={info?.name || card} />
      </div>
    );
  };

  return (
    <div className="player-list-overlay">
      <strong>Гравці:</strong>
      <ul>
        {players.length === 0 ? (
          <li>Очікуємо гравців…</li>
        ) : (
          players.map(p => (
            <li key={p.id} className={isActive(p) ? 'active-player' : ''}>
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
                    <span className="player-coins">
                      <img src="/icons/coin.png" alt="Coin" className="coin-icon-small" />
                      {p.coins}
                    </span>
                  )}
                </div>
              </div>
              {Array.isArray(p.built) && p.built.length > 0 && (
                <div className="player-built-list" style={{ marginTop: 6 }}>
                  {p.built.map((card, i) => renderCard(card, i))}
                </div>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default PlayerList;
