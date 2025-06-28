// ✅ session.js : gestion des joueurs, noms, rôles, et synchro Firebase

import { getDatabase, ref, get, update, set, onValue, remove } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { initGame, renderGame, resetGame } from "./memory-core.js";

const firebaseConfig = {
  apiKey: "AIzaSyAV8RMYwJ4-r5oGn6I1zPsVDTXkQE-GRpM",
  authDomain: "memorygame-70305.firebaseapp.com",
  databaseURL: "https://memorygame-70305-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "memorygame-70305",
  storageBucket: "memorygame-70305.appspot.com",
  messagingSenderId: "700177553228",
  appId: "1:700177553228:web:4a750936d2866eeface1e9"
};

const app = firebase.initializeApp(firebaseConfig);
const db = getDatabase();
const gameRef = ref(db, "game");

let sessionId = localStorage.getItem("sessionId") || crypto.randomUUID();
localStorage.setItem("sessionId", sessionId);

let currentPlayer = null;

async function setupPlayer() {
  const snap = await get(gameRef);
  const data = snap.val();
  let player = null;

  const name = prompt(data?.names?.joueur1 ? "Entrez le nom du 2ème joueur :" : "Entrez le nom du 1er joueur :");

  if (!data || !data.sessions?.joueur1) {
    player = "joueur1";
  } else if (!data.sessions?.joueur2) {
    player = "joueur2";
  } else {
    alert("Deux joueurs sont déjà connectés.");
    return;
  }

  currentPlayer = player;
  await update(gameRef, {
    [`sessions/${player}`]: sessionId,
    [`names/${player}`]: name
  });

  document.getElementById("reset-button").addEventListener("click", () => {
    if (currentPlayer === "joueur1") resetGame(gameRef);
  });

  onValue(gameRef, (snapshot) => {
    const gameData = snapshot.val();
    if (!gameData) return;
    renderGame(gameData, currentPlayer, gameRef);
  });

  await initGame(gameRef);
}

setupPlayer();
