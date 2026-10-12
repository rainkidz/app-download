function formatSize(bytes) {
  if (!bytes || bytes <= 0) return "-";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function createCard(app, slug) {
  const card = document.createElement("article");
  card.className = "app-card";

  const changelogItems = (app.changelog || [])
    .map(item => `<li>${escapeHtml(item)}</li>`)
    .join("");

  card.innerHTML = `
    <div class="app-card-header">
      <img class="app-icon" src="${escapeAttr(app.icon)}" alt="${escapeAttr(app.name)} icon" width="64" height="64"
           onerror="this.src='assets/icon.svg'">
      <div class="app-card-title">
        <h2>${escapeHtml(app.name)}</h2>
        <p class="app-version">v${escapeHtml(app.versionName)}</p>
      </div>
    </div>
    <p class="app-tagline">${escapeHtml(app.tagline || "")}</p>
    <p class="app-meta">
      <span>${formatSize(app.size)}</span>
      <span class="dot">•</span>
      <span>${formatDate(app.releasedAt)}</span>
    </p>
    <div class="card-actions">
      <a class="btn btn-primary" href="${escapeAttr(app.url)}">Download APK</a>
      <a class="btn btn-secondary" href="app.html?slug=${encodeURIComponent(slug)}">Details</a>
    </div>
    ${changelogItems ? `
    <details class="changelog">
      <summary>Release notes</summary>
      <ul>${changelogItems}</ul>
    </details>` : ""}
  `;
  return card;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function escapeAttr(s) {
  return escapeHtml(s);
}

async function fetchJson(url) {
  const res = await fetch(`${url}?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function loadApps() {
  const grid = document.getElementById("apps-grid");
  try {
    const slugs = await fetchJson("apps/index.json");
    const apps = await Promise.allSettled(
      slugs.map(slug => fetchJson(`apps/${slug}.json`))
    );

    grid.innerHTML = "";
    let count = 0;
    apps.forEach((result, i) => {
      if (result.status === "fulfilled" && result.value && result.value.url) {
        grid.appendChild(createCard(result.value, slugs[i]));
        count++;
      }
    });

    if (count === 0) {
      grid.innerHTML = '<p class="loading">No apps available.</p>';
    }
  } catch (err) {
    grid.innerHTML = '<p class="loading">Failed to load app list. Reload the page.</p>';
  }
}

document.getElementById("year").textContent = new Date().getFullYear();
loadApps();
