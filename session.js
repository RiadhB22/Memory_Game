import { get, set } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

export async function getOrCreatePlayer(gameRef) {
  const player = sessionStorage.getItem("player");
  const name = localStorage.getItem("name");
  const { child } = await import("https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js");

  const getName = async (label) => {
    let n = "";
    while (!n) {
      n = prompt(`Entrez votre nom (${label}) :`).trim();
    }
    localStorage.setItem("name", n);
    return n;
  };

  const snap = await get(gameRef);
  const data = snap.val();

  if (!player) {
    const p1 = data?.names?.joueur1;
    const p2 = data?.names?.joueur2;

    if (!p1) {
      const name1 = name || await getName("Joueur 1");
      await set(child(gameRef, "names/joueur1"), name1);
      sessionStorage.setItem("player", "joueur1");
      return "joueur1";
    } else if (!p2) {
      const name2 = name || await getName("Joueur 2");
      await set(child(gameRef, "names/joueur2"), name2);
      sessionStorage.setItem("player", "joueur2");
      return "joueur2";
    } else {
      alert("Deux joueurs sont déjà connectés.");
      throw new Error("Session complète.");
    }
  }

  return player;
}
