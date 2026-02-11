//Uncaught TypeError: Cannot read properties of undefined (reading 'contains')
const socket = io();
let roomCode = null;
let localPlayer, remotePlayer, isPlayer1;
let maps = {};
let activeLevels = [];
let scene;
let currentMapKey1, currentMapKey2, currentMap;
let myLevelAbility = null;
let otherLevelAbility = null;
let spawnXGlobal, spawnYGlobal, spawnXp1, spawnYp1, spawnXp2, spawnYp2; //update this for checkpoints --> update for each player
let currentLevelName, otherLevelName;
let mainLayerXOffset, mainLayerYOffset;

let singlePlayerCurrentMap;

let singlePlayerDroneUsage = 0;

// let lastKnownPlayer = null;
let activeRoundId = null;

let coyote = false;

let levelTimer, levelTimerInterval, startTime;
let finalLevelActive = false;

let leftBtnActive = false,
  rightBtnActive = false,
  jumpBtnActive = false,
  abilityBtnActive = false,
  restartBtnActive = false;

let currentPlayer;

let alreadySwitched = false;

let levelInfo, abilityInfo;

let world1W, world1H, world2W, world2H;

let camTop;
let camBottom;

let touchedWinAlr = false;

let mapAnimatedTiles1 = [];
let mapAnimatedTiles2 = [];

let isChangingLevels = false;

let isSinglePlayer = false;

const DEATH_TILES = [
  19, 20, 27, 28, 818, 819, 770, 771 /*, 756, 708, 660, 612*/,
];

let localPlayerState = {
  x: 0,
  y: 0,
};

let droneActive = false;
let dronePlatform, dronePlatforms;

// let usedJump = false;

let beaten = [];
let active = [];
let locked = [
  {
    mapName: "Caveman",
    mapKey: "level1",
    owner: 1,
    ability: "crouch",
  },
  {
    mapName: "Stone Age",
    mapKey: "level2",
    owner: 1,
    ability: "levitate",
  },
  {
    mapName: "Renaissance",
    mapKey: "level3",
    owner: 1,
    ability: "glide",
  },
  {
    mapName: "Exploration",
    mapKey: "level4",
    owner: 2,
    ability: "shatter",
  },
  {
    mapName: "Industrial",
    mapKey: "level5",
    owner: 2,
    ability: "dash",
  },
  {
    mapName: "Futuristic",
    mapKey: "level6",
    owner: 2,
    ability: "drone",
  },
];
const ABILITY_CONFIG_SINGLE = {
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

const LEVEL_BACKGROUNDS = {
  level1: [
    { key: "level1layer1", factor: 0.05 },
    { key: "level1layer2", factor: 0.1 },
    { key: "level1layer3", factor: 0.15 },
  ],
  level2: [
    { key: "level2layer1", factor: 0.05 },
    { key: "level2layer2", factor: 0.1 },
    { key: "level2layer3", factor: 0.15 },
    { key: "level2layer4", factor: 0.2 },
  ],
  level3: [
    { key: "level3layer1", factor: 0.05 },
    { key: "level3layer2", factor: 0.1 },
    { key: "level3layer3", factor: 0.15 },
    { key: "level3layer4", factor: 0.2 },
    { key: "level3layer5", factor: 0.25 },
    { key: "level3layer6", factor: 0.3 },
  ],
  level4: [
    { key: "level4layer1", factor: 0.05 },
    { key: "level4layer2", factor: 0.1 },
    { key: "level4layer3", factor: 0.15 },
  ],
  level5: [
    { key: "level5layer1", factor: 0.05 },
    { key: "level5layer2", factor: 0.1 },
    { key: "level5layer3", factor: 0.15 },
  ],
  level6: [
    { key: "level6layer1", factor: 0.05 },
    { key: "level6layer2", factor: 0.1 },
    { key: "level6layer3", factor: 0.15 },
    { key: "level6layer4", factor: 0.2 },
    { key: "level6layer5", factor: 0.25 },
  ],
};

const layerTints = {
  level1: {
    // tint: 0xffb84f,
    tint: 0xffffff,
  },
  level2: {
    //tint: 0x00f783,
    tint: 0xffffff,
  },
  level3: {
    //tint: 0xcf6784,
    tint: 0xffffff,
  },
  level4: {
    // tint: 0xa08c90,
    tint: 0xffffff,
  },
  level5: {
    // tint: 0x6c1812,
    tint: 0xffffff,
  },
  level6: {
    // tint: 0xff78bf,
    tint: 0xffffff,
  },
};

function getPlayerByOwner(owner) {
  if ((owner === 1 && isPlayer1) || (owner === 2 && !isPlayer1)) {
    return localPlayer;
  }
  return remotePlayer;
}

let activeInterval;
let gotAbility = false;
function updateMessages(classes, msg, isLocal, duration = false) {
  if (activeInterval) {
    clearInterval(activeInterval);
    activeInterval = null;
  }
  let el;
  if (isLocal) {
    el = document.getElementById("localStatus");
  } else {
    el = document.getElementById("remoteStatus");
  }
  el.className = "";
  el.classList.add(...classes);
  el.innerHTML = msg;
  if (duration) {
    const endTime = Date.now() + duration;

    activeInterval = setInterval(() => {
      const remaining = Math.max(0, (endTime - Date.now()) / 1000);
      el.innerHTML = msg + ": " + remaining.toFixed(1) + "s";

      if (remaining <= 0) {
        clearInterval(activeInterval);
        updateMessages([], "", isLocal);
      }
    }, 100);
  }
}
const abilities = {
  crouch: {
    activate({ abilityOwner, duration }) {
      if (isSinglePlayer) {
        localPlayer.crouchActive = true;
      }
      getPlayerByOwner(abilityOwner).setScale(0.5);
      getPlayerByOwner(abilityOwner).crouchActive = true;
      let isPlayerCheck = isPlayer1 ? 1 : 2;
      let isLocal = isPlayerCheck == abilityOwner ? true : false;
      updateMessages(["green"], "Crouch Active", isLocal, duration);
    },
    deactivate({ abilityOwner }) {
      if (isSinglePlayer) {
        localPlayer.crouchActive = false;
      }
      getPlayerByOwner(abilityOwner).setScale(1);

      getPlayerByOwner(abilityOwner).crouchActive = false;
      let isPlayerCheck = isPlayer1 ? 1 : 2;
      let isLocal = isPlayerCheck == abilityOwner ? true : false;
      if (activeInterval) {
        clearInterval(activeInterval);
      }
      // updateMessages([], "", isLocal);
    },
  },
  levitate: {
    activate({ abilityOwner, duration }) {
      if (isSinglePlayer) {
        localPlayer.levitateActive = true;
      }
      getPlayerByOwner(abilityOwner).levitateActive = true;
      console.log(
        "ab obj lev: " + getPlayerByOwner(abilityOwner).levitateActive,
      );
      let isPlayerCheck = isPlayer1 ? 1 : 2;
      let isLocal = isPlayerCheck == abilityOwner ? true : false;
      updateMessages(["green"], "Levitate Active", isLocal, duration);
      getPlayerByOwner(abilityOwner).anims.play("p1levitate", true);
    },
    deactivate({ abilityOwner }) {
      if (isSinglePlayer) {
        localPlayer.levitateActive = false;
      }
      getPlayerByOwner(abilityOwner).levitateActive = false;
      getPlayerByOwner(abilityOwner).anims.stop();
      getPlayerByOwner(abilityOwner).setFrame(0);

      let isPlayerCheck = isPlayer1 ? 1 : 2;
      let isLocal = isPlayerCheck == abilityOwner ? true : false;
      if (activeInterval) {
        clearInterval(activeInterval);
      }
      // updateMessages([], "", isLocal);
    },
  },
  glide: {
    activate({ abilityOwner, duration }) {
      if (isSinglePlayer) {
        localPlayer.glideActive = true;
      }
      getPlayerByOwner(abilityOwner).glideActive = true;
      let isPlayerCheck = isPlayer1 ? 1 : 2;
      let isLocal = isPlayerCheck == abilityOwner ? true : false;
      updateMessages(["green"], "Glide Active", isLocal, duration);
      playAbilityChain(
        getPlayerByOwner(abilityOwner),
        "p1glideOpen",
        "p1glideActive",
      );
      getPlayerByOwner(abilityOwner).setScale(1.8);
      getPlayerByOwner(abilityOwner).body.setSize(24, 24);
      getPlayerByOwner(abilityOwner).setOffset(12, 24);
      if (isSinglePlayer) {
        localPlayer.setScale(1.8);
        localPlayer.body.setSize(24, 24);
        localPlayer.setOffset(12, 24);
      }
      // getPlayerByOwner(abilityOwner).body.refreshBody();
    },
    deactivate({ abilityOwner }) {
      if (isSinglePlayer) {
        localPlayer.glideActive = false;
      }
      getPlayerByOwner(abilityOwner).glideActive = false;
      getPlayerByOwner(abilityOwner).anims.stop();
      getPlayerByOwner(abilityOwner).setFrame(0);

      getPlayerByOwner(abilityOwner).setScale(1);
      getPlayerByOwner(abilityOwner).body.setSize(48, 48);
      // getPlayerByOwner(abilityOwner).body.refreshBody();
      if (isSinglePlayer) {
        localPlayer.setScale(1);
        localPlayer.body.setSize(48, 48);
      }
      let isPlayerCheck = isPlayer1 ? 1 : 2;
      let isLocal = isPlayerCheck == abilityOwner ? true : false;
      if (activeInterval) {
        clearInterval(activeInterval);
      }
      // updateMessages([], "", isLocal);
    },
  },
  //p2 objs
  shatter: {
    activate({ abilityOwner, duration }) {
      if (isSinglePlayer) {
        localPlayer.shatterActive = true;
      }
      getPlayerByOwner(abilityOwner).shatterActive = true;
      getPlayerByOwner(abilityOwner).anims.play("p2shatter", true);

      let isPlayerCheck = isPlayer1 ? 1 : 2;
      let isLocal = isPlayerCheck == abilityOwner ? true : false;
      updateMessages(["green"], "Shatter Active", isLocal, duration);
    },
    deactivate({ abilityOwner }) {
      if (isSinglePlayer) {
        localPlayer.shatterActive = false;
      }
      getPlayerByOwner(abilityOwner).shatterActive = false;
      getPlayerByOwner(abilityOwner).anims.stop();
      getPlayerByOwner(abilityOwner).setFrame(0);

      let isPlayerCheck = isPlayer1 ? 1 : 2;
      let isLocal = isPlayerCheck == abilityOwner ? true : false;
      if (activeInterval) {
        clearInterval(activeInterval);
      }
      // updateMessages([], "", isLocal);
    },
  },
  dash: {
    activate({ abilityOwner, duration }) {
      if (isSinglePlayer) {
        localPlayer.dashActive = true;
      }
      getPlayerByOwner(abilityOwner).dashActive = true;
      playAbilityChain(
        getPlayerByOwner(abilityOwner),
        "p2dashOpen",
        "p2dashActive",
      );
      let isPlayerCheck = isPlayer1 ? 1 : 2;
      let isLocal = isPlayerCheck == abilityOwner ? true : false;

      getPlayerByOwner(abilityOwner).setScale(1.8);
      getPlayerByOwner(abilityOwner).body.setSize(24, 24);
      getPlayerByOwner(abilityOwner).setOffset(12, 16);
      if (isSinglePlayer) {
        localPlayer.setScale(1.8);
        localPlayer.body.setSize(24, 24);
        localPlayer.setOffset(12, 16);
      }

      updateMessages(["green"], "Dash Active", isLocal, duration);
    },
    deactivate({ abilityOwner }) {
      if (isSinglePlayer) {
        localPlayer.dashActive = false;
      }
      getPlayerByOwner(abilityOwner).dashActive = false;

      getPlayerByOwner(abilityOwner).anims.stop();
      getPlayerByOwner(abilityOwner).setFrame(0);

      getPlayerByOwner(abilityOwner).setScale(1);
      getPlayerByOwner(abilityOwner).body.setSize(48, 48);
      if (isSinglePlayer) {
        localPlayer.setScale(1);
        localPlayer.body.setSize(48, 48);
      }
      let isPlayerCheck = isPlayer1 ? 1 : 2;
      let isLocal = isPlayerCheck == abilityOwner ? true : false;
      if (activeInterval) {
        clearInterval(activeInterval);
      }
      // updateMessages([], "", isLocal);
    },
  },
  drone: {
    activate({ abilityOwner, x, y, usage, duration }) {
      if (isSinglePlayer) {
        localPlayer.droneActive = true;
      }
      getPlayerByOwner(abilityOwner).droneActive = true;
      let isPlayerCheck = isPlayer1 ? 1 : 2;
      let isLocal = isPlayerCheck == abilityOwner ? true : false;
      updateMessages(
        ["green"],
        "Drone Active: " + usage + "/5",
        isLocal,
        duration,
      );
      if (droneActive) {
        return;
      } else {
        droneActive = true;
        getPlayerByOwner(abilityOwner).setVelocityY(0);
        getPlayerByOwner(abilityOwner).setPosition(x, y);
        dronePlatform = dronePlatforms.create(x, y + 50, "drone").setScale(1);
        //camera ignore
        if (isSinglePlayer) {
          camBottom.ignore(dronePlatform);
        } else {
          if (isPlayer1) {
            camTop.ignore(dronePlatform);
          } else {
            camBottom.ignore(dronePlatform);
          }
        }
        dronePlatform.body.immovable = true;
        dronePlatform.body.moves = false;
        dronePlatform.body.allowGravity = false;
      }
    },
    deactivate({ abilityOwner }) {
      if (isSinglePlayer) {
        localPlayer.droneActive = false;
      }
      getPlayerByOwner(abilityOwner).droneActive = false;

      let isPlayerCheck = isPlayer1 ? 1 : 2;
      let isLocal = isPlayerCheck == abilityOwner ? true : false;
      droneActive = false;
      if (dronePlatform) {
        dronePlatform.destroy();
        dronePlatform = null;
      }
      if (activeInterval) {
        clearInterval(activeInterval);
      }
      // updateMessages([], "", isLocal);
    },
  },
};

function copyText(button) {
  const textToCopy = button.dataset.code;
  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      button.src = "assets/check_icon.png";
      setTimeout(function () {
        button.src = "assets/copy_icon.png";
      }, 3000);
    })
    .catch((err) => {
      //   console.error("Failed to copy: ", err);
    });
}
document.getElementById("copyLink").addEventListener("click", function () {
  copyText(this);
});
document.getElementById("copyLink").dataset.url = window.location.href;
const entry = performance.getEntriesByType("navigation")[0];
if (entry && entry.type === "reload") {
  window.location = window.location.href.split("?")[0];
}

document.getElementById("creditsClose").addEventListener("click", function () {
  resetCredits();
  /*if (scene) {
        scene.pausePhysics = false;
        setPhysicsOn(localPlayer, true);
    }*/
});

document
  .getElementById("matchmakingBtn")
  .addEventListener("click", function () {
    socket.emit("awaitingMatchmaking");
  });

// Cache DOM elements once
const playerSelect = document.getElementById("playerSelect");
const player1Btn = document.getElementById("player1");
const player2Btn = document.getElementById("player2");
const clearBtn = document.getElementById("clear");
const startBtn = document.getElementById("startBtn");
startBtn.disabled = true; // default off

document.getElementById("gameStatus").style.color = "#fff";

document.getElementById("createBtn").onclick = () => {
  socket.emit("createRoom");
};

document.getElementById("leaveBtn").addEventListener("click", () => {
  document.getElementById("roomDataDiv").style.opacity = "0";
  document.getElementById("join").style.opacity = "1";
  document.getElementById("leaveBtn").style.opacity = "0";
  document.getElementById("copyLink").style.opacity = "0";
  playerSelect.style.display = "none";
  setTimeout(function () {
    document.getElementById("roomDataDiv").style.display = "none";
    document.getElementById("join").style.display = "block";
    document.getElementById("leaveBtn").style.display = "none";
    document.getElementById("copyLink").style.display = "none";
  }, 500);
  resetUI();
  document.getElementById("title-white").innerHTML = "Inter";
  document.getElementById("title-black").innerHTML = "Twined";
  socket.emit("leaveRoom", roomCode);
});
socket.on("leavePrompt", () => {
  let prompt = confirm(
    "The other player has left the room and will not be able to rejoin. Would you like to leave the room?",
  );
  if (prompt) {
    document.getElementById("gameContainer").style.display = "none";
    document.getElementById("setupContainer").style.display = "block";
    document.getElementById("roomDataDiv").style.opacity = "0";
    document.getElementById("join").style.opacity = "1";
    document.getElementById("leaveBtn").style.opacity = "0";
    document.getElementById("copyLink").style.opacity = "0";
    document.getElementById("particles").style.display = "block";

    //reset select player btns
    player1Btn.disabled = false;
    player2Btn.disabled = false;

    clearBtn.style.opacity = "0";

    player1Btn.classList.remove("selected");
    player1Btn.classList.add("connected");
    player1Btn.innerHTML = "Select Player 1";

    player2Btn.classList.remove("selected");
    player2Btn.classList.add("connected");
    player2Btn.innerHTML = "Select Player 2";

    setTimeout(function () {
      document.getElementById("roomDataDiv").style.display = "none";
      document.getElementById("join").style.display = "block";
      document.getElementById("leaveBtn").style.display = "none";
      document.getElementById("copyLink").style.display = "none";
    }, 500);
    resetUI();
    document.getElementById("title-white").innerHTML = "Inter";
    document.getElementById("title-black").innerHTML = "Twined";
    socket.emit("leaveRoom", roomCode);
  }
});
socket.on("leaveRoom", () => {
  document.getElementById("join").style.display = "block";
  // document.getElementById("roomInfo").innerText = "Room: ";
  // document.getElementById("status").innerText = "";

  //reset to selection defaults
  player1Btn.disabled = false;
  player2Btn.disabled = false;
  startBtn.disabled = true;
  playerSelect.style.display = "none";
});
function joinRoom() {
  const code = document.getElementById("roomCodeInput").value;
  socket.emit("joinRoom", code);
}

document.getElementById("roomCodeInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.stopPropagation();
    joinRoom();
  }
});

document
  .getElementById("leaveMatchmaking")
  .addEventListener("click", function () {
    socket.emit("exitMatchmaking");
    document.getElementById("join").style.display = "block";
    document.getElementById("title-white").innerHTML = "Inter";
    document.getElementById("title-black").innerHTML = "Twined";
    document.getElementById("leaveMatchmaking").style.opacity = "0";
    setTimeout(function () {
      document.getElementById("join").style.opacity = "1";
      document.getElementById("leaveMatchmaking").style.display = "none";
    }, 50);
  });

socket.on("correctlyJoinedRoom", (roomCode) => {
  resetUI();
  var url = new URL(window.location.href);
  url.searchParams.set("c", roomCode);
  window.history.pushState({}, "", url);
  document.getElementById("copyLink").dataset.url = url.href;
  document.getElementById("copyLink").dataset.code = roomCode;

  document.getElementById("title-white").innerHTML =
    roomCode.slice(0, 3) + "&nbsp;";
  document.getElementById("title-black").innerHTML =
    "&nbsp;" + roomCode.slice(3, 6);

  document.getElementById("roomDataDiv").style.display = "block";
  document.getElementById("leaveBtn").style.display = "block";
  document.getElementById("copyLink").style.display = "block";
  document.getElementById("join").style.opacity = "0";
  document.getElementById("leaveMatchmaking").style.display = "none";
  setTimeout(function () {
    document.getElementById("roomDataDiv").style.opacity = "1";
    document.getElementById("join").style.display = "none";
    document.getElementById("leaveBtn").style.opacity = "1";
    document.getElementById("copyLink").style.opacity = "1";
  }, 100);

  // document.getElementById("roomInfo").innerText = "Room: " + roomCode;
  // document.getElementById("join").style.display = "none";
});

socket.on("roomUpdate", (room) => {
  roomCode = room.roomCode;
  /* document.getElementById("status").innerText = JSON.stringify(
        room.roomData,
        null,
        2,
    );*/
  const users = Object.keys(room.roomData.users);
  if (users[0]) {
    document.getElementById("connection1").innerHTML = "&nbsp;Connected&nbsp;";
    document.getElementById("connection1").classList.remove("waiting");
    document.getElementById("connection1").classList.add("connected");
    document.getElementById("connection1id").innerHTML =
      "&nbsp;ID: " + users[0] + "&nbsp;";
    if (users[0] == socket.id) {
      document.getElementById("connection1").innerHTML += " (You)&nbsp;";
    }
  }
  if (users[1]) {
    document.getElementById("connection2").innerHTML = "&nbsp;Connected&nbsp;";
    document.getElementById("connection2").classList.remove("remove");
    document.getElementById("connection2").classList.add("connected");
    document.getElementById("connection2id").innerHTML =
      "&nbsp;ID: " + users[1] + "&nbsp;";
    if (users[1] == socket.id) {
      document.getElementById("connection2").innerHTML += " (You)&nbsp;";
    }
  } else {
    document.getElementById("connection2").innerHTML = "&nbsp;Waiting...&nbsp;";
    document.getElementById("connection2id").innerHTML = "";
    document.getElementById("connection2").classList.add("waiting");
    document.getElementById("connection2").classList.remove("connected");
  }
  socket.emit("getUserCount", roomCode);
});

//try url
socket.on("connect", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const roomCode = urlParams.get("c");
  if (roomCode) {
    socket.emit("joinRoom", roomCode);
  }
});

//chat
let chatInput = document.getElementById("chatInput");
let chatSend = document.getElementById("chatSend");
let chatMessages = document.getElementById("chatMessages");
chatSend.addEventListener("click", function () {
  const now = new Date();

  const formattedTime = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  let msg = chatInput.value;
  if (msg.trim() !== "") {
    socket.emit("chatMessage", {
      room: roomCode,
      message: msg,
      sender: socket.id,
      player: isPlayer1 ? 1 : 2,
      time: formattedTime,
    });
    chatInput.value = "";
    chatInput.focus();
  }
});

socket.on("chatMessage", function (data) {
  let messageDiv = document.createElement("div");
  messageDiv.classList.add("chatMessage");

  let time = document.createElement("span");
  time.classList.add("chatTime");
  time.textContent = data.time;

  let label = document.createElement("span");
  label.classList.add("chatLabel");
  label.textContent = "Player: " + data.player;

  let message = document.createElement("span");
  message.textContent = data.message;
  if (data.sender == socket.id) {
    messageDiv.classList.add("chatSent");
  } else {
    messageDiv.classList.add("chatReceived");
  }
  messageDiv.appendChild(time);
  messageDiv.appendChild(label);
  messageDiv.appendChild(message);
  chatMessages.appendChild(messageDiv);
  if (document.getElementById("chatCont").style.display == "none") {
    document.getElementById("newMessageDot").style.display = "block";
  } else {
    document.getElementById("chatMessages").scrollTop =
      document.getElementById("chatMessages").scrollHeight;
  }
});

function updateInfo() {
  //array[key].ability
  for (const key in beaten) {
    let mapKey = beaten[key].mapKey;
    let el = document.getElementById("pause" + mapKey + "Info");
    el.innerHTML = `<span style='font-family: "Jersey 10", sans-serif;'> Completed:&nbsp;</span>${beaten[key].mapName}`;
    el.className = "";
    el.classList.add("green");
  }
  if (active.length != 0) {
    for (const key in active) {
      let mapKey = active[key].mapKey;
      let el = document.getElementById("pause" + mapKey + "Info");
      el.innerHTML = `<span style='font-family: "Jersey 10", sans-serif;'> Current:&nbsp;</span>${active[key].mapName}`;
      el.className = "";
      el.classList.add("tan");
    }
  }
  if (locked.length != 0) {
    for (const key in locked) {
      let mapKey = locked[key].mapKey;
      let el = document.getElementById("pause" + mapKey + "Info");
      el.innerHTML = `<span style='font-family: "Jersey 10", sans-serif;'> Locked:&nbsp;</span>${locked[key].mapName}`;
      el.className = "";
      el.classList.add("gray");
    }
  }
}

player1Btn.addEventListener("click", () => {
  socket.emit("playerSelected", { roomCode, player: 1 });
  clearBtn.style.left = "25%";
  clearBtn.style.opacity = "1";
  // isPlayer1 = true;
});

player2Btn.addEventListener("click", () => {
  socket.emit("playerSelected", { roomCode, player: 2 });
  clearBtn.style.left = "75%";
  clearBtn.style.opacity = "1";
  // isPlayer1 = false;
});

clearBtn.addEventListener("click", () => {
  socket.emit("clearSelections", roomCode);
  clearBtn.style.opacity = "0";
  // isPlayer1 = false;
});

socket.on("readyToSelectPlayers", () => {
  playerSelect.style.display = "block";
  document.getElementById("roomDataDiv").style.opacity = "0";
  setTimeout(function () {
    document.getElementById("roomDataDiv").style.display = "none";
  }, 500);
});
socket.on("notReadyToSelectPlayers", () => {
  playerSelect.style.display = "none";
  document.getElementById("roomDataDiv").style.display = "block";
  setTimeout(function () {
    document.getElementById("roomDataDiv").style.opacity = "1";
  }, 100);
});
let tipsInterval;
const tips = [
  "Set custom keybinds in the pause menu",
  "You activate the other player's ability",
  "Chat with your partner using the message icon in the top right",
  "You can pause the game",
  "Restart the level (with r or any key you set in the keybinds menu)",
  "View your partner's ability in the pause menu",
  "View the levels you've beaten in the pause menu",
  "View the levels you're currently on in the pause menu",
  "View the levels you haven't beaten yet in the pause menu",
  "You can switch to the mobile layout in the pause menu",
  "You can mute the game in the pause menu",
  //lore
  "Alphred lost his arms benching 225lbs",
  "Alphred and Phrederick are both part of the revered Bigphred clan",
  "Phrederick is the younger brother of Alphred",
  "Alphred and Phrederick are looking for their long lost ancestor using their time machine",
  "Alphred and Phrederick got separated in the time machine",
  "Alphred's favorite song is Tek it",
  "Phrederick is secretly in love with the bee from the Stone Age",
  "Phrederick finds the drone in level 6 nice but wonders if it would tickle his feet when he activates it",
  "Alphred is a big fan of Cyberpunk Edgerunners",
  "Alphred spends five of his seven hours awake curling his moustache",
  "Phrederick's moustache is like that when he wakes up",
];
startBtn.addEventListener("click", () => {
  socket.emit("startGame", roomCode);
  socket.emit("startTips", roomCode);
});
socket.on("startTips", () => {
  document.getElementById("tipsOverlay").style.display = "block";
  document.getElementById("tipsOverlay").style.opacity = "1";
  tipsInterval = setInterval(function () {
    let randomTip = tips[Math.floor(Math.random() * tips.length)];
    document.getElementById("tip").innerHTML = randomTip + "...";
  }, 3000);
});
socket.on("endTips", () => {
  clearInterval(tipsInterval);
  document.getElementById("tipsOverlay").style.opacity = "0";
  setTimeout(function () {
    document.getElementById("tipsOverlay").style.display = "none";
  }, 500);
});
socket.on("playerStatusUpdate", ({ disabled, room, canStart }) => {
  player1Btn.disabled = disabled.player1;
  player2Btn.disabled = disabled.player2;
  if (disabled.player1) {
    player1Btn.classList.add("selected");
    player1Btn.classList.remove("connected");
    if (room.users[socket.id].player == 1) {
      player1Btn.innerHTML = "Phrederick (You)";
      document.getElementById("favicon").href = "assets/p1.png";
    } else {
      player1Btn.innerHTML = "Phrederick (Taken)";
    }
  } else {
    player1Btn.classList.remove("selected");
    player1Btn.classList.add("connected");
    player1Btn.innerHTML = "Select Phrederick";
  }
  if (disabled.player2) {
    player2Btn.classList.add("selected");
    player2Btn.classList.remove("connected");
    player2Btn.innerHTML = "Alphred (Taken)";
    if (room.users[socket.id].player == 2) {
      player2Btn.innerHTML = "Alphred (You)";
      document.getElementById("favicon").href = "assets/p2.png";
    } else {
      player2Btn.innerHTML = "Alphred (Taken)";
    }
  } else {
    player2Btn.classList.remove("selected");
    player2Btn.classList.add("connected");
    player2Btn.innerHTML = "Select Alphred";
  }
  startBtn.disabled = !canStart;
});

socket.on("errorMessage", (msg) => {
  toggleJoin();
  document.getElementById("joinCodeError").style.opacity = "1";
  document.getElementById("joinCodeError").innerText = msg;
});
let room = {};
var game;
document
  .getElementById("singlePlayerBtn")
  .addEventListener("click", function () {
    isSinglePlayer = true;

    document.getElementById("setupContainer").style.display = "none";
    document.getElementById("gameContainer").style.display = "block";
    document.getElementById("particles").style.display = "none";

    startSinglePlayerGame();
  });
let singlePlayerLevelQueue = [];
let currentSingleLevelIndex = 0;

function startSinglePlayerGame() {
  const ts = 32;
  const allLevels = [
    {
      mapKey: "level1",
      ability: "crouch",
      owner: 1,
      spawnX: 6 * ts,
      spawnY: 49 * ts,
    },
    {
      mapKey: "level2",
      ability: "levitate",
      owner: 1,
      spawnX: 6 * ts,
      spawnY: 49 * ts,
    },
    {
      mapKey: "level3",
      ability: "glide",
      owner: 1,
      spawnX: 6 * ts,
      spawnY: 11 * ts,
    },
    {
      mapKey: "level4",
      ability: "shatter",
      owner: 2,
      spawnX: 4 * ts,
      spawnY: 84 * ts,
    },
    {
      mapKey: "level5",
      ability: "dash",
      owner: 2,
      spawnX: 6 * ts,
      spawnY: 89 * ts,
    },
    {
      mapKey: "level6",
      ability: "drone",
      owner: 2,
      spawnX: 6 * ts,
      spawnY: 17 * ts,
    },
  ];

  singlePlayerLevelQueue = Phaser.Utils.Array.Shuffle(allLevels);
  currentSingleLevelIndex = 0;

  createPhaserGame();
}
function createAnimations(scene) {
  scene.anims.create({
    key: "flower",
    frames: scene.anims.generateFrameNumbers("flowerSheet", {
      start: 0,
      end: 7,
    }),
    frameRate: 5,
    repeat: 0,
  });
  scene.anims.create({
    key: "checkpointAnim",
    frames: scene.anims.generateFrameNumbers("CheckpointTileset", {
      start: 0,
      end: 1,
    }),
    frameRate: 20,
    repeat: 0,
  });
  scene.anims.create({
    key: "p1run",
    frames: scene.anims.generateFrameNumbers("p1", {
      start: 1,
      end: 4,
    }),
    frameRate: 17,
    repeat: -1,
  });
  scene.anims.create({
    key: "p1glideOpen",
    frames: scene.anims.generateFrameNumbers("p1", {
      start: 5,
      end: 10,
    }),
    frameRate: 9,
    repeat: 0,
  });
  scene.anims.create({
    key: "p1glideActive",
    frames: scene.anims.generateFrameNumbers("p1", {
      start: 11,
      end: 15,
    }),
    frameRate: 9,
    repeat: -1,
  });
  scene.anims.create({
    key: "p1levitate",
    frames: scene.anims.generateFrameNumbers("p1", {
      start: 16,
      end: 27,
    }),
    frameRate: 7,
    repeat: -1,
  });
  scene.anims.create({
    key: "p1jump",
    frames: scene.anims.generateFrameNumbers("p1", {
      start: 28,
      end: 29,
    }),
    frameRate: 17,
    repeat: -1,
  });
  scene.anims.create({
    key: "p2run",
    frames: scene.anims.generateFrameNumbers("p2", {
      start: 1,
      end: 4,
    }),
    frameRate: 17,
    repeat: -1,
  });
  scene.anims.create({
    key: "p2jump",
    frames: scene.anims.generateFrameNumbers("p2", {
      start: 5,
      end: 6,
    }),
    frameRate: 17,
    repeat: -1,
  });
  scene.anims.create({
    key: "p2dashOpen",
    frames: scene.anims.generateFrameNumbers("p2", {
      start: 7,
      end: 11,
    }),
    frameRate: 9,
    repeat: 0,
  });
  scene.anims.create({
    key: "p2dashActive",
    frames: scene.anims.generateFrameNumbers("p2", {
      start: 12,
      end: 19,
    }),
    frameRate: 9,
    repeat: -1,
  });
  scene.anims.create({
    key: "p2shatter",
    frames: scene.anims.generateFrameNumbers("p2", {
      start: 20,
      end: 23,
    }),
    frameRate: 17,
    repeat: -1,
  });
}

function createSinglePlayer() {
  scene = this;
  this.physics.world.TILE_BIAS = 32;

  const p1Sprite = this.physics.add.sprite(0, 0, "p1");
  const p2Sprite = this.physics.add.sprite(0, 0, "p2");

  camTop = this.cameras.main;
  camTop.setViewport(0, 0, 50, 50);

  camBottom = this.cameras.add(0, 50, 50, 50);
  //0.7
  camTop.zoomTo(0.7, 2000, Phaser.Math.Easing.Back.Out);
  camBottom.zoomTo(0.7, 2000, Phaser.Math.Easing.Back.Out);

  // camTop.setBackgroundColor("#00FF00");
  // camBottom.setBackgroundColor("#FFFF00");
  localPlayer = p1Sprite;
  remotePlayer = p2Sprite;
  camTop.startFollow(localPlayer);
  camBottom.startFollow(remotePlayer);

  camTop.ignore(remotePlayer);
  camBottom.ignore(localPlayer);

  remotePlayer.setCollideWorldBounds(true);
  localPlayer.setCollideWorldBounds(true);

  remotePlayer.body.moves = false;
  remotePlayer.body.immovable = true;

  //socket events
  remoteTargetX = 0;
  remoteTargetY = 0;

  //drone platforms
  dronePlatforms = this.physics.add.staticGroup();
  this.physics.add.collider(localPlayer, dronePlatforms);

  // generate Levels

  this.lastSend = 0;

  this.cursors = this.input.keyboard.createCursorKeys();

  this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

  setLocalStorage();
  updateKeybinds();

  //grah
  console.log("setp2");
  localPlayer.setTexture("p2");

  this.pausePhysics = false;

  // this.music = this.sound.add("music");
  // this.music.setLoop(true);
  // if (localStorage.getItem("soundOn") == null) {
  //   localStorage.setItem("soundOn", true);
  // }
  // if (localStorage.getItem("soundOn") == true) {
  //   this.music.play();
  // } else {
  //   this.music.pause();
  // }
  //level skipping, comment out for final build

  if (levelTimerInterval) {
    clearInterval(levelTimerInterval);
  }
  startTime = Date.now();

  levelTimerInterval = setInterval(function () {
    levelTimer = Date.now() - startTime;
    document.getElementById("timer").innerHTML =
      (levelTimer / 1000).toFixed(0) + "s";
  }, 100);

  this.input.keyboard.on("keydown-Z", function (event) {
    loadNextSingleLevel();
  });

  createAnimations(scene);
  loadNextSingleLevel();
}

function loadNextSingleLevel() {
  if (currentSingleLevelIndex >= singlePlayerLevelQueue.length) {
    if (levelTimerInterval) {
      clearInterval(levelTimerInterval);
    }
    gameClearedUI(levelTimer);
    return;
  }

  clearAllLevels(scene);

  const levelData = singlePlayerLevelQueue[currentSingleLevelIndex];

  const map = scene.make.tilemap({ key: levelData.mapKey });
  singlePlayerCurrentMap = map;
  const tilesets = map.tilesets.map((ts) =>
    map.addTilesetImage(ts.name, ts.name),
  );

  currentMap = levelData.mapKey;
  myLevelAbility = levelData.ability;
  localPlayer.crouchActive = false;
  localPlayer.levitateActive = false;
  localPlayer.glideActive = false;
  localPlayer.shatterActive = false;
  localPlayer.dashActive = false;
  localPlayer.droneActive = false;

  //build new player
  if (levelData.owner == 1) {
    localPlayer.setTexture("p1");
  } else {
    localPlayer.setTexture("p2");
  }

  [world1W, world1H] = buildLevel({
    map,
    mapKey: levelData.mapKey,
    tilesets,
    owner: levelData.owner,
    offsetX: 0,
    offsetY: 0,
    spawnX: levelData.spawnX,
    spawnY: levelData.spawnY,
    mapName: levelData.mapKey,
    scene,
    camTop: scene.cameras.main,
    camBottom: camBottom,
    ability: levelData.ability,
  });
  spawnXp1 = levelData.spawnX;
  spawnYp1 = levelData.spawnY;
  currentPlayer = levelData.owner;

  localPlayer.setPosition(levelData.spawnX, levelData.spawnY);
  gotAbility = false;

  const animatedTiles1 = getAnimatedTiles(map);
  mapAnimatedTiles1 = getAllMapAnimatedTiles(
    activeLevels[0].layers,
    animatedTiles1,
  );

  resizeCamerasOnly();
  setPhysicsOn(localPlayer, true);

  currentSingleLevelIndex++;
}

let singlePlayerCooldownDone = true;
let singlePlayerIsCurrentlyHolding = false;
let singlePlayerAbilityTimer = null;
function updateSinglePlayer(time, delta) {
  if (!localPlayer || isChangingLevels) return;

  const body = localPlayer.body;
  if (scene.restartKey.isDown) {
    localPlayer.setPosition(spawnXGlobal, spawnYGlobal);
    localPlayer.setVelocity(0, 0);
  }
  let moveSpeed = 360;
  if (localPlayer.levitateActive) {
    body.setVelocityY(-100);
  }
  if (localPlayer.glideActive) {
    body.setVelocityY(50);
  }
  if (localPlayer.dashActive) {
    moveSpeed = 1500;
  }
  if (leftBtnActive || this.leftKey.isDown) {
    body.setVelocityX(-moveSpeed);
    localPlayer.flipX = true;
  } else if (rightBtnActive || this.rightKey.isDown) {
    body.setVelocityX(moveSpeed);
    localPlayer.flipX = false;
  } else {
    body.setVelocityX(0);
  }

  //do anims logic haha :sob: if else chain of doom ahh
  if (localPlayer.levitateActive) {
    localPlayer.anims.play("p1levitate", true);
  } else if (localPlayer.glideActive) {
    const currentKey = localPlayer.anims.currentAnim
      ? localPlayer.anims.currentAnim.key
      : "";

    if (currentKey !== "p1glideOpen") {
      localPlayer.anims.play("p1glideActive", true);
    }
  } else if (localPlayer.shatterActive) {
    localPlayer.anims.play("p2shatter", true);
  } else if (localPlayer.dashActive) {
    const currentKey = localPlayer.anims.currentAnim
      ? localPlayer.anims.currentAnim.key
      : "";

    if (currentKey !== "p2dashOpen") {
      localPlayer.anims.play("p2dashActive", true);
    }
  } else if (this.rightKey.isDown || rightBtnActive) {
    if (currentPlayer == 1) {
      localPlayer.anims.play("p1run", true);
    } else {
      localPlayer.anims.play("p2run", true);
    }
  } else if (this.leftKey.isDown || leftBtnActive) {
    if (currentPlayer == 1) {
      localPlayer.anims.play("p1run", true);
    } else {
      localPlayer.anims.play("p2run", true);
    }
  } else {
    if (localPlayer.anims.isPlaying) {
      if (
        localPlayer.anims.currentAnim.key == "p1run" ||
        localPlayer.anims.currentAnim.key == "p2run"
      ) {
        localPlayer.anims.stop();
        localPlayer.setFrame(0);
      }
    }
  }

  let oppositeCurrentPlayer = currentPlayer == 1 ? 2 : 1;

  if (localPlayer.body.blocked.down) {
    coyote = true;
    if (coyoteTimeout) {
      clearTimeout(coyoteTimeout);
    }
    coyoteTimeout = setTimeout(function () {
      coyote = false;
    }, 150);
  }
  const jump = Phaser.Input.Keyboard.JustDown(this.jumpKey);

  if ((jump && localPlayer.body.blocked.down) || (jump && coyote)) {
    if (localPlayer.crouchActive) {
      localPlayer.setVelocityY(-270);
    } else {
      localPlayer.setVelocityY(-400);
    }
  }

  const isAbilityInputDown =
    (scene.abilityKey?.isDown || abilityBtnActive) && gotAbility;
  const config = ABILITY_CONFIG_SINGLE[myLevelAbility];

  if (
    isAbilityInputDown &&
    singlePlayerCooldownDone &&
    !singlePlayerIsCurrentlyHolding
  ) {
    singlePlayerIsCurrentlyHolding = true;

    if (myLevelAbility === "drone") {
      if (singlePlayerDroneUsage < 5) {
        singlePlayerDroneUsage++;
        abilities[myLevelAbility]?.activate({
          abilityOwner: oppositeCurrentPlayer,
          x: localPlayer.x,
          y: localPlayer.y,
          usage: singlePlayerDroneUsage,
          duration: config.duration,
        });
      }
    } else {
      abilities[myLevelAbility]?.activate({
        abilityOwner: oppositeCurrentPlayer,
        duration: config.duration,
      });
    }

    if (config.duration && config.duration !== Infinity) {
      if (singlePlayerAbilityTimer) clearTimeout(singlePlayerAbilityTimer);

      singlePlayerAbilityTimer = setTimeout(() => {
        if (singlePlayerIsCurrentlyHolding) {
          triggerSinglePlayerDeactivation();
        }
      }, config.duration);
    }
  }

  if (!isAbilityInputDown && singlePlayerIsCurrentlyHolding) {
    triggerSinglePlayerDeactivation();
  }

  function triggerSinglePlayerDeactivation() {
    singlePlayerIsCurrentlyHolding = false;
    singlePlayerCooldownDone = false;

    if (singlePlayerAbilityTimer) {
      clearTimeout(singlePlayerAbilityTimer);
      singlePlayerAbilityTimer = null;
    }

    abilities[myLevelAbility]?.deactivate({
      abilityOwner: oppositeCurrentPlayer,
    });

    const cooldownTime = config.cooldown;
    let counter = cooldownTime / 1000;
    let abilityText =
      myLevelAbility.charAt(0).toUpperCase() + myLevelAbility.slice(1);

    const cooldownInterval = setInterval(() => {
      updateMessages([], "", true);
      updateMessages([], "", false);
      updateMessages(
        ["red"],
        abilityText + " cooling down: " + counter.toFixed(1) + "s",
        true,
      );
      counter -= 0.1;
    }, 100);

    setTimeout(() => {
      clearInterval(cooldownInterval);
      updateMessages([], "", true);
      singlePlayerCooldownDone = true;
    }, cooldownTime);
  }

  if (localPlayer.y > scene.physics.world.bounds.height + 200) {
    deathReset();
  }

  updateTileAnimations(mapAnimatedTiles1, delta);
}

function createPhaserGame() {
  var config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: "gameContainer",
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 500 },
        fps: 60,
        debug: false,
      },
    },
    scene: {
      preload: preload,
      create: createSinglePlayer,
      update: updateSinglePlayer,
    },
  };

  game = new Phaser.Game(config);
}

socket.on("startGame", (roomData) => {
  document.getElementById("setupContainer").style.display = "none";
  document.getElementById("gameContainer").style.display = "block";

  document.getElementById("particles").style.display = "none";

  isPlayer1 = roomData.users[socket.id].player === 1;
  room = roomData;
  var config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: "gameContainer",
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 500 },
        fps: 60,
        timeScale: 1,
        debug: false,
      },
    },
    scene: { preload: preload, create: create, update: update },
  };
  game = new Phaser.Game(config);
});

socket.on("deathReset", (data) => {
  if (!scene) return;
  remotePlayer.setTint(0xff0000);
  setTimeout(function () {
    remotePlayer.clearTint();
  }, 1000);
});
function deathReset() {
  localPlayer.setTint(0xff0000);
  scene.pausePhysics = true;
  setPhysicsOn(localPlayer, false);
  if (!isSinglePlayer) {
    socket.emit("deathReset", { room: roomCode });
  }
  setTimeout(function () {
    localPlayer.clearTint();
    scene.pausePhysics = false;
    setPhysicsOn(localPlayer, true);

    localPlayer.setPosition(spawnXGlobal, spawnYGlobal);
    localPlayer.setVelocity(0, 0);
    if (currentLevelName == "level6" && !isSinglePlayer) {
      socket.emit("droneRecharge", {
        room: roomCode,
      });
    } else {
      singlePlayerDroneUsage = 0;
    }
  }, 1000);
}
function getAnimatedTiles(map) {
  const animatedTiles = [];

  map.tilesets.forEach((tileset) => {
    if (!tileset.tileData) return;

    Object.values(tileset.tileData).forEach((tileData) => {
      if (tileData.animation) {
        animatedTiles.push({
          tileset,
          frames: tileData.animation.map((f) => ({
            tileid: f.tileid + tileset.firstgid,
            duration: f.duration,
          })),
        });
      }
    });
  });

  return animatedTiles;
}

function getAllMapAnimatedTiles(layers, animatedTiles) {
  const allAnimatedTiles = [];

  layers.forEach((layer) => {
    layer.forEachTile((tile) => {
      const animInfo = animatedTiles.find((a) =>
        a.frames.some((f) => f.tileid === tile.index),
      );

      if (animInfo) {
        const currentFrameIndex = animInfo.frames.findIndex(
          (f) => f.tileid === tile.index,
        );

        allAnimatedTiles.push({
          tile,
          frames: animInfo.frames,
          currentFrame: currentFrameIndex >= 0 ? currentFrameIndex : 0,
          elapsed: 0,
        });
      }
    });
  });

  return allAnimatedTiles;
}

function updateTileAnimations(mapAnimatedTiles, delta) {
  for (let i = mapAnimatedTiles.length - 1; i >= 0; i--) {
    const tileAnim = mapAnimatedTiles[i];
    if (!tileAnim || !tileAnim.tile) {
      mapAnimatedTiles.splice(i, 1);
      continue;
    }

    try {
      if (
        !tileAnim.tile.layer ||
        !tileAnim.tile.layer.tilemapLayer ||
        !tileAnim.tile.layer.tilemapLayer.scene
      ) {
        throw new Error("Layer destroyed");
      }

      tileAnim.elapsed += delta;

      tileAnim.tile.setCollision(false);

      const currentFrame = tileAnim.frames[tileAnim.currentFrame];

      if (tileAnim.elapsed >= currentFrame.duration) {
        tileAnim.elapsed -= currentFrame.duration;
        tileAnim.currentFrame =
          (tileAnim.currentFrame + 1) % tileAnim.frames.length;
        const nextFrame = tileAnim.frames[tileAnim.currentFrame];

        tileAnim.tile.index = nextFrame.tileid;
        // tileAnim.tile.setCollision(DEATH_TILES.includes(nextFrame.tileid));
      }
    } catch (err) {
      mapAnimatedTiles.splice(i, 1);
    }
  }
}

function activateCheckpointLocal(group, activeCheckpoint, mapKey, isLocal) {
  //   console.log("activatecheckpoint fct");
  try {
    group.getChildren().forEach((cp) => {
      cp.active = false;
      cp.setFrame(0);
    });

    activeCheckpoint.active = true;
    activeCheckpoint.setFrame(1);

    // update respawn only if this is the current map
    if (mapKey === currentMap && isLocal) {
      spawnXGlobal = activeCheckpoint.x;
      spawnYGlobal = activeCheckpoint.y;
    }
  } catch (e) {
    // console.log(e);
  }
}

function buildLevel({
  map,
  mapKey,
  tilesets,
  owner,
  offsetX,
  offsetY,
  spawnX,
  spawnY,
  mapName,
  scene,
  camTop,
  camBottom,
  ability,
}) {
  //   console.log("build level fct");
  const layers = [];
  const colliders = [];
  const isLocalOwner =
    (owner === 1 && isPlayer1) || (owner === 2 && !isPlayer1);

  map.layers.forEach((layerData) => {
    const layer = map.createLayer(layerData.name, tilesets, offsetX, offsetY);

    layers.push(layer);

    // Camera visibility && ability setting
    if (isSinglePlayer) {
      camBottom.ignore(layer);
      myLevelAbility = ability;
      currentLevelName = mapKey;
      spawnXGlobal = spawnX;
      spawnYGlobal = spawnY;
    } else {
      if (isLocalOwner) {
        camBottom.ignore(layer);
        myLevelAbility = ability;
        currentLevelName = mapKey;
        // spawnXGlobal = spawnX;
        // spawnYGlobal = spawnY;
        // localPlayer.setPosition(spawnXGlobal, spawnYGlobal);
        // updateMessages(["purple"], "Current Level: " + mapName, true);
      } else {
        camTop.ignore(layer);
        otherLevelAbility = ability;
        otherLevelName = mapKey;
        // updateMessages(["purple"], "Current Level: " + mapName, false);
      }
    }
    // if (!isLocalOwner) return;
    if (layerData.name == "Deco" || layerData.name == "Deco 2") {
      if (layerTints[mapKey]["tint"] != -1) {
        layer.setTint(layerTints[mapKey]["tint"]);
      }
    }

    if (layerData.name == "Deco") {
      layer.setVisible(true);
      layer.setDepth(-10);
    } else if (layerData.name == "Deco 2" || layerData.name == "BB") {
      layer.setVisible(true);
      layer.setDepth(-9);
    } else {
      layer.setVisible(false);
    }

    if (isLocalOwner || isSinglePlayer) {
      if (layerData.name === "HB") {
        // layer.setVisible(false);
        layer.setCollisionByProperty({ collides: true });
        layer.setCollisionByExclusion([-1]);
        const collider = scene.physics.add.collider(localPlayer, layer);
        colliders.push(collider);
      } else if (layerData.name === "Win") {
        const overlap = scene.physics.add.overlap(
          localPlayer,
          layer,
          (player, tile) => {
            if (isChangingLevels) return;
            if (!tile || !tile.layer || !tile.layer.tilemapLayer) return;
            if (tile.index === -1) return false;

            if (touchedWinAlr) return;
            touchedWinAlr = true;

            if (isSinglePlayer) {
              scene.time.delayedCall(0, () => {
                loadNextSingleLevel();
              });
              // console.log("win activated");
            } else {
              socket.emit("gameWinUpdate", {
                room: roomCode,
                touching: true,
              });
            }
          },
        );
        colliders.push(overlap);
      } else if (layerData.name === "Death") {
        //layer.setVisible(false);
        const overlap = scene.physics.add.overlap(
          localPlayer,
          layer,
          (player, tile) => {
            if (tile.index === -1) return false;
            if (!tile || !tile.layer || !tile.layer.tilemapLayer) return;
            if (isChangingLevels) return;
            deathReset();
          },
        );
        // console.log("Created overlap", overlap);
        colliders.push(overlap);
      } else if (layerData.name === "AB") {
        //layer.setVisible(false);
        const overlap = scene.physics.add.overlap(
          localPlayer,
          layer,
          (player, tile) => {
            if (tile.index === -1) return false;
            if (!tile || !tile.layer || !tile.layer.tilemapLayer) return;
            if (isChangingLevels) return;
            if (!gotAbility) {
              if (isSinglePlayer) {
                gotAbility = true;
                let abilityText = myLevelAbility.replace(/^./, (char) =>
                  char.toUpperCase(),
                );
                updateMessages(
                  ["blue"],
                  "Ability Gained: " + abilityText,
                  true,
                );
              } else {
                socket.emit("abilityPickup", {
                  room: roomCode,
                  state: true,
                });
              }
            }
          },
        );
        // console.log("Created overlap", overlap);
        colliders.push(overlap);
      } /*else if (layerData.name === "Teleport") {
        //layer.setVisible(false);
        const overlap = scene.physics.add.overlap(
          localPlayer,
          layer,
          (player, tile) => {
            if (tile.index === -1) return false;
            if (!tile || !tile.layer || !tile.layer.tilemapLayer) return;
            if (isChangingLevels) return;
            localPlayer.setPosition(tile.properties.x, tile.properties.y);
          },
        );
        // console.log("Created overlap", overlap);
        colliders.push(overlap);
      } */ else if (layerData.name === "BB") {
        layer.setCollisionByProperty({ collides: true });
        layer.setCollisionByExclusion([-1]);
        const overlap = scene.physics.add.collider(
          localPlayer,
          layer,
          (player, tile) => {
            if (tile.index === -1) return false;
            if (!tile || !tile.layer || !tile.layer.tilemapLayer) return;
            if (isChangingLevels) return;
            const adjacentTiles = getTouchingTiles(
              tile,
              tile.layer.tilemapLayer,
            );

            adjacentTiles.forEach((tile) => {
              if (isSinglePlayer) {
                // tile.layer.tilemapLayer.removeTileAt(tile.x, tile.y);
                destroyBlockSinglePlayer({
                  mapId: mapKey,
                  layer: tile.layer.name,
                  x: tile.x,
                  y: tile.y,
                });
              } else {
                socket.emit("destroyBlock", {
                  room: roomCode,
                  mapId: mapKey, //need to rework this
                  layer: tile.layer.name,
                  activatedBy: socket.id,
                  x: tile.x,
                  y: tile.y,
                });
              }
            });
          },
        );
        // console.log("Created overlap", overlap);
        colliders.push(overlap);
      } else if (layerData.name === "Recharge") {
        //layer.setVisible(false);
        const overlap = scene.physics.add.overlap(
          localPlayer,
          layer,
          (player, tile) => {
            if (tile.index === -1) return false;
            if (!tile || !tile.layer || !tile.layer.tilemapLayer) return;
            if (isChangingLevels) return;
            if (isSinglePlayer) {
              singlePlayerDroneUsage = 0;
              updateMessages(["green"], "Drone Recharged", true);
            } else {
              socket.emit("droneRecharge", {
                room: roomCode,
              });
            }
          },
        );
        // console.log("Created overlap", overlap);
        colliders.push(overlap);
      }
    }
  });

  let jumpGroup;
  let checkpointOverlap;
  let deathGroup;

  const checkpointsLayer = map.getObjectLayer("ObjCheck");
  if (!checkpointsLayer) return;

  const checkpointsGroup = scene.physics.add.staticGroup();

  checkpointsLayer.objects.forEach((obj, index) => {
    const x = obj.x + obj.width / 2;
    const y = obj.y - obj.height / 2;

    const block = checkpointsGroup.create(
      x + offsetX,
      y + offsetY,
      "CheckpointTileset",
      0,
    );

    block.setDepth(-4);

    block.checkpointId = index;
    block.active = false;
    block.setSize(obj.width, obj.height);
    block.refreshBody();
  });
  if (isLocalOwner || isSinglePlayer) {
    try {
      camBottom.ignore(checkpointsGroup.getChildren());
    } catch (e) {
      //   console.log(e);
    }
  } else {
    try {
      camTop.ignore(checkpointsGroup.getChildren());
    } catch (e) {
      //   console.log(e);
    }
  }

  if (isLocalOwner || isSinglePlayer) {
    try {
      checkpointOverlap = scene.physics.add.overlap(
        localPlayer,
        checkpointsGroup,
        (player, checkpoint) => {
          //   console.log("touched checkpoint");
          if (isChangingLevels) return;
          if (!checkpoint || checkpoint.active) return;

          activateCheckpointLocal(checkpointsGroup, checkpoint, mapKey, true);

          socket.emit("checkpointUpdate", {
            room: roomCode,
            mapKey,
            checkpointId: checkpoint.checkpointId,
          });
        },
      );
      //   console.log("Created overlap", checkpointOverlap);
      colliders.push(checkpointOverlap);
    } catch (e) {
      //   console.log(e);
    }
  }
  let jumpOverlap;

  if (mapKey === "level3") {
    const jumpLayer = map.getObjectLayer("ObjJump");
    jumpGroup = scene.physics.add.staticGroup();

    jumpLayer.objects.forEach((obj, index) => {
      const x = obj.x + obj.width / 2;
      const y = obj.y - obj.height / 2;

      const block = jumpGroup.create(x + offsetX, y + offsetY, "flowerSheet");

      block.jumpId = index;
      block.usedJump = false;
      block.setSize(obj.width, obj.height);
    });
    if (isPlayer1 || isSinglePlayer) {
      //only happens on p1 anyways
      jumpOverlap = scene.physics.add.overlap(
        localPlayer,
        jumpGroup,
        (player, obj) => {
          if (isChangingLevels) return;
          if (!obj.anims) return;

          if (!obj.usedJump) {
            obj.anims.play("flower", true);
            localPlayer.setVelocityY(-600);
            obj.usedJump = true;
            socket.emit("jumpAnimUpdate", {
              room: roomCode,
              jumpId: obj.jumpId,
              reset: false,
            });

            setTimeout(() => {
              obj.anims.playReverse("flower");
              socket.emit("jumpAnimUpdate", {
                room: roomCode,
                jumpId: obj.jumpId,
                reset: true,
              });

              setTimeout(() => {
                obj.usedJump = false;
              }, 1600);
            }, 3000);
          }
        },
      );
      //   console.log("Created overlap", jumpOverlap);
      colliders.push(jumpOverlap);
      camBottom.ignore(jumpGroup.getChildren());
    } else {
      camTop.ignore(jumpGroup.getChildren());
    }
  }

  // obj death
  if (isLocalOwner || isSinglePlayer) {
    const deathLayer = map.getObjectLayer("ObjDeath");
    deathGroup = scene.physics.add.staticGroup();

    deathLayer.objects.forEach((obj) => {
      const x = obj.x + obj.width / 2;
      const y = obj.y - obj.height / 2;
      const block = deathGroup.create(x + offsetX, y + offsetY, null);

      block.setSize(obj.width, obj.height);
      block.setVisible(false);

      if (obj.rotation) {
        //doesn't work unfortunately cuz phaser physics is gay
        block.setRotation(Phaser.Math.DegToRad(obj.rotation));
      }
    });
    const deathCollider = scene.physics.add.collider(
      localPlayer,
      deathGroup,
      (player, tile) => {
        if (!tile) return;
        deathReset();
      },
    );
    // console.log("Created overlap", deathCollider);
    colliders.push(deathCollider);
  }
  if (jumpGroup) {
    activeLevels.push({
      map,
      layers,
      colliders,
      key: mapKey,
      owner: owner,
      jumpGroup,
      checkpoints: checkpointsGroup,
      checkpointOverlap,
      deathGroup,
    });
  } else {
    activeLevels.push({
      map,
      layers,
      colliders,
      owner: owner,
      key: mapKey,
      checkpoints: checkpointsGroup,
      checkpointOverlap,
      deathGroup,
    });
  }
  fadeOutOverlay();
  socket.emit("endTips", roomCode);

  return [map.widthInPixels, map.heightInPixels];
}

function clearAllLevels(scene) {
  //   console.log("clearall levels fct");
  mapAnimatedTiles1.length = 0;
  mapAnimatedTiles2.length = 0;
  try {
    scene.physics.world.pause();
    activeLevels.forEach((level) => {
      if (scene[level.key + "bg"]) {
        scene[level.key + "bg"].forEach((bg) => bg.destroy());
        scene[level.key + "bg"] = [];
      }
      if (level.jumpGroup) {
        level.jumpGroup.clear(true, true);
        level.jumpGroup.destroy(true);
        level.jumpGroup = null;
      }
      if (level.checkpointOverlap) {
        scene.physics.world.removeCollider(level.checkpointOverlap);
        level.checkpointOverlap = null;
      }
      if (level.deathGroup) {
        level.deathGroup.clear(true, true);
        level.deathGroup.destroy(true);
        level.deathGroup = null;
      }
      if (level.checkpoints) {
        level.checkpoints.clear(true, true);
        level.checkpoints.destroy(true);
        level.checkpoints = null;
      }
      //   console.log("Removing", level.colliders.length, "colliders");

      level.colliders.forEach((c) => {
        scene.physics.world.removeCollider(c);
      });
      level.colliders = [];

      //   scene.physics.world.colliders.destroy();

      level.layers.forEach((layer) => {
        layer.destroy();
      });
      level.layers = [];
      if (level.map) {
        level.map.destroy();
        level.map = null;
      }
    });

    activeLevels.length = 0;
    maps = {};
    scene.time.delayedCall(0, () => {
      scene.physics.world.resume();
    });
  } catch (e) {
    // console.log(e);
  }
}
socket.on("getPosition", (data) => {
  //localPlayer.setVelocity(0); //nah cuz what if 5/5 alr
  socket.emit("getPosition", {
    room: roomCode,
    x: localPlayer.x,
    y: localPlayer.y,
    abilityOwner: data.abilityOwner,
    type: data.type,
    // activatedBy: data.activatedBy,
  });
});
function destroyBlockSinglePlayer(data) {
  if (gotAbility && localPlayer.shatterActive) {
    const map = singlePlayerCurrentMap;
    if (!map) return;
    const layer = map.getLayer(data.layer)?.tilemapLayer;
    if (!layer) return;
    layer.removeTileAt(data.x, data.y);
  }
}
socket.on("destroyBlock", (data) => {
  const map = maps[data.mapId];
  if (!map) return;

  const layer = map.getLayer(data.layer)?.tilemapLayer;
  if (!layer) return;
  if (data.activatedBy == socket.id && localPlayer.shatterActive) {
    layer.removeTileAt(data.x, data.y);
  } else if (data.activatedBy != socket.id) {
    layer.removeTileAt(data.x, data.y);
  }
});
socket.on("abilityPickup", (data) => {
  if (data.activatedBy == socket.id) {
    gotAbility = true;
    let abilityText = myLevelAbility.replace(/^./, (char) =>
      char.toUpperCase(),
    );
    updateMessages(["blue"], "Ability Gained: " + abilityText, true);
  } else {
    let abilityText = otherLevelAbility.replace(/^./, (char) =>
      char.toUpperCase(),
    );
    updateMessages(["blue"], "Ability Gained: " + abilityText, false);
  }
});

socket.on("droneRecharge", (data) => {
  if (data.activatedBy == socket.id) {
    updateMessages(["green"], "Drone Recharged", true);
  } else {
    updateMessages(["green"], "Drone Recharged", false);
  }
});
function playAbilityChain(sprite, openKey, activeKey) {
  if (
    sprite.anims.isPlaying &&
    sprite.anims.currentAnim &&
    sprite.anims.currentAnim.key === activeKey
  ) {
    return;
  }
  if (
    sprite.anims.isPlaying &&
    sprite.anims.currentAnim &&
    sprite.anims.currentAnim.key === openKey
  ) {
    return;
  }
  sprite.anims.play(openKey, true);
  sprite.off("animationcomplete");

  sprite.once("animationcomplete", (anim) => {
    if (anim.key === openKey) {
      sprite.anims.play(activeKey, true);
    }
  });
}
socket.on("jumpAnimUpdate", (data) => {
  if (!scene) return;

  const level = activeLevels.find((l) => l.jumpGroup);
  if (!level) return;

  const flower = level.jumpGroup
    .getChildren()
    .find((f) => f.jumpId === data.jumpId);

  if (!flower || !flower.anims) return;

  if (data.reset) {
    flower.anims.playReverse("flower");
  } else {
    flower.anims.play("flower", true);
  }
});

socket.on("checkpointUpdate", (data) => {
  //   console.log("checkpoint update socket evnt");

  if (!scene) return;

  const level = activeLevels.find((l) => l.key === data.mapKey);
  if (!level || !level.checkpoints) return;

  const checkpoint = level.checkpoints
    .getChildren()
    .find((cp) => cp.checkpointId === data.checkpointId);

  if (!checkpoint) return;

  activateCheckpointLocal(level.checkpoints, checkpoint, data.mapKey, false);
});

let wonAlready;
socket.on("gameClearUI", (data) => {
  gameClearedUI(data.totalTime);
});

function gameClearedUI(ms) {
  let seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;

  const hoursStr = hours.toString().padStart(2, "0");
  const minutesStr = minutes.toString().padStart(2, "0");
  const secondsStr = seconds.toString().padStart(2, "0");

  //return to home
  document.getElementById("gameOverlay").style.display = "block";
  document.getElementById("pauseBtn").style.display = "none";

  setTimeout(function () {
    document.getElementById("gameOverlay").style.opacity = "1";
  }, 50);
  document.getElementById("gameOverlay").innerHTML +=
    `<h1 style="position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); padding: 0.1em; font-size: 7em; width: 100%; text-align: center;" class="connected">Game Cleared</h1>`;
  document.getElementById("gameOverlay").innerHTML +=
    `<p style="position: absolute; top: 70%; left: 50%; transform: translate(-50%,-50%); padding: 0.1em; font-size: 3em; width: 100%; text-align: center; color: white; text-shadow: 0px 0px 10px white;">${hoursStr}:${minutesStr}:${secondsStr}</p>`;
  setTimeout(function () {
    document.getElementById("gameOverlay").style.opacity = "0";
    setTimeout(function () {
      document.getElementById("gameOverlay").style.display = "none";
    }, 500);

    document.getElementById("gameContainer").style.display = "none";
    document.getElementById("setupContainer").style.display = "block";
    document.getElementById("roomDataDiv").style.opacity = "0";
    document.getElementById("join").style.opacity = "1";
    document.getElementById("leaveBtn").style.opacity = "0";
    document.getElementById("copyLink").style.opacity = "0";
    playerSelect.style.display = "none";
    setTimeout(function () {
      document.getElementById("roomDataDiv").style.display = "none";
      document.getElementById("join").style.display = "block";
      document.getElementById("leaveBtn").style.display = "none";
      document.getElementById("copyLink").style.display = "none";
      document.getElementById("pauseBtn").style.display = "block";

      if (game) {
        game.destroy();
        game = null;
      }
    }, 500);
    resetUI();
    document.getElementById("title-white").innerHTML = "Inter";
    document.getElementById("title-black").innerHTML = "Twined";
    socket.emit("leaveRoom", roomCode);
    document.getElementById("particles").style.display = "block";
  }, 20000);
}
socket.on("gameWin", (msg) => {
  //   console.log("gamewin socket event");
  if (wonAlready) return;
  wonAlready = true;
  updateMessages(["green"], "Level Cleared", true);
  // updateMessages(["green"], "Level Cleared", false);

  clearInterval(levelTimerInterval);
  socket.emit("setTimes", {
    time: levelTimer,
    levelName: currentLevelName,
    isPlayer1: isPlayer1,
    room: roomCode,
  });

  localPlayer.crouchActive = false;
  localPlayer.levitateActive = false;
  localPlayer.glideActive = false;
  localPlayer.shatterActive = false;
  localPlayer.dashActive = false;
  localPlayer.droneActive = false;

  setTimeout(function () {
    updateMessages([], "", true);
    updateMessages([], "", false);
    socket.emit("requestNextLevel", roomCode);
    alreadySwitched = false;
    // console.log("game win, alr switched:" + alreadySwitched);
  }, 2000);
});

socket.on("switchCams", (data) => {
  if (alreadySwitched) return;
  if (data.roundId !== activeRoundId) return;
  //   if (currentPlayer === lastKnownPlayer) return;
  //   lastKnownPlayer = currentPlayer;
  alreadySwitched = true;
  //   console.log("switch cams socket event");

  if (levelTimerInterval) {
    clearInterval(levelTimerInterval);
    socket.emit("setTimes", {
      time: levelTimer,
      levelName: currentLevelName,
      isPlayer1: isPlayer1,
      room: roomCode,
    });
    startTime = Date.now();

    levelTimerInterval = setInterval(function () {
      levelTimer = Date.now() - startTime;
      document.getElementById("timer").innerHTML =
        (levelTimer / 1000).toFixed(0) + "s";
    }, 100);
  }
  safeSwitchCameras(data.currentPlayer);
});

function teardownLevelsForOwner(oldOwner) {
  //   console.log("teardownlevelsforowner");
  activeLevels.forEach((level) => {
    if (level.owner !== oldOwner) return;
    if (!level.map || !level.map.layers || level.map.layers.length === 0)
      return;

    // console.log("Removing", level.colliders.length, "colliders");
    level.colliders?.forEach((c) => {
      scene.physics.world.removeCollider(c);
    });
    level.colliders = [];

    level.jumpGroup?.clear(true, true);
    level.jumpGroup?.destroy(true);
    level.jumpGroup = null;

    level.deathGroup?.clear(true, true);
    level.deathGroup?.destroy(true);
    level.deathGroup = null;

    level.checkpoints?.clear(true, true);
    level.checkpoints?.destroy(true);
    level.checkpoints = null;

    if (level.checkpointOverlap) {
      scene.physics.world.removeCollider(level.checkpointOverlap);
      level.checkpointOverlap = null;
    }

    // 3. Destroy layers
    level.layers?.forEach((layer) => layer.destroy());
    level.layers = [];

    // 4. Destroy map LAST
    level.map?.destroy();
    level.map = null;
  });
}

function resizeCamerasOnly() {
  //   console.log("resize cameras only fct");
  let cameraWidth = window.innerWidth;
  let cameraHeight = window.innerHeight;

  let mapWidth, mapHeight;
  if (isSinglePlayer) {
    scene.physics.world.setBounds(0, 0, world1W, world1H);
    camTop.setBounds(0, 0, world1W, world1H);
    mapWidth = world1W;
    mapHeight = world1H;
    // currentMap = currentMapKey1;
    camTop.setViewport(0, 0, scene.gameWidth, scene.gameHeight);
  } else {
    if (currentPlayer === 1) {
      // console.log("world1 dimen: " + world1W / 32 + ", " + world1H / 32);
      scene.physics.world.setBounds(0, 0, world1W, world1H);
      camTop.setBounds(0, 0, world1W, world1H);
      camBottom.setBounds(0, 0, world1W, world1H);
      mapWidth = world1W;
      mapHeight = world1H;
      currentMap = currentMapKey1;
      // console.log("settingworldbounds");
    } else {
      // console.log("world2 dimen: " + world2W / 32 + ", " + world2H / 32);
      scene.physics.world.setBounds(0, 0, world2W, world2H);
      camTop.setBounds(0, 0, world2W, world2H);
      camBottom.setBounds(0, 0, world2W, world2H);
      mapWidth = world2W;
      mapHeight = world2H;
      currentMap = currentMapKey2;
      // console.log("settingworldbounds");
    }
    // Camera visibility
  }
  const isMain =
    (isPlayer1 && currentPlayer === 1) || (!isPlayer1 && currentPlayer === 2);
  if (isSinglePlayer) {
    camTop.setVisible(true);
    camBottom.setVisible(false);

    camTop.setViewport(0, 0, scene.gameWidth, scene.gameHeight);
    camBottom.setViewport(0, 0, 0, 0);
  } else {
    camTop.setVisible(isMain);
    camBottom.setVisible(!isMain);

    camTop.setViewport(0, 0, isMain ? scene.gameWidth : 0, scene.gameHeight);
    camBottom.setViewport(0, 0, isMain ? 0 : scene.gameWidth, scene.gameHeight);
  }
  // Backgrounds
  let bgKey = isMain ? currentLevelName : otherLevelName;
  if (isSinglePlayer) {
    bgKey = currentLevelName;
  }

  if (scene[bgKey + "bg"]) {
    scene[bgKey + "bg"].forEach((bg) => bg.destroy());
  }

  const backgrounds = [];

  LEVEL_BACKGROUNDS[bgKey].forEach((bg, i) => {
    const image = scene.add
      .image(0, 0, bg.key)
      .setScrollFactor(bg.factor)
      .setDepth(-100 + i);

    const scaleX =
      (cameraWidth + (mapWidth - cameraWidth) * bg.factor) / image.width;
    const scaleY =
      (cameraHeight + (mapHeight - cameraHeight) * bg.factor) / image.height;

    image.setScale(Math.max(scaleX, scaleY) * 2);
    if (isSinglePlayer) {
      camBottom.ignore(image);
    } else {
      if (isMain) camBottom.ignore(image);
      else camTop.ignore(image);
    }
    backgrounds.push(image);
  });

  scene[bgKey + "bg"] = backgrounds;
  //   console.log("correctly resized w/out errors");
}

function safeSwitchCameras(newCurrentPlayer) {
  //   console.log("safe switch cameras");

  if (!scene || isChangingLevels) return;

  isChangingLevels = true;
  currentPlayer = newCurrentPlayer;

  scene.physics.world.pause();
  mapAnimatedTiles1.length = 0;
  mapAnimatedTiles2.length = 0;

  if (currentPlayer == 1 && isPlayer1) {
    spawnXGlobal = spawnXp1;
    spawnYGlobal = spawnYp1;
    localPlayer.setPosition(spawnXGlobal, spawnYGlobal);
  }
  if (currentPlayer == 2 && !isPlayer1) {
    spawnXGlobal = spawnXp2;
    spawnYGlobal = spawnYp2;
    localPlayer.setPosition(spawnXGlobal, spawnYGlobal);
  }

  const oldOwner = newCurrentPlayer === 1 ? 2 : 1;

  teardownLevelsForOwner(oldOwner);
  resizeCamerasOnly();

  scene.time.delayedCall(0, () => {
    scene.physics.world.resume();
    isChangingLevels = false;
  });
}

function generateLevels(nextLevel1, nextLevel2, currentPlayerData) {
  //   console.log("generate levels fct");
  const map1 = scene.make.tilemap({ key: nextLevel1.mapKey });
  const tilesets1 = map1.tilesets.map((ts) =>
    map1.addTilesetImage(ts.name, ts.name),
  );

  const map2 = scene.make.tilemap({ key: nextLevel2.mapKey });
  const tilesets2 = map2.tilesets.map((ts) =>
    map2.addTilesetImage(ts.name, ts.name),
  );
  localPlayer.setPosition(256, 256);
  remotePlayer.setPosition(256, 256);
  currentPlayer = currentPlayerData;
  //   lastKnownPlayer = currentPlayer;

  currentMapKey1 = nextLevel1.mapKey;
  currentMapKey2 = nextLevel2.mapKey;

  [world1W, world1H] = buildLevel({
    map: map1,
    mapKey: nextLevel1.mapKey,
    tilesets: tilesets1,
    owner: nextLevel1.owner,
    offsetX: nextLevel1.offsetX,
    offsetY: nextLevel1.offsetY,
    spawnX: nextLevel1.spawnX,
    spawnY: nextLevel1.spawnY,
    mapName: nextLevel1.mapName,
    scene,
    camTop,
    camBottom,
    ability: nextLevel1.ability,
  });

  [world2W, world2H] = buildLevel({
    map: map2,
    mapKey: nextLevel2.mapKey,
    tilesets: tilesets2,
    owner: nextLevel2.owner,
    offsetX: nextLevel2.offsetX,
    offsetY: nextLevel2.offsetY,
    spawnX: nextLevel2.spawnX,
    spawnY: nextLevel2.spawnY,
    mapName: nextLevel2.mapName,
    scene,
    camTop,
    camBottom,
    ability: nextLevel2.ability,
  });
  maps[nextLevel1.mapKey] = map1;
  maps[nextLevel2.mapKey] = map2;

  spawnXp1 = nextLevel1.spawnX;
  spawnYp1 = nextLevel1.spawnY;
  spawnXp2 = nextLevel2.spawnX;
  spawnYp2 = nextLevel2.spawnY;

  if (currentPlayer == 1 && isPlayer1) {
    spawnXGlobal = spawnXp1;
    spawnYGlobal = spawnYp1;
    localPlayer.setPosition(spawnXGlobal, spawnYGlobal);
  }
  if (currentPlayer == 2 && !isPlayer1) {
    spawnXGlobal = spawnXp2;
    spawnYGlobal = spawnYp2;
    localPlayer.setPosition(spawnXGlobal, spawnYGlobal);
  }

  const animatedTiles1 = getAnimatedTiles(map1);
  mapAnimatedTiles1 = getAllMapAnimatedTiles(
    activeLevels[0].layers,
    animatedTiles1,
  );

  const animatedTiles2 = getAnimatedTiles(map2);
  mapAnimatedTiles2 = getAllMapAnimatedTiles(
    activeLevels[1].layers,
    animatedTiles2,
  );

  resizeCamerasOnly();
}
let remoteTargetX, remoteTargetY;
socket.on("playerUpdate", (data) => {
  remoteTargetX = data.x;
  remoteTargetY = data.y;
  if (data.left) {
    remotePlayer.flipX = true;
  } else if (data.right) {
    remotePlayer.flipX = false;
  }

  if (
    data.levitateActive ||
    data.glideActive ||
    data.shatterActive ||
    data.dashActive ||
    data.jump
  ) {
    return;
  }
  if (!isPlayer1) {
    if (data.right || data.left) {
      remotePlayer.anims.play("p1run", true);
    } else {
      remotePlayer.anims.stop();
      remotePlayer.setFrame(0);
    }
  } else {
    if (data.right || data.left) {
      remotePlayer.anims.play("p2run", true);
    } else {
      remotePlayer.anims.stop();
      remotePlayer.setFrame(0);
    }
  }
});

let pendingLevels = null;

socket.on("generateLevels", (data) => {
  if (!scene) {
    pendingLevels = data;
    return;
  }
  activeRoundId = data.roundId;
  applyLevels(data);
});

function applyLevels(data) {
  //   console.log("apply levels fct");
  if (scene && scene.physics) {
    scene.physics.world.pause();
  }
  isChangingLevels = true;
  // fadeInOverlay();
  wonAlready = false;
  gotAbility = false;
  // usedJump = false;

  mapAnimatedTiles1.length = 0;
  mapAnimatedTiles2.length = 0;

  spawnXGlobal = null;
  spawnYGlobal = null;

  clearAllLevels(scene);

  // console.log(data.nextLevel2);
  // console.log(data.nextLevel1);
  if (data.nextLevel1 == false || data.nextLevel2 == false) {
    if (active.length != 0) {
      for (const key in active) {
        beaten.push(active[key]);
      }
      active = [];
    }
    updateInfo();
    // setTimeout(fadeOutOverlay, 1000);
    //run final level
    // mergeCameras();
    isChangingLevels = false;

    socket.emit("gameClearUI", {
      room: roomCode,
    });
  } else {
    wonAlready = false;
    gotAbility = false;
    //start timer
    if (levelTimerInterval) {
      clearInterval(levelTimerInterval);
    }
    startTime = Date.now();

    levelTimerInterval = setInterval(function () {
      levelTimer = Date.now() - startTime;
      document.getElementById("timer").innerHTML =
        (levelTimer / 1000).toFixed(0) + "s";
    }, 100);
    if (active.length != 0) {
      for (const key in active) {
        beaten.push(active[key]);
      }
      active = [];
    }
    if (locked.length != 0) {
      let temp = locked;
      locked = [];
      for (const key in temp) {
        if (
          !(temp[key].mapKey == data.nextLevel1.mapKey) &&
          !(temp[key].mapKey == data.nextLevel2.mapKey)
        ) {
          locked.push(temp[key]);
        }
      }
    }
    active.push(data.nextLevel1);
    active.push(data.nextLevel2);
    updateInfo();
    // console.log("grah: " + data.currentPlayer);
    generateLevels(data.nextLevel1, data.nextLevel2, data.currentPlayer);
    alreadySwitched = false;
    touchedWinAlr = false;
    // console.log("alr switched from gen levels: " + alreadySwitched);
    fadeInOverlay();
    if (scene && scene.physics) {
      scene.physics.world.resume();
      isChangingLevels = false;
    }
  }
}

let volume = document.getElementById("volumeBtn");
let volumeOn = true;
volume.addEventListener("click", function () {
  if (!scene) return;
  if (volumeOn) {
    volume.src = "assets/volumeOff.png";
    scene.music.pause();
    localStorage.setItem("soundOn", false);
  } else {
    volume.src = "assets/volumeOn.png";
    scene.music.play();
    localStorage.setItem("soundOn", true);
  }
  volumeOn = !volumeOn;
});

function mergeCameras() {
  // scene.cameras.main.reset();
  camTop.setViewport(0, 0, scene.gameWidth, scene.gameHeight);
  scene.cameras.remove(camBottom);
  remotePlayer.destroy();
  finalLevelActive = true;

  if (isPlayer1) {
    remotePlayer = scene.physics.add.sprite(0, 0, "p1");
  } else {
    remotePlayer = scene.physics.add.sprite(0, 0, "p2");
  }

  remotePlayer.body.allowGravity = false;
  remotePlayer.body.moves = false; // keep this bc lag
  remotePlayer.body.immovable = true; // and this fr
  remotePlayer.setCollideWorldBounds(true);

  // camBottom.destroy(); this breaks it fr
  scene.physics.add.collider(localPlayer, remotePlayer);

  document.getElementById("divider").style.display = "none";
}

function getTouchingTiles(targetTile, layer) {
  const tileX = targetTile.x;
  const tileY = targetTile.y;
  const touchingTiles = [];
  const neighbors = [
    { x: tileX - 1, y: tileY },
    { x: tileX + 1, y: tileY },
    { x: tileX, y: tileY - 1 },
    { x: tileX, y: tileY + 1 },
  ];

  neighbors.push(
    { x: tileX - 1, y: tileY - 1 },
    { x: tileX + 1, y: tileY - 1 },
    { x: tileX - 1, y: tileY + 1 },
    { x: tileX + 1, y: tileY + 1 },
  );

  neighbors.forEach((coord) => {
    const tile = layer.getTileAt(coord.x, coord.y, true);
    if (tile) {
      touchingTiles.push(tile);
    }
  });
  touchingTiles.push(targetTile); //make sure to push the original tile :sob:

  return touchingTiles;
}

socket.on("abilityActivated", (data) => {
  if (data.type == "drone") {
    abilities[data.type]?.activate({
      abilityOwner: data.abilityOwner,
      x: data.x,
      y: data.y,
      usage: data.usage,
      duration: data.duration,
    });
  } else {
    abilities[data.type]?.activate({
      abilityOwner: data.abilityOwner,
      duration: data.duration,
    });
  }
});

socket.on("abilityDeactivated", (data) => {
  abilities[data.type]?.deactivate({
    abilityOwner: data.abilityOwner,
  });
  let counter = data.cooldown / 1000;
  const cooldownInterval = setInterval(() => {
    if (data.activatedBy != socket.id) {
      let abilityText = myLevelAbility.replace(/^./, (char) =>
        char.toUpperCase(),
      );
      updateMessages(
        ["red"],
        abilityText + " cooling down: " + counter.toFixed(1) + "s",
        true,
      );
    } else {
      let abilityText = otherLevelAbility.replace(/^./, (char) =>
        char.toUpperCase(),
      );
      updateMessages(
        ["red"],
        abilityText + " cooling down: " + counter.toFixed(1) + "s",
        false,
      );
    }
    counter -= 0.1;
  }, 100);
  setTimeout(() => {
    clearInterval(cooldownInterval);
    updateMessages([], "", true);
    updateMessages([], "", false);
  }, data.cooldown);
});

document.getElementById("saveKeybinds").addEventListener("click", function () {
  updateKeybinds();
  document.getElementById("saveKeybinds").innerText = "Saved!";
  setTimeout(function () {
    document.getElementById("saveKeybinds").innerText = "Save";
  }, 1500);
});
document.getElementById("resetKeybinds").addEventListener("click", function () {
  resetKeybinds();
  document.getElementById("resetKeybinds").innerText = "Reset to Default!";
  setTimeout(function () {
    document.getElementById("resetKeybinds").innerText = "Reset Keybinds";
  }, 1500);
});

function prevent(e) {
  e.preventDefault();
}

let leftBtn = document.getElementById("leftBtn");
let rightBtn = document.getElementById("rightBtn");
let jumpBtn = document.getElementById("jumpBtn");
let abilityBtn = document.getElementById("abilityBtn");
let restartBtn = document.getElementById("restartBtn");

leftBtn.addEventListener("pointerdown", (e) => {
  prevent(e);
  leftBtnActive = true;
});
leftBtn.addEventListener("pointerup", (e) => {
  prevent(e);
  leftBtnActive = false;
});
leftBtn.addEventListener("pointercancel", () => {
  leftBtnActive = false;
});

rightBtn.addEventListener("pointerdown", (e) => {
  prevent(e);
  rightBtnActive = true;
});
rightBtn.addEventListener("pointerup", (e) => {
  prevent(e);
  rightBtnActive = false;
});
rightBtn.addEventListener("pointercancel", () => {
  rightBtnActive = false;
});

jumpBtn.addEventListener("pointerdown", (e) => {
  prevent(e);

  if (scene) {
    if (localPlayer.crouchActive) {
      localPlayer.setVelocityY(-270);
    } else {
      if (localPlayer.body.blocked.down || coyote) {
        localPlayer.setVelocityY(-400);
      }
    }
  }
});

abilityBtn.addEventListener("pointerdown", (e) => {
  prevent(e);
  abilityBtnActive = true;

  if (!abilityPressed) {
    abilityPressed = true;
    if (isSinglePlayer) {
      // {FINISH THIS ONCE I'M DONE WITH EVERYTHING}
    } else {
      socket.emit("abilityActivated", {
        room: roomCode,
        abilityOwner: isPlayer1 ? 2 : 1,
        type: otherLevelAbility,
        activatedBy: socket.id,
        x: remotePlayer.x,
        y: remotePlayer.y,
      });
    }
  }
});

abilityBtn.addEventListener("pointerup", (e) => {
  prevent(e);
  abilityBtnActive = false;

  if (abilityPressed) {
    abilityPressed = false;
    socket.emit("abilityDeactivated", {
      room: roomCode,
      abilityOwner: isPlayer1 ? 2 : 1,
      type: otherLevelAbility,
      activatedBy: socket.id,
    });
  }
});

abilityBtn.addEventListener("pointercancel", () => {
  abilityBtnActive = false;
  abilityPressed = false;
});

restartBtn.addEventListener("pointerdown", (e) => {
  prevent(e);
  if (scene) {
    //deathReset();
    localPlayer.setPosition(spawnXGlobal, spawnYGlobal);
    localPlayer.setVelocity(0, 0);
  }
});

const SPECIAL_KEYS = {
  ArrowLeft: "LEFT",
  ArrowRight: "RIGHT",
  ArrowUp: "UP",
  ArrowDown: "DOWN",
  Space: "SPACE",
  Escape: "ESC",
  Enter: "ENTER",
  Backspace: "BACKSPACE",
  Tab: "TAB",
  ShiftLeft: "SHIFT",
  ShiftRight: "SHIFT",
  ControlLeft: "CTRL",
  ControlRight: "CTRL",
  AltLeft: "ALT",
  AltRight: "ALT",
  CapsLock: "CAPS_LOCK",
  PageUp: "PAGE_UP",
  PageDown: "PAGE_DOWN",
  End: "END",
  Home: "HOME",
  Insert: "INSERT",
  Delete: "DELETE",
  ContextMenu: "CONTEXT_MENU",
  NumLock: "NUM_LOCK",
  ScrollLock: "SCROLL_LOCK",
  Pause: "PAUSE",
};
function normalizeToPhaserKey(key) {
  const special = SPECIAL_KEYS[key];
  if (special) return special;

  if (/^Key([A-Z])$/.test(key)) {
    return key.slice(3); // KeyA -> A
  }

  if (/^Digit([0-9])$/.test(key)) {
    const nums = [
      "ZERO",
      "ONE",
      "TWO",
      "THREE",
      "FOUR",
      "FIVE",
      "SIX",
      "SEVEN",
      "EIGHT",
      "NINE",
    ];
    return nums[+key.slice(5)];
  }

  return key.toUpperCase();
}

function getKeyObject(key) {
  const phaserKey = normalizeToPhaserKey(key);

  return scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[phaserKey]);
}

const ACTIONS = {
  left: { sceneKey: "leftKey", storage: "left", selector: ".div6" },
  right: { sceneKey: "rightKey", storage: "right", selector: ".div7" },
  jump: { sceneKey: "jumpKey", storage: "jump", selector: ".div8" },
  ability: { sceneKey: "abilityKey", storage: "ability", selector: ".div9" },
  pause: { sceneKey: "pauseKey", storage: "pause", selector: ".div12" },
  restart: { sceneKey: "restartKey", storage: "restart", selector: ".div10" },
};

const DEFAULT_KEYS = {
  left: "ArrowLeft",
  right: "ArrowRight",
  jump: "ArrowUp",
  ability: "k",
  pause: "ESC",
  restart: "r",
};

const keydownDivs = document.querySelectorAll(".keydownDiv");
keydownDivs.forEach((div) => {
  div.addEventListener("keydown", function (event) {
    event.preventDefault();
    let keyDisplay = event.key;
    if (keyDisplay == "ArrowLeft") {
      keyDisplay = "←";
    } else if (keyDisplay == "ArrowRight") {
      keyDisplay = "→";
    } else if (keyDisplay == "ArrowUp") {
      keyDisplay = "↑";
    } else if (keyDisplay == "ArrowDown") {
      keyDisplay = "↓";
    } else if (keyDisplay == " ") {
      keyDisplay = "Space";
    }
    div.textContent = keyDisplay;
    if (keyDisplay == "Space") {
      div.dataset.key = "Space";
    } else {
      div.dataset.key = event.key;
    }
  });
});

function updateKeybinds() {
  if (!scene) return;

  const usedPhaserKeys = new Map();

  document.querySelectorAll(".keydownDiv").forEach((div) => {
    const action = ACTIONS[div.dataset.event];
    if (!action) return;

    const domKey = div.dataset.key;
    const phaserKey = normalizeToPhaserKey(domKey);

    // Collision check
    if (usedPhaserKeys.has(phaserKey)) {
      const conflictAction = usedPhaserKeys.get(phaserKey);

      alert(
        `"${domKey}" is already assigned to "${conflictAction}".\nEach action must have a unique key.`,
      );

      return;
    }

    usedPhaserKeys.set(phaserKey, action.storage);

    scene[action.sceneKey] = getKeyObject(domKey);
    localStorage.setItem(action.storage, domKey);
  });
}

function resetKeybinds() {
  if (!scene) return;
  for (const actionName in ACTIONS) {
    const { storage, selector } = ACTIONS[actionName];
    const key = DEFAULT_KEYS[storage];
    let keyDisplay = key;
    if (key == "ArrowLeft") {
      keyDisplay = "←";
    } else if (key == "ArrowRight") {
      keyDisplay = "→";
    } else if (key == "ArrowUp") {
      keyDisplay = "↑";
    } else if (key == "ArrowDown") {
      keyDisplay = "↓";
    }
    const div = document.querySelector(selector);
    if (!div) continue;

    div.dataset.key = key;
    div.innerHTML = keyDisplay;
    // localStorage.setItem(actionName.storage, domKey);
  }
}

function setLocalStorage() {
  // if (!scene) return;

  for (const actionName in ACTIONS) {
    const { storage, selector } = ACTIONS[actionName];
    const key = localStorage.getItem(storage) || DEFAULT_KEYS[storage];
    let keyDisplay = key;
    if (key == "ArrowLeft") {
      keyDisplay = "←";
    } else if (key == "ArrowRight") {
      keyDisplay = "→";
    } else if (key == "ArrowUp") {
      keyDisplay = "↑";
    } else if (key == "ArrowDown") {
      keyDisplay = "↓";
    }
    const div = document.querySelector(selector);
    if (!div) continue;

    div.dataset.key = key;
    div.innerHTML = keyDisplay;
  }
}
let abilityPressed = false;

function preload() {
  this.load.image("RDTileset", "assets/RDTileset.png");
  this.load.image("FTileset", "assets/FTileset.png");
  this.load.image("ExtrasTileset", "assets/ExtrasTileset.png");
  this.load.spritesheet("flowerSheet", "assets/jumpanim.png", {
    frameWidth: 64,
    frameHeight: 64,
  });
  this.load.spritesheet("p1", "assets/p1sheet.png", {
    frameWidth: 48,
    frameHeight: 48,
  });
  this.load.spritesheet("p2", "assets/p2sheet.png", {
    frameWidth: 48,
    frameHeight: 48,
  });
  this.load.spritesheet("CheckpointTileset", "assets/CheckpointTileset.png", {
    frameWidth: 64,
    frameHeight: 64,
  });

  this.load.tilemapTiledJSON("level1", "assets/levels/RDLevel1.tmj");
  this.load.tilemapTiledJSON("level2", "assets/levels/RDLevel2.tmj");
  this.load.tilemapTiledJSON("level3", "assets/levels/RDLevel3.tmj");
  this.load.tilemapTiledJSON("level4", "assets/levels/RDLevel4.tmj");
  this.load.tilemapTiledJSON("level5", "assets/levels/RDLevel5.tmj");
  this.load.tilemapTiledJSON("level6", "assets/levels/RDLevel6.tmj");

  this.load.audio("music", "assets/gameMusic.m4a");

  //bgs
  Object.entries(LEVEL_BACKGROUNDS).forEach(([level, layers]) => {
    layers.forEach(({ key }) => {
      const layerNum = key.match(/layer(\d+)/)[1];
      this.load.image(key, `assets/backgrounds/${level}/layer${layerNum}.png`);
      // console.log(`assets/backgrounds/${level}/layer${layerNum}.png`);
    });
  });

  // this.load.image("p1", "assets/player.png");
  this.load.image("drone", "assets/drone.png");
  this.gameWidth = this.sys.game.canvas.width;
  this.gameHeight = this.sys.game.canvas.height;
}
//let grid;
function create() {
  scene = this;
  this.physics.world.TILE_BIAS = 32;

  if (pendingLevels) {
    applyLevels(pendingLevels);
    pendingLevels = null;
  }
  const p1Sprite = this.physics.add.sprite(0, 0, "p1");
  const p2Sprite = this.physics.add.sprite(0, 0, "p2");

  camTop = this.cameras.main;
  camTop.setViewport(0, 0, 50, 50);

  camBottom = this.cameras.add(0, 50, 50, 50);
  //0.7
  camTop.zoomTo(0.7, 2000, Phaser.Math.Easing.Back.Out);
  camBottom.zoomTo(0.7, 2000, Phaser.Math.Easing.Back.Out);

  // camTop.setBackgroundColor("#00FF00");
  // camBottom.setBackgroundColor("#FFFF00");

  if (isPlayer1) {
    localPlayer = p1Sprite;
    remotePlayer = p2Sprite;

    camTop.startFollow(localPlayer);
    camBottom.startFollow(remotePlayer);

    camTop.ignore(remotePlayer);
    camBottom.ignore(localPlayer);
  } else {
    localPlayer = p2Sprite;
    remotePlayer = p1Sprite;

    camTop.startFollow(localPlayer);
    camBottom.startFollow(remotePlayer);

    camTop.ignore(remotePlayer);
    camBottom.ignore(localPlayer);
  }
  remotePlayer.setCollideWorldBounds(true);
  localPlayer.setCollideWorldBounds(true);

  remotePlayer.body.moves = false;
  remotePlayer.body.immovable = true;

  //socket events
  remoteTargetX = 0;
  remoteTargetY = 0;

  //drone platforms
  dronePlatforms = this.physics.add.staticGroup();
  this.physics.add.collider(localPlayer, dronePlatforms);

  // generate Levels
  socket.emit("requestNextLevel", roomCode);

  this.lastSend = 0;

  this.cursors = this.input.keyboard.createCursorKeys();

  this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

  setLocalStorage();
  updateKeybinds();

  //level skipping, comment out for final build
  /* this.input.keyboard.on("keydown-Z", function (event) {
    socket.emit("gameWinUpdate", {
      room: roomCode,
      touching: true,
    });
  });*/

  this.pausePhysics = false;

  this.music = this.sound.add("music");
  this.music.setLoop(true);
  if (localStorage.getItem("soundOn") == null) {
    localStorage.setItem("soundOn", true);
  }
  if (localStorage.getItem("soundOn") == true) {
    this.music.play();
  } else {
    this.music.pause();
  }
  createAnimations(this);
  // this.input.keyboard.preventDefault = false;
}
document.getElementById("pauseBtn").addEventListener("click", function () {
  showPause();
  scene.pausePhysics = true;
  setPhysicsOn(localPlayer, false);
});

document.getElementById("resumeBtn").addEventListener("click", function () {
  hidePause();
  scene.pausePhysics = false;
  setPhysicsOn(localPlayer, true);
});

function setPhysicsOn(sprite, val = true) {
  sprite.body.enable = val;
  sprite.setCollisionCategory(val ? 1 : null);

  // sprite.setEnable(false);
  sprite.body.moves = val;
  sprite.body.immovable = !val;

  // sprite.setIgnoreGravity(!val);
  if (!val) {
    sprite.setAngularVelocity(0);
    sprite.setVelocity(0, 0);
  }
}

chatInput.addEventListener("focus", () => {
  if (scene) {
    scene.input.keyboard.enabled = false;
  }
});

chatInput.addEventListener("blur", () => {
  if (scene) {
    scene.input.keyboard.enabled = true;
  }
});
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.stopPropagation();
    chatSend.click();
  }
});

let coyoteTimeout;
let isGoingRight = false;
let isGoingLeft = false;
function update(time, delta) {
  if (!localPlayer) return;
  if (isChangingLevels || !scene?.physics?.world) return;
  try {
    //pause/unpause
    updateTileAnimations(mapAnimatedTiles1, delta);
    updateTileAnimations(mapAnimatedTiles2, delta);

    if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
      this.pausePhysics = !this.pausePhysics;

      setPhysicsOn(localPlayer, !this.pausePhysics);

      if (this.pausePhysics) {
        showPause();
      } else {
        hidePause();
      }
    }
    if (!this.pausePhysics) {
      const jump = Phaser.Input.Keyboard.JustDown(this.jumpKey);
      /* Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
        Phaser.Input.Keyboard.JustDown(this.keyW) ||
        Phaser.Input.Keyboard.JustDown(this.keySpace);*/
      if (!abilityBtnActive) {
        if (scene.abilityKey?.isDown) {
          if (!abilityPressed) {
            abilityPressed = true;
            socket.emit("abilityActivated", {
              room: roomCode,
              abilityOwner: isPlayer1 ? 2 : 1,
              type: otherLevelAbility,
              activatedBy: socket.id,
              x: remotePlayer.x,
              y: remotePlayer.y,
            });
          }
        }
      }

      // Ability release
      if (!abilityBtnActive) {
        if (scene.abilityKey && !scene.abilityKey.isDown) {
          if (abilityPressed) {
            abilityPressed = false;
            socket.emit("abilityDeactivated", {
              room: roomCode,
              abilityOwner: isPlayer1 ? 2 : 1,
              type: otherLevelAbility,
              activatedBy: socket.id,
            });
          }
        }
      }
      //check if you are the main or side player
      if (
        (currentPlayer == 1 && isPlayer1) ||
        (currentPlayer == 2 && !isPlayer1)
      ) {
        //restart
        if (scene.restartKey.isDown) {
          //deathReset();
          localPlayer.setPosition(spawnXGlobal, spawnYGlobal);
          localPlayer.setVelocity(0, 0);
        }

        if (localPlayer.levitateActive) {
          localPlayer.body.allowGravity = false;
          localPlayer.setVelocityY(-100);
          localPlayer.setAccelerationY(0);
        } else if (localPlayer.glideActive) {
          localPlayer.body.allowGravity = true;
          localPlayer.setVelocityY(50);
        } else {
          localPlayer.body.allowGravity = true;
          if (localPlayer.body.blocked.down) {
            coyote = true;
            if (coyoteTimeout) {
              clearTimeout(coyoteTimeout);
            }
            coyoteTimeout = setTimeout(function () {
              coyote = false;
            }, 150);
          }
          if ((jump && localPlayer.body.blocked.down) || (jump && coyote)) {
            if (localPlayer.crouchActive) {
              localPlayer.setVelocityY(-270);
            } else {
              localPlayer.setVelocityY(-400);
            }
          }
          if (localPlayer.body.blocked.down) {
            localPlayer.jump = false;
          } else {
            localPlayer.jump = true;
          }
        }

        let velocityX = 360;
        if (localPlayer.dashActive) {
          velocityX = 1500;
        }
        //do anims logic haha :sob: if else chain of doom ahh
        if (localPlayer.levitateActive) {
          localPlayer.anims.play("p1levitate", true);
        } else if (localPlayer.glideActive) {
          const currentKey = localPlayer.anims.currentAnim
            ? localPlayer.anims.currentAnim.key
            : "";

          if (currentKey !== "p1glideOpen") {
            localPlayer.anims.play("p1glideActive", true);
          }
        } else if (localPlayer.shatterActive) {
          localPlayer.anims.play("p2shatter", true);
        } else if (localPlayer.dashActive) {
          const currentKey = localPlayer.anims.currentAnim
            ? localPlayer.anims.currentAnim.key
            : "";

          if (currentKey !== "p2dashOpen") {
            localPlayer.anims.play("p2dashActive", true);
          }
        } else if (this.rightKey.isDown || rightBtnActive) {
          if (isPlayer1) {
            localPlayer.anims.play("p1run", true);
          } else {
            localPlayer.anims.play("p2run", true);
          }
        } else if (this.leftKey.isDown || leftBtnActive) {
          if (isPlayer1) {
            localPlayer.anims.play("p1run", true);
          } else {
            localPlayer.anims.play("p2run", true);
          }
        } else {
          localPlayer.anims.stop();
          localPlayer.setFrame(0);
        }

        if (this.rightKey.isDown || rightBtnActive) {
          localPlayer.setVelocityX(velocityX);
          localPlayer.flipX = false;

          isGoingRight = true;
        } else if (this.leftKey.isDown || leftBtnActive) {
          localPlayer.setVelocityX(-velocityX);
          localPlayer.flipX = true;

          isGoingLeft = true;
        } else {
          localPlayer.setVelocityX(0);
          isGoingLeft = false;
          isGoingRight = false;
        }
      }
    }
    if (time - this.lastSend > 5) {
      if (
        localPlayer.x != localPlayerState.x ||
        localPlayer.y != localPlayerState.y ||
        localPlayer.droneActive
      ) {
        socket.emit("playerUpdate", {
          room: roomCode,
          x: localPlayer.x,
          y: localPlayer.y,
          left: isGoingLeft,
          right: isGoingRight,
          crouchActive: localPlayer.crouchActive,
          levitateActive: localPlayer.levitateActive,
          glideActive: localPlayer.glideActive,
          shatterActive: localPlayer.shatterActive,
          dashActive: localPlayer.dashActive,
          droneActive: localPlayer.droneActive,
          jump: localPlayer.jump,
        });
      }
      localPlayerState.x = localPlayer.x;
      localPlayerState.y = localPlayer.y;

      this.lastSend = time;
      const base = 0.2;
      const eased = Phaser.Math.Easing.Sine.Out(base);

      remotePlayer.x = Phaser.Math.Linear(remotePlayer.x, remoteTargetX, eased);
      remotePlayer.y = Phaser.Math.Linear(remotePlayer.y, remoteTargetY, eased);
    }
  } catch (e) {
    // console.log(e);
  }
}
window.addEventListener("resize", function () {
  if (!game || !scene) {
    return;
  }
  let width = window.innerWidth;
  let height = window.innerHeight;
  game.scale.resize(width, height);
  if (finalLevelActive) {
    camTop.setViewport(0, 0, width, height);
  } else {
    resizeCamerasOnly();
    scene.scale.setGameSize(window.innerWidth, window.innerHeight);
  }
});
