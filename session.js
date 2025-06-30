import { launchGame, createGame, clearGame } from "./memory-core.js";

async function setupSession() {
  const name = prompt("Entrez votre nom :");
  if (!name) return;

  const data = await fetch("https://memorygame-70305-default-rtdb.europe-west1.firebasedatabase.app/game.json").then(r => r.json());
  const player1 = data?.sessions?.joueur1;
  const player2 = data?.sessions?.joueur2;

  let role = "joueur1";
  if (player1 && !player2) role = "joueur2";
  else if (player1 && player2) {
    alert("Deux joueurs sont déjà connectés.");
    return;
  }

  await createGame(name, role);
  document.getElementById("reset-button").disabled = role !== "joueur1";
  document.getElementById("reset-button").addEventListener("click", async () => {
    if (confirm("Voulez-vous réinitialiser la partie ?")) {
      await clearGame();
      window.location.reload();
    }
  });

  launchGame();
}

setupSession();
