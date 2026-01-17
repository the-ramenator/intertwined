const path = document.getElementById("tearPath");

function generateTear() {
  const points = [];
  const segments = 20;

  for (let i = 0; i <= segments; i++) {
    const y = (i / segments) * 100;
    const x = 50 + (Math.random() - 0.5) * 20;
    points.push(`${x},${y}`);
  }

  let d = `M ${points[0]}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i]}`;
  }

  path.setAttribute("d", d);
}

generateTear();

setInterval(generateTear, 800);

function showCredits() {
  document.getElementById("creditsCont").style.display = "block";
  document.getElementById("particles").style.display = "none";
  setTimeout(function () {
    document.getElementById("creditsCont").style.opacity = "1";
    document.getElementById("credits").classList.add("creditsAnim");
  }, 100);
}
function resetCredits() {
  document.getElementById("creditsCont").style.opacity = "0";
  document.getElementById("particles").style.display = "block";

  setTimeout(function () {
    document.getElementById("creditsCont").style.display = "none";
    document.getElementById("credits").classList.remove("creditsAnim");
  }, 500);
}
document.getElementById("creditsBtn").addEventListener("click", function () {
  showCredits();
});

document
  .getElementById("pauseCreditsBtn")
  .addEventListener("click", function () {
    showCredits();
    // hidePause();
  });

function showPause() {
  document.getElementById("pauseOverlay").style.display = "block";
  document.getElementById("particles").style.display = "block";
  setTimeout(function () {
    document.getElementById("pauseOverlay").style.opacity = "1";
    document.getElementById("pauseBtn").style.display = "none";
    document.getElementById("particles").style.opacity = "1";
  }, 25);
}
function hidePause() {
  document.getElementById("pauseOverlay").style.opacity = "0";
  document.getElementById("pauseBtn").style.display = "block";
  document.getElementById("particles").style.opacity = "0";
  setTimeout(function () {
    document.getElementById("particles").style.display = "none";
    document.getElementById("pauseOverlay").style.display = "none";
  }, 500);
}

function showKeybindsUI() {
  document.getElementById("pauseKeybindsCont").style.display = "block";
  document.getElementById("pauseOptions").style.opacity = "0";

  setTimeout(function () {
    document.getElementById("pauseKeybindsCont").style.opacity = "1";
    document.getElementById("pauseOptions").style.display = "none";
  }, 100);
}
function hideKeybindsUI() {
  document.getElementById("pauseKeybindsCont").style.opacity = "0";
  document.getElementById("pauseOptions").style.display = "flex";
  setTimeout(function () {
    document.getElementById("pauseKeybindsCont").style.display = "none";
    document.getElementById("pauseOptions").style.opacity = "1";
  }, 500);
}

function showPauseInfoUI() {
  document.getElementById("pauseInfoCont").style.display = "block";
  document.getElementById("pauseOptions").style.opacity = "0";

  setTimeout(function () {
    document.getElementById("pauseInfoCont").style.opacity = "1";
    document.getElementById("pauseOptions").style.display = "none";
  }, 100);
}
function hidePauseInfoUI() {
  document.getElementById("pauseInfoCont").style.opacity = "0";
  document.getElementById("pauseOptions").style.display = "flex";
  setTimeout(function () {
    document.getElementById("pauseInfoCont").style.display = "none";
    document.getElementById("pauseOptions").style.opacity = "1";
  }, 500);
}

document.getElementById("backKeybinds").addEventListener("click", function () {
  hideKeybindsUI();
});

document
  .getElementById("pauseKeybindsBtn")
  .addEventListener("click", function () {
    showKeybindsUI();
  });
document.getElementById("pauseInfoBtn").addEventListener("click", function () {
  showPauseInfoUI();
});
document.getElementById("backInfo").addEventListener("click", function () {
  hidePauseInfoUI();
});
let abilityInfoActive = true; // default to abilities so on click switches to levels
document.getElementById("switchInfoBtn").addEventListener("click", function () {
  if (abilityInfoActive) {
    document.getElementById("pauseAbilityInfo").style.display = "none";
    document.getElementById("pauseLevelInfo").style.display = "block";
    document.getElementById("switchInfoBtn").innerHTML = "Abilities";
    abilityInfoActive = false;
  } else {
    document.getElementById("pauseAbilityInfo").style.display = "block";
    document.getElementById("pauseLevelInfo").style.display = "none";
    document.getElementById("switchInfoBtn").innerHTML = "Levels";
    abilityInfoActive = true;
  }
});
document.getElementById("switchInfoBtn").click();

function showPauseHelp() {
  document.getElementById("pauseHelpCont").style.display = "block";
  document.getElementById("pauseOptions").style.opacity = "0";

  setTimeout(function () {
    document.getElementById("pauseHelpCont").style.opacity = "1";
    document.getElementById("pauseOptions").style.display = "none";
  }, 100);
}

let shownMobile = false;
document
  .getElementById("mobileKeybinds")
  .addEventListener("click", function () {
    shownMobile = !shownMobile;
    if (shownMobile) {
      document.getElementById("mobileOptions").style.display = "block";
      document.getElementById("mobileKeybinds").innerHTML = "PC Layout";
    } else {
      document.getElementById("mobileOptions").style.display = "none";
      document.getElementById("mobileKeybinds").innerHTML = "Mobile Layout";
    }
  });

function fadeInOverlay() {
  /* document.getElementById("gameOverlay").style.display = "block";
  setTimeout(function () {
    document.getElementById("gameOverlay").style.opacity = "1";
  }, 50);*/
}
function fadeOutOverlay() {
  /* document.getElementById("gameOverlay").style.opacity = "0";
  setTimeout(function () {
    document.getElementById("gameOverlay").style.display = "none";
  }, 500);*/
}

function hidePauseHelp() {
  document.getElementById("pauseHelpCont").style.opacity = "0";
  document.getElementById("pauseOptions").style.display = "flex";
  setTimeout(function () {
    document.getElementById("pauseHelpCont").style.display = "none";
    document.getElementById("pauseOptions").style.opacity = "1";
  }, 500);
}

document.getElementById("pauseHelpBtn").addEventListener("click", function () {
  showPauseHelp();
});
document.getElementById("backHelp").addEventListener("click", function () {
  hidePauseHelp();
});

function resetUI() {
  document.getElementById("roomCodeInput").style.opacity = "0";
  setTimeout(function () {
    document.getElementById("roomCodeInput").style.display = "none";
    document.getElementById("roomCodeInput").value = "";
    document.getElementById("joinCodeError").style.opacity = "0";
    document.getElementById("joinCodeError").innerText = "";
    document.getElementById("joinToggle").style.left = "75%";
    document.getElementById("joinToggle").style.top = "60%";
    document.getElementById("createBtn").style.left = "25%";
    document.getElementById("leftCont").style.width = "50%";
    document.getElementById("rightCont").style.width = "50%";
    document.getElementById("rightCont").style.left = "50%";
    document.getElementById("tear").style.left = "50%";
    document.getElementById("title").style.left = "50%";
    document.getElementById("title").style.width = "100%";
    document.getElementsByClassName("tearDividerLeft")[0].style.left = "35%";
    document.getElementsByClassName("tearDividerRight")[0].style.left = "50%";
  }, 500);
}
function toggleJoin() {
  const items = [
    document.getElementById("rightCont").style,
    document.getElementById("title").style,
  ];
  items.forEach((item) => {
    Object.assign(item, {
      width: "65%",
      left: "35%",
    });
  });

  document.getElementById("leftCont").style.width = "35%";
  document.getElementById("tear").style.left = "35%";

  document.getElementsByClassName("tearDividerLeft")[0].style.left = "20%";
  document.getElementsByClassName("tearDividerRight")[0].style.left = "35%";

  document.getElementById("createBtn").style.left = "17.5%";
  document.getElementById("joinToggle").style.left = "67.5%";
  document.getElementById("joinToggle").style.top = "65%";

  document.getElementById("roomCodeInput").style.display = "block";
  setTimeout(function () {
    document.getElementById("roomCodeInput").style.opacity = "1";
  }, 100);

  document.getElementById("joinToggle").addEventListener("click", function () {
    joinRoom();
  });
}

document.body.addEventListener("mousemove", function (e) {
  const mouseX = (1 * e.clientX) / window.innerWidth;
  const mouseY = (0.5 * e.clientY) / window.innerHeight;
  document.getElementById("left").style.transform =
    `translate3d(-${mouseX}%, -${mouseY}%, 0)`;
  document.getElementById("right").style.transform =
    `translate3d(${mouseX - 10}%, ${mouseY - 1}%, 0)`;
});

document.getElementById("joinToggle").addEventListener("click", function () {
  toggleJoin();
});

//matchmaking
document
  .getElementById("matchmakingBtn")
  .addEventListener("click", function () {
    document.getElementById("join").style.opacity = "0";
    document.getElementById("title-white").innerHTML = "Wait";
    document.getElementById("title-black").innerHTML = "ing...";
    document.getElementById("leaveMatchmaking").style.display = "block";
    setTimeout(function () {
      document.getElementById("join").style.display = "none";
      document.getElementById("leaveMatchmaking").style.opacity = "1";
    }, 500);
  });
//loading colors

function generateAnalogousPair() {
  const baseHue = Math.floor(Math.random() * 360);
  const secondHue = (baseHue + 50) % 360;

  document.documentElement.style.setProperty("--loading1", baseHue);
  document.documentElement.style.setProperty("--loading2", secondHue);
}

generateAnalogousPair();

//particles
function random(min, max, fixed) {
  return (Math.random() * (max - min) + min).toFixed(fixed);
}
function randomEl(array) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}
function newParticle() {
  this.obj = document.createElement("div");
  this.obj.classList.add("particle");
  this.obj.style.top = window.innerHeight * Math.random() + "px";
  this.obj.style.left = window.innerWidth * Math.random() + "px";
  this.obj.style.animation =
    "animParticle" +
    random(1, 4, 0) +
    " " +
    random(20, 50, 0) +
    "s linear infinite";
  //this.obj.style.animationDelay = random(0, 2, 2) + 's';
  var dim = random(1, 4, 0);
  this.obj.style.height = dim + "px";
  this.obj.style.width = dim + "px";
  document.getElementById("particles").appendChild(this.obj);
}
var dot = [];
for (var i = 0; i < random(100, 300, 0); i++) {
  dot.push(new newParticle());
}

//info modal
let infoBtn = document.getElementById("infoBtn");
let infoOverlay = document.getElementById("infoOverlay");
let infoClose = document.getElementById("infoClose");
infoBtn.addEventListener("click", function () {
  infoOverlay.style.display = "block";
  setTimeout(function () {
    infoOverlay.style.opacity = "1";
  }, 100);
});
infoClose.addEventListener("click", function () {
  infoOverlay.style.opacity = "0";
  setTimeout(function () {
    infoOverlay.style.display = "none";
  }, 500);
});
window.addEventListener("click", function (event) {
  if (event.target == infoOverlay) {
    infoOverlay.style.opacity = "0";
    setTimeout(function () {
      infoOverlay.style.display = "none";
    }, 500);
  }
});

let chatOpen = false;
const chat = document.getElementById("chatCont");
const header = document.getElementById("chatHeader");

const chatInputUI = document.getElementById("chatInput");

document.getElementById("messagesBtn").addEventListener("click", function () {
  chatOpen = !chatOpen;
  if (chatOpen) {
    chat.style.display = "flex";
    document.getElementById("newMessageDot").style.display = "none";

    setTimeout(() => chatInputUI.focus(), 0);
  } else {
    chat.style.display = "none";
    document.getElementById("newMessageDot").style.display = "none";
  }
});

document.getElementById("chatClose").addEventListener("click", function () {
  chatOpen = false;
  chat.style.display = "none";
  document.getElementById("newMessageDot").style.display = "none";
});

document.getElementById("chatClose").click();

let isDragging = false;
let offsetX = 0;
let offsetY = 0;

header.addEventListener("mousedown", (e) => {
  isDragging = true;

  const rect = chat.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;

  document.body.style.userSelect = "none";
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  chat.style.left = `${e.clientX - offsetX}px`;
  chat.style.top = `${e.clientY - offsetY}px`;
  chat.style.right = "auto";
  chat.style.bottom = "auto";
});

document.addEventListener("mouseup", () => {
  isDragging = false;
  document.body.style.userSelect = "";
});

chat.addEventListener("mousedown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
    e.stopPropagation();
  }
});
chatInputUI.addEventListener("keydown", (e) => e.stopPropagation());
chatInputUI.addEventListener("keyup", (e) => e.stopPropagation());

const loadingBar = document.getElementById("loading");
const loadingCont = document.getElementById("loadingCont");
const loadingText = document.getElementById("loadingText");
const loadingWord = document.getElementById("loadingWord");

let progress = 0;
let dotCount = 0;
let counter = 0;
const loadingInterval = setInterval(() => {
  if (progress < 90) {
    progress += Math.random() * 5;
    progress = Math.min(progress, 90);

    loadingBar.style.width = progress * 0.4 + "%";
    loadingText.textContent = Math.round(progress) + "%";
  }
}, 100);
const dotsInterval = setInterval(() => {
  dotCount = (dotCount + 1) % 4;
  loadingWord.textContent = "Loading" + ".".repeat(dotCount);
}, 500);
// Real load completion
window.onload = () => {
  clearInterval(loadingInterval);
  clearInterval(dotsInterval);

  progress = 100;
  loadingBar.style.width = "40%";
  loadingText.textContent = "100%";

  setTimeout(() => {
    loadingCont.style.opacity = "0";
    document.getElementById("particles").style.display = "block";
    document.getElementById("particles").style.opacity = "1";
    setTimeout(() => {
      loadingCont.style.display = "none";
    }, 500);
  }, 500);
};
