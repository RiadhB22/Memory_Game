// ✅ session.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, get, set, update, onValue, remove } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { initGame, renderGame, handleCardClick } from './memory-core.js';

const firebaseConfig = {
  apiKey: "AIzaSyAV8RMYwJ4-r5oGn6I1zPsVDTXkQE-GRpM",
  authDomain: "memorygame-70305.firebaseapp.com",
  databaseURL: "https://memorygame-70305-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "memorygame-70305",
  storageBucket: "memorygame-70305.appspot.com",
  messagingSenderId: "700177553228",
  appId: "1:700177553228:web:4a750936d2866eeface1e9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const gameRef = ref(db, 'game');

let sessionId = localStorage.getItem("memory_session_id");
if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("memory_session_id", sessionId);
}
sessionStorage.setItem("sessionId", sessionId);

let player = sessionStorage.getItem("player");

async function detectPlayerRole() {
  const snap = await get(gameRef);
  const data = snap.val();
  const nom = prompt("Entrez votre nom :");
  if (!nom) return;

  if (!data) {
    await set(gameRef, {
      sessions: { joueur1: sessionId },
      scores: { joueur1: 0, joueur2: 0 },
      names: { joueur1: nom }
    });
    player = "joueur1";
  } else if (!data.sessions?.joueur1) {
    await update(gameRef, {
      'sessions/joueur1': sessionId,
      'names/joueur1': nom
    });
    player = "joueur1";
  } else if (!data.sessions?.joueur2) {
    await update(gameRef, {
      'sessions/joueur2': sessionId,
      'names/joueur2': nom
    });
    player = "joueur2";
  } else {
    alert("Deux joueurs sont déjà connectés.");
    return;
  }
  sessionStorage.setItem("player", player);
  sessionStorage.setItem("nomJoueur", nom);
  updatePlayerNamesImmediately(nom, player);
}

function updatePlayerNamesImmediately(nom, joueur) {
  if (joueur === "joueur1") {
    document.getElementById("player1-name").textContent = nom;
  } else if (joueur === "joueur2") {
    document.getElementById("player2-name").textContent = nom;
  }
}

function listenToGameState() {
  onValue(gameRef, snapshot => {
    const data = snapshot.val();
    if (!data || !data.board) return;

    const name1 = data.names?.joueur1 || "Joueur 1";
    const name2 = data.names?.joueur2 || "Joueur 2";
    const currentPlayer = sessionStorage.getItem("player");

    document.getElementById("player1-name").textContent = name1;
    document.getElementById("player2-name").textContent = name2;
    document.getElementById("reset-button").disabled = currentPlayer !== "joueur1";

    renderGame(data, currentPlayer, gameRef);
  });
}

function setupResetButton() {
  document.getElementById("reset-button").addEventListener("click", () => {
    if (sessionStorage.getItem("player") !== "joueur1") return;
    if (!confirm("Voulez-vous vraiment réinitialiser la partie ?")) return;
    remove(gameRef);
    window.location.reload();
  });
}

(async function start() {
  await detectPlayerRole();
  await initGame(gameRef);
  listenToGameState();
  setupResetButton();
})();
