import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../sockets/socket';
import './GameBoard.css';
import districtsData from '../data/districtCards.json';

// 🧩 Компоненти
import PlayerList from '../components/game/PlayerList';
import PlayerCircle from '../components/game/PlayerCircle';
import RoleSelectOverlay from '../components/game/RoleSelectOverlay';
import BuildOverlay from '../components/game/BuildOverlay';
import CardChoiceOverlay from '../components/game/CardChoiceOverlay';
import HandOverlay from '../components/game/HandOverlay';

// 🧰 Типи
type Player = {
  id: string;
  username: string;
  role: string | null;
  avatar?: string | null;
  coins?: number;
  hand?: string[];
  built?: string[];
};

interface DistrictCard {
  id: string;
  name: string;
  category: string;
  cost: number;
  image: string;
  effect?: string;
}

interface DistrictCardsFile {
  districts: DistrictCard[];
}

const data = districtsData as DistrictCardsFile;

// 🔍 Пошук картки
export const getCardInfo = (cardId: string): DistrictCard | undefined =>
  data.districts.find((c: DistrictCard) => c.id === cardId);

const GameBoard = () => {
  const { sessionName } = useParams();
  const myUsername = useMemo(() => sessionStorage.getItem('username') || '', []);

  // 📊 Стан
  const [players, setPlayers] = useState<Player[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [myId, setMyId] = useState<string>();
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

  // 🧩 Маппінг гравців
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
        const idx = merged.findIndex(
          p => p.username === u.username || p.id === u.id
        );
        if (idx !== -1) merged[idx] = { ...merged[idx], ...u };
        else merged.push(u);
      });
      return merged.filter(
        p =>
          (p.id && p.id.toString().trim()) ||
          (p.username && p.username.trim())
      );
    });
  };

  // 🔌 Сокети
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
      setCurrentPickerId(
        payload?.currentPickerId ?? payload?.currentPicker ?? ''
      );
    };

    const onNextPicker = (payload: any) => {
      setAvailableRoles(payload?.availableRoles ?? []);
      setCurrentPickerId(
        payload?.currentPickerId ?? payload?.currentPicker ?? ''
      );
    };

    const onRolesSelected = (updated: any[]) => {
      mergePlayers(mapPlayers(updated));
      const me = updated.find(
        u => u.username === myUsername || u.id === myId
      );
      if (me?.role) {
        setMyRole(me.role);
        setRoleDescription(`${me.role} — спеціальні властивості...`);
      }
    };

    const onStartGamePhase = ({ phase }: { phase: number }) =>
      setPhase(phase);

    const onOfferCards = ({ cards }: { cards: string[] }) => {
      setCardChoices(cards || []);
      setButtonsDisabled(true);
    };

    const onCardsUpdated = (updated: any[]) => {
      mergePlayers(mapPlayers(updated));
      const me = updated.find(
        u => u.username === myUsername || u.id === myId
      );
      if (me?.hand) setMyHand(me.hand);
      if (me?.built) setBuiltDistricts(me.built);
      if (me?.coins !== undefined) setCoins(me.coins);
      setButtonsDisabled(false);
      setCardChoices([]);
      setShowBuildOverlay(false);
    };

    const onCoinsUpdated = (updated: any[]) => {
      mergePlayers(mapPlayers(updated));
      const me = updated.find(
        u => u.username === myUsername || u.id === myId
      );
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

  // 🧮 Перевірка активного гравця
  const amIPicker = useMemo(() => {
    if (!currentPickerId) return false;
    if (myId && currentPickerId === myId) return true;
    if (currentPickerId === myUsername) return true;
    const picker = players.find(
      p => p.id === currentPickerId || p.username === currentPickerId
    );
    return picker
      ? picker.id === myId || picker.username === myUsername
      : false;
  }, [currentPickerId, myId, myUsername, players]);

  // 🟡 Дії
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

  // ===============================
  // 🔰 Рендер
  // ===============================
  return (
    <div className="game-board">
      <PlayerList players={players} currentPickerId={currentPickerId} />
      <PlayerCircle players={players} currentPickerId={currentPickerId} />
      <h1 className="game-title">🎮 Гра: {sessionName}</h1>

      <div className="game-phase">
        <div>Фаза: {phase === 1 ? 'Вибір ролей' : 'Гра у процесі'}</div>
      </div>

      <RoleSelectOverlay
        phase={phase}
        amIPicker={amIPicker}
        availableRoles={availableRoles}
        sessionName={sessionName}
        players={players}
        currentPickerId={currentPickerId}
      />

      <BuildOverlay
        visible={showBuildOverlay}
        myHand={myHand}
        onBuild={buildDistrict}
        onClose={() => setShowBuildOverlay(false)}
      />

      <CardChoiceOverlay cards={cardChoices} onPick={pickCard} />
      <HandOverlay
        showHand={showHand}
        setShowHand={setShowHand}
        myHand={myHand}
      />

      {/* 🟣 Кнопка toggle руки */}
      <div className="hand-toggle" onClick={() => setShowHand(true)}>
        <img
          src="/icons/arrow-down.png"
          alt="Показати руку"
          style={{ width: 40, height: 40, cursor: 'pointer' }}
        />
      </div>

      {/* Кнопки дій */}
      {phase !== 1 && amIPicker && (
        <div className="actions-panel">
          <button onClick={takeCoins} disabled={buttonsDisabled}>
            💰 Взяти 2 монети
          </button>
          <button onClick={requestCards} disabled={buttonsDisabled}>
            📜 Взяти креслення кварталу
          </button>
          <button
            onClick={() => setShowBuildOverlay(true)}
            disabled={buttonsDisabled || myHand.length === 0}
          >
            🏗 Побудувати квартал
          </button>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
