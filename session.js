import { launchGame, createGame, clearGame } from './memory-core.js';

document.addEventListener("DOMContentLoaded", async () => {
  const player = sessionStorage.getItem("player");
  if (!player) {
    let name = prompt("Entrez votre nom :");
    if (!name) name = "Anonyme";

    const role = (await checkRole()) === "joueur1" ? "joueur2" : "joueur1";
    sessionStorage.setItem("player", role);
    await createGame(name, role);
  }

  launchGame();

  document.getElementById("resetBtn").addEventListener("click", async () => {
    const currentPlayer = sessionStorage.getItem("player");
    if (currentPlayer === "joueur1") {
      await clearGame();
      location.reload();
    } else {
      alert("Seul le Joueur 1 peut réinitialiser la partie.");
    }
  });
});

async function checkRole() {
  const res = await fetch("https://memorygame-70305-default-rtdb.europe-west1.firebasedatabase.app/game.json");
  const data = await res.json();
  if (!data || !data.sessions || !data.sessions.joueur1) return "joueur1";
  return "joueur2";
}
