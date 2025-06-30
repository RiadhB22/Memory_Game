import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, get, set, onValue, remove, update } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

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

let player;
let sessionId = localStorage.getItem("memory_session_id") || crypto.randomUUID();
localStorage.setItem("memory_session_id", sessionId);
sessionStorage.setItem("sessionId", sessionId);

async function initSession() {
  const snap = await get(gameRef);
  const data = snap.val();
  const nom = prompt("Entrez votre nom :");
  const sessionId = sessionStorage.getItem("sessionId");

  if (!data) {
    player = "joueur1";
    await set(gameRef, {
      started: false,
      sessions: { joueur1: sessionId },
      noms: { joueur1: nom }
    });
  } else if (!data.sessions?.joueur2) {
    player = "joueur2";
    await update(gameRef, {
      "sessions/joueur2": sessionId,
      "noms/joueur2": nom
    });
  } else {
    alert("Deux joueurs sont déjà connectés.");
    return;
  }

  sessionStorage.setItem("player", player);
  sessionStorage.setItem("nomJoueur", nom);
  document.getElementById("reset-button").disabled = player !== "joueur1";

  import("./memory-core.js").then(module => {
    module.initGame(player, db, gameRef);
  });
}

initSession();
