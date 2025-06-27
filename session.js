// session.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, set, get, onValue, update, remove } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

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
  if (!nom) {
    alert("Nom requis pour jouer.");
    return;
  }

  if (!data) {
    sessionStorage.setItem("player", "joueur1");
    sessionStorage.setItem("nomJoueur1", nom);
    player = "joueur1";
    await set(gameRef, {
      started: false,
      sessions: { joueur1: sessionId },
      noms: { joueur1: nom }
    });
    afficherAttente();
    return;
  }

  if (!data.sessions?.joueur1) {
    sessionStorage.setItem("player", "joueur1");
    sessionStorage.setItem("nomJoueur1", nom);
    player = "joueur1";
    await update(gameRef, {
      sessions: { ...data.sessions, joueur1: sessionId },
      noms: { ...data.noms, joueur1: nom }
    });
    afficherAttente();
    return;
  }

  if (!data.sessions?.joueur2) {
    sessionStorage.setItem("player", "joueur2");
    sessionStorage.setItem("nomJoueur2", nom);
    player = "joueur2";
    await update(gameRef, {
      sessions: { ...data.sessions, joueur2: sessionId },
      noms: { ...data.noms, joueur2: nom },
      started: true,
      board: melangerCartes(),
      matched: [],
      flipped: [],
      turn: "joueur1",
      moves: 0,
      scores: { joueur1: 0, joueur2: 0 },
      timeStart: Date.now()
    });
    return;
  }

  alert("Deux joueurs sont déjà connectés.");
}

function afficherAttente() {
  const el = document.getElementById("waiting-message");
  if (el) el.textContent = "⏳ En attente du deuxième joueur...";
}

function melangerCartes() {
  const cartes = [];
  for (let i = 1; i <= 20; i++) {
    cartes.push({ id: i, img: `files/${i}-1.jpg` });
    cartes.push({ id: i, img: `files/${i}-2.jpg` });
  }
  return cartes.sort(() => 0.5 - Math.random());
}

detectPlayerRole();

onValue(gameRef, snapshot => {
  const data = snapshot.val();
  if (!data?.noms) return;
  document.getElementById("player1-name").textContent = `${data.turn === 'joueur1' ? '✋ ' : ''}${data.noms.joueur1 || 'Joueur 1'}:`;
  document.getElementById("player2-name").textContent = `${data.turn === 'joueur2' ? '✋ ' : ''}${data.noms.joueur2 || 'Joueur 2'}:`;
});
