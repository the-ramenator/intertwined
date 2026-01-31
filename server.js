process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED PROMISE", err);
});

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static("public"));
const rooms = {};
const awaitingMatchmaking = [];

const ts = 32;
const LEVELS = [
  {
    id: "p1_1",
    mapName: "Caveman",
    mapKey: "level1",
    owner: 1,
    offsetX: 0,
    offsetY: -6 * ts,
    spawnX: 6 * ts,
    spawnY: 49 * ts,
    ability: "crouch",
  },
  {
    id: "p1_2",
    mapName: "Stone Age",
    mapKey: "level2",
    owner: 1,
    offsetX: -2 * ts,
    offsetY: 0,
    spawnX: 6 * ts,
    spawnY: 49 * ts,
    ability: "levitate",
  },
  {
    id: "p1_3",
    mapName: "Renaissance",
    mapKey: "level3",
    owner: 1,
    offsetX: 0,
    offsetY: 0,
    spawnX: 6 * ts, //84 * ts, //6 * ts,
    spawnY: 11 * ts, //33 * ts, //11 * ts,
    ability: "glide",
  },
  {
    id: "p2_1",
    mapName: "Exploration",
    mapKey: "level4",
    owner: 2,
    offsetX: 0,
    offsetY: 0,
    spawnX: 4 * ts,
    spawnY: 84 * ts,
    ability: "shatter",
  },
  {
    id: "p2_2",
    mapName: "Industrial",
    mapKey: "level5",
    owner: 2,
    offsetX: 0,
    offsetY: 0,
    spawnX: 6 * ts,
    spawnY: 89 * ts,
    ability: "dash",
  },
  {
    id: "p2_3",
    mapName: "Futuristic",
    mapKey: "level6",
    owner: 2,
    offsetX: 0,
    offsetY: 0,
    spawnX: 6 * ts,
    spawnY: 17 * ts, //good offset
    ability: "drone",
  },
];
const ABILITY_CONFIG = {
  glide: {
    duration: Infinity,
    cooldown: 2000,
    mode: "channel", //allow early cancel
  },
  dash: {
    duration: 5000,
    cooldown: 1500,
    mode: "channel",
  },
  levitate: {
    duration: 7000,
    cooldown: 4000,
    mode: "channel",
  },
  crouch: {
    duration: Infinity,
    cooldown: 0,
    mode: "channel",
  },
  shatter: {
    duration: 950,
    cooldown: 2500,
    mode: "channel",
  },
  drone: {
    duration: null,
    cooldown: 500, //10000
    mode: "channel",
  },
};

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
function emitRoomUpdate(roomCode) {
  const data = { roomCode: roomCode, roomData: rooms[roomCode] };
  io.to(roomCode).emit("roomUpdate", data);
}
function getOtherKey(obj, knownKey) {
  if (!obj) return null;
  const keys = Object.keys(obj);
  if (keys.length !== 2) return null;
  return keys.find((k) => k !== knownKey) || null;
}

function pickNextLevel(room, owner) {
  const pool = owner === 1 ? room.levels.owner1Pool : room.levels.owner2Pool;

  if (!pool || pool.length === 0) return null;

  const index = Math.floor(Math.random() * pool.length);
  return pool.splice(index, 1)[0];
}
function createRoom(id) {
  const roomCode = generateRoomCode();
  rooms[roomCode] = {
    users: {},
    roomCode: roomCode,
    started: false,
    abilities: {
      1: null,
      2: null,
    },
    currentPlayer: Math.floor(Math.random() * 2) + 1,
    abilityState: {
      1: { active: false, cooldownUntil: 0, timeout: null },
      2: { active: false, cooldownUntil: 0, timeout: null, droneUsage: 0 },
    },
    levelTimes: {},
  };

  rooms[roomCode].users[id] = {
    status: "connected",
    player: 0,
    win: false,
    abilityGained: false,
    readyForNextLevel: false,
  };

  rooms[roomCode].levels = {
    owner1Pool: LEVELS.filter((l) => l.owner === 1).map((l) => ({ ...l })),
    owner2Pool: LEVELS.filter((l) => l.owner === 2).map((l) => ({ ...l })),
  };
  return roomCode;
}
io.on("connection", (socket) => {
  // socket.emit("connect");
  socket.on("createRoom", () => {
    try {
      let roomCode = createRoom(socket.id);
      socket.join(roomCode);
      // socket.emit("roomCreated", roomCode);
      socket.emit("correctlyJoinedRoom", roomCode);
      emitRoomUpdate(roomCode);
    } catch (e) {
      // console.log(e);
    }
  });
  socket.on("awaitingMatchmaking", () => {
    try {
      awaitingMatchmaking.push(socket.id);

      if (awaitingMatchmaking.length >= 2) {
        const p1 = awaitingMatchmaking[0];
        const p2 = awaitingMatchmaking[1];

        const roomCode = createRoom(p1);

        rooms[roomCode].users[p2] = {
          status: "connected",
          player: 0,
          win: false,
          abilityGained: false,
          readyForNextLevel: false,
        };

        io.in(p1).socketsJoin(roomCode);
        io.in(p2).socketsJoin(roomCode);

        io.to(roomCode).emit("correctlyJoinedRoom", roomCode);
        emitRoomUpdate(roomCode);

        awaitingMatchmaking.splice(0, 2);
      }
    } catch (e) {
      // console.log(e)
    }
  });
  socket.on("exitMatchmaking", () => {
    try {
      const idx = awaitingMatchmaking.indexOf(socket.id);
      if (idx > -1) {
        awaitingMatchmaking.splice(idx, 1);
      }
    } catch (e) {
      //console.log(e)
    }
  });
  socket.on("getUserCount", (roomCode) => {
    try {
      const userCount = Object.keys(rooms[roomCode].users).length;
      if (userCount === 2) {
        io.to(roomCode).emit("readyToSelectPlayers");
      }
    } catch (e) {
      // console.log(e);
    }
  });
  socket.on("playerSelected", ({ roomCode, player }) => {
    try {
      rooms[roomCode].users[socket.id].player = player;
      updatePlayerStatus(roomCode);
      emitRoomUpdate(roomCode);
    } catch (e) {
      // console.log(e);
    }
  });
  socket.on("clearSelections", (roomCode) => {
    try {
      rooms[roomCode].users[socket.id].player = 0;
      updatePlayerStatus(roomCode);
      emitRoomUpdate(roomCode);
    } catch (e) {
      // console.log(e);
    }
  });
  socket.on("chatMessage", (data) => {
    try {
      io.to(data.room).emit("chatMessage", data);
    } catch (e) {
      // console.log(e);
    }
  });
  function updatePlayerStatus(roomCode) {
    const room = rooms[roomCode];
    const status = { player1Taken: false, player2Taken: false };
    for (const id in room.users) {
      const p = room.users[id].player;
      if (p === 1) status.player1Taken = true;
      if (p === 2) status.player2Taken = true;
    }
    const canStart = status.player1Taken && status.player2Taken;
    io.to(roomCode).emit("playerStatusUpdate", {
      disabled: { player1: status.player1Taken, player2: status.player2Taken },
      room: room,
      canStart,
    });
  }
  socket.on("startTips", (roomCode) => {
    try {
      io.to(roomCode).emit("startTips");
    } catch (e) {}
  });
  socket.on("endTips", (roomCode) => {
    try {
      io.to(roomCode).emit("endTips");
    } catch (e) {}
  });
  socket.on("startGame", (roomCode) => {
    try {
      rooms[roomCode].started = true;
      io.to(roomCode).emit("startGame", rooms[roomCode]);
    } catch (e) {
      // console.log(e);
    }
  });
  socket.on("joinRoom", (roomCode) => {
    try {
      if (!rooms[roomCode]) {
        socket.emit("errorMessage", "Room does not exist.");
        return;
      }
      const userCount = Object.keys(rooms[roomCode].users).length;
      if (userCount >= 2) {
        socket.emit("errorMessage", "Room is full.");
        return;
      }
      rooms[roomCode].users[socket.id] = {
        status: "connected",
        player: 0,
        win: false,
        abilityGained: false,
        readyForNextLevel: false,
      };

      socket.join(roomCode);
      socket.emit("correctlyJoinedRoom", roomCode);
      emitRoomUpdate(roomCode);
    } catch (e) {
      // console.log(e);
    }
  });
  socket.on("updateStatus", ({ roomCode, status }) => {
    try {
      if (rooms[roomCode] && rooms[roomCode].users[socket.id]) {
        rooms[roomCode].users[socket.id].status = status;
        emitRoomUpdate(roomCode);
      }
    } catch (e) {
      // console.log(e);
    }
  });

  socket.on("playerUpdate", (data) => {
    try {
      socket.to(data.room).emit("playerUpdate", data);
    } catch (e) {
      // console.log(e);
    }
  });
  socket.on("requestNextLevel", (roomCode) => {
    try {
      const room = rooms[roomCode];
      if (!room) return;
      room.users[socket.id].readyForNextLevel = true;
      const otherPlayerId = getOtherKey(room.users, socket.id);
      const otherPlayer = room.users[otherPlayerId];

      if (
        room.users[socket.id].readyForNextLevel &&
        otherPlayer.readyForNextLevel
      ) {
        //check if both p1 and p2 have sent the ready
        const nextLevel1 = pickNextLevel(room, 1);
        const nextLevel2 = pickNextLevel(room, 2);
        if (nextLevel1 && nextLevel2) {
          room.abilities[1] = nextLevel1.ability;
          room.abilities[2] = nextLevel2.ability;
          room.currentLevels = {
            p1: nextLevel1,
            p2: nextLevel2,
          };
          room.active = {
            p1: nextLevel1,
            p2: nextLevel2,
          };

          room.users[socket.id].readyForNextLevel = false;
          otherPlayer.readyForNextLevel = false;

          //reset ability gained
          room.users[socket.id].abilityGained = false;
          otherPlayer.abilityGained = false;

          //reset win
          // room.users[socket.id].win = false;
          // otherPlayer.win = false;
          // console.log(room.currentPlayer);
          let currentPlayer = room.currentPlayer;
          io.to(roomCode).emit("generateLevels", {
            nextLevel1,
            nextLevel2,
            currentPlayer,
          });
        } else {
          io.to(roomCode).emit("generateLevels", {
            nextLevel1: false,
            nextLevel2: false,
          });
        }
      }
    } catch (e) {
      // console.log(e);
    }
  });
  function deactivateAbility(room, abilityOwner, type) {
    const config = ABILITY_CONFIG[type];
    const state = room.abilityState[abilityOwner];

    if (!state.active) return;

    state.active = false;
    state.cooldownUntil = Date.now() + config.cooldown;

    if (state.timeout) {
      clearTimeout(state.timeout);
      state.timeout = null;
    }
    try {
      io.to(room.roomCode).emit("abilityDeactivated", {
        abilityOwner,
        type,
        cooldown: config.cooldown,
        activatedBy: socket.id,
      });
    } catch (e) {
      // console.log(e);
    }
  }

  socket.on("abilityActivated", (data) => {
    try {
      const room = rooms[data.room];
      if (!room) return;

      const { abilityOwner, type } = data;
      const config = ABILITY_CONFIG[type];
      const state = room.abilityState[abilityOwner];

      if (!config) return;
      if (room.abilities[abilityOwner] !== type) return;

      //check if ability is gained by other user
      const otherPlayerId = getOtherKey(room.users, socket.id);
      if (!room.users[otherPlayerId].abilityGained) return;

      const now = Date.now();

      if (state.active || now < state.cooldownUntil) return;

      state.active = true;
      if (type == "drone") {
        socket.to(data.room).emit("getPosition", {
          room: data.room,
          abilityOwner,
          type,
          duration: config.duration,
          // cooldown: config.cooldown,
        });
      } else {
        io.to(data.room).emit("abilityActivated", {
          abilityOwner,
          type,
          duration: config.duration,
          // cooldown: config.cooldown,
        });
      }

      // Timed ability
      if (config.duration !== Infinity && config.duration != null) {
        state.timeout = setTimeout(() => {
          deactivateAbility(room, abilityOwner, type);
        }, config.duration);
      }
    } catch (e) {
      // console.log(e);
    }
  });
  socket.on("droneRecharge", (data) => {
    try {
      const room = rooms[data.room];
      if (!room) return;
      room.abilityState[2].droneUsage = 0;
      io.to(data.room).emit("droneRecharge", {
        activatedBy: socket.id,
      });
    } catch (e) {
      // console.log(e);
    }
  });
  socket.on("setTimes", (data) => {
    try {
      rooms[data.room].levelTimes[data.levelName] = data.time;
    } catch (e) {
      // console.log(e);
    }
  });
  socket.on("getPosition", (data) => {
    //only happens on drone
    try {
      const room = rooms[data.room];
      if (room.abilityState[2].droneUsage < 5) {
        //disable if less than 5
        room.abilityState[2].droneUsage += 1;
        io.to(data.room).emit("abilityActivated", {
          abilityOwner: data.abilityOwner,
          type: data.type,
          x: data.x,
          y: data.y,
          usage: room.abilityState[2].droneUsage,
        });
      }
    } catch (e) {
      // console.log(e);
    }
  });
  socket.on("abilityDeactivated", (data) => {
    try {
      const room = rooms[data.room];
      if (!room) return;

      const { abilityOwner, type } = data;
      const config = ABILITY_CONFIG[type];
      const state = room.abilityState[abilityOwner];

      if (!state.active) return;

      // Allow early cancel ONLY for channel abilities
      if (config.mode === "channel") {
        deactivateAbility(room, abilityOwner, type);
      }
    } catch (e) {
      // console.log(e);
    }
  });

  socket.on("abilityPickup", (data) => {
    try {
      rooms[data.room].users[socket.id].abilityGained = data.state;
      io.emit("abilityPickup", {
        activatedBy: socket.id,
      });
    } catch (e) {
      // console.log(e);
    }
  });
  socket.on("destroyBlock", (data) => {
    try {
      if (!rooms[data.room].users[socket.id].abilityGained) return;
      //check if the ability is active
      const state = rooms[data.room].abilityState[2];
      // console.log(rooms[data.room].abilityState);
      if (!state.active) return;
      io.to(data.room).emit("destroyBlock", data); //only activate after validating ability
    } catch (e) {
      // console.log(e);
    }
  });
  socket.on("jumpAnimUpdate", (data) => {
    try {
      socket.to(data.room).emit("jumpAnimUpdate", data);
    } catch (e) {
      // console.log(e);
    }
  });
  socket.on("checkpointUpdate", (data) => {
    try {
      socket.broadcast.to(data.room).emit("checkpointUpdate", data);
    } catch (e) {
      // console.log(e);
    }
  });
  socket.on("deathReset", (data) => {
    try {
      socket.to(data.room).emit("deathReset", data);
    } catch (e) {
      console.log(e);
    }
  });
  socket.on("gameWinUpdate", (data) => {
    try {
      rooms[data.room].users[socket.id].win = data.touching;

      const playerIds = Object.keys(rooms[data.room].users);
      if (playerIds.length !== 2) return; // Only win with 2 players

      let p1 = rooms[data.room].users[playerIds[0]].win;
      let p2 = rooms[data.room].users[playerIds[1]].win;
      if (p1 == true && p2 == true) {
        rooms[data.room].users[playerIds[0]].win = false;
        rooms[data.room].users[playerIds[1]].win = false;
        rooms[data.room].currentPlayer =
          rooms[data.room].currentPlayer === 1 ? 2 : 1;
        io.to(data.room).emit("gameWin", "Both Win!");
      } else {
        rooms[data.room].currentPlayer =
          rooms[data.room].currentPlayer === 1 ? 2 : 1;
        io.to(data.room).emit("switchCams", {
          currentPlayer: rooms[data.room].currentPlayer,
        });
      }
    } catch (e) {
      // console.log(e);
    }
  });
  socket.on("leaveRoom", (roomCode) => {
    try {
      const room = rooms[roomCode];
      if (!room) return;

      const idx = awaitingMatchmaking.indexOf(socket.id);
      if (idx > -1) {
        awaitingMatchmaking.splice(idx, 1);
      }

      if (room.users[socket.id]) {
        delete room.users[socket.id];
        socket.leave(roomCode);
        socket.emit("leaveRoom");
        emitRoomUpdate(roomCode);

        // If room empty, delete it
        if (Object.keys(room.users).length === 0) {
          delete rooms[roomCode];
        } else {
          io.to(roomCode).emit("notReadyToSelectPlayers");
          // reset player selections
          for (const id in room.users) {
            room.users[id].player = 0;
          }
          io.to(roomCode).emit("playerStatusUpdate", {
            disabled: { player1: false, player2: false },
            room: rooms[roomCode],
            canStart: false,
          });
        }
      }
    } catch (e) {
      // console.log(e);
    }
  });

  socket.on("disconnect", () => {
    try {
      const idx = awaitingMatchmaking.indexOf(socket.id);
      if (idx > -1) {
        awaitingMatchmaking.splice(idx, 1);
      }

      for (const roomCode in rooms) {
        if (rooms[roomCode].users[socket.id]) {
          delete rooms[roomCode].users[socket.id];
          if (Object.keys(rooms[roomCode].users).length === 0) {
            delete rooms[roomCode];
          } else {
            emitRoomUpdate(roomCode);
            if (rooms[roomCode].started) {
              socket.to(roomCode).emit("leavePrompt");
            }
          }
        }
      }
    } catch (e) {
      // console.log(e);
    }
  });
});
server.listen(3000, () => console.log("Server running on port 3000"));