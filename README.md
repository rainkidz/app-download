# Katalog Aplikasi Android — rainkidz

Landing page katalog + distribusi APK gratis via GitHub Pages dan GitHub Releases.

- **URL web:** https://rainkidz.github.io/app-download/
- **Daftar app:** https://rainkidz.github.io/app-download/apps/index.json
- **Repo:** https://github.com/rainkidz/app-download

## Struktur

```
index.html              # Katalog (daftar app otomatis dari apps/)
app.html                # Detail page (?slug=dropdesk) — QR, checksum, versi lama
faq.html                # FAQ umum
css/style.css
js/main.js              # Render kartu katalog
js/app.js               # Render detail page
js/qr.js                # QR generator (CDN qrcode-generator)
apps/index.json         # Daftar slug app: ["dropdesk", "wispmail"]
apps/dropdesk.json      # Metadata versi Dropdesk
apps/wispmail.json      # Metadata versi Wispmail
assets/icons/           # Ikon app (ganti dengan PNG asli)
assets/screens/         # Screenshot app (opsional, tampil di detail page)
android-update-checker/ # Contoh kode cek update (Kotlin)
```

## 1. Deploy Web

```bash
git add .
git commit -m "update katalog"
git push
```

Aktifkan Pages sekali saja: **Settings → Pages → Branch `main` / `/ (root)` → Save**

## 2. Tambah Aplikasi Baru

1. Buat folder `apps/`, tambahkan file baru, misal `apps/myapp.json`:

```json
{
  "name": "My App",
  "tagline": "One-liner for the catalog card.",
  "description": "Longer description shown on the app detail page.",
  "icon": "assets/icons/myapp.svg",
  "screenshots": ["assets/screens/myapp-1.png"],
  "features": ["Feature 1", "Feature 2"],
  "sourceUrl": "https://github.com/rainkidz/myapp",
  "playStoreUrl": "",
  "repoSlug": "rainkidz/myapp",
  "package": "com.rainkidz.myapp",
  "versionCode": 1,
  "versionName": "1.0.0",
  "url": "https://github.com/rainkidz/app-download/releases/download/v1.0.0/myapp.apk",
  "size": 12345678,
  "checksum": "sha256:...",
  "changelog": ["First release"],
  "forceUpdateBelow": 0,
  "minSdk": 24,
  "releasedAt": "2026-10-12"
}
```

2. Tambah slug-nya ke `apps/index.json`: `["dropdesk", "wispmail", "myapp"]`
3. Push — kartu app otomatis muncul di katalog.

### Catatan field

| Field | Fungsi |
|---|---|
| `screenshots[]` | Galeri screenshot di detail page (taruh PNG di `assets/screens/`) |
| `features[]` | Daftar fitur (3–5 poin) di detail page |
| `sourceUrl` | Tombol "Source code" di detail page |
| `playStoreUrl` | Tombol "Google Play" (kosongkan `""` kalau belum ada) |
| `repoSlug` | Untuk fetch daftar versi lama dari GitHub Releases API. **Repo private tidak akan tampil** (API publik butuh auth) — nanti fallback link "All releases". |
| `package` | Nama package Android, ditampilkan di detail page |
| `checksum` | SHA-256 APK, ditampilkan di UI "verify" untuk verifikasi integritas |

## 3. Upload APK & Rilis Versi Baru

1. **Releases → Create a new release** → tag (mis. `v1.1.0`) → upload `.apk` → **Publish**
2. Copy URL asset, lalu update `apps/<slug>.json`:
   - `url` → link asset release baru
   - `versionCode` / `versionName` → naikkan
   - `size` → `(Get-Item app.apk).Length`
   - `checksum` → `(Get-FileHash app.apk -Algorithm SHA256).Hash.ToLower()`
   - `changelog`, `releasedAt`
3. Push. Web & app (pemeriksa update) langsung lihat versi baru.

## 4. Integrasi Update Otomatis di App Android

Salin `android-update-checker/UpdateChecker.kt` ke project, ubah `VERSION_URL` ke `apps/<slug>.json` app Anda. Tambahkan di `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />

<application>
    <provider
        android:name="androidx.core.content.FileProvider"
        android:authorities="${applicationId}.fileprovider"
        android:exported="false"
        android:grantUriPermissions="true">
        <meta-data
            android:name="android.support.FILE_PROVIDER_PATHS"
            android:resource="@xml/file_paths" />
    </provider>
</application>
```

`app/src/main/res/xml/file_paths.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<paths>
    <external-files-path name="updates" path="Download/" />
</paths>
```

Pemanggilan (butuh AppCompat + coroutines):

```kotlin
UpdateChecker.checkAndPrompt(this)
```

## 5. Batasan GitHub

- APK per file maks **2GB**; bandwidth "fair use" — untuk ribuan download/bulan aman
- Kalau trafik meledak (puluhan GB/bulan), pindah ke Cloudflare Pages + R2

## 6. Cek Lokal

```powershell
python -m http.server 8000
# buka http://localhost:8000
```
