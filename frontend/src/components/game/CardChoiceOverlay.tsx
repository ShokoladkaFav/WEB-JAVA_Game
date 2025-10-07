import React from 'react';
import { getCardInfo } from './getCardInfo';

interface Props {
  cards: string[];
  onPick: (card: string) => void;
}

const CardChoiceOverlay: React.FC<Props> = ({ cards, onPick }) => {
  if (!cards || cards.length === 0) return null;

  return (
    <div
      className="overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
      }}
    >
      <div
        className="overlay-content"
        style={{
          background: 'radial-gradient(circle at top, #1c1c1c 0%, #000 100%)',
          border: '3px solid gold',
          borderRadius: 16,
          padding: '40px 60px',
          boxShadow: '0 0 40px gold',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            color: 'gold',
            marginBottom: 30,
            fontSize: 26,
            fontWeight: 'bold',
          }}
        >
          Оберіть карту:
        </h2>

        <div
          style={{
            display: 'flex',
            gap: 30,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {cards.map((card, i) => {
            const info = getCardInfo(card);
            return (
              <div
                key={`${card}-${i}`}
                className="card-choice"
                onClick={() => onPick(card)}
                style={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform =
                    'scale(1.05)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    '0 0 15px gold';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform =
                    'scale(1.0)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                <img
                  src={info?.image || `/districts/${card}.png`}
                  alt={info?.name || card}
                  style={{
                    width: 180,
                    height: 250,
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <div
                  style={{
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '6px 0',
                    textAlign: 'center',
                    fontWeight: 600,
                  }}
                >
                  {info?.name || card} — 💰{info?.cost ?? '?'}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => onPick('')}
          style={{
            marginTop: 30,
            backgroundColor: '#333',
            color: 'white',
            border: '2px solid gold',
            borderRadius: 8,
            padding: '10px 20px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
          onMouseEnter={e =>
            ((e.target as HTMLButtonElement).style.backgroundColor = '#555')
          }
          onMouseLeave={e =>
            ((e.target as HTMLButtonElement).style.backgroundColor = '#333')
          }
        >
          Скасувати
        </button>
      </div>
    </div>
  );
};

export default CardChoiceOverlay;
