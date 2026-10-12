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

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function shortHash(checksum) {
  if (!checksum) return "";
  const hex = checksum.replace(/^sha256:/i, "");
  return `${hex.slice(0, 8)}...${hex.slice(-8)}`;
}

async function fetchJson(url) {
  const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function loadOldVersions(repoSlug) {
  if (!repoSlug) return null;
  try {
    const releases = await fetch(
      `https://api.github.com/repos/${repoSlug}/releases?per_page=20`
    ).then(r => (r.ok ? r.json() : null));
    if (!Array.isArray(releases) || releases.length === 0) return null;
    return releases.filter(r => !r.draft);
  } catch {
    return null;
  }
}

function oldVersionsHtml(releases, currentVersionName) {
  if (!releases || releases.length === 0) return "";
  const rows = releases.map(r => {
    const apk = (r.assets || []).find(a => a.name.endsWith(".apk"));
    const link = apk ? apk.browser_download_url : r.html_url;
    const isCurrent = r.name === currentVersionName || r.tag_name === `v${currentVersionName}`;
    const size = apk ? `<td class="num">${formatSize(apk.size)}</td>` : "<td class=\"num\">-</td>";
    return `
      <tr${isCurrent ? ' class="is-current"' : ""}>
        <td><a href="${escapeHtml(link)}" target="_blank" rel="noopener">${escapeHtml(r.name || r.tag_name)}</a>${isCurrent ? " <span class=\"badge\">current</span>" : ""}</td>
        ${size}
        <td>${formatDate(r.published_at)}</td>
      </tr>`;
  }).join("");

  return `
    <section class="section">
      <h2>Old versions</h2>
      <div class="table-wrap">
        <table class="version-table">
          <thead><tr><th>Version</th><th class="num">Size</th><th>Released</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="note">Older builds are also on <a href="https://github.com/${escapeHtml(repoSlug)}/releases" target="_blank" rel="noopener">GitHub Releases</a>. Updating in-app is always recommended over sideloading old versions.</p>
    </section>`;
}

function renderDetail(app) {
  document.title = `${app.name} - rainkidz`;
  const root = document.getElementById("app-root");

  const featuresHtml = (app.features || []).map(f =>
    `<li>${escapeHtml(f)}</li>`
  ).join("");

  const shotsHtml = (app.screenshots || []).map((s, i) =>
    `<img src="${escapeHtml(s)}" alt="${escapeHtml(app.name)} screenshot ${i + 1}" loading="lazy" onerror="this.style.display='none'">`
  ).join("");

  const linksHtml = [
    app.sourceUrl ? `<a class="btn btn-secondary" href="${escapeHtml(app.sourceUrl)}" target="_blank" rel="noopener">Source code</a>` : "",
    app.playStoreUrl ? `<a class="btn btn-secondary" href="${escapeHtml(app.playStoreUrl)}" target="_blank" rel="noopener">Google Play</a>` : "",
    `<a class="btn btn-secondary" href="index.html">All apps</a>`
  ].join("");

  root.innerHTML = `
    <nav class="breadcrumb"><a href="index.html">← Back to catalog</a></nav>

    <section class="app-hero">
      <img class="app-icon-lg" src="${escapeHtml(app.icon)}" alt="${escapeHtml(app.name)} icon" width="96" height="96" onerror="this.src='assets/icon.svg'">
      <div class="app-hero-meta">
        <h1>${escapeHtml(app.name)}</h1>
        <p class="app-tagline">${escapeHtml(app.tagline || "")}</p>
        <p class="app-meta">
          <span class="badge badge-accent">v${escapeHtml(app.versionName)}</span>
          <span>${formatSize(app.size)}</span>
          <span class="dot">•</span>
          <span>${formatDate(app.releasedAt)}</span>
          <span class="dot">•</span>
          <span>Android ${app.minSdk ? "7.0+" : ""}</span>
        </p>
        ${app.package ? `<p class="package-name">${escapeHtml(app.package)}</p>` : ""}
      </div>
    </section>

    <section class="download-panel">
      <a id="download-btn" class="btn btn-primary btn-lg" href="${escapeHtml(app.url)}">Download APK</a>
      <button id="qr-toggle" class="btn btn-secondary" type="button">Show QR</button>
      <div id="qr-box" class="qr-box" hidden></div>
      <p class="qr-hint" id="qr-hint" hidden>Scan to download on your phone.</p>

      ${app.checksum ? `
      <div class="verify-box">
        <div class="verify-label">SHA-256 fingerprint (verify after download)</div>
        <code class="verify-hash" title="${escapeHtml(app.checksum.replace(/^sha256:/i, ""))}">${escapeHtml(shortHash(app.checksum))}</code>
        <button class="btn btn-ghost btn-sm" id="copy-hash" type="button">Copy</button>
      </div>` : ""}

      <div class="link-row">${linksHtml}</div>
    </section>

    ${app.description ? `
    <section class="section">
      <h2>About</h2>
      <p class="about-text">${escapeHtml(app.description)}</p>
    </section>` : ""}

    ${featuresHtml ? `
    <section class="section section-alt">
      <h2>Features</h2>
      <ul class="features-list">${featuresHtml}</ul>
    </section>` : ""}

    ${shotsHtml ? `
    <section class="section">
      <h2>Screenshots</h2>
      <div class="screenshots">${shotsHtml}</div>
    </section>` : ""}

    <div id="versions-section"></div>

    ${(app.changelog || []).length ? `
    <section class="section">
      <h2>Release notes — v${escapeHtml(app.versionName)}</h2>
      <ul class="changelog-list">${app.changelog.map(c => `<li>${escapeHtml(c)}</li>`).join("")}</ul>
    </section>` : ""}

    <section class="section section-alt">
      <h2>How to install</h2>
      <ol class="steps">
        <li>Tap <strong>Download APK</strong> (or scan the QR code with your phone).</li>
        <li>Open the downloaded file.</li>
        <li>If prompted, enable <strong>"Allow from this source"</strong> for your browser.</li>
        <li>Tap <strong>Install</strong>.</li>
      </ol>
      <p class="note">New versions appear here first. The app itself will notify you when an update is available.</p>
    </section>
  `;

  document.getElementById("copy-hash")?.addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    try {
      await navigator.clipboard.writeText(app.checksum.replace(/^sha256:/i, ""));
      btn.textContent = "Copied!";
    } catch {
      btn.textContent = "Failed";
    }
    setTimeout(() => (btn.textContent = "Copy"), 2000);
  });

  const qrBox = document.getElementById("qr-box");
  const qrToggle = document.getElementById("qr-toggle");
  const qrHint = document.getElementById("qr-hint");
  let qrRendered = false;
  qrToggle.addEventListener("click", () => {
    if (!qrRendered) {
      window.QR.render(qrBox, app.url);
      qrRendered = true;
      qrToggle.textContent = "Hide QR";
      qrBox.removeAttribute("hidden");
      qrHint.removeAttribute("hidden");
    } else {
      const show = qrBox.hasAttribute("hidden");
      qrBox.toggleAttribute("hidden", !show);
      qrHint.toggleAttribute("hidden", !show);
      qrToggle.textContent = show ? "Hide QR" : "Show QR";
    }
  });
}

async function init() {
  const slug = new URLSearchParams(window.location.search).get("slug");
  const root = document.getElementById("app-root");

  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
    root.innerHTML = `<p class="loading">App not found. <a href="index.html">Back to catalog</a></p>`;
    return;
  }

  let app;
  try {
    app = await fetchJson(`apps/${encodeURIComponent(slug)}.json`);
  } catch {
    root.innerHTML = `<p class="loading">App not found. <a href="index.html">Back to catalog</a></p>`;
    return;
  }

  renderDetail(app);

  if (app.repoSlug) {
    const releases = await loadOldVersions(app.repoSlug);
    const section = document.getElementById("versions-section");
    if (releases) {
      section.innerHTML = oldVersionsHtml(releases, app.versionName);
    } else if (app.sourceUrl) {
      section.innerHTML = `<section class="section"><h2>Old versions</h2><p class="note">Full history is on <a href="https://github.com/${escapeHtml(app.sourceUrl.replace("https://github.com/", ""))}/releases" target="_blank" rel="noopener">GitHub Releases</a>.</p></section>`;
    }
  }
}

document.getElementById("year").textContent = new Date().getFullYear();
init();
