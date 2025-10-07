import React from 'react';
import { getCardInfo } from './getCardInfo';


interface Props {
  showHand: boolean;
  setShowHand: (value: boolean) => void;
  myHand: string[];
}

const HandOverlay: React.FC<Props> = ({ showHand, setShowHand, myHand }) => {
  if (!showHand) return null;

  const renderCard = (card: string, i: number) => {
    const info = getCardInfo(card);
    return (
      <div key={`${card}-${i}`} className="district-card">
        <img src={info?.image || `/districts/${card}.png`} alt={info?.name || card} />
        <div className="card-info">
          <strong>{info?.name || card}</strong>
          <p>💰 {info?.cost ?? '?'}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="overlay" onClick={() => setShowHand(false)}>
      <div className="overlay-content" onClick={e => e.stopPropagation()}>
        <h3 style={{ color: 'gold' }}>Ваші карти</h3>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center',
          }}
        >
          {myHand.length > 0 ? myHand.map((card, i) => renderCard(card, i)) : <p>Немає карт у руці</p>}
        </div>
        <button onClick={() => setShowHand(false)}>Закрити</button>
      </div>
    </div>
  );
};

export default HandOverlay;
