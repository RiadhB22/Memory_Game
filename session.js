// session.js
import { getDatabase, ref, get, update, onValue } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const db = getDatabase();
const gameRef = ref(db, 'game');

export async function initSession() {
  let sessionId = localStorage.getItem("memory_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("memory_session_id", sessionId);
  }
  sessionStorage.setItem("sessionId", sessionId);

  let player = sessionStorage.getItem("player");
  if (!player) {
    const snapshot = await get(gameRef);
    const data = snapshot.val();
    const nom = prompt("Entrez votre nom :");

    if (!data || !data.sessions || !data.sessions.joueur1) {
      player = "joueur1";
      update(gameRef, {
        sessions: { joueur1: sessionId },
        noms: { joueur1: nom }
      });
    } else if (!data.sessions.joueur2) {
      player = "joueur2";
      update(gameRef, {
        sessions: { ...data.sessions, joueur2: sessionId },
        noms: { ...data.noms, joueur2: nom }
      });
    } else {
      alert("Deux joueurs sont déjà connectés.");
      return;
    }

    sessionStorage.setItem("player", player);
    sessionStorage.setItem("nom", nom);
  }

  onValue(gameRef, snapshot => {
    const data = snapshot.val();
    if (!data || !data.noms) return;

    const nom1 = data.noms.joueur1 || "Joueur 1";
    const nom2 = data.noms.joueur2 || "Joueur 2";

    document.getElementById("player1-name").textContent = nom1;
    document.getElementById("player2-name").textContent = nom2;
  });
}
