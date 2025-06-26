import { getDatabase, ref, onValue, set, get, update } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const db = getDatabase();
const gameRef = ref(db, 'game');

let sessionId = localStorage.getItem("memory_session_id");
if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("memory_session_id", sessionId);
}
sessionStorage.setItem("sessionId", sessionId);

export async function detectPlayerRole() {
  const snap = await get(gameRef);
  const data = snap.val();

  if (!data || !data.sessions) {
    const nom = prompt("Entrez votre nom (Joueur 1) :");
    if (!nom) return null;
    const newGame = {
      noms: { joueur1: nom },
      sessions: { joueur1: sessionId }
    };
    await set(gameRef, newGame);
    sessionStorage.setItem("nomJoueur1", nom);
    return "joueur1";
  }

  if (data.sessions?.joueur1 === sessionId) return "joueur1";
  if (data.sessions?.joueur2 === sessionId) return "joueur2";

  if (!data.sessions.joueur2) {
    const nom = prompt("Entrez votre nom (Joueur 2) :");
    if (!nom) return null;
    await update(gameRef, {
      'noms/joueur2': nom,
      'sessions/joueur2': sessionId
    });
    sessionStorage.setItem("nomJoueur2", nom);
    return "joueur2";
  }

  alert("❌ Deux joueurs sont déjà connectés.");
  return null;
}
