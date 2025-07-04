// session.js
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const db = getDatabase();
const gameRef = ref(db, 'game');

let sessionId = localStorage.getItem("memory_session_id");
if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("memory_session_id", sessionId);
}
sessionStorage.setItem("sessionId", sessionId);

export async function detectPlayerRole() {
  const snapshot = await get(gameRef);
  const data = snapshot.val();
  const sessionId = sessionStorage.getItem("sessionId");

  if (data && data.sessions && data.sessions.joueur1 === sessionId) {
    sessionStorage.setItem("player", "joueur1");
    return "joueur1";
  }

  if (data && data.sessions && data.sessions.joueur2 === sessionId) {
    sessionStorage.setItem("player", "joueur2");
    return "joueur2";
  }

  const isFirst = !data || !data.sessions || !data.sessions.joueur1;
  const nom = prompt(`Entrez votre nom (${isFirst ? 'Joueur 1' : 'Joueur 2'}) :`).trim();

  if (!nom) {
    alert("Nom invalide");
    return;
  }

  const player = isFirst ? "joueur1" : "joueur2";
  sessionStorage.setItem("player", player);
  sessionStorage.setItem("nom" + player.charAt(0).toUpperCase() + player.slice(1), nom);

  const sessions = {
    ...(data?.sessions || {}),
    [player]: sessionId
  };

  const noms = {
    ...(data?.noms || {}),
    [player]: nom
  };

  await update(gameRef, { sessions, noms });
  return player;
}
