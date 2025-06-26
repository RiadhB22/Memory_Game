// session.js
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const db = getDatabase();
const gameRef = ref(db, 'game');

export async function detectPlayerRole() {
  const sessionId = localStorage.getItem("memory_session_id") || crypto.randomUUID();
  localStorage.setItem("memory_session_id", sessionId);
  sessionStorage.setItem("sessionId", sessionId);

  const snap = await get(gameRef);
  const data = snap.val();
  let role = null;

  if (!data?.sessions?.joueur1) {
    const nom = prompt("Entrez votre nom (Joueur 1) :");
    await update(gameRef, {
      sessions: { ...(data?.sessions || {}), joueur1: sessionId },
      noms: { ...(data?.noms || {}), joueur1: nom }
    });
    sessionStorage.setItem("nomJoueur1", nom);
    role = "joueur1";
  } else if (!data?.sessions?.joueur2) {
    const nom = prompt("Entrez votre nom (Joueur 2) :");
    await update(gameRef, {
      sessions: { ...(data?.sessions || {}), joueur2: sessionId },
      noms: { ...(data?.noms || {}), joueur2: nom }
    });
    sessionStorage.setItem("nomJoueur2", nom);
    role = "joueur2";
  } else {
    alert("Deux joueurs sont déjà connectés. Veuillez réessayer plus tard.");
  }

  return role;
}
