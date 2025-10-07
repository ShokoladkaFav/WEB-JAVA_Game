import React from 'react';

interface Player {
  id: string;
  username: string;
  avatar?: string | null;
}

interface Props {
  players: Player[];
  currentPickerId: string;
}

const PlayerCircle: React.FC<Props> = ({ players, currentPickerId }) => {
  const isActive = (p: Player) => p.id === currentPickerId || p.username === currentPickerId;

  return (
    <div className="circle-container" aria-hidden>
      {players.map((p, index) => {
        const angle = players.length ? (index / players.length) * 2 * Math.PI : 0;
        const x = 200 * Math.cos(angle);
        const y = 200 * Math.sin(angle);
        const active = isActive(p);

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
                <div className="avatar-placeholder">
                  {p.username.charAt(0).toUpperCase()}
                </div>
              )}
              {active && <span className="turn-icon">⏳</span>}
            </div>
            <span className="player-name">{p.username}</span>
          </div>
        );
      })}
    </div>
  );
};

export default PlayerCircle;
