/* QR generator wrapper — uses qrcode-generator from CDN (MIT).
   Falls back gracefully if CDN is unavailable. */
const QR_LIB_URL = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js";

let qrLibReady = null;

function loadQrLib() {
  if (qrLibReady) return qrLibReady;
  qrLibReady = new Promise((resolve, reject) => {
    if (window.qrcode) { resolve(window.qrcode); return; }
    const s = document.createElement("script");
    s.src = QR_LIB_URL;
    s.onload = () => window.qrcode ? resolve(window.qrcode) : reject(new Error("qrcode missing"));
    s.onerror = () => reject(new Error("CDN failed"));
    document.head.appendChild(s);
  });
  return qrLibReady;
}

async function renderQr(container, text, sizePx = 160) {
  try {
    const qrcode = await loadQrLib();
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    container.innerHTML = qr.createSvgTag({ cellSize: Math.floor(sizePx / (qr.getModuleCount() + 8)), margin: 2 });
    container.removeAttribute("hidden");
  } catch (e) {
    container.setAttribute("hidden", "");
  }
}

window.QR = { render: renderQr };
