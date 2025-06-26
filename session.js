import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const db = getDatabase();
const gameRef = ref(db, "game");

export async function detectPlayerRole() {
  let snapshot = await (await import("https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js")).get(gameRef);
  let data = snapshot.val() || {};
  let sessionId = sessionStorage.getItem("sessionId");

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("sessionId", sessionId);
  }

  let noms = data.noms || {};
  let sessions = data.sessions || {};

  if (!sessions.joueur1) {
    const nom = prompt("Entrez le nom du 1er joueur :");
    sessions.joueur1 = sessionId;
    noms.joueur1 = nom || "Joueur 1";
    sessionStorage.setItem("nomJoueur1", noms.joueur1);
    await update(gameRef, { sessions, noms });
    return "joueur1";
  }

  if (!sessions.joueur2) {
    const nom = prompt("Entrez le nom du 2ème joueur :");
    sessions.joueur2 = sessionId;
    noms.joueur2 = nom || "Joueur 2";
    sessionStorage.setItem("nomJoueur2", noms.joueur2);
    await update(gameRef, { sessions, noms });
    return "joueur2";
  }

  alert("Deux joueurs sont déjà connectés.");
  return null;
}
