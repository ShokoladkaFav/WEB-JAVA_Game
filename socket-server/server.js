// server.js — повний, готовий для вставки

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// -------------------------
// Стан сервера в пам'яті
// -------------------------
let sessions = {};            // sessionName -> { name, host, password, maxPlayers, players[], readyPlayers[], selectedRoles, game? }
const userSockets = {};       // username -> socket.id
const userToSession = {};     // username -> sessionName
const friendRequests = {};    // username -> [requesters]
const userFriends = {};       // username -> [friends]
const disconnectTimers = {};  // username -> timeoutId

function updateLobbyState(sessionName) {
  const session = sessions[sessionName];
  if (session) {
    io.to(sessionName).emit('lobbyStateUpdated', session);
  }
  io.emit('sessionsUpdated', Object.values(sessions));
}

// Допоміжне: безпечно дістати username із сокета
function getUsernameFromSocket(socket) {
  return socket.data?.username || Object.entries(userSockets).find(([, id]) => id === socket.id)?.[0] || null;
}

// -------------------------
io.on('connection', (socket) => {
  console.log('🟢 Connected', socket.id);

  // -------------------------
  // Реєстрація username
  // -------------------------
  socket.on('registerUsername', (username) => {
    if (!username) return;
    userSockets[username] = socket.id;
    socket.data.username = username;

    if (!friendRequests[username]) friendRequests[username] = [];
    if (!userFriends[username]) userFriends[username] = [];

    if (disconnectTimers[username]) {
      clearTimeout(disconnectTimers[username]);
      delete disconnectTimers[username];
    }

    console.log(`👤 registerUsername: ${username} -> ${socket.id}`);
  });

  // -------------------------
  // Повернути всі сесії
  // -------------------------
  socket.on('getSessions', () => {
    socket.emit('sessionsUpdated', Object.values(sessions));
  });

  // -------------------------
  // Створити нову сесію
  // -------------------------
  socket.on('createSession', (data, callback) => {
    const { name, host, password, maxPlayers } = data || {};
    if (!name || !host) {
      callback?.({ success: false, message: 'Invalid session' });
      return;
    }
    if (sessions[name]) {
      callback?.({ success: false, message: 'Session already exists' });
      return;
    }

    sessions[name] = {
      name,
      host,
      password: password || null,
      maxPlayers: maxPlayers || 8,
      players: [host],
      readyPlayers: [],
      selectedRoles: {}, 
      game: null,
    };

    userToSession[host] = name;
    socket.join(name);
    updateLobbyState(name);
    socket.emit('joinedSession', name);
    callback?.({ success: true });
    console.log(`🎮 Created session: ${name} by ${host}`);
  });

  // -------------------------
  // Приєднатися до сесії
  // -------------------------
  socket.on('joinSession', ({ sessionName, username, password }) => {
    const session = sessions[sessionName];
    if (!session) return socket.emit('joinSessionError', 'Session not found');
    if (session.password && session.password !== password) return socket.emit('joinSessionError', 'Wrong password');
    if (session.players.length >= session.maxPlayers) return socket.emit('joinSessionError', 'Session full');

    if (!session.players.includes(username)) {
      session.players.push(username);
    }
    userToSession[username] = sessionName;
    socket.data.username = username;
    socket.join(sessionName);
    updateLobbyState(sessionName);
    socket.emit('joinedSession', sessionName);
    console.log(`➕ ${username} joined session ${sessionName}`);
  });

  // -------------------------
  // Приєднатися до лоббі
  // -------------------------
  socket.on('joinLobby', ({ sessionName, username }) => {
    const session = sessions[sessionName];
    if (!session) {
      socket.emit('lobbyNotFound');
      return;
    }
    if (!session.players.includes(username)) {
      session.players.push(username);
    }
    userToSession[username] = sessionName;
    socket.data.username = username;
    socket.join(sessionName);
    updateLobbyState(sessionName);
    socket.emit('joinedSession', sessionName);
    console.log(`💬 ${username} joined lobby ${sessionName}`);
  });

  // -------------------------
  // Вийти з лоббі
  // -------------------------
  socket.on('leaveLobby', ({ sessionName, username }) => {
    const session = sessions[sessionName];
    if (!session) return;

    session.players = session.players.filter((p) => p !== username);
    session.readyPlayers = (session.readyPlayers || []).filter((p) => p !== username);
    delete userToSession[username];
    socket.leave(sessionName);

    if (session.players.length === 0) {
      delete sessions[sessionName];
      io.emit('sessionsUpdated', Object.values(sessions));
      io.to(sessionName).emit('lobbyClosed');
      console.log(`🗑️ Session ${sessionName} removed (empty)`);
    } else {
      updateLobbyState(sessionName);
      console.log(`🚪 ${username} left lobby ${sessionName}`);
    }
  });

  // -------------------------
  // toggleReady
  // -------------------------
  socket.on('toggleReady', ({ sessionName, username }) => {
    const session = sessions[sessionName];
    if (!session) return;

    session.readyPlayers = session.readyPlayers || [];
    const idx = session.readyPlayers.indexOf(username);
    if (idx === -1) session.readyPlayers.push(username);
    else session.readyPlayers.splice(idx, 1);

    updateLobbyState(sessionName);
    console.log(`✅ toggleReady ${username} in ${sessionName}`);
  });

  // -------------------------
  // updateRoles
  // -------------------------
  socket.on('updateRoles', ({ sessionName, roles }) => {
    const session = sessions[sessionName];
    if (!session) return;
    session.selectedRoles = roles || {};
    updateLobbyState(sessionName);
    console.log(`🔧 Roles updated in ${sessionName}`);
  });

  // -------------------------
  // ======= ІГРОВА ЛОГІКА =======
  // -------------------------

  function getRoundRoles(session) {
    const count = session.players.length;
    const list = [];
    for (let i = 1; i <= count; i++) {
      const r = session.selectedRoles?.[i];
      if (r) list.push(r);
    }
    return list;
  }

  socket.on('startGame', ({ sessionName }) => {
    const session = sessions[sessionName];
    if (!session) return;

    const rolesForRound = getRoundRoles(session);
    const players = [...session.players];

    session.game = {
      phase: 1,
      availableRoles: rolesForRound,
      picks: {},
      order: players,
      currentIndex: 0,
      turnNumber: 0,
    };

    io.to(sessionName).emit('gameStarted', { sessionName, players });

    const payloadPlayers = players.map((u) => ({ id: u, username: u, role: null }));
    const currentPickerId = session.game.order[session.game.currentIndex];

    io.to(sessionName).emit('startRoleSelection', {
      availableRoles: [...session.game.availableRoles],
      players: payloadPlayers,
      currentPickerId, // 🔥 додано, щоб фронт бачив хто обирає
    });

    console.log(`🚀 Game started in ${sessionName}. Roles: ${rolesForRound.join(', ')}`);
  });

  socket.on('getSessionState', ({ sessionName }) => {
    const session = sessions[sessionName];
    if (!session) return;

    socket.emit('lobbyStateUpdated', session);

    if (session.game?.phase === 1) {
      const players = session.players.map((u) => ({
        id: u,
        username: u,
        role: session.game.picks[u] || null,
      }));

      const currentPickerId = session.game.order[session.game.currentIndex];

      socket.emit('startRoleSelection', {
        availableRoles: [...session.game.availableRoles],
        players,
        currentPickerId, // 🔥 додано
      });

      socket.emit('rolesSelected', players);
    }

    if (session.game?.phase >= 2) {
      socket.emit('startGamePhase', { phase: session.game.phase });
    }
  });

  socket.on('pickRole', ({ role }) => {
    const username = getUsernameFromSocket(socket);
    if (!username) return;

    const sessionName = userToSession[username];
    const session = sessions[sessionName];
    if (!session || !session.game || session.game.phase !== 1) return;

    const { availableRoles, picks, order, currentIndex } = session.game;
    const currentPicker = order[currentIndex];

    if (username !== currentPicker) return;
    if (!availableRoles.includes(role)) return;

    picks[username] = role;
    session.game.availableRoles = availableRoles.filter((r) => r !== role);

    const playersPayload = session.players.map((u) => ({
      id: u,
      username: u,
      role: picks[u] || null,
    }));
    io.to(sessionName).emit('rolesSelected', playersPayload);

    if (currentIndex + 1 < order.length) {
      session.game.currentIndex += 1;
      const nextPickerId = order[session.game.currentIndex];
      io.to(sessionName).emit('nextPicker', {
        currentPickerId: nextPickerId,
        availableRoles: [...session.game.availableRoles],
      });
    } else {
      session.game.phase = 2;
      io.to(sessionName).emit('startGamePhase', { phase: 2 });
      console.log(`🧭 Roles done in ${sessionName}. Picks: ${JSON.stringify(picks)}`);
    }
  });

  // -------------------------
  // removeSession
  // -------------------------
  socket.on('removeSession', ({ sessionName, username }) => {
    const session = sessions[sessionName];
    if (session && session.host === username) {
      delete sessions[sessionName];
      io.emit('sessionsUpdated', Object.values(sessions));
      io.to(sessionName).emit('lobbyClosed');
      console.log(`🧹 Session ${sessionName} removed by host ${username}`);
    }
  });

  // -------------------------
  // kickPlayer
  // -------------------------
  socket.on('kickPlayer', ({ sessionName, playerToKick }) => {
    const session = sessions[sessionName];
    if (!session) return;

    session.players = session.players.filter((p) => p !== playerToKick);
    session.readyPlayers = (session.readyPlayers || []).filter((p) => p !== playerToKick);
    delete userToSession[playerToKick];

    const kickedSocketId = userSockets[playerToKick];
    if (kickedSocketId) {
      io.to(kickedSocketId).emit('kicked', { sessionName });
    }

    updateLobbyState(sessionName);
    console.log(`👢 ${playerToKick} kicked from ${sessionName}`);
  });

  // -------------------------
  // Друзі
  // -------------------------
  socket.on('getFriendData', ({ username }) => {
    socket.emit('friendData', {
      friends: userFriends[username] || [],
      requests: friendRequests[username] || [],
    });
  });

  socket.on('sendFriendRequest', ({ to, from }) => {
    if (!friendRequests[to]) friendRequests[to] = [];
    if (!friendRequests[to].includes(from)) friendRequests[to].push(from);
    const toSocket = userSockets[to];
    if (toSocket) {
      io.to(toSocket).emit('friendRequestReceived', { requests: friendRequests[to] });
    }
  });

  socket.on('acceptFriendRequest', ({ requester, acceptor }) => {
    userFriends[acceptor] = userFriends[acceptor] || [];
    userFriends[requester] = userFriends[requester] || [];
    if (!userFriends[acceptor].includes(requester)) userFriends[acceptor].push(requester);
    if (!userFriends[requester].includes(acceptor)) userFriends[requester].push(acceptor);
    friendRequests[acceptor] = (friendRequests[acceptor] || []).filter(r => r !== requester);

    const accSocket = userSockets[acceptor];
    const reqSocket = userSockets[requester];
    if (accSocket) io.to(accSocket).emit('friendAdded', { friends: userFriends[acceptor], requests: friendRequests[acceptor] });
    if (reqSocket) io.to(reqSocket).emit('friendAdded', { friends: userFriends[requester], requests: friendRequests[requester] || [] });
  });

  socket.on('rejectFriendRequest', ({ requester, rejector }) => {
    friendRequests[rejector] = (friendRequests[rejector] || []).filter((r) => r !== requester);
    const rejectorSocket = userSockets[rejector];
    if (rejectorSocket) {
      io.to(rejectorSocket).emit('friendRequestReceived', { requests: friendRequests[rejector] });
    }
  });

  socket.on('removeFriend', ({ user, friendToRemove }) => {
    userFriends[user] = (userFriends[user] || []).filter((f) => f !== friendToRemove);
    userFriends[friendToRemove] = (userFriends[friendToRemove] || []).filter((f) => f !== user);
    const userSocket = userSockets[user];
    const friendSocket = userSockets[friendToRemove];
    if (userSocket) io.to(userSocket).emit('friendRemoved', { friends: userFriends[user] });
    if (friendSocket) io.to(friendSocket).emit('friendRemoved', { friends: userFriends[friendToRemove] });
  });

  // -------------------------
  // Disconnect
  // -------------------------
  socket.on('disconnect', () => {
    console.log('🔴 Disconnect', socket.id);
    let foundUser = null;
    for (const [username, sid] of Object.entries(userSockets)) {
      if (sid === socket.id) {
        foundUser = username;
        break;
      }
    }
    if (!foundUser) return;

    const username = foundUser;
    delete userSockets[username];

    const sessionName = userToSession[username];
    if (sessionName && sessions[sessionName]) {
      const session = sessions[sessionName];
      session.players = session.players.filter((p) => p !== username);
      session.readyPlayers = (session.readyPlayers || []).filter((p) => p !== username);

      disconnectTimers[username] = setTimeout(() => {
        if (session.players.length === 0) {
          delete sessions[sessionName];
          io.to(sessionName).emit('lobbyClosed');
          console.log(`🗑️ Session ${sessionName} deleted after disconnect cleanup`);
        } else {
          updateLobbyState(sessionName);
        }
        io.emit('sessionsUpdated', Object.values(sessions));
        delete userToSession[username];
        delete disconnectTimers[username];
      }, 30000);
    } else {
      delete userToSession[username];
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🟢 Server running on http://localhost:${PORT}`);
});
