import React from 'react';
import socket from '../../sockets/socket';

interface Props {
  phase: number;
  amIPicker: boolean;
  availableRoles: string[];
  sessionName?: string;
  players: any[];
  currentPickerId: string;
}

const RoleSelectOverlay: React.FC<Props> = ({
  phase,
  amIPicker,
  availableRoles,
  sessionName,
  players,
  currentPickerId
}) => {
  if (phase !== 1) return null;

  if (amIPicker && availableRoles.length > 0) {
    return (
      <div className="overlay">
        <div className="overlay-content">
          <h3>Ваш хід! Оберіть роль:</h3>
          <div className="role-card-grid">
            {availableRoles.map(role => (
              <button
                key={role}
                onClick={() => socket.emit('pickRole', { sessionName, role })}
                className="role-card-button"
              >
                <img src={`/ROLE_kard/${role}.png`} alt={role} className="role-card" />
                <span>{role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentPicker =
    players.find(p => p.id === currentPickerId) ||
    players.find(p => p.username === currentPickerId);

  return (
    <p className="waiting-text" style={{ color: 'white', textAlign: 'center' }}>
      Очікування вибору ролі гравцем: {currentPicker?.username || '...'}
    </p>
  );
};

export default RoleSelectOverlay;
