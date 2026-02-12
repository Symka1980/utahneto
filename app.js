let games = [];

const gameSelect = document.getElementById("gameSelect");
const result = document.getElementById("result");

const reqBox = document.getElementById("reqBox");
const reqMin = document.getElementById("reqMin");
const reqRec = document.getElementById("reqRec");
const reqSource = document.getElementById("reqSource");

// --- CPU/GPU tier scoring (MVP) ---
const CPU_TIER_SCORE = { low: 1, mid: 2, high: 3, enthusiast: 4 };
const GPU_TIER_SCORE = { igpu: 0, low: 1, mid: 2, high: 3, enthusiast: 4 };

function tierNameCpu(t) {
  return { low: "Low", mid: "Mid", high: "High", enthusiast: "Enthusiast" }[t] || t;
}
function tierNameGpu(t) {
  return { igpu: "iGPU", low: "Low", mid: "Mid", high: "High", enthusiast: "Enthusiast" }[t] || t;
}

// --- Tier UI controls ---
const cpuTierEl = document.getElementById("cpuTier");
const gpuTierEl = document.getElementById("gpuTier");

// Mark tiers as "touched" only when the change really comes from the user
function markTouched(e) {
  if (e && e.isTrusted && e.target) {
    e.target.dataset.touched = "1";
  }
}
if (cpuTierEl) cpuTierEl.addEventListener("change", markTouched);
if (gpuTierEl) gpuTierEl.addEventListener("change", markTouched);

function tiersUntouched() {
  const cpuTouched = cpuTierEl && cpuTierEl.dataset.touched === "1";
  const gpuTouched = gpuTierEl && gpuTierEl.dataset.touched === "1";
  return !cpuTouched && !gpuTouched;
}

function setSelectValueIfExists(selectEl, value) {
  if (!selectEl || !value) return;
  // only set if that option exists
  const hasOption = Array.from(selectEl.options).some(o => o.value === value);
  if (hasOption) selectEl.value = value;
}

function applyDefaultTiersForGame(g) {
  if (!g) return;
  if (!cpuTierEl && !gpuTierEl) return;
  if (!tiersUntouched()) return;

  setSelectValueIfExists(cpuTierEl, g.min?.cpuTier);
  setSelectValueIfExists(gpuTierEl, g.min?.gpuTier);
}

function fmtReq(r) {
  const cpu = r.cpuTier ? `CPU ${tierNameCpu(r.cpuTier)}` : "CPU (TBD)";
  const gpu = r.gpuTier ? `GPU ${tierNameGpu(r.gpuTier)}` : "GPU (TBD)";
  return `${cpu} · ${gpu} · RAM ${r.ramGb} GB · Volné místo ${r.storageGb} GB · SSD ${r.ssdRequired ? "ANO" : "NE"}`;
}

async function loadGames() {
  const res = await fetch("games.json", { cache: "no-store" });
  games = await res.json();

  if (gameSelect) {
    gameSelect.innerHTML = games
      .map(g => `<option value="${g.id}">${g.name}</option>`)
      .join("");
  }

  renderRequirements();
}

function getSelectedGame() {
  if (!gameSelect) return null;
  const gameId = gameSelect.value;
  return games.find(g => g.id === gameId);
}

function renderRequirements() {
  const g = getSelectedGame();
  if (!g) return;

  reqBox.style.display = "block";
  reqMin.textContent = fmtReq(g.min);
  reqRec.textContent = fmtReq(g.rec);
  reqSource.href = g.sourceUrl;
  reqSource.textContent = g.sourceUrl.replace(/^https?:\/\//, "");

  // Apply defaults AFTER rendering requirements
  // (and only if user didn't manually change tiers)
  applyDefaultTiersForGame(g);
}

function evaluateTier(user, req) {
  const fails = [];

  if (req.cpuTier && CPU_TIER_SCORE[user.cpuTier] < CPU_TIER_SCORE[req.cpuTier]) {
    fails.push(`CPU: máš ${tierNameCpu(user.cpuTier)}, požadavek je ${tierNameCpu(req.cpuTier)}`);
  }

  if (req.gpuTier && GPU_TIER_SCORE[user.gpuTier] < GPU_TIER_SCORE[req.gpuTier]) {
    fails.push(`GPU: máš ${tierNameGpu(user.gpuTier)}, požadavek je ${tierNameGpu(req.gpuTier)}`);
  }

  if (user.ramGb < req.ramGb) fails.push(`RAM: máš ${user.ramGb} GB, požadavek je ${req.ramGb} GB`);
  if (user.storageGb < req.storageGb) fails.push(`Volné místo: máš ${user.storageGb} GB, požadavek je ${req.storageGb} GB`);
  if (req.ssdRequired && !user.hasSsd) fails.push(`SSD: doporučeno/požadováno SSD`);

  return fails;
}

if (gameSelect) {
  gameSelect.addEventListener("change", () => {
    renderRequirements();
    result.innerHTML = "";
  });
}

const form = document.getElementById("checkForm");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const g = getSelectedGame();
    if (!g) return;

    const user = {
      cpuTier: cpuTierEl ? cpuTierEl.value : "mid",
      gpuTier: gpuTierEl ? gpuTierEl.value : "mid",
      ramGb: Number(document.getElementById("ramGb").value),
      storageGb: Number(document.getElementById("storageGb").value),
      hasSsd: document.getElementById("hasSsd").value === "yes"
    };

    const failsRec = evaluateTier(user, g.rec);
    const failsMin = evaluateTier(user, g.min);

    const mvpNote =
      `<small>MVP porovnává CPU/GPU pomocí “úrovní” (Low/Mid/High). Přesné modely doplníme později.</small>`;

    if (failsRec.length === 0) {
      result.innerHTML = `✅ <strong>Splňuješ Recommended</strong> pro <strong>${g.name}</strong>.<br>${mvpNote}`;
      return;
    }

    if (failsMin.length === 0) {
      result.innerHTML =
        `🟨 <strong>Splňuješ Minimum</strong>, ale ne Recommended pro <strong>${g.name}</strong>.` +
        `<ul>${failsRec.map(f => `<li>${f}</li>`).join("")}</ul>${mvpNote}`;
      return;
    }

    result.innerHTML =
      `❌ <strong>Nesplňuješ Minimum</strong> pro <strong>${g.name}</strong>:` +
      `<ul>${failsMin.map(f => `<li>${f}</li>`).join("")}</ul>${mvpNote}`;
  });
}

loadGames().catch(() => {
  result.innerHTML = "Nepodařilo se načíst databázi her (games.json). Zkus refresh.";
});
