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

// GLOBALS
let currentUser = null;
let players = [];
const bots = 5;
const botNames = ["BotAlpha","BotBravo","BotCharlie","BotDelta","BotEcho"];
let hue = 0;

// UI refs
const titleScreen = document.getElementById('titleScreen');
const loginScreen = document.getElementById('loginScreen');
const lobby = document.getElementById('lobby');
const loginBtn = document.getElementById('loginBtn');
const loginSubmit = document.getElementById('loginSubmit');
const backToTitle = document.getElementById('backToTitle');
const killFeedElement = document.getElementById('killFeed');
const shopElement = document.getElementById('shopItems');
const wardrobeElement = document.getElementById('wardrobeItems');
const mapList = document.getElementById('mapList');
const previewArea = document.getElementById('previewArea');

// Tabs
const tabs = {
  gameModes: document.getElementById('tabGameModes'),
  shop: document.getElementById('tabShop'),
  wardrobe: document.getElementById('tabWardrobe'),
  settings: document.getElementById('tabSettings'),
  playFab: document.getElementById('tabPlayFab')
};
const tabContents = {
  gameModes: document.getElementById('contentGameModes'),
  shop: document.getElementById('contentShop'),
  wardrobe: document.getElementById('contentWardrobe'),
  settings: document.getElementById('contentSettings'),
  playFab: document.getElementById('contentPlayFab')
};
function hideAllTabs(){ Object.values(tabContents).forEach(c=>c.classList.add('hidden')); }
function showTab(name){ hideAllTabs(); tabContents[name].classList.remove('hidden'); }
tabs.gameModes.addEventListener('click',()=>showTab('gameModes'));
tabs.shop.addEventListener('click',()=>showTab('shop'));
tabs.wardrobe.addEventListener('click',()=>showTab('wardrobe'));
tabs.settings.addEventListener('click',()=>showTab('settings'));
tabs.playFab.addEventListener('click',()=>showTab('playFab'));

// login UI
loginBtn.addEventListener('click', ()=>{ hideAllUI(); loginScreen.classList.remove('hidden'); });
backToTitle.addEventListener('click', ()=>{ hideAllUI(); titleScreen.classList.remove('hidden'); });
function hideAllUI(){ titleScreen.classList.add('hidden'); loginScreen.classList.add('hidden'); lobby.classList.add('hidden'); }

// handle login
loginSubmit.addEventListener('click', ()=>{
  const username = document.getElementById('username').value.trim();
  if(!username) return alert('Enter username');
  currentUser = username;
  const userRef = db.collection('users').doc(currentUser);
  userRef.get().then(doc=>{
    if(!doc.exists){
      let initialItems = [];
      if(currentUser==='AJMurr') initialItems.push('RGB Skin');
      userRef.set({ coins:0, crown:false, items: initialItems });
    } else if(currentUser==='AJMurr'){
      const data = doc.data();
      if(!data.items.includes('RGB Skin')) userRef.update({ items: firebase.firestore.FieldValue.arrayUnion('RGB Skin') });
    }
  }).then(()=>{
    hideAllUI(); lobby.classList.remove('hidden');
    if(currentUser==='AJMurr') tabs.playFab.style.display='inline-block';
    loadWardrobe(); loadShop(); loadMaps(); loadPlayFabPanel();
  });
});

// wardrobe
function loadWardrobe(){
  wardrobeElement.innerHTML='';
  if(!currentUser) return;
  db.collection('users').doc(currentUser).get().then(doc=>{
    if(!doc.exists) return;
    const items = doc.data().items||[];
    items.forEach(it=>{
      const d = document.createElement('div');
      d.textContent = it;
      wardrobeElement.appendChild(d);
    });
  });
}

// shop
function loadShop(){
  shopElement.innerHTML='';
  const items=[ {name:'Red Hat',cost:5},{name:'Blue Gun Skin',cost:10},{name:'Gold Belt',cost:15} ];
  items.forEach(it=>{
    const btn = document.createElement('button');
    btn.textContent = `${it.name} - ${it.cost} coins`;
    btn.onclick = ()=> buyItem(it);
    shopElement.appendChild(btn);
  });
}
function buyItem(item){
  if(!currentUser) return alert('Login first');
  const ref = db.collection('users').doc(currentUser);
  ref.get().then(doc=>{
    if(!doc.exists) return alert('Error');
    const coins = doc.data().coins||0;
    if(coins < item.cost) return alert('Not enough coins');
    ref.update({ coins: firebase.firestore.FieldValue.increment(-item.cost), items: firebase.firestore.FieldValue.arrayUnion(item.name) });
    alert(item.name + ' purchased');
    loadWardrobe();
  });
}

// publish map (with genre + screenshot URL)
function publishMap(mapData, mapName, genre='General', screenshotURL=''){
  if(!currentUser) return alert('Login first');
  const category = (currentUser==='AJMurr')?'By AJMurr':'Community';
  db.collection('maps').add({
    name: mapName, creator: currentUser, category: category, genre: genre, data: mapData, screenshot: screenshotURL,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).then(()=>alert('Map published'));
}

// load maps grouped by category, show genre, hover screenshot
function loadMaps(){
  mapList.innerHTML='';
  db.collection('maps').orderBy('timestamp','desc').get().then(snapshot=>{
    const categories = {};
    snapshot.forEach(doc=>{
      const m = doc.data();
      if(!categories[m.category]) categories[m.category]=[];
      categories[m.category].push(m);
    });
    for(const cat in categories){
      const h = document.createElement('h3'); h.textContent = cat; mapList.appendChild(h);
      const row = document.createElement('div'); row.style.display='flex'; row.style.flexWrap='wrap'; row.style.gap='10px';
      categories[cat].forEach(m=>{
        const btn = document.createElement('button');
        btn.className='mode-card';
        btn.innerHTML = `<strong>${m.name}</strong><br><small>${m.genre}</small>`;
        if(m.screenshot){
          btn.addEventListener('mouseenter', ()=>{ previewArea.style.backgroundImage = `url(${m.screenshot})`; previewArea.style.backgroundSize='cover'; previewArea.textContent=''; });
          btn.addEventListener('mouseleave', ()=>{ previewArea.style.backgroundImage=''; previewArea.textContent='Hover a mode to preview'; });
        }
        row.appendChild(btn);
      });
      mapList.appendChild(row);
    }
  });
}

// kill feed
function addKillFeed(killer,victim){
  const e = document.createElement('div'); e.textContent = `${killer} eliminated ${victim}`; killFeedElement.prepend(e);
  if(killFeedElement.childElementCount>10) killFeedElement.removeChild(killFeedElement.lastChild);
}

// admin panel
function loadPlayFabPanel(){
  if(currentUser!=='AJMurr') return;
  const panel = document.getElementById('playFabPanel');
  panel.innerHTML = `<button onclick="alert('Give moderator')">Give Moderator</button><button onclick="alert('View Players')">View Players</button>`;
}

// canvas + players
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
function spawnBots(){ for(let i=0;i<bots;i++){ const botName = botNames[Math.floor(Math.random()*botNames.length)]+Math.floor(Math.random()*1000); players.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,isBot:true,name:botName}); } }
function botAI(){ players.forEach((bot,i)=>{ if(bot.isBot){ const targetIndex = Math.floor(Math.random()*players.length); if(players[targetIndex] && players[targetIndex]!==bot){ addKillFeed(bot.name, players[targetIndex].name); players.splice(targetIndex,1); } } }); }
setInterval(botAI,5000);
function gameLoop(){ ctx.clearRect(0,0,canvas.width,canvas.height); players.forEach(p=>{ if(p.name==='AJMurr') ctx.fillStyle = `hsl(${hue},100%,50%)`; else ctx.fillStyle = p.isBot ? 'red' : 'green'; ctx.fillRect(p.x,p.y,40,40); }); hue += 2; if(hue>=360) hue = 0; requestAnimationFrame(gameLoop); }
spawnBots(); gameLoop();

// game mode buttons
document.getElementById('btnBattleRoyale').addEventListener('click', ()=>{ hideAllTabs(); alert('Battle Royale started!'); });
document.getElementById('btnCreative').addEventListener('click', ()=>{ hideAllTabs(); alert('Creative mode started!'); });
