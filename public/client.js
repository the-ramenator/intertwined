const socket = io();
let roomCode = null;
let localPlayer, remotePlayer, isPlayer1;
let maps = {};
let activeLevels = [];
let scene;
let myLevelAbility = null;
let otherLevelAbility = null;
let spawnXGlobal, spawnYGlobal; //update this for checkpoints
let currentLevelName, otherLevelName;
let mainLayerXOffset, mainLayerYOffset;

let levelTimer, levelTimerInterval, startTime;
let finalLevelActive = false;

let leftBtnActive = false,
    rightBtnActive = false,
    jumpBtnActive = false,
    abilityBtnActive = false,
    restartBtnActive = false;

let levelInfo, abilityInfo;

let localPlayerState = {
    x: 0,
    y: 0,
};

let droneActive = false;
let dronePlatform, dronePlatforms;

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

function getPlayerByOwner(owner) {
    if ((owner === 1 && isPlayer1) || (owner === 2 && !isPlayer1)) {
        return localPlayer;
    }
    return remotePlayer;
}

let activeInterval;
let gotAbility = false;
function updateMessages(classes, msg, isLocal, duration = false) {
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
        let counter = duration / 1000;
        activeInterval = setInterval(() => {
            el.innerHTML = msg + ": " + counter.toFixed(1) + "s";
            counter -= 0.1;
        }, 100);
        setTimeout(() => {
            clearInterval(activeInterval);
            updateMessages([], "", isLocal);
        }, duration);
    }
}
const abilities = {
    crouch: {
        activate({ abilityOwner, duration }) {
            getPlayerByOwner(abilityOwner).setScale(0.1);
            getPlayerByOwner(abilityOwner).crouchActive = true;
            let isPlayerCheck = isPlayer1 ? 1 : 2;
            let isLocal = isPlayerCheck == abilityOwner ? true : false;
            updateMessages(["green"], "Crouch Active", isLocal, duration);
        },
        deactivate({ abilityOwner }) {
            getPlayerByOwner(abilityOwner).setScale(0.2);
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
            getPlayerByOwner(abilityOwner).levitateActive = true;
            let isPlayerCheck = isPlayer1 ? 1 : 2;
            let isLocal = isPlayerCheck == abilityOwner ? true : false;
            updateMessages(["green"], "Levitate Active", isLocal, duration);
        },
        deactivate({ abilityOwner }) {
            getPlayerByOwner(abilityOwner).levitateActive = false;
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
            getPlayerByOwner(abilityOwner).glideActive = true;
            let isPlayerCheck = isPlayer1 ? 1 : 2;
            let isLocal = isPlayerCheck == abilityOwner ? true : false;
            updateMessages(["green"], "Glide Active", isLocal, duration);
        },
        deactivate({ abilityOwner }) {
            getPlayerByOwner(abilityOwner).glideActive = false;
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
            getPlayerByOwner(abilityOwner).breakActive = true;
            let isPlayerCheck = isPlayer1 ? 1 : 2;
            let isLocal = isPlayerCheck == abilityOwner ? true : false;
            updateMessages(["green"], "Shatter Active", isLocal, duration);
        },
        deactivate({ abilityOwner }) {
            getPlayerByOwner(abilityOwner).breakActive = false;
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
            getPlayerByOwner(abilityOwner).dashActive = true;
            let isPlayerCheck = isPlayer1 ? 1 : 2;
            let isLocal = isPlayerCheck == abilityOwner ? true : false;
            updateMessages(["green"], "Dash Active", isLocal, duration);
        },
        deactivate({ abilityOwner }) {
            getPlayerByOwner(abilityOwner).dashActive = false;
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
                dronePlatform = dronePlatforms
                    .create(x, y + 140, "p1")
                    .setScale(1.25, 0.25);
                //camera ignore
                if (isPlayer1) {
                    camTop.ignore(dronePlatform);
                } else {
                    camBottom.ignore(dronePlatform);
                }
                dronePlatform.body.immovable = true;
                dronePlatform.body.moves = false;
                dronePlatform.body.allowGravity = false;
            }
        },
        deactivate({ abilityOwner }) {
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
            console.error("Failed to copy: ", err);
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
        document.getElementById("connection1").innerHTML =
            "&nbsp;Connected&nbsp;";
        document.getElementById("connection1").classList.remove("waiting");
        document.getElementById("connection1").classList.add("connected");
        document.getElementById("connection1id").innerHTML =
            "&nbsp;ID: " + users[0] + "&nbsp;";
        if (users[0] == socket.id) {
            document.getElementById("connection1").innerHTML += " (You)&nbsp;";
        }
    }
    if (users[1]) {
        document.getElementById("connection2").innerHTML =
            "&nbsp;Connected&nbsp;";
        document.getElementById("connection2").classList.remove("remove");
        document.getElementById("connection2").classList.add("connected");
        document.getElementById("connection2id").innerHTML =
            "&nbsp;ID: " + users[1] + "&nbsp;";
        if (users[1] == socket.id) {
            document.getElementById("connection2").innerHTML += " (You)&nbsp;";
        }
    } else {
        document.getElementById("connection2").innerHTML =
            "&nbsp;Waiting...&nbsp;";
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
startBtn.addEventListener("click", () => {
    socket.emit("startGame", roomCode);
});

socket.on("playerStatusUpdate", ({ disabled, room, canStart }) => {
    player1Btn.disabled = disabled.player1;
    player2Btn.disabled = disabled.player2;
    if (disabled.player1) {
        player1Btn.classList.add("selected");
        player1Btn.classList.remove("connected");
        if (room.users[socket.id].player == 1) {
            player1Btn.innerHTML = "Player 1 (You)";
        } else {
            player1Btn.innerHTML = "Player 1 (Taken)";
        }
    } else {
        player1Btn.classList.remove("selected");
        player1Btn.classList.add("connected");
        player1Btn.innerHTML = "Select Player 1";
    }
    if (disabled.player2) {
        player2Btn.classList.add("selected");
        player2Btn.classList.remove("connected");
        player2Btn.innerHTML = "Player 2 (Taken)";
        if (room.users[socket.id].player == 2) {
            player2Btn.innerHTML = "Player 2 (You)";
        } else {
            player2Btn.innerHTML = "Player 2 (Taken)";
        }
    } else {
        player2Btn.classList.remove("selected");
        player2Btn.classList.add("connected");
        player2Btn.innerHTML = "Select Player 2";
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
socket.on("startGame", (roomData) => {
    document.getElementById("setupContainer").style.display = "none";
    document.getElementById("gameContainer").style.display = "block";

    document.getElementById("particles").style.display = "none";

    // console.log(roomData.users[socket.id].player === 1);
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
                debug: true,
            },
        },
        scene: { preload: preload, create: create, update: update },
    };
    game = new Phaser.Game(config);
});
function buildLevel({
    map,
    mapKey,
    tileset,
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
    const layers = [];
    const colliders = [];
    map.layers.forEach((layerData) => {
        const layer = map.createLayer(
            layerData.name,
            tileset,
            offsetX,
            offsetY,
        );

        layers.push(layer);

        const isLocalOwner =
            (owner === 1 && isPlayer1) || (owner === 2 && !isPlayer1);
        // Camera visibility && ability setting
        if (isLocalOwner) {
            camBottom.ignore(layer);
            myLevelAbility = ability;
            currentLevelName = mapKey;
            localPlayer.setPosition(spawnXGlobal, spawnYGlobal);
            updateMessages(["purple"], "Current Level: " + mapName, true);
            spawnXGlobal = spawnX;
            spawnYGlobal = spawnY;
        } else {
            camTop.ignore(layer);
            otherLevelAbility = ability;
            otherLevelName = mapKey;
            updateMessages(["purple"], "Current Level: " + mapName, false);
        }

        if (!isLocalOwner) return;

        if (layerData.name === "HB") {
            layer.setCollisionByProperty({ collides: true });
            layer.setCollisionByExclusion([-1]);
            const collider = scene.physics.add.collider(localPlayer, layer);
            colliders.push(collider);
        } else if (layerData.name === "Win") {
            const overlap = scene.physics.add.overlap(
                localPlayer,
                layer,
                (player, tile) => {
                    if (tile.index === -1) return false;
                    socket.emit("gameWinUpdate", {
                        room: roomCode,
                        touching: true,
                    });
                    setTimeout(function () {
                        socket.emit("gameWinUpdate", {
                            room: roomCode,
                            touching: false,
                        });
                    }, 500);
                },
            );
            colliders.push(overlap);
        } else if (layerData.name === "Death") {
            const overlap = scene.physics.add.overlap(
                localPlayer,
                layer,
                (player, tile) => {
                    if (tile.index === -1) return false;
                    // localPlayer.setPosition(spawnX, spawnY);
                },
            );
            colliders.push(overlap);
        } else if (layerData.name === "AB") {
            const overlap = scene.physics.add.overlap(
                localPlayer,
                layer,
                (player, tile) => {
                    if (tile.index === -1) return false;
                    if (!gotAbility) {
                        socket.emit("abilityPickup", {
                            room: roomCode,
                            state: true,
                        });
                    }
                },
            );
            colliders.push(overlap);
        } else if (layerData.name === "Teleport") {
            const overlap = scene.physics.add.overlap(
                localPlayer,
                layer,
                (player, tile) => {
                    if (tile.index === -1) return false;
                    localPlayer.setPosition(
                        tile.properties.x,
                        tile.properties.y,
                    );
                },
            );
            colliders.push(overlap);
        } else if (layerData.name === "Jump") {
            const overlap = scene.physics.add.overlap(
                localPlayer,
                layer,
                (player, tile) => {
                    if (tile.index === -1) return false;
                    localPlayer.setVelocityY(-600);
                },
            );
            colliders.push(overlap);
        } else if (layerData.name === "BB") {
            layer.setCollisionByProperty({ collides: true });
            layer.setCollisionByExclusion([-1]);
            const overlap = scene.physics.add.collider(
                localPlayer,
                layer,
                (player, tile) => {
                    if (tile.index === -1) return false; //alert("hehe touchig");
                    const adjacentTiles = getTouchingTiles(
                        tile,
                        tile.layer.tilemapLayer,
                    );

                    adjacentTiles.forEach((tile) => {
                        //tile.layer.tilemapLayer.removeTileAt(tile.x, tile.y);
                        socket.emit("destroyBlock", {
                            room: roomCode,
                            mapId: mapKey, //need to rework this
                            layer: tile.layer.name,
                            activatedBy: socket.id,
                            x: tile.x,
                            y: tile.y,
                        });
                    });
                },
            );
            colliders.push(overlap);
        } else if (layerData.name === "Recharge") {
            const overlap = scene.physics.add.overlap(
                localPlayer,
                layer,
                (player, tile) => {
                    if (tile.index === -1) return false;
                    socket.emit("droneRecharge", {
                        room: roomCode,
                    });
                },
            );
            colliders.push(overlap);
        }
    });

    activeLevels.push({
        map,
        layers,
        colliders,
    });
    fadeOutOverlay();
    return [map.widthInPixels, map.heightInPixels];
}

function clearAllLevels(scene) {
    activeLevels.forEach((level) => {
        level.colliders.forEach((c) => {
            scene.physics.world.removeCollider(c);
        });

        level.layers.forEach((layer) => {
            layer.destroy();
        });

        level.map.destroy();
    });

    activeLevels.length = 0;
    maps = {};
}
socket.on("getPosition", (data) => {
    socket.emit("getPosition", {
        room: roomCode,
        x: localPlayer.x,
        y: localPlayer.y,
        abilityOwner: data.abilityOwner,
        type: data.type,
        // activatedBy: data.activatedBy,
    });
});
socket.on("destroyBlock", (data) => {
    const map = maps[data.mapId];
    if (!map) return;

    const layer = map.getLayer(data.layer)?.tilemapLayer;
    if (!layer) return;
    if (data.activatedBy == socket.id && localPlayer.breakActive) {
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

let wonAlready;
socket.on("gameWin", (msg) => {
    if (wonAlready) return;
    wonAlready = true;
    updateMessages(["green"], "Level Cleared", true);
    updateMessages(["green"], "Level Cleared", false);
    clearInterval(levelTimerInterval);
    socket.emit("setTimes", {
        time: levelTimer,
        levelName: currentLevelName,
        isPlayer1: isPlayer1,
        room: roomCode,
    });
    setTimeout(function () {
        updateMessages([], "", true);
        updateMessages([], "", false);
        socket.emit("requestNextLevel", roomCode);
    }, 2000);
});
let camTop;
let camBottom;
function generateLevels(nextLevel1, nextLevel2) {
    const mapData1 = scene.cache.tilemap.get(nextLevel1.mapKey).data;
    const mapData2 = scene.cache.tilemap.get(nextLevel2.mapKey).data;

    const tilesetName1 = mapData1.tilesets[0].name;
    const tilesetName2 = mapData2.tilesets[0].name;

    // const tileKey1 = tilesetName1 === "TestTS1" ? "testTiles" : "RDTiles";
    // const tileKey2 = tilesetName2 === "TestTS1" ? "testTiles" : "RDTiles";
    const map1 = scene.make.tilemap({ key: nextLevel1.mapKey });
    const tileset1 = map1.addTilesetImage(tilesetName1, "RDTiles");

    const map2 = scene.make.tilemap({ key: nextLevel2.mapKey });
    const tileset2 = map2.addTilesetImage(tilesetName2, "RDTiles");
    localPlayer.setPosition(256, 256);
    remotePlayer.setPosition(256, 256);

    let [world1W, world1H] = buildLevel({
        map: map1,
        mapKey: nextLevel1.mapKey,
        tileset: tileset1,
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

    let [world2W, world2H] = buildLevel({
        map: map2,
        mapKey: nextLevel2.mapKey,
        tileset: tileset2,
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
    let worldH = Math.max(world1H, world2H);
    let worldW = Math.max(world1W, world2W);
    scene.physics.world.setBounds(0, 0, worldW, worldH);

    camTop.setBounds(0, 0, worldW, worldH);
    camBottom.setBounds(0, 0, worldW, worldH);

    maps[nextLevel1.mapKey] = map1;
    maps[nextLevel2.mapKey] = map2;
}
let remoteTargetX, remoteTargetY;
socket.on("playerUpdate", (data) => {
    remoteTargetX = data.x;
    remoteTargetY = data.y;
});
let pendingLevels = null;

socket.on("generateLevels", (data) => {
    if (!scene) {
        pendingLevels = data;
        return;
    }
    applyLevels(data);
});

function applyLevels(data) {
    fadeInOverlay();
    clearAllLevels(scene);
    if (data.nextLevel1 == false || data.nextLevel2 == false) {
        if (active.length != 0) {
            for (const key in active) {
                beaten.push(active[key]);
            }
            active = [];
        }
        updateInfo();
        setTimeout(fadeOutOverlay, 1000);
        //run final level
        mergeCameras();
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
                // active.splice(key, 1);
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
        generateLevels(data.nextLevel1, data.nextLevel2);
        fadeInOverlay();
    }
}
function mergeCameras() {
    // scene.cameras.main.reset();
    camTop.setViewport(0, 0, scene.gameWidth, scene.gameHeight);
    scene.cameras.remove(camBottom);
    remotePlayer.destroy();
    finalLevelActive = true;

    if (isPlayer1) {
        remotePlayer = scene.physics.add
            .sprite(0, 0, "p1")
            .setScale(0.2)
            .setTint(0xff0000);
    } else {
        remotePlayer = scene.physics.add
            .sprite(0, 0, "p1")
            .setScale(0.2)
            .setTint(0x0000ff);
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
            localPlayer.setVelocityY(-400);
        }
    }
});

abilityBtn.addEventListener("pointerdown", (e) => {
    prevent(e);
    abilityBtnActive = true;

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
        localPlayer.setPosition(spawnXGlobal, spawnYGlobal);
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

    return scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes[phaserKey],
    );
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
        }
        div.textContent = keyDisplay;
        div.dataset.key = event.key;
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
    this.load.image("RDTiles", "assets/RDTileset.png");
    this.load.tilemapTiledJSON("level1", "assets/levels/RDLevel1.tmj");
    this.load.tilemapTiledJSON("level2", "assets/levels/RDLevel2.tmj");
    this.load.tilemapTiledJSON("level3", "assets/levels/RDLevel3.tmj");
    this.load.tilemapTiledJSON("level4", "assets/levels/RDLevel4.tmj");
    this.load.tilemapTiledJSON("level5", "assets/levels/RDLevel5.tmj");
    this.load.tilemapTiledJSON("level6", "assets/levels/RDLevel6.tmj");
    this.load.image("p1", "assets/player.png");
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
    const p1Sprite = this.physics.add
        .sprite(0, 0, "p1")
        .setScale(0.2)
        .setTint(0x0000ff);
    const p2Sprite = this.physics.add
        .sprite(0, 0, "p1")
        .setScale(0.2)
        .setTint(0xff0000);

    camTop = this.cameras.main;
    camTop.setViewport(0, 0, this.gameWidth, this.gameHeight / 2);

    camBottom = this.cameras.add(
        0,
        this.gameHeight / 2,
        this.gameWidth,
        this.gameHeight / 2,
    );
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

    // Handle Socket.io events
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
    this.input.keyboard.on("keydown-Z", function (event) {
        socket.emit("gameWinUpdate", {
            room: roomCode,
            touching: true,
        });
    });

    /*  grid = this.add.grid(
        500,
        500,
        1000,
        1000,
        32,
        32,
        null,
        null,
        0x00ff00, // Outline color (e.g., green lines)
        0.5, // Outline alpha (transparency)
    );*/

    this.pausePhysics = false;
    // this.input.keyboard.preventDefault = false;

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
}

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

function update(time, delta) {
    if (!localPlayer) return;
    //pause/unpause
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

        //restart
        if (scene.restartKey.isDown) {
            localPlayer.setPosition(spawnXGlobal, spawnYGlobal);
        }

        if (localPlayer.levitateActive) {
            localPlayer.body.allowGravity = false;
            localPlayer.setVelocityY(-150);
            localPlayer.setAccelerationY(0);
        } else if (localPlayer.glideActive) {
            localPlayer.body.allowGravity = true;
            localPlayer.setVelocityY(50);
        } else {
            localPlayer.body.allowGravity = true;
            if (jump) {
                if (localPlayer.crouchActive) {
                    localPlayer.setVelocityY(-270);
                } else {
                    localPlayer.setVelocityY(-400);
                }
            }
        }
        let velocityX = 360;
        if (localPlayer.dashActive) {
            velocityX = 1500;
        }

        if (this.rightKey.isDown || rightBtnActive) {
            localPlayer.setVelocityX(velocityX);
        } else if (this.leftKey.isDown || leftBtnActive) {
            localPlayer.setVelocityX(-velocityX);
        } else {
            localPlayer.setVelocityX(0);
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
                // vx: localPlayer.body.velocity.x,
                // vy: localPlayer.body.velocity.y,
            });
        }
        localPlayerState.x = localPlayer.x;
        localPlayerState.y = localPlayer.y;

        this.lastSend = time;
        const base = 0.2;
        const eased = Phaser.Math.Easing.Sine.Out(base);

        remotePlayer.x = Phaser.Math.Linear(
            remotePlayer.x,
            remoteTargetX,
            eased,
        );
        remotePlayer.y = Phaser.Math.Linear(
            remotePlayer.y,
            remoteTargetY,
            eased,
        );
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
        camTop.setViewport(0, 0, width, height / 2);
        camBottom.setViewport(0, height / 2, width, height / 2);
    }
});
