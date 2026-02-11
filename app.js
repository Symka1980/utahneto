const games = [
  {
    id: "warzone",
    name: "Call of Duty: Warzone",
    min: { ramGb: 8, storageGb: 116, ssdRequired: true },
    note: "MVP: čísla jsou startovní. Později doplníme CPU/GPU a ověříme zdroje."
  },
  {
    id: "civ6",
    name: "Civilization VI",
    min: { ramGb: 8, storageGb: 12, ssdRequired: false },
    note: "MVP: CPU/GPU později."
  },
  {
    id: "anno117",
    name: "Anno 117: Pax Romana",
    min: { ramGb: 16, storageGb: 70, ssdRequired: true },
    note: "MVP: CPU/GPU později."
  }
];

const gameSelect = document.getElementById("gameSelect");
const result = document.getElementById("result");

function renderGames() {
  gameSelect.innerHTML = games.map(g => `<option value="${g.id}">${g.name}</option>`).join("");
}
renderGames();

document.getElementById("checkForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const gameId = gameSelect.value;
  const ramGb = Number(document.getElementById("ramGb").value);
  const storageGb = Number(document.getElementById("storageGb").value);
  const hasSsd = document.getElementById("hasSsd").value === "yes";

  const g = games.find(x => x.id === gameId);
  if (!g) return;

  const fails = [];
  if (ramGb < g.min.ramGb) fails.push(`RAM: máš ${ramGb} GB, minimum je ${g.min.ramGb} GB`);
  if (storageGb < g.min.storageGb) fails.push(`Volné místo: máš ${storageGb} GB, minimum je ${g.min.storageGb} GB`);
  if (g.min.ssdRequired && !hasSsd) fails.push(`SSD: hra doporučuje/požaduje SSD`);

  if (fails.length === 0) {
    result.innerHTML = `✅ <strong>Splňuješ základ</strong> (RAM/disk/SSD) pro <strong>${g.name}</strong>.<br><small>${g.note}</small>`;
  } else {
    result.innerHTML = `❌ <strong>Nesplňuješ základ</strong> pro <strong>${g.name}</strong>:<ul>${fails.map(f => `<li>${f}</li>`).join("")}</ul><small>${g.note}</small>`;
  }
});
