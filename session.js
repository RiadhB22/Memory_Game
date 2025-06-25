import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

export async function detectPlayerRole() {
  const db = getDatabase();
  const gameRef = ref(db, 'game');
  const snapshot = await get(gameRef);
  const data = snapshot.val() || {};
  const sessionId = sessionStorage.getItem("sessionId");

  if (data.sessions?.joueur1 === sessionId) return "joueur1";
  if (data.sessions?.joueur2 === sessionId) return "joueur2";

  const nom = prompt(data.sessions?.joueur1 ? "Entrez votre nom (Joueur 2) :" : "Entrez votre nom (Joueur 1) :");
  if (!nom) return null;

  if (!data.sessions?.joueur1) {
    await update(gameRef, {
      sessions: { ...(data.sessions || {}), joueur1: sessionId },
      noms: { ...(data.noms || {}), joueur1: nom }
    });
    sessionStorage.setItem("nomJoueur1", nom);
    return "joueur1";
  }

  if (!data.sessions?.joueur2) {
    await update(gameRef, {
      sessions: { ...(data.sessions || {}), joueur2: sessionId },
      noms: { ...(data.noms || {}), joueur2: nom }
    });
    sessionStorage.setItem("nomJoueur2", nom);
    return "joueur2";
  }

  alert("Deux joueurs sont déjà connectés.");
  return null;
}
