// session.js
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const db = getDatabase();
const gameRef = ref(db, 'game');

export async function detectPlayerRole() {
  const snap = await get(gameRef);
  const data = snap.val();
  const nom = prompt("Entrez votre nom :");

  let sessionId = localStorage.getItem("memory_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("memory_session_id", sessionId);
  }
  sessionStorage.setItem("sessionId", sessionId);

  if (!data) {
    sessionStorage.setItem("player", "joueur1");
    sessionStorage.setItem("nomJoueur1", nom);
    await update(gameRef, { sessions: { joueur1: sessionId }, noms: { joueur1: nom } });
    return "joueur1";
  }

  if (!data.sessions?.joueur1) {
    sessionStorage.setItem("player", "joueur1");
    sessionStorage.setItem("nomJoueur1", nom);
    await update(gameRef, { "sessions/joueur1": sessionId, "noms/joueur1": nom });
    return "joueur1";
  }

  if (!data.sessions?.joueur2) {
    sessionStorage.setItem("player", "joueur2");
    sessionStorage.setItem("nomJoueur2", nom);
    await update(gameRef, { "sessions/joueur2": sessionId, "noms/joueur2": nom });
    return "joueur2";
  }

  alert("❌ Deux joueurs sont déjà connectés.");
  return null;
}
