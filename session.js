// 📁 session.js
import { db } from "./firebase-init.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const gameRef = ref(db, "game");

export async function detectPlayerRole() {
  const snapshot = await get(gameRef);
  const data = snapshot.val();

  const sessionId = crypto.randomUUID();
  sessionStorage.setItem("sessionId", sessionId);

  const nom = prompt("Entrez votre nom :");

  let role;
  if (!data || !data.sessions || !data.sessions.joueur1) {
    role = "joueur1";
  } else if (!data.sessions.joueur2) {
    role = "joueur2";
  } else {
    alert("Deux joueurs sont déjà connectés.");
    return null;
  }

  sessionStorage.setItem("player", role);
  sessionStorage.setItem("nom" + role.charAt(0).toUpperCase() + role.slice(1), nom);

  const updates = {
    ["sessions/" + role]: sessionId,
    ["noms/" + role]: nom
  };

  await update(gameRef, updates);
  return role;
}
