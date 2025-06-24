// session.js

// Initialisation Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDnqY...", // Remplace par ta clé API
  authDomain: "memorygame-70305.firebaseapp.com",
  databaseURL: "https://memorygame-70305-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "memorygame-70305",
  storageBucket: "memorygame-70305.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let playerId = localStorage.getItem("playerId") || crypto.randomUUID();
localStorage.setItem("playerId", playerId);

const namesRef = db.ref("names");
const scoresRef = db.ref("scores");
const sessionsRef = db.ref("sessions");

let playerRole = null;
let otherPlayerId = null;

async function initSession() {
  const snapshot = await sessionsRef.once("value");
  const session = snapshot.val();

  if (!session || !session.joueur1) {
    playerRole = "joueur1";
    await sessionsRef.set({ joueur1: playerId });
    askName("Entrez votre nom (Joueur 1)");
    showWaiting();
  } else if (!session.joueur2 && session.joueur1 !== playerId) {
    playerRole = "joueur2";
    await sessionsRef.update({ joueur2: playerId });
    askName("Entrez votre nom (Joueur 2)");
  } else {
    alert("Deux joueurs sont déjà connectés.");
  }
}

function askName(msg) {
  let name = prompt(msg);
  if (!name) name = "Anonyme";
  namesRef.update({ [playerRole]: name });
  document.getElementById(`${playerRole}-name`).textContent = name;
}

function showWaiting() {
  const waitingEl = document.getElementById("waiting-message");
  waitingEl.style.display = "block";
}

function hideWaiting() {
  const waitingEl = document.getElementById("waiting-message");
  waitingEl.style.display = "none";
}

sessionsRef.on("value", (snapshot) => {
  const session = snapshot.val();
  if (session?.joueur1 && session?.joueur2) {
    hideWaiting();
    document.dispatchEvent(new Event("start-game"));
  }
});

namesRef.on("value", (snapshot) => {
  const names = snapshot.val();
  if (names?.joueur1) document.getElementById("player1-name").textContent = names.joueur1;
  if (names?.joueur2) document.getElementById("player2-name").textContent = names.joueur2;
});

initSession();
