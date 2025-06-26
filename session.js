import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const db = getDatabase();
const gameRef = ref(db, "game");

export async function detectPlayerRole() {
  const snapshot = await get(gameRef);
  const data = snapshot.val() || {};
  const sessionId = sessionStorage.getItem("sessionId");
  let role = null;

  const nom = prompt(`Entrez votre nom (${data.noms?.joueur1 ? "Joueur 2" : "Joueur 1"}) :`);

  if (!data.sessions?.joueur1) {
    role = "joueur1";
  } else if (!data.sessions?.joueur2) {
    role = "joueur2";
  } else {
    alert("❌ Deux joueurs sont déjà connectés.");
    return null;
  }

  const sessions = data.sessions || {};
  const noms = data.noms || {};
  sessions[role] = sessionId;
  noms[role] = nom;

  sessionStorage.setItem("player", role);
  sessionStorage.setItem(`nom${role.charAt(0).toUpperCase() + role.slice(1)}`, nom);

  await update(gameRef, { sessions, noms });
  return role;
}
