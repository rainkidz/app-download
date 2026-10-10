const FALLBACK_VERSION = {
  versionCode: 1,
  versionName: "1.0.0",
  url: "https://github.com/rainkidz/app-download/releases/download/v1.0.0/app-release.apk",
  size: 24576000,
  changelog: ["Rilis perdana aplikasi"],
  releasedAt: "2026-10-10"
};

function formatSize(bytes) {
  if (!bytes || bytes <= 0) return "- MB";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function render(v) {
  const versionName = v.versionName || v.versionCode || "1.0.0";
  document.getElementById("app-version").textContent = `Versi ${versionName}`;
  document.getElementById("app-size").textContent = formatSize(v.size);
  document.getElementById("app-updated").textContent = `Diperbarui ${formatDate(v.releasedAt)}`;
  document.getElementById("changelog-version").textContent = versionName;

  const list = document.getElementById("changelog-list");
  list.innerHTML = "";
  const items = Array.isArray(v.changelog) && v.changelog.length ? v.changelog : FALLBACK_VERSION.changelog;
  items.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });

  if (v.url) {
    document.getElementById("download-btn").href = v.url;
  }
  document.getElementById("year").textContent = new Date().getFullYear();
}

async function loadVersion() {
  try {
    const res = await fetch(`version.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    render(await res.json());
  } catch (err) {
    render(FALLBACK_VERSION);
  }
}

document.getElementById("copy-link").addEventListener("click", async (e) => {
  const btn = e.currentTarget;
  try {
    await navigator.clipboard.writeText(window.location.href.split("#")[0]);
    btn.textContent = "Tersalin!";
  } catch {
    btn.textContent = window.location.href.split("#")[0];
  }
  setTimeout(() => (btn.textContent = "Copy Link"), 2000);
});

loadVersion();
