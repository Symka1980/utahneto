let games = [];

const gameSelect = document.getElementById("gameSelect");
const result = document.getElementById("result");

const reqBox = document.getElementById("reqBox");
const reqMin = document.getElementById("reqMin");
const reqRec = document.getElementById("reqRec");
const reqSource = document.getElementById("reqSource");

function fmtReq(r) {
  return `RAM ${r.ramGb} GB · Volné místo ${r.storageGb} GB · SSD ${r.ssdRequired ? "ANO" : "NE"}`;
}

function getDefaultGameId() {
  // 1) ?game=warzone (volitelné)
  const url = new URL(window.location.href);
  const q = url.searchParams.get("game");
  if (q) return q;

  // 2) <body data-game="warzone"> (pro SEO stránky)
  const b = document.body?.dataset?.game;
  return b || null;
}

async function loadGames() {
  const res = await fetch("/games.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`games.json HTTP ${res.status}`);
  games = await res.json();

  gameSelect.innerHTML = games
    .map(g => `<option value="${g.id}">${g.name}</option>`)
    .join("");

  const defaultId = getDefaultGameId();
  if (defaultId && games.some(g => g.id === defaultId)) {
    gameSelect.value = defaultId;
  }

  renderRequirements();
}

function getSelectedGame() {
  const gameId = gameSelect.value;
  return games.find(g => g.id === gameId);
}

function renderRequirements() {
  const g = getSelectedGame();
  if (!g) return;

  reqBox.style.display = "block";
  reqMin.textContent = fmtReq(g.min);
  reqRec.textContent = fmtReq(g.rec);

  reqSource.href = g.sourceUrl || "#";
  reqSource.textContent = (g.sourceUrl || "").replace(/^https?:\/\//, "");
}

function evaluateTier(user, req) {
  const fails = [];
  if (user.ramGb < req.ramGb) fails.push(`RAM: máš ${user.ramGb} GB, požadavek je ${req.ramGb} GB`);
  if (user.storageGb < req.storageGb) fails.push(`Volné místo: máš ${user.storageGb} GB, požadavek je ${req.storageGb} GB`);
  if (req.ssdRequired && !user.hasSsd) fails.push(`SSD: doporučeno/požadováno SSD`);
  return fails;
}

gameSelect.addEventListener("change", () => {
  renderRequirements();
  result.innerHTML = "";
});

document.getElementById("checkForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const g = getSelectedGame();
  if (!g) return;

  const user = {
    ramGb: Number(document.getElementById("ramGb").value),
    storageGb: Number(document.getElementById("storageGb").value),
    hasSsd: document.getElementById("hasSsd").value === "yes"
  };

  const failsRec = evaluateTier(user, g.rec);
  const failsMin = evaluateTier(user, g.min);

  if (failsRec.length === 0) {
    result.innerHTML = `✅ <strong>Splňuješ Recommended</strong> pro <strong>${g.name}</strong>.<br><small>CPU/GPU doplníme v další verzi.</small>`;
    return;
  }

  if (failsMin.length === 0) {
    result.innerHTML = `🟨 <strong>Splňuješ Minimum</strong>, ale ne Recommended pro <strong>${g.name}</strong>:<ul>${failsRec.map(f => `<li>${f}</li>`).join("")}</ul><small>CPU/GPU doplníme v další verzi.</small>`;
    return;
  }

  result.innerHTML = `❌ <strong>Nesplňuješ Minimum</strong> pro <strong>${g.name}</strong>:<ul>${failsMin.map(f => `<li>${f}</li>`).join("")}</ul><small>CPU/GPU doplníme v další verzi.</small>`;
});

loadGames().catch(() => {
  result.innerHTML = "Nepodařilo se načíst databázi her (games.json). Zkus refresh.";
});
