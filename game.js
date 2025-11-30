// ---------------------------
// FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCfNag0I5B6fseRFPTDIDdhTHkYUW2eQmY",
  authDomain: "ajmurrroyale-b6cd5.firebaseapp.com",
  projectId: "ajmurrroyale-b6cd5",
  storageBucket: "ajmurrroyale-b6cd5.firebasestorage.app",
  messagingSenderId: "741785042016",
  appId: "1:741785042016:web:b510b215a7dedd474a1705",
  measurementId: "G-H5SQTLGBSH"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ---------------------------
// GLOBAL VARIABLES
let currentUser = null;
let players = [];
const bots = 5;
const botNames = ["BotAlpha","BotBravo","BotCharlie","BotDelta","BotEcho"];
let hue = 0; // For RGB animation

// ---------------------------
// UI ELEMENTS
const titleScreen = document.getElementById("titleScreen");
const loginScreen = document.getElementById("loginScreen");
const lobby = document.getElementById("lobby");
const loginBtn = document.getElementById("loginBtn");
const createAccountBtn = document.getElementById("createAccountBtn");
const loginSubmit = document.getElementById("loginSubmit");
const backToTitle = document.getElementById("backToTitle");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const mapList = document.getElementById("mapList");
const killFeedElement = document.getElementById("killFeed");
const shopElement = document.getElementById("shopItems");

// ---------------------------
// UI HANDLERS
loginBtn.addEventListener("click", () => {
  hideAllUI();
  loginScreen.classList.remove("hidden");
});
backToTitle.addEventListener("click", () => {
  hideAllUI();
  titleScreen.classList.remove("hidden");
});
function hideAllUI() {
  titleScreen.classList.add("hidden");
  loginScreen.classList.add("hidden");
  lobby.classList.add("hidden");
}

// ---------------------------
// LOGIN LOGIC WITH AJMURR EXCLUSIVE RGB SKIN
loginSubmit.addEventListener("click", () => {
  const username = usernameInput.value.trim();
  if (!username) return alert("Enter a username.");
  currentUser = username;

  const userRef = db.collection("users").doc(currentUser);
  userRef.get().then(doc => {
    if (!doc.exists) {
      // Create new account
      let initialItems = [];
      if (currentUser === "AJMurr") initialItems.push("RGB Skin");
      userRef.set({ coins:0, crown:false, items: initialItems });
    } else if (currentUser === "AJMurr") {
      const data = doc.data();
      if (!data.items.includes("RGB Skin")) {
        userRef.update({ items: firebase.firestore.FieldValue.arrayUnion("RGB Skin") });
      }
    }
  });

  hideAllUI();
  lobby.classList.remove("hidden");
  loadMaps();
  loadShop();
});

// ---------------------------
// CREATIVE MAP FUNCTIONS
function publishMap(mapData, mapName) {
  if (!currentUser) return alert("Login first!");
  const category = (currentUser === "AJMurr") ? "By AJMurr" : "Community";
  db.collection("maps").add({ name: mapName, creator: currentUser, category: category, data: mapData, timestamp: firebase.firestore.FieldValue.serverTimestamp() })
    .then(() => alert("Map published!"));
}
function banMap(mapId) {
  if (currentUser !== "AJMurr") return alert("Not authorized");
  db.collection("maps").doc(mapId).delete().then(() => alert("Map banned"));
}
function loadMaps() {
  mapList.innerHTML = "";
  db.collection("maps").orderBy("timestamp","desc").get().then(snapshot => {
    snapshot.forEach(doc => {
      const map = doc.data();
      const btn = document.createElement("button");
      btn.textContent = `${map.name} (${map.category})`;
      mapList.appendChild(btn);
    });
  }).catch(err => console.error(err));
}

// ---------------------------
// COINS & CROWNS
function handleWin() {
  if (!currentUser) return;
  const userRef = db.collection("users").doc(currentUser);
  userRef.get().then(doc => {
    let coins = 1;
    if (doc.exists && doc.data().crown) coins = 2;
    userRef.set({ coins: firebase.firestore.FieldValue.increment(coins), crown: true }, { merge: true });
  });
}

// ---------------------------
// ITEM SHOP (Excludes RGB Skin)
function loadShop() {
  if (!shopElement) return;
  shopElement.innerHTML = "";
  const items = [
    { name: "Red Hat", cost: 5 },
    { name: "Blue Gun Skin", cost: 10 },
    { name: "Gold Belt", cost: 15 }
  ];
  items.forEach(item => {
    const btn = document.createElement("button");
    btn.textContent = `${item.name} - ${item.cost} coins`;
    btn.onclick = () => buyItem(item);
    shopElement.appendChild(btn);
  });
}
function buyItem(item) {
  if (!currentUser) return alert("Login first!");
  const userRef = db.collection("users").doc(currentUser);
  userRef.get().then(doc => {
    if (!doc.exists) return alert("Error");
    const coins = doc.data().coins || 0;
    if (coins < item.cost) return alert("Not enough coins!");
    userRef.update({ coins: firebase.firestore.FieldValue.increment(-item.cost), items: firebase.firestore.FieldValue.arrayUnion(item.name) });
    alert(`${item.name} purchased!`);
  });
}

// ---------------------------
// GAME CANVAS SETUP
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function spawnBots() {
  for (let i=0;i<bots;i++) {
    const botName = botNames[Math.floor(Math.random()*botNames.length)] + Math.floor(Math.random()*1000);
    players.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, isBot:true, name:botName });
  }
}

// ---------------------------
// KILL FEED
function addKillFeed(killer, victim) {
  const entry = document.createElement("div");
  entry.textContent = `${killer} eliminated ${victim}`;
  killFeedElement.prepend(entry);
  if (killFeedElement.childElementCount>10) killFeedElement.removeChild(killFeedElement.lastChild);
}
function eliminatePlayer(killer, victimIndex) {
  const victim = players[victimIndex];
  addKillFeed(killer.name, victim.name);
  players.splice(victimIndex,1);
}

// ---------------------------
// EXAMPLE BOT AI (eliminates random player every 5 sec)
function botAI() {
  players.forEach((bot,i)=>{
    if(bot.isBot){
      const targetIndex = Math.floor(Math.random()*players.length);
      if(players[targetIndex] && players[targetIndex]!==bot){
        eliminatePlayer(bot,targetIndex);
      }
    }
  });
}
setInterval(botAI,5000);

// ---------------------------
// GAME LOOP WITH RGB ANIMATION FOR AJMURR
function gameLoop() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  players.forEach(p=>{
    if(p.name==="AJMurr") {
      ctx.fillStyle = `hsl(${hue},100%,50%)`; // RGB animated
    } else {
      ctx.fillStyle = p.isBot ? "red" : "green";
    }
    ctx.fillRect(p.x,p.y,40,40);
  });

  hue += 2;
  if(hue>=360) hue=0;

  requestAnimationFrame(gameLoop);
}

spawnBots();
gameLoop();