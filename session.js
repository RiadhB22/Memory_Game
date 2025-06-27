import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getDatabase, ref, get, set, update, onValue, remove
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { initGame, renderGame } from "./memory-core.js";

const firebaseConfig = {
  databaseURL: "https://memorygame-70305-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const gameRef = ref(db, "game");
let currentPlayer = null;

async function setup() {
  const snap = await get(gameRef);
  const data = snap.val();

  if (!data || !data.sessions?.joueur1 || !data.sessions?.joueur2) {
    const name = prompt("Entrez votre nom :");
    const id = crypto.randomUUID();
    if (!data || !data.sessions?.joueur1) {
      await update(gameRef, {
        "sessions/joueur1": id,
        "names/joueur1": name,
        "scores/joueur1": 0,
        "turn": "joueur1",
        "started": false
      });
      currentPlayer = "joueur1";
    } else if (!data.sessions?.joueur2) {
      await update(gameRef, {
        "sessions/joueur2": id,
        "names/joueur2": name,
        "scores/joueur2": 0,
        "started": true,
        "timeStart": Date.now()
      });
      currentPlayer = "joueur2";
    } else {
      alert("Deux joueurs sont déjà connectés.");
      return;
    }
  } else {
    const id = crypto.randomUUID();
    if (id === data.sessions?.joueur1) currentPlayer = "joueur1";
    else if (id === data.sessions?.joueur2) currentPlayer = "joueur2";
    else {
      alert("Deux joueurs sont déjà connectés.");
      return;
    }
  }

  onValue(gameRef, (snap) => {
    const newData = snap.val();
    renderGame(newData, currentPlayer, gameRef);
    updateTime(newData.timeStart);
  });

  document.getElementById("reset-button").addEventListener("click", async () => {
    if (currentPlayer !== "joueur1") return;
    await remove(gameRef);
    location.reload();
  });

  initGame(gameRef);
}

function updateTime(startTime) {
  if (!startTime) return;
  const durationEl = document.getElementById("duration");
  const startEl = document.getElementById("start-time");

  const startDate = new Date(startTime);
  startEl.textContent = `${startDate.getHours()}:${startDate.getMinutes()}`;

  setInterval(() => {
    const now = Date.now();
    const seconds = Math.floor((now - startTime) / 1000);
    durationEl.textContent = `${seconds}s`;
  }, 1000);
}

setup();
