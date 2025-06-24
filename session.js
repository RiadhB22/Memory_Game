// session.js
export const firebaseConfig = {
  apiKey: "AIzaSyAV8RMYwJ4-r5oGn6I1zPsVDTXkQE-GRpM",
  authDomain: "memorygame-70305.firebaseapp.com",
  databaseURL: "https://memorygame-70305-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "memorygame-70305",
  storageBucket: "memorygame-70305.appspot.com",
  messagingSenderId: "700177553228",
  appId: "1:700177553228:web:4a750936d2866eeface1e9"
};

export let player = null;
export let sessionId = localStorage.getItem("memory_session_id");

if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("memory_session_id", sessionId);
}
sessionStorage.setItem("sessionId", sessionId);

export async function detectPlayerRole() {
  const { getDatabase, ref, get, update } = await import("https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js");
  const db = getDatabase();
  const gameRef = ref(db, 'game');

  const snapshot = await get(gameRef);
  const data = snapshot.val();
  const nom = prompt("Entrez votre nom :");

  if (!data || !data.sessions) {
    player = "joueur1";
    await update(gameRef, {
      sessions: { joueur1: sessionId, nomJoueur1: nom }
    });
  } else if (!data.sessions.joueur1) {
    player = "joueur1";
    await update(gameRef, {
      sessions: { ...data.sessions, joueur1: sessionId, nomJoueur1: nom }
    });
  } else if (!data.sessions.joueur2) {
    player = "joueur2";
    await update(gameRef, {
      sessions: { ...data.sessions, joueur2: sessionId, nomJoueur2: nom }
    });
  } else {
    alert("Deux joueurs sont déjà connectés.");
    player = null;
  }

  sessionStorage.setItem("player", player);
}
