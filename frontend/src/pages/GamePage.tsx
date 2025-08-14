// src/pages/GamePage.tsx
import React from 'react';
import GameBoard from '../components/GameBoard';
import './GamePage.css';

const GamePage: React.FC = () => {
  // Таймер бездіяльності було видалено, оскільки він міг переривати гру,
  // коли користувач просто обмірковує свій хід.
  // Логіку AFK (away from keyboard) краще реалізовувати на стороні сервера з прив'язкою до таймера ходу.

  return (
    <div className="game-page">
      <GameBoard />
    </div>
  );
};

export default GamePage;
