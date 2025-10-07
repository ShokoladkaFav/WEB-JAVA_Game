import React from 'react';
import { getCardInfo } from './getCardInfo';


interface Props {
  visible: boolean;
  myHand: string[];
  onBuild: (card: string) => void;
  onClose: () => void;
}

const BuildOverlay: React.FC<Props> = ({ visible, myHand, onBuild, onClose }) => {
  if (!visible) return null;

  const renderCard = (card: string, i: number) => {
    const info = getCardInfo(card);
    return (
      <div
        key={`${card}-${i}`}
        className="district-card"
        onClick={() => onBuild(card)}
        style={{ cursor: 'pointer' }}
      >
        <img src={info?.image || `/districts/${card}.png`} alt={info?.name || card} />
        <div className="card-info">
          <strong>{info?.name || card}</strong>
          <p>💰 {info?.cost ?? '?'}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="overlay-content" onClick={e => e.stopPropagation()}>
        <h3 style={{ color: 'gold' }}>Оберіть карту для побудови</h3>
        <div className="card-choice-grid">
          {myHand.map((card, i) => renderCard(card, i))}
        </div>
        <button onClick={onClose}>Скасувати</button>
      </div>
    </div>
  );
};

export default BuildOverlay;
