// session.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  set,
  get,
  update,
  remove,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { initGame, renderGame } from "./memory-core.js";

const firebaseConfig = {
  // Ton vrai config ici
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  databaseURL: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const gameRef = ref(db, "game");

let currentPlayer = null;

function generateSessionId() {
  return crypto.randomUUID();
}

function askPlayerName(role) {
  const name = prompt(`Entrez le nom du ${role === "joueur1" ? "1er" : "2ème"} joueur :`);
  localStorage.setItem("nom", name || role);
  return name || role;
}

async function initSession() {
  const snap = await get(gameRef);
  let data = snap.val();

  const sessionId = generateSessionId();
  localStorage.setItem("memory_session_id", sessionId);

  if (!data || !data.sessions?.joueur1) {
    currentPlayer = "joueur1";
    const nom = askPlayerName(currentPlayer);
    await set(gameRef, {
      sessions: { joueur1: sessionId },
      names: { joueur1: nom },
      scores: { joueur1: 0, joueur2: 0 },
      flipped: [],
      matched: [],
      moves: 0,
      turn: "joueur1",
      started: false,
    });
  } else if (!data.sessions?.joueur2) {
    currentPlayer = "joueur2";
    const nom = askPlayerName(currentPlayer);
    await update(gameRef, {
      "sessions/joueur2": sessionId,
      "names/joueur2": nom,
      started: true,
      timeStart: Date.now(),
    });
  } else {
    alert("Deux joueurs sont déjà connectés.");
    return;
  }

  listenToGame();
}

function listenToGame() {
  onValue(gameRef, (snap) => {
    const data = snap.val();
    if (!data) return;
    renderGame(data, currentPlayer, gameRef);

    if (data.timeStart) {
      const start = new Date(data.timeStart);
      document.getElementById("start-time").textContent = `${start.getHours()}:${start.getMinutes().toString().padStart(2, '0')}`;
      updateTimer(data.timeStart);
    }
  });
}

function updateTimer(startTime) {
  const interval = setInterval(() => {
    const now = Date.now();
    const diff = Math.floor((now - startTime) / 1000);
    document.getElementById("time").textContent = `${diff}s`;
  }, 1000);
}

document.getElementById("reset-button").addEventListener("click", async () => {
  const confirmation = confirm("Voulez-vous vraiment recommencer ?");
  if (confirmation) {
    await remove(gameRef);
    location.reload();
  }
});

initSession();
