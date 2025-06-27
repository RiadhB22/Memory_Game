import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { initGame } from "./memory-core.js";

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
const gameRef = ref(db, "game");

let sessionId = localStorage.getItem("memory_session_id");
if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("memory_session_id", sessionId);
}
sessionStorage.setItem("sessionId", sessionId);

let player = sessionStorage.getItem("player");
let nom = "";

(async () => {
  const snapshot = await get(gameRef);
  const data = snapshot.val();

  nom = prompt("Entrez votre nom :")?.trim();
  if (!nom) nom = "Anonyme";

  if (!data || !data.sessions?.joueur1) {
    player = "joueur1";
    sessionStorage.setItem("player", "joueur1");
    sessionStorage.setItem("nomJoueur1", nom);
    await set(gameRef, {
      started: false,
      sessions: { joueur1: sessionId },
      noms: { joueur1: nom }
    });
  } else if (!data.sessions?.joueur2) {
    player = "joueur2";
    sessionStorage.setItem("player", "joueur2");
    sessionStorage.setItem("nomJoueur2", nom);
    await set(gameRef, {
      ...data,
      sessions: { ...data.sessions, joueur2: sessionId },
      noms: { ...data.noms, joueur2: nom }
    });
  } else {
    alert("⚠️ Deux joueurs sont déjà connectés.");
    return;
  }

  // Mise à jour interface immédiatement
  document.getElementById("player1-name").textContent = `Joueur 1 : ${sessionStorage.getItem("nomJoueur1") || "---"}`;
  document.getElementById("player2-name").textContent = `Joueur 2 : ${sessionStorage.getItem("nomJoueur2") || "---"}`;
  document.getElementById("reset-button").disabled = player !== "joueur1";

  initGame(db, player);
})();
