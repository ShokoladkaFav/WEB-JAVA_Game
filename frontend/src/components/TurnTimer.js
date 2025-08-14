import { useEffect, useRef } from "react";

const TurnTimer = ({ onTimeout, isPlayerTurn }) => {
  const timerRef = useRef(null);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isPlayerTurn) {
      timerRef.current = setTimeout(() => {
        onTimeout(); // Автоматичне завершення ходу
      }, 180000); // 3 хвилини
    }
  };

  // Слухаємо активність користувача
  useEffect(() => {
    if (!isPlayerTurn) return;

    const events = ["mousemove", "keydown", "click"];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer(); // старт таймера

    return () => {
      clearTimeout(timerRef.current);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [isPlayerTurn]);

  return null;
};

export default TurnTimer;
